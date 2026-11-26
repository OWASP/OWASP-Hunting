#!/usr/bin/env bash
# Commit a regenerated payload catalog to the website branch and push it,
# surviving a concurrent update of that branch.
#
# Inputs (environment):
#   SITE_DIR    checkout of the website branch, with the new catalog already written
#   SOURCE_DIR  checkout of main (read as data, never executed)
#   REMOTE      push URL (https URL in CI, a path in tests)
#   BRANCH      branch to update (website)
#   SOURCE_SHA  main revision the catalog was generated from
#   REPOSITORY  owner/name, used for the commit link (default OWASP/OWASP-Hunting)
#   RUN_ID      optional, recorded in the commit message
# Credentials come from the caller (GIT_ASKPASS); nothing secret is read here.
#
# stdout: key=value lines (published, website_sha, stale) for $GITHUB_OUTPUT.
# stderr: human-readable log. Exit 1 only when the push could not be completed.

set -euo pipefail

: "${SITE_DIR:?}" "${SOURCE_DIR:?}" "${REMOTE:?}" "${BRANCH:?}" "${SOURCE_SHA:?}"
REPOSITORY="${REPOSITORY:-OWASP/OWASP-Hunting}"
OUT="public/payload-catalog"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$(cd "$SITE_DIR" && pwd)"
SOURCE_DIR="$(cd "$SOURCE_DIR" && pwd)"

log() { echo "$@" >&2; }
emit() { printf '%s\n' "$@"; }

cd "$SITE_DIR"
git config user.name "${GIT_USER_NAME:-owasp-hunting-sync[bot]}"
git config user.email "${GIT_USER_EMAIL:-41898282+github-actions[bot]@users.noreply.github.com}"

if [ "$(git -C "$SOURCE_DIR" rev-parse HEAD)" != "$SOURCE_SHA" ]; then
  log "SOURCE_DIR is not at $SOURCE_SHA; refusing to publish a catalog for a different revision."
  exit 1
fi

commit() {
  git add -A -- "$OUT"
  git commit -q \
    -m "chore(catalog): sync payloads from main@${SOURCE_SHA:0:7}" \
    -m "Source: https://github.com/${REPOSITORY}/commit/${SOURCE_SHA}" \
    -m "Automated by .github/workflows/sync-payloads.yml${RUN_ID:+ (run ${RUN_ID})}."
}

if [ -z "$(git status --porcelain -- "$OUT")" ]; then
  log "Catalog already matches ${SOURCE_SHA:0:7}; nothing to commit."
  emit "published=false" "stale=false" "website_sha=$(git rev-parse HEAD)"
  exit 0
fi
commit

for attempt in 1 2 3 4; do
  if git push -q "$REMOTE" "HEAD:refs/heads/${BRANCH}" 2>&1 | sed 's/^/  git: /' >&2 && [ "${PIPESTATUS[0]}" -eq 0 ]; then
    log "Published ${SOURCE_SHA:0:7} to ${BRANCH} on attempt ${attempt}."
    emit "published=true" "stale=false" "website_sha=$(git rev-parse HEAD)"
    exit 0
  fi
  log "Push attempt ${attempt} was rejected; ${BRANCH} moved. Rebuilding on the latest ${BRANCH}."
  git fetch -q "$REMOTE" "$BRANCH"
  git reset -q --hard FETCH_HEAD

  decision="$(node "$HERE/guard.mjs" --source "$SOURCE_DIR" --out "$SITE_DIR/$OUT")"
  if [ "$decision" = "stale" ]; then
    log "${BRANCH} already holds a newer catalog; not overwriting it."
    emit "published=false" "stale=true" "website_sha=$(git rev-parse HEAD)"
    exit 0
  fi

  node "$HERE/generate.mjs" --source "$SOURCE_DIR" --out "$SITE_DIR/$OUT" --repository "$REPOSITORY" --branch main >&2
  if [ -z "$(git status --porcelain -- "$OUT")" ]; then
    log "Another run already published this catalog."
    emit "published=false" "stale=false" "website_sha=$(git rev-parse HEAD)"
    exit 0
  fi
  commit
  sleep "${RETRY_DELAY:-$((attempt * 5))}"
done

log "Could not update ${BRANCH} after 4 attempts."
exit 1

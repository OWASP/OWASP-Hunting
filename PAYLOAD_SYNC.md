# Payload catalog synchronization

The Payload Explorer shows the payload files that live on the `main` branch. Nothing is copied by hand: a workflow regenerates a catalog from `main` and publishes it to this branch, and the normal deployment pipeline does the rest.

```text
push to main
  └─ .github/workflows/sync-payloads.yml          (lives on main)
       ├─ reads main as data (never executes it)
       ├─ runs scripts/payload-catalog/generate.mjs from website
       ├─ commits public/payload-catalog/* to website   (GitHub App, ruleset bypass)
       │    ├─ deploy-website.yml        → owasp.github.io/OWASP-Hunting (redirects to production)
       │    └─ sync-docs-hunting.yml     → th30d4y/docs-hunting main
       │                                      └─ its deploy.yml → GitHub Pages → hunting.0d4y.dev
       └─ waits for the deployment, then polls https://hunting.0d4y.dev/payload-catalog/index.json
          until it reports the same source revision
```

`hunting.0d4y.dev` is served by GitHub Pages from the **`th30d4y/docs-hunting`** mirror, not from this repository's Pages site. The sync workflow therefore verifies the production URL itself rather than trusting the OWASP Pages deployment alone.

## What is generated

`public/payload-catalog/` contains only generated files. Do not edit them.

| File | Purpose |
|---|---|
| `index.json` | Small index: source revision, counts, groups, and per-category metadata and file list. Read at build time and by the browser. |
| `<slug>.json` | One chunk per category with every payload file's exact content. Loaded lazily by the browser. |

Every file records its SHA-256 and every chunk's hash is stored in the index, so a build can detect a damaged or partial catalog.

Version tracking, kept separate on purpose:

| Value | Where it comes from |
|---|---|
| Project version | `VERSION` on `main` (`project.version`). Never bumped by a sync. |
| Payload revision | Exact `main` commit SHA (`source.revision`), with a link to that commit. |
| Website revision | The commit on `website` that contains the catalog. |
| Counts | categories, files, entries (non-comment, non-blank lines, using the same comment rule as `scripts/check_duplicates.py`) and bytes. |
| Timestamp | The source commit's date. It is not the run time, so identical input always produces identical output. |

The generator is deterministic: the same `main` commit always produces byte-identical files, so a sync with nothing new changes nothing and creates no commit.

## One-time setup (maintainers)

The workflow is written and tested, but it cannot publish until these are configured. Without them it fails with a clear message instead of doing nothing silently.

1. **Create a GitHub App** (owner: the OWASP organization, or a maintainer account).
   - Repository permissions: **Contents: Read and write**. Nothing else.
   - Install it on `OWASP/OWASP-Hunting` only.
2. **Add the credentials to `OWASP/OWASP-Hunting`** (Settings → Secrets and variables → Actions):
   - Variable `PAYLOAD_SYNC_APP_ID`: the App ID.
   - Secret `PAYLOAD_SYNC_APP_PRIVATE_KEY`: the App's private key (PEM).
   - Alternative if an App is not possible: secret `PAYLOAD_SYNC_TOKEN`, a fine-grained token for this repository with Contents: Read and write, with an expiry date. An App is preferred because its tokens are short lived and it appears as its own actor in rulesets.
3. **Allow the App to update `website` through the ruleset.** The ruleset *OWASP Hunting Main Protection* requires pull requests on `website`. Add the App to that ruleset's **Bypass list** (mode: *Always*). This is the only exception; the rules stay in force for everyone else, and the App can only change `public/payload-catalog/`.
4. Optional variable `PRODUCTION_URL` (default `https://hunting.0d4y.dev`).
5. Run **Actions → Sync payload catalog to website → Run workflow** on `main` once and check the report in the run summary.

The App token is required rather than `GITHUB_TOKEN` because pushes made with `GITHUB_TOKEN` do not start other workflows, and the deployment must start from the push.

## Behaviour

| Situation | What happens |
|---|---|
| Payload or README change merged to `main` | The workflow runs, publishes, waits for the deployment, and verifies production. |
| Change that does not alter the catalog | The generated files are identical, no commit is made, production is spot-checked. |
| Two pushes to `main` in quick succession | Runs queue (they never cancel each other). Each run regenerates from the latest `main`, so the last run always wins. |
| Older run starts after a newer one published | `guard.mjs` sees that the catalog's revision is not an ancestor of the run's `main` commit and skips publishing. |
| `website` moves while a run is pushing | `publish.sh` fetches, rebuilds on the new tip and retries (4 attempts). If the catalog turns out to be published already, it stops without a commit. |
| Generation or validation fails | Nothing is written: the catalog is built in a temporary directory, validated, and swapped in atomically. The previous catalog stays live. |
| File is not valid UTF-8, contains NUL bytes, is a symlink or is over 2 MB | It is skipped and listed under `skipped` in the index and the run summary. |
| Weekly schedule | Reconciliation: if production does not serve the published revision, the deployment workflows are dispatched again. |

The workflow never runs for pull requests, so no secret is exposed to contributor code, and payload content is only ever read as text.

## Failure recovery

| Symptom | Likely cause | Fix |
|---|---|---|
| "Payload sync is not configured" | Variable/secret from step 2 missing | Add them, re-run the workflow. |
| "Could not update website" / push rejected | App not in the ruleset bypass list, or `website` locked | Step 3. |
| "No deployment started" | The push did not trigger `deploy-website.yml` (token type, or Actions disabled) | Use the App token, check Actions is enabled, re-run. |
| Deploy succeeded but live check times out | Pages is cached for about 10 minutes, or the mirror did not update | Re-run the workflow (it re-checks). Check `sync-docs-hunting.yml` and `th30d4y/docs-hunting` Actions. The mirror needs its `DOCS_SYNC_TOKEN` (see `WEBSITE_MIRROR.md`). |
| "Generator missing" | The website branch does not have `scripts/payload-catalog/` yet | Merge the Payload Explorer pull request into `website`. |

Regenerate by hand from any `main` commit:

```bash
git clone https://github.com/OWASP/OWASP-Hunting.git /tmp/hunting-main
git -C /tmp/hunting-main checkout <sha>
node scripts/payload-catalog/generate.mjs --source /tmp/hunting-main --out public/payload-catalog
node scripts/payload-catalog/generate.mjs --validate --out public/payload-catalog
```

## Rollback

- **A bad catalog was published:** revert the `chore(catalog): sync payloads from main@…` commit on `website` with a pull request (or as the App). The site rebuilds from the previous catalog. The next sync will republish the latest `main`, so if `main` itself is the problem, fix or revert `main` instead.
- **Pause synchronization:** disable the *Sync payload catalog to website* workflow in the Actions tab. The last published catalog keeps being served.
- **Hold a specific revision:** generate with the commands above, commit, and disable the workflow until `main` is fixed.

## Tests and checks

`npm test` runs `scripts/payload-catalog/*.test.mjs`. They cover discovery, exact preservation (CRLF, BOM, tabs, unicode, empty files, hostile strings), determinism, idempotency, added/modified/renamed/removed files, tamper detection, path safety, atomic writes, concurrent writers, the stale-run guard, live verification, and the publish script against real git remotes including concurrent pushes. `deploy-website.yml` runs them, validates the catalog, builds, and `scripts/validate_website_export.py` checks that every category has a page and every chunk exists in the export.

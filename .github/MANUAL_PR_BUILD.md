# PR build check

A CODEOWNER can request a build by posting this standalone comment on an open website PR:

```text
/check-build
```

Surrounding whitespace is accepted. Arguments, quoted commands, edited comments, bot comments, and ordinary issue comments do not request a build. PR authors and other contributors cannot start builds unless they are authorized CODEOWNERS themselves.

The workflow runs `npm ci` and `npm run build` with Node.js 22, then publishes a **Manual PR build** commit status linked to the Actions log. It does not lint, test, deploy, approve, or merge the PR. The status appears on the PR; no extra bot comment is posted.

## Activation and manual fallback

The command handler must first be merged into `main`, GitHub's default branch. Until then `/check-build` has no effect. Once merged, comment on the PR's Conversation tab, not an inline code-review thread.

The Actions button remains available to authorized CODEOWNERS:

1. Open **Actions → Manual PR build → Run workflow**.
2. Select **main** and enter the website PR number, for example `112`.
3. Check the PR's **Manual PR build** status or the Actions build log.

```sh
gh workflow run manual-pr-build.yml --repo OWASP/OWASP-Hunting --ref main -f pr_number=112
gh run list --repo OWASP/OWASP-Hunting --workflow manual-pr-build.yml --limit 5
gh run view RUN_ID --repo OWASP/OWASP-Hunting --log-failed
```

The status is attached to the exact PR head SHA selected at the start, including for fork PRs. New commits do not inherit a previous passing result; post a new command or dispatch again after a push. This builds the PR head, not a speculative merge with the target branch. Do not make this requested-only status a required check unless you intend to run it for every website PR.

## CODEOWNERS authorization

- Authorization reads `.github/CODEOWNERS` from the PR's trusted target branch (`website`), at the base SHA returned by GitHub. It never reads the PR head's version of that file. `main` deliberately has no active owners for reviewer deferral; this does not override the website branch's owners.
- Only direct `@username` entries in that file grant command access, and the user must also have repository write, maintain, or admin permission. A handle mentioned only in a comment does not grant access. `website` currently lists `@0x5t4l1n`.
- This command uses the direct usernames listed in CODEOWNERS as its operator list. It does not infer ownership from the changed-file patterns. Team entries and email-only owners do not grant command access; there is no team-membership token or fallback to reviewer lists.
- Both the original requester and the user requesting a rerun must pass authorization. Authorization is repeated immediately before checkout of PR code and again before publishing the result. A skipped preparation job or failed authorization cannot reach the build.
- Comment requests are re-read from GitHub. The original comment must still contain only `/check-build`, belong to the same PR, and have the original human author. Deleting or changing the command prevents later execution or reporting; revoking a CODEOWNER also blocks later phases.
- Runs use the trusted workflow from `main`. Users who can modify the trusted workflow or target-branch CODEOWNERS can change this policy. GitHub may create a workflow run for an unauthorized comment, but it fails authorization without executing PR code or publishing a PR status.

## Execution and results

- Creating/updating a PR does not automatically build it. Only an explicit comment command or manual dispatch requests a build.
- PR code executes on a fresh GitHub-hosted build runner with a read-only token, no repository secrets passed in, no saved Git credentials, and no shared dependency cache.
- The build runner first checks out trusted authorization code separately, authorizes the request, then checks out the selected PR SHA under `candidate/`. Failed authorization stops before the candidate checkout and before `npm ci`.
- Only separate trusted preparation/reporting jobs have permission to publish commit statuses. They check out the workflow's own commit, never the PR's reporting scripts. Build results come from GitHub's job outcome, not PR-generated artifacts or outputs.
- An install or build failure produces a failed status. A cancelled or skipped build is reported as an error if the reporting job runs. If the run is stopped, authorization changes, or the command is deleted before reporting completes, inspect Actions; a pending status is not success.
- The build has a 20-minute timeout. Full output is retained in the GitHub Actions log under normal repository retention settings.

## Local policy tests

```sh
node --test scripts/test_manual_pr_build.cjs
```

Tests cover comment parsing, manual dispatch, trusted base CODEOWNERS, repository permissions, unauthorized requests and reruns, changed comments, immutable commit selection, and result reporting. Preparation also runs these tests before selecting a PR.

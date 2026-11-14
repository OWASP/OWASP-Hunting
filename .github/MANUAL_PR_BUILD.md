# Manual PR build check

`manual-pr-build.yml` builds an open website PR only when **0x5t4l1n** requests it. It runs `npm ci` and `npm run build` with Node.js 22, then publishes a **Manual PR build** commit status linked to the build log. It does not run lint, tests, deploy, approve, or merge the PR.

## Run a build

The workflow must first be merged into the repository's default branch, `main`.

1. Open **Actions → Manual PR build → Run workflow**.
2. Select **main** and enter the website PR number, for example `112`.
3. Run the workflow and check the PR's **Manual PR build** status or the Actions build log.

From the CLI:

```sh
gh workflow run manual-pr-build.yml --repo OWASP/OWASP-Hunting --ref main -f pr_number=112
gh run list --repo OWASP/OWASP-Hunting --workflow manual-pr-build.yml --limit 5
gh run view RUN_ID --repo OWASP/OWASP-Hunting --log-failed
```

The status is attached to the exact PR head SHA selected at the start, including for fork PRs. New commits do not inherit a previous passing result; run the workflow again after a push. This builds the PR head, not a speculative merge with the target branch. Do not make this manual-only status a required check unless you intend to run it for every website PR.

## Access and execution

- The only event is `workflow_dispatch`; opening or updating a PR does not trigger a build.
- Every job checks both the original actor and the person requesting a rerun. Both must be `0x5t4l1n`. The repository must be `OWASP/OWASP-Hunting` and the selected workflow branch must be `main`.
- Other repository writers may still see GitHub's Run workflow button, but their runs and reruns skip the jobs before any PR code is executed. The account checks do not change GitHub's repository permissions; administrators and people able to change the trusted workflow can change this policy.
- PR code executes only on a fresh GitHub-hosted build runner with a read-only token, no repository secrets passed in, no saved Git credentials, and no shared dependency cache.
- Only separate trusted preparation/reporting jobs have permission to publish commit statuses. They check out the workflow's own commit, never the PR's scripts. Build results come from GitHub's job outcome, not PR-generated artifacts or outputs.
- An install or build failure produces a failed status. A cancelled or skipped build is reported as an error if the reporting job runs. If the whole run is stopped before reporting completes, inspect the Actions run; do not treat a pending status as success.
- The build has a 20-minute timeout. Full output is retained in the GitHub Actions log under the repository's normal retention settings.

## Test the policy locally

```sh
node --test scripts/test_manual_pr_build.cjs
```

Tests cover the operator and rerun restrictions, malformed inputs, PR target validation, immutable commit selection, and success/failure/cancellation reporting. The preparation job also runs these tests before selecting a PR.

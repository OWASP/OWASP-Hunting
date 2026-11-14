# PR template gate

`PR intake` checks the current PR description against the canonical
`main` branch's `.github/PULL_REQUEST_TEMPLATE.md`. Every section must be present once, prose
sections must contain an answer, confirmations must be checked, and exactly one
AI-assistance option must be selected. AI use is accepted; its contribution and
human validation must be described. Tool/model and provider may be `unknown`.
Source attribution may be `N/A`. Comments and fenced examples cannot supply
headings or checkboxes. This validates structure, not the truth of the answers.

On failure, one bot comment lists corrections and the `PR template format` job
fails. Duplicate checking, labeling, branch-direction checks, and checker tests
are skipped. Editing the description reruns validation and updates that comment.
On success, those jobs run and non-draft PRs are requested for review from
`.github/pr-reviewers.json`. Authors are not asked to review their own PRs, and
pending or completed reviews are not requested repeatedly. If a description
becomes invalid, pending requests for configured reviewers are removed; existing
reviews and notifications cannot be erased.

The validator necessarily runs even when the description is invalid. The test
workflow has its own read-only preflight because tests execute PR code and must
remain on the unprivileged `pull_request` event. Both validation jobs check out protected `main` for the validator, canonical
template, and reviewer configuration. This also works for `website` PRs whose
base branch does not contain the validator. Correction comments link to that
same canonical template. Only trusted policy code runs in `pull_request_target`;
it never checks out or executes PR head code. The unprivileged test job still
checks out the PR candidate; its main-only template tests run for `main` PRs and
pushes, while the shared Python duplicate-checker tests run for both branches.
Push checks and issue-assignment commands remain independent of PR formatting.
GitHub's fork-workflow approval policy still applies to tests.

## Activation

This change is prepared for `main`. It does not change live GitHub settings.
Before activating reviewer deferral:

1. Audit both branch protection and repository rulesets. The current `main`
   protection requires code-owner reviews, while CODEOWNERS requests them before
   Actions can run. Replace that requirement with at least one required approving
   review, keeping stale-review dismissal, administrator enforcement, and other
   existing protections. This allows any eligible reviewer to approve rather than
   requiring the named code owner; confirm that policy change before rollout.
   If approval must remain restricted to named code owners, retain CODEOWNERS and
   accept GitHub's immediate notifications instead.
2. Add `PR template format` as a required status check. A failed job alone does
   not prevent merging, and skipped downstream jobs must not be used as the gate.
   Keep the duplicate check required and verify its check name after the reusable
   workflow migration; select the emitted check rather than assuming its old name.
3. Merge the automation and validate a fresh PR with an incomplete description.
   Confirm the corrective comment, failing required gate, skipped downstream jobs,
   and absence of automatic review requests. Complete its description and confirm
   checks resume and a reviewer is requested. Test again with a fork PR and draft.
4. Keep the centralized policy on `main`. Website PR validation does not require
   copying the validator or reviewer list to `website`. Retain the website
   deployment/mirror workflows and its CODEOWNERS configuration. Apply any
   workflow changes that actually live on `website` separately and update
   applicable protection rules there. Do not merge the website branch into main.

Existing PRs are checked on their next edit, push, reopen, or ready-for-review
event. This cannot suppress manual reviewer requests, external GitHub Apps, or
notifications already sent. No contributor code, payloads, or AI services are
used to judge template compliance.

## Local verification

From the repository root:

```sh
node --test scripts/test_pr_template.cjs
python3 -m unittest discover -s scripts -p 'test_*.py' -v
```


## Rechecking failures from before the policy checkout fix

A historical run that failed with `Cannot find module scripts/pr_template.cjs`
never validated the PR description. It does not show that the author used the
wrong format. After merging the checkout fix, trigger a fresh intake run with a
PR-description edit, a new PR commit, or a reopen event. Rerunning an old run can
reuse its old workflow definition and repeat the old base-checkout error.

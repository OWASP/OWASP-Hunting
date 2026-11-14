# Contributing to OWASP Hunting

This is the canonical contribution guide for the project.

For changes to the GitHub Pages documentation site, follow [Contributing to the OWASP Hunting website](./WEBSITE_CONTRIBUTING.md) and open a PR against `website`.

## Rules

- Content must be legal, ethical, and support authorized security testing only.
- No credentials, API keys, tokens, or private/customer data — real or realistic-looking.
- No exploits for undisclosed (0-day) vulnerabilities.
- No plagiarism — attribute sources where a payload comes from a specific writeup, CVE, or tool.
- Don't submit a payload that is character-for-character or whitespace-only different from one that already exists. If it's a meaningful variant (different encoding, bypass, or context), say so in the PR.

## Contribute to the website (`website` branch)

The documentation website at [hunting.0d4y.dev](https://hunting.0d4y.dev/) is maintained on the [`website` branch](https://github.com/OWASP/OWASP-Hunting/tree/website). The `main` branch holds the canonical payload collection. For website pages, design, navigation, search, or images, start from `website` and open a PR **into `website`**, even if GitHub suggests `main` by default.

1. Fork this repository. For a new clone of your fork, create your working branch from the latest official `website` branch:

   ```bash
   git clone https://github.com/YOUR_USERNAME/OWASP-Hunting.git
   cd OWASP-Hunting
   git remote add upstream https://github.com/OWASP/OWASP-Hunting.git
   git fetch upstream website
   git switch -c docs/my-website-change upstream/website
   ```

2. Make a focused change in the website files (`src/app/`, `src/components/`, `src/lib/`, or `public/`). Follow the [full website contribution guide](https://github.com/OWASP/OWASP-Hunting/blob/website/WEBSITE_CONTRIBUTING.md) for the file map, accessibility guidance, and GitHub Pages base-path requirements.
3. With Node.js 22, run the website checks before opening the PR:

   ```bash
   npm ci
   npx tsc --noEmit
   npm run lint
   npm run build
   python3 scripts/validate_website_export.py
   ```

   For a visual change, also use `npm run dev` and review `http://localhost:3000/OWASP-Hunting/` in a browser.
4. Push your branch to your fork and open a PR with **base repository `OWASP/OWASP-Hunting` and base branch `website`**. Describe what changed and how you checked it. The labeler automatically assigns the `Website` label to PRs touching website files. A merged website PR deploys the OWASP site and automatically syncs website content to `docs-hunting/main`; contributors should propose website changes here, not in the deployment mirror.

If the change also updates a canonical payload file, submit that payload change separately against `main` using the workflow below.

Authorized CODEOWNERS can request build evidence by commenting `/check-build` on a website PR, or using the [manual PR build check](.github/MANUAL_PR_BUILD.md) in Actions. The workflow checks target-branch CODEOWNERS and reports the tested commit on the PR.

## Payload workflow (`main` branch)

1. Fork the repo and create a focused branch (`add-xss-dom-payloads`, `new-category-graphql-injection`, etc.).
2. Add/edit payloads in the right category directory, matching its existing format.
3. Before opening the PR, grep the target (and related) categories for near-duplicates yourself — the CI duplicate check only catches exact and whitespace-only matches, not meaningful near-duplicates.
4. Review your own diff, then open a PR against `main` using the PR template.

### New category

Only if the vulnerability class doesn't fit an existing one:

```
New-Category/
├── README.md       # Description, Common Attack Vectors, Testing Approach, Payloads
└── new-category-payloads.txt
```

Add it to the category list in the top-level [README.md](./README.md).

## Duplicate checking

`scripts/check_duplicates.py` runs automatically in CI (`.github/workflows/duplicate-check.yml`) on every PR. It compares added/changed lines in `.txt` payload files against the PR base branch and within the PR itself. Exact duplicates fail the check; whitespace-only matches are advisory because spacing can change payload behavior. Leading and trailing whitespace is preserved for exact comparison. This is a line-based text comparison, not a semantic check or a check of Markdown content. It reads complete file contents via the GitHub API and compares the PR merge base to its head, so it is not intended to run standalone locally.

The bot always comments directly on the PR with the result: if a match is found, it lists each entry, its actual line in your PR, and where it already exists; if not, it confirms no duplicates were found. It updates that same comment on every push instead of piling up new ones.

The bot applies the `duplicate` label when blocking exact duplicates are found and removes it otherwise, including when there are only advisory whitespace matches. This checker is the only automation that manages that label.

Run the offline regression tests locally with:

```bash
python -m unittest discover -s scripts -p 'test_*.py' -v
```

Unreadable, invalid UTF-8, binary, oversized, or incomplete payload content causes an error rather than a successful partial check. Payloads are only read as text and are never executed.

## Claiming an issue

Contributors can claim an issue by commenting with the exact command:

```text
/take-pr
```

The command assigns the issue to the commenter. To remove your own assignment, comment:

```text
/remove-pr
```

These commands apply to issues, not pull requests. They only change the commenter's own assignment; they do not remove another contributor from an issue.

## Automatic labels

`.github/workflows/labeler.yml` applies labels based on which files a PR changes, using `.github/labeler.yml`:

| Label | Applied when |
|---|---|
| `new-payload` | A `.txt` payload file is added or changed |
| `documentation` | Any `.md` file changes (root docs or a category README) |
| `Website` | Changes under `src/` or `public/` (website application code) |
| `maintenance` | Changes under `.github/workflows/`, `.github/labeler.yml`, `scripts/`, `.gitignore`, or `VERSION` |
| `new-category` | Every changed file sits inside a top-level directory that isn't already a known category — i.e. the PR introduces a new one |
| `duplicate` | Applied/removed only by the Duplicate Payload Check workflow above — never by the labeler |
| `needs-review` | Not automated — no file path reliably implies a PR needs review (every PR does), so this is left to maintainers |

The configured `new-payload`, `documentation`, `Website`, `new-category`, `duplicate`, and `maintenance` labels exist in this repository. Fork maintainers must create these labels before enabling the workflows.

## Pull requests

Every PR should state: what changed, why it's useful, which category it affects, whether you checked for duplicates, what validation you did, and any sources/references. Payloads are never executed in CI or by any project tooling.

Use every section of the [PR template](.github/PULL_REQUEST_TEMPLATE.md), complete
the answers, select exactly one AI-assistance option, and check the confirmations
that apply truthfully. Source attribution can be `N/A` when no sources apply.
Documentation-only PRs still need the disclosure and confirmations.

The PR template check comments with missing items and pauses automated checks
and reviewer assignment until the description is complete. Edit the existing
description to rerun it; no new commit is needed. See the
[gate documentation](.github/PR_TEMPLATE_GATE.md) for behavior and rollout details.

## AI-assisted contributions

AI-assisted contributions are allowed if disclosed and personally validated by the contributor — disclosure alone is never grounds for rejection; undisclosed or unvalidated AI output is.

Every PR must include:

```
AI assistance: Yes / No
Tool or model: <name + version, or "unknown">
Provider: <if known>
Contribution: <what it helped create or modify>
Human validation: <what you personally reviewed or tested>
```

- Say "unknown" rather than guessing a model/version.
- No need to disclose prompts, conversations, or account details — only the fields above.
- No tool or provider is required, recommended, or disallowed.
- You are responsible for the technical accuracy, legality, and relevance of anything you submit, regardless of what tool helped produce it. This covers *contributor* AI use only — the project itself does not integrate any AI provider.

## Resources

- [Project repository](https://github.com/OWASP/OWASP-Hunting)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [DISCLAIMER.md](./DISCLAIMER.md) — legal terms you agree to by contributing
- [SECURITY.md](./SECURITY.md) — reporting a security issue in this repo itself

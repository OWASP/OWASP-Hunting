# OWASP Hunting v1.0.2

Released 2026-11-14. This release covers everything merged since [v1.0.1](https://github.com/OWASP/OWASP-Hunting/releases/tag/v1.0.1) (2026-10-23) on both branches: the canonical payload collection on `main` and the documentation website on `website`.

For the short, versioned list of changes see [CHANGELOG.md](CHANGELOG.md).

## Highlights

- **65 categories, up from 41.** Twenty-four new vulnerability classes, plus ten new reference files inside existing categories.
- **85 payload and reference files with 10,802 payload entries.** Entries are counted the way the duplicate checker counts them: non-blank lines that are not comments.
- **A searchable Payload Explorer on the website.** Every payload on `main` can be searched, filtered, copied and downloaded from the site, with no hand-copied lists.
- **A catalog and sync pipeline.** The site's payload data is generated from `main` and published to the `website` branch by a workflow that a maintainer runs on demand.
- **Stricter, friendlier contribution automation.** A pull request template gate, issue self-assignment commands, automatic labels for website changes, and a duplicate checker fix for payloads that start with `#`.
- **Website redesign and fixes.** A new homepage, repaired mobile navigation, anchors that no longer hide under the sticky header, and corrected documentation rendering.

## New vulnerability categories

Twenty-four categories were added to the collection. Each has a `README.md` explaining the attack, how to test for it and how to defend against it, plus one or more payload files.

| Area | Categories |
|---|---|
| Injection | XXE, CRLF Injection, XPath and XSLT Injection, SSI and ESI Injection, Expression Language Injection, Email Injection |
| Browser and protocol | DOM-Based Attacks, Clickjacking, HTTP Parameter Pollution, Host Header Attacks, SOAP and gRPC Security, Mobile Deep Links |
| Access and authentication | MFA Bypass, Rate-Limit and CAPTCHA Bypass, Race Conditions |
| Server and configuration | Subdomain Takeover, Information Disclosure, Type Juggling, ReDoS, Supply Chain and CI/CD, Cloud and Container Security, Secrets Exposure |
| Tooling and evasion | WAF Bypass, Discovery Wordlists |

### New reference files in existing categories

| Category | Addition |
|---|---|
| Command-Injection | Argument and option injection |
| XSS | Blind, JSONP, Markdown, CSP and mXSS payloads |
| SQL-Injection | ORM and query-context payloads |
| Deserialization | Additional library payloads |
| Path-Traversal | File-inclusion wrappers |
| SSRF | Renderer and headless-browser SSRF |
| Cache-Poisoning | Web cache deception |
| Prompt-Injection | MCP and tool poisoning |
| Weak-Passwords | An extended password list |
| Vulnerable-Components | A CVE reference list |

### Review fixes included in this content

Payloads were reviewed before merge and adjusted: destructive probes (such as `-delete` examples) were removed, an incorrect pickle sample was replaced, the structured-clone `__proto__` example and the Confluence CVE range were corrected, and a Phar note was added for PHP 8 behavior. Duplicate entries flagged by the checker were removed.

## Payload Explorer (website)

The Payloads section of the website was rebuilt. It replaces a small, hand-copied set of examples (about 600 strings across 32 pages) with the full collection (10,802 entries across 65 category pages).

**Library page (`/payloads`)**
- Instant category filter and a grouped category list with counts.
- Full-text search across every payload. It streams through the data six categories at a time and shows progress. All words must match, case-insensitively.
- A notice and partial results if one category fails to load, instead of losing the whole search.

**Category pages (`/payloads/<category>`)**
- A file browser, a section list and an in-file filter.
- `# Heading` comment lines render as headings with a per-section **Copy** button. Notes render as plain text. Blank lines stay empty. There are no line numbers.
- Copy a line, a section or a whole file. Download a file or a ZIP of the whole category. Copies and downloads are byte-exact.
- Deep links to a file and line. Source links point at the exact `main` commit the page was built from.
- Keyboard use: one tab stop for the payload list, arrow keys, Home, End, PageUp and PageDown, Enter or C to copy, `/` to focus the page search.
- Light and dark themes, a layout that holds from 320 px up, 44 px touch targets on touch devices, and reduced-motion support.
- Categories without a hand-written guide show their README instead. A new folder with a `README.md` and a `.txt` file becomes a page with no code change.

**Safety**
- Payload text is untrusted. It is rendered only as text. The code never parses it as HTML, evaluates it, navigates to it or makes a request because of it, and a test fails the build if such an API appears in the rendering code.

## Catalog and sync pipeline

`main` is the single source of truth for payloads. The website reads a generated catalog of it.

- **Generator** (`scripts/payload-catalog/` on `website`): reads a checkout of `main` as data and writes `public/payload-catalog/`, an index plus one chunk per category. It is deterministic, so the same commit always gives identical files and an unchanged catalog creates no commit. Output is written atomically, so a failed run leaves the previous catalog in place.
- **Integrity:** every file records its SHA-256 and the index stores each chunk's hash. The browser refuses to show a chunk that does not match, so a half-finished deployment cannot mix revisions.
- **Version tracking:** the catalog records the project version (`VERSION`), the exact `main` commit, and counts. Each page shows the commit it was built from.
- **Workflow** (`.github/workflows/sync-payloads.yml` on `main`): **Sync payload catalog to website**. It runs **only when a maintainer starts it** from the Actions tab. It never runs for pull requests. It refuses to publish if a newer catalog is already on `website`, retries a rejected push on the new tip, then waits for the site deployment and checks that production serves the same revision.
- **Setup:** publishing needs a GitHub App with Contents read and write access, the `PAYLOAD_SYNC_APP_ID` variable, the `PAYLOAD_SYNC_APP_PRIVATE_KEY` secret, and a ruleset bypass for that App. Steps, failure recovery and rollback are in `PAYLOAD_SYNC.md` on the `website` branch.

## Repository automation

- **Pull request template gate** (#99). Duplicate checks, labels, tests and reviewer requests wait until the pull request description is complete. An incomplete description gets one comment listing what is missing. Reviewer assignment moved from CODEOWNERS to `.github/pr-reviewers.json`. See `.github/PR_TEMPLATE_GATE.md`.
- **Issue self-assignment** (#53, #54). Comment `/take-pr` on an issue to be assigned, or `/remove-pr` to be unassigned. A follow-up fix makes this work for external contributors.
- **Website labels** (#69). Pull requests that change website code get the `Website` label automatically.
- **Duplicate checker** (#98). Payloads that begin with `#`, such as `#{7*7}` or fragment-style redirects, are now indexed. Only `# `, `##` and `#<tab>` at the start of a line count as comments.

## Website changes

- **Homepage redesign** (#86). A new homepage with an attack-surface topology view and scroll animations, with restyled About, Contributing, Docs and Community pages, header and footer.
- **Mobile navigation** (#47). The desktop and mobile menus no longer show together after a resize.
- **Section anchors** (#48). Category anchors scroll to a position below the sticky header.
- **Documentation rendering** (#56, #65, #67). Ordered lists keep their numbers, Markdown blockquotes render as real blockquotes, and the active table-of-contents link has proper spacing.
- **Reference links** (#84). Dead links on the XML Injection, IDOR and JWT payload pages were replaced.
- **Content accuracy.** The About page's coverage links are built from the catalog, README links containing parentheses are no longer cut short, and the Community page no longer links to a missing file.
- **Changelog page.** It now shows the real release history instead of placeholder years.

## Fixes

- Duplicate checker: payloads starting with `#` are no longer skipped (#98).
- Issue assignment commands now run for external contributors (#54).

## Compatibility and upgrade notes

- **No breaking changes.** Payload files are still Markdown and plain text. There is no install or build step for the collection.
- **Version:** `VERSION` is now `1.0.2`. The website catalog reads it the next time the sync workflow is run.
- **Payload files** contain protocol fragments and multi-step fixtures, so they are not universal one-line wordlists. Examples need the context in the matching README and an authorized lab.
- **Website search** is plain substring matching, not fuzzy search.

## Maintainer notes

- Merge order matters across branches: changes to the generator land on `website` first, the workflow that calls it lives on `main`.
- The branch rules still list two required checks by their old names, `Duplicate Payload Check` and `Prevent website into main`. GitHub now reports them as `duplicates / Duplicate Payload Check` and `direction / Prevent website into main`. Update the rules so pull requests are not left waiting on checks that never report.
- After the website is deployed, run **Sync payload catalog to website** once from `main` and confirm production serves the new revision at `/payload-catalog/index.json`.

## Contributors

Thank you to everyone who contributed to this release.

| Contributor | Contribution |
|---|---|
| [@0x5t4l1n](https://github.com/0x5t4l1n) | Maintainer. 24 new categories and 10 reference files (#102), Payload Explorer and catalog generator (#103), sync workflow (#104, #106), PR template gate (#99), issue self-assignment (#53), homepage redesign (#86), mobile navigation and anchor fixes (#47, #48), and the issue reports behind the website fixes. |
| [@sarthakdev143-lite](https://github.com/sarthakdev143-lite) | Duplicate checker fix for payloads that start with `#` (#98). |
| [@Ashishchoudhary07](https://github.com/Ashishchoudhary07) | Website documentation fixes: ordered lists (#56), blockquotes (#65), table-of-contents spacing (#67). |
| [@HarshRajSinghania](https://github.com/HarshRajSinghania) | Replaced dead reference links on the XML Injection, IDOR and JWT pages (#84). |
| GitHub Copilot coding agent | Issue assignment workflow fix (#54) and website auto-labeling (#69), reviewed and merged by the maintainer. |

### Earlier contributions not credited in v1.0.1

These were merged before v1.0.1 was tagged and are credited here.

| Contributor | Contribution |
|---|---|
| [@Rishini-Dharan](https://github.com/Rishini-Dharan) | Registered Cache-Poisoning in the README and labeler (#26); ignored Python cache files and untracked committed `.pyc` files (#27). |
| [@Yashwantgokul](https://github.com/Yashwantgokul) | Prompt-Injection category cleanup (#25, #30). |

### AI assistance

Claude Code (Claude Sonnet 5.5, Anthropic) assisted with #102, #103, #104, #106 and this release documentation, as disclosed in each pull request. The maintainer reviewed and merged them.

## Responsible use

All payloads and techniques are for systems you own, authorized penetration tests, approved bug bounty programs and controlled educational environments. See [DISCLAIMER.md](DISCLAIMER.md).

**Full changelog:** [v1.0.1...v1.0.2](https://github.com/OWASP/OWASP-Hunting/compare/v1.0.1...v1.0.2)

# Changelog

Changes to the canonical payload collection and repository tooling are recorded here.
Release 1.0.2 and later also list notable changes to the `website` branch, which is
otherwise maintained separately. Longer release notes are in `RELEASE_NOTES_v*.md`.

## [Unreleased]

## [1.0.2] - 2026-11-14

Full notes: [RELEASE_NOTES_v1.0.2.md](RELEASE_NOTES_v1.0.2.md). The collection now has 65 categories, 85 payload and reference files and 10,802 payload entries.

### Added

- Twenty-four categories: XXE, CRLF Injection, XPath and XSLT Injection, SSI and ESI Injection, Expression Language Injection, Email Injection, DOM-Based Attacks, Clickjacking, HTTP Parameter Pollution, Host Header Attacks, Subdomain Takeover, Information Disclosure, Type Juggling, ReDoS, Supply Chain and CI/CD, Cloud and Container Security, SOAP and gRPC Security, Mobile Deep Links, MFA Bypass, Rate-Limit and CAPTCHA Bypass, Race Conditions, WAF Bypass, Secrets Exposure, and Discovery Wordlists. The collection now has 65 categories.
- Payload Explorer on the website: a searchable, lazy-loaded library of every payload on `main`, with a category filter, full-text search with progress, a file browser, section navigation, an in-file filter, copy of a line, section or file, file and category ZIP downloads, deep links and source links pinned to the synced `main` commit (#103).
- A deterministic payload catalog generator with SHA-256 integrity checks, an atomic write, a stale-run guard, a publish script and a live-site verifier, kept on the `website` branch (#103).
- `sync-payloads.yml`: a manually started workflow that publishes the catalog from `main` to the `website` branch using a GitHub App token, then waits for the deployment and checks production (#104, #106). Setup and recovery are in `PAYLOAD_SYNC.md` on `website`.
- A pull request template gate that holds duplicate checks, labels, tests and reviewer requests until the description is complete; reviewer assignment moves to `.github/pr-reviewers.json` (#99).
- Issue self-assignment: `/take-pr` and `/remove-pr` comments assign or unassign the commenter (#53).
- Automatic `Website` label for pull requests that change website code (#69).
- New reference files in existing categories: argument and option injection (Command-Injection), blind/JSONP/Markdown/CSP/mXSS payloads (XSS), ORM and query-context payloads (SQL-Injection), additional library payloads (Deserialization), file-inclusion wrappers (Path-Traversal), renderer and headless-browser SSRF (SSRF), web cache deception (Cache-Poisoning), MCP and tool poisoning (Prompt-Injection), an extended password list (Weak-Passwords) and a CVE reference list (Vulnerable-Components).

### Changed

- Registered the new categories in the root README and the labeler exclusions.
- Category READMEs now point to their additional payload files.
- Website homepage redesigned with an attack-surface topology view and scroll animations; About, Contributing, Docs, Community, header and footer restyled (#86).
- The website's Payloads section, home counts, sidebar and search now come from the generated catalog instead of hand-copied lists (#103).
- `VERSION` is now `1.0.2`.

### Fixed

- Duplicate checker: payloads that begin with `#` (for example `#{7*7}`) are indexed; only `# `, `##` and `#<tab>` at the start of a line are comments (#98).
- Issue assignment commands run for external contributors (#54).
- Website: mobile and desktop navigation no longer show together after a resize (#47); category anchors clear the sticky header (#48); ordered lists, blockquotes and table-of-contents spacing in the documentation (#56, #65, #67); dead reference links on the XML Injection, IDOR and JWT pages (#84).
- Website content accuracy: About coverage links match the library groups, README links with parentheses are no longer truncated, the Community page no longer links to a missing contributors file, and stale "30+" class counts and removed-feature mentions are corrected.

### Contributors

[@0x5t4l1n](https://github.com/0x5t4l1n), [@sarthakdev143-lite](https://github.com/sarthakdev143-lite), [@Ashishchoudhary07](https://github.com/Ashishchoudhary07), [@HarshRajSinghania](https://github.com/HarshRajSinghania), the GitHub Copilot coding agent, and, for contributions merged before 1.0.1 and not credited then, [@Rishini-Dharan](https://github.com/Rishini-Dharan) and [@Yashwantgokul](https://github.com/Yashwantgokul). Claude Code (Claude Sonnet 5.5) assisted with #102, #103, #104 and #106, as disclosed in those pull requests.

## [1.0.1] - 2026-10-23

### Added

- Ten categories since v1.0.0: API Authorization, Cache Poisoning, CSRF, CSS Injection, GraphQL Security, OAuth and OIDC, SAML Vulnerabilities, Session Management, WebSocket Security, and XS-Leaks.
- Additional references for business logic and races, cache normalization, file processing/storage, modern HTTP desynchronization, JWT claim lifecycle, indirect agent prompt injection, SSRF parsing, and XSS contexts.
- A root `VERSION` file and this changelog. The collection now has 41 categories and 51 payload/reference text files.
- Offline regression tests for the duplicate checker, with CI configured for Python 3.10 and the latest available Python 3 release.

### Fixed

- Actual head-file line numbers in duplicate reports, including files containing comments and blank lines.
- Complete merge-base/head comparisons instead of potentially truncated API patches, including payloads that resemble diff headers.
- Deleted-file moves, renames across payload extensions, and same-file reorder handling.
- Exact comparison preserves leading/trailing whitespace. Whitespace-only matches are advisory; only exact duplicates fail the check and apply the duplicate label.
- Read, encoding, file-list truncation and incomplete API-content errors fail explicitly instead of producing a successful partial check.
- Whitespace-index removals preserve other variants and support single-use iterables.
- PR report formatting handles HTML, backticks, pipes and unusual paths; report size is bounded and full matches remain in workflow logs.
- Only comments authored by `github-actions[bot]` are eligible for updates; contributor-supplied markers cannot select another author's comment.
- Base64 API content is validated before decoding as UTF-8.
- Category-specific testing guidance replaces unrelated copied instructions; stale label setup instructions are corrected.
- Replaced unavailable Node.js and NIST reference URLs with current official resources, and the unavailable OWASP project-page URL with the canonical OWASP repository.

### Changed

- Expanded open-redirect examples and cleaned up unrelated entries in the Prompt Injection category.
- Documented the separate website contribution workflow and added a guard against merging the `website` branch into `main`.
- Registered categories consistently in the root README and labeler exclusions.
- Removed the Discord notification workflow and tracked Python bytecode; Python cache files are ignored.
- Bounded duplicate-check and regression-test CI jobs to ten minutes.

### Compatibility and validation

- Markdown and text remain the collection format; no application install/build step is introduced.
- Payload entries include protocol fragments and multi-step fixtures, so these files are not universal one-line wordlists.
- Static checks and synthetic regression tests do not establish that every example works against every target. Use the documented context in an authorized lab.

## [1.0.0] - 2026-10-14

- Initial tagged release of the security-testing reference collection.
- Project documentation, contribution and AI-disclosure policies, security reporting guidance, PR labeling and duplicate-check automation.

[1.0.2]: https://github.com/OWASP/OWASP-Hunting/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/OWASP/OWASP-Hunting/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/OWASP/OWASP-Hunting/releases/tag/v1.0.0

# Changelog

Changes to the canonical payload collection and repository tooling are recorded here.
The `website` branch is maintained separately.

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

[1.0.1]: https://github.com/OWASP/OWASP-Hunting/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/OWASP/OWASP-Hunting/releases/tag/v1.0.0

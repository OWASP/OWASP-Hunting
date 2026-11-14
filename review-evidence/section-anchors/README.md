# Section anchor verification

Captured on the SQL Injection page at 1366x900 after selecting Mitigation in the table of contents. Automatic scrolling was used for both captures to avoid a screenshot in the middle of a smooth-scroll animation.

- Before: heading top approximately 0.6px, hidden under the sticky header (bottom 52.8px).
- After: heading top approximately 80.6px, visible below the same header.
- Mobile direct fragment at 390x844: target top approximately 79.9px, header bottom 52.8px.
- Injection breadcrumb resolves to the index category section; all six category sections have stable slug IDs.
- Exported category breadcrumb targets checked across all 32 payload reference pages.

The Next.js development toolbar is visible; existing nested-button diagnostics reported in #36 are outside this PR's section-link scope. Payloads were displayed as reference text only, never executed.
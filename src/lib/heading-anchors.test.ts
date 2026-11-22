import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { renderMarkdown } from "./docs-markdown.ts";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts: string[]) => readFileSync(join(srcDir, ...parts), "utf8");
const css = read("app", "globals.css");

test("heading anchors: globals.css defines .heading-anchor styling", () => {
  assert.match(css, /\.heading-anchor\s*\{[^}]*opacity:\s*0/);
  assert.match(css, /\.heading-anchor\s*\{[^}]*text-decoration:\s*none\s*!important/);
});

test("heading anchors: becomes visible on hover, keyboard focus, and touch devices", () => {
  assert.match(
    css,
    /:where\(h1,\s*h2,\s*h3,\s*h4\)\[id\]:hover\s+\.heading-anchor,\s*\.heading-anchor:focus-visible\s*\{[^}]*opacity:\s*1/
  );
  assert.match(
    css,
    /:where\(h1,\s*h2,\s*h3,\s*h4\)\[id\]:hover\s+\.heading-anchor,\s*\.heading-anchor:focus-visible\s*\{[^}]*color:\s*var\(--color-accent\)/
  );
  assert.match(css, /@media\s*\(hover:\s*none\)\s*\{[\s\S]*?\.heading-anchor\s*\{[^}]*opacity:\s*0\.[0-9]+/);
});

test("heading anchors: hidden in print mode", () => {
  const printMatch = css.match(/@media print\s*\{([\s\S]*?\n\})/);
  assert.ok(printMatch, "@media print block must be present");
  assert.match(printMatch[1], /\.heading-anchor\s*\{[^}]*display:\s*none\s*!important/);
});

test("heading anchors: markdown renderer includes accessible heading anchors on h2 and h3", () => {
  const html = renderMarkdown("## Installation\n\n### Quick Setup");
  assert.match(
    html,
    /<h2 id="installation">Installation<a href="#installation" class="heading-anchor" aria-label="Link to section: Installation">#<\/a><\/h2>/
  );
  assert.match(
    html,
    /<h3 id="quick-setup">Quick Setup<a href="#quick-setup" class="heading-anchor" aria-label="Link to section: Quick Setup">#<\/a><\/h3>/
  );

  const slugPage = read("app", "docs", "[slug]", "page.tsx");
  assert.match(slugPage, /renderMarkdown\(block\.content/);
});

test("heading anchors: markdown renderer escapes double quotes in aria-label", () => {
  const html = renderMarkdown('## Using "Quotes" in Headings\n\n### "Nested" Case');
  assert.match(
    html,
    /<h2 id="using-quotes-in-headings">Using "Quotes" in Headings<a href="#using-quotes-in-headings" class="heading-anchor" aria-label="Link to section: Using &quot;Quotes&quot; in Headings">#<\/a><\/h2>/
  );
  assert.match(
    html,
    /<h3 id="nested-case">"Nested" Case<a href="#nested-case" class="heading-anchor" aria-label="Link to section: &quot;Nested&quot; Case">#<\/a><\/h3>/
  );
});

test("heading anchors: single delegated listener mounted in root layout with no duplicate per-link handler", () => {
  const component = read("components", "ui", "HeadingAnchor.tsx");
  assert.match(component, /export function HeadingAnchorListener\(/);
  assert.match(component, /useEffect\(/);
  assert.match(component, /document\.addEventListener\("click"/);
  assert.match(component, /document\.removeEventListener\("click"/);
  assert.doesNotMatch(component, /onClick=/);

  const rootLayout = read("app", "layout.tsx");
  assert.match(rootLayout, /<HeadingAnchorListener \/>/);
});

test("heading anchors: educational sections and readme blocks import HeadingAnchor", () => {
  const edu = read("components", "payloads", "EducationalSections.tsx");
  assert.match(edu, /import\s*\{\s*HeadingAnchor\s*\}\s*from\s*"@\/components\/ui\/HeadingAnchor"/);
  assert.match(edu, /<HeadingAnchor id="what-it-is" text="What it is" \/>/);

  const readme = read("components", "payloads", "ReadmeBlocks.tsx");
  assert.match(readme, /import\s*\{\s*HeadingAnchor\s*\}\s*from\s*"@\/components\/ui\/HeadingAnchor"/);
  assert.match(readme, /<HeadingAnchor id=\{id\} text=\{block\.text\} \/>/);
});

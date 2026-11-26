import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "app", "globals.css"),
  "utf8"
);

function extractMediaBlocks(cssContent: string, query: string): string[] {
  const blocks: string[] = [];
  let pos = 0;
  while ((pos = cssContent.indexOf(query, pos)) !== -1) {
    const openBrace = cssContent.indexOf("{", pos);
    if (openBrace === -1) break;
    let depth = 1;
    let i = openBrace + 1;
    while (i < cssContent.length && depth > 0) {
      if (cssContent[i] === "{") depth++;
      else if (cssContent[i] === "}") depth--;
      i++;
    }
    blocks.push(cssContent.slice(openBrace + 1, i - 1));
    pos = i;
  }
  return blocks;
}

test("sidebar layout: desktop breakpoint (>= 1100px) shows sidebar and hides mobile trigger", () => {
  const blocks = extractMediaBlocks(css, "@media (min-width: 1100px)");
  assert.ok(blocks.length > 0, "min-width: 1100px media query must exist");
  const combined = blocks.join("\n");
  assert.match(combined, /\.docs-sidebar\s*\{\s*display:\s*block\s*!important;\s*\}/);
  assert.match(combined, /\.mobile-nav-trigger\s*\{\s*display:\s*none\s*!important;\s*\}/);
});

test("sidebar layout: tablet and mobile breakpoint (<= 1099px) collapses sidebar into mobile trigger", () => {
  const blocks = extractMediaBlocks(css, "@media (max-width: 1099px)");
  assert.ok(blocks.length > 0, "max-width: 1099px media query must exist");
  const combined = blocks.join("\n");
  assert.match(combined, /\.docs-sidebar\s*\{\s*display:\s*none\s*!important;\s*\}/);
  assert.match(combined, /\.mobile-nav-trigger\s*\{\s*display:\s*block\s*!important;\s*\}/);
});

test("sidebar layout: tablet breakpoint sets reference-layout to block and resets padding-inline", () => {
  const blocks = extractMediaBlocks(css, "@media (max-width: 1099px)");
  assert.ok(blocks.length >= 2, "must have layout rules under max-width: 1099px");
  const combined = blocks.join("\n");
  assert.match(combined, /\.reference-layout\s*\{[^}]*display:\s*block\s*!important/);
  assert.match(combined, /\.reference-content\s*\{[^}]*padding-inline:\s*0/);
});

test("sidebar layout: table of contents panel hides at <= 1024px", () => {
  const blocks = extractMediaBlocks(css, "@media (max-width: 1024px)");
  assert.ok(blocks.length > 0, "max-width: 1024px media query must exist");
  const combined = blocks.join("\n");
  assert.match(combined, /\.docs-toc\s*\{\s*display:\s*none\s*!important;\s*\}/);
});

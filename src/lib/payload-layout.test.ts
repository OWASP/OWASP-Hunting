// Guards for layout rules that are easy to break and hard to notice:
// the explorer's sticky toolbar and file rail must keep working when the page is scrolled.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "components", "payloads", "payloads.module.css"), "utf8");

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`));
  assert.ok(match, `${selector} rule not found`);
  return match[1];
}

test("no ancestor of the sticky toolbar or rail is a scroll container", () => {
  // overflow hidden/auto/scroll on an ancestor makes it the sticky element's scroll container,
  // so the toolbar and rail would scroll away with the page instead of staying in view.
  const explorer = rule(".explorer");
  assert.match(explorer, /overflow:\s*clip/, "the panel must clip with overflow: clip");
  for (const selector of [".explorerBody", ".viewer"]) {
    assert.doesNotMatch(rule(selector), /overflow(-x|-y)?:\s*(hidden|auto|scroll)/, `${selector} must not be a scroll container`);
  }
  assert.match(rule(".viewerBar"), /position:\s*sticky/);
});

test("rows stay clear of the sticky site header and toolbar when scrolled to", () => {
  const line = rule(".line");
  assert.match(line, /scroll-margin-top:\s*calc\(3\.25rem \+ var\(--viewer-bar-h/);
});

test("the toolbar collapses to one row on narrow viewers instead of growing", () => {
  assert.match(css, /@container viewer \(max-width: 600px\)/);
  assert.match(css, /\.viewerActions \.btnLabel \{\s*display: none;/);
});

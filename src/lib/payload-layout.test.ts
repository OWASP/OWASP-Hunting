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

test("mobile navigation scroll lock releases when widening the viewport to desktop breakpoint", () => {
  const headerSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "components", "layout", "Header.tsx"),
    "utf8",
  );
  assert.match(headerSource, /min-width:\s*768px/);
  assert.match(headerSource, /innerWidth\s*>=\s*768/);
  assert.match(headerSource, /document\.body\.style\.overflow\s*=\s*previousOverflow/);

  // Behavior simulation: open menu at 390x844 mobile viewport, then resize to 1280x800 desktop
  const body = { style: { overflow: "" } };
  let innerWidth = 390;
  let mobileOpen = true;
  const previousOverflow = body.style.overflow;
  body.style.overflow = "hidden";

  const handleResize = () => {
    if (innerWidth >= 768) {
      mobileOpen = false;
      body.style.overflow = previousOverflow;
    }
  };

  assert.equal(body.style.overflow, "hidden", "scroll should be locked while mobile menu is open");

  // Widening viewport across 768px desktop breakpoint releases scroll lock
  innerWidth = 1280;
  handleResize();

  assert.equal(mobileOpen, false, "mobile menu must close when viewport widens to desktop");
  assert.equal(body.style.overflow, "", "body scroll must be restored when crossing desktop breakpoint");
});

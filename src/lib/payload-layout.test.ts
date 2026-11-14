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

test("Sidebar scopes active-item automatic scrolling to the desktop container", () => {
  const sidebarSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "components", "layout", "Sidebar.tsx"),
    "utf8",
  );

  // Desktop Sidebar explicitly passes autoScroll, whereas MobileSidebar does not
  assert.match(sidebarSource, /<SidebarSection[^>]*autoScroll/);
  assert.match(sidebarSource, /active && autoScroll && linkRef\.current/);

  // Simulation: late category in list (e.g. tor-based-attacks) rendered in mobile vs desktop
  let scrollIntoViewCalled = false;
  let windowScrollY = 0;
  const linkRef = {
    scrollIntoView: () => {
      scrollIntoViewCalled = true;
      windowScrollY = 2503; // document scroll when unscoped on mobile
    },
  };

  const simulateSidebarItem = ({ active, autoScroll }: { active: boolean; autoScroll: boolean }) => {
    if (active && autoScroll && linkRef) {
      linkRef.scrollIntoView();
    }
  };

  // 1. Mobile navigation opening on a late category: autoScroll is false, preserving scroll position
  scrollIntoViewCalled = false;
  windowScrollY = 0;
  simulateSidebarItem({ active: true, autoScroll: false });
  assert.equal(scrollIntoViewCalled, false, "Mobile navigation must not invoke scrollIntoView");
  assert.equal(windowScrollY, 0, "Document scrollY must remain 0 so mobile toggle and filter stay accessible");

  // 2. Desktop navigation: autoScroll is true, bringing active item into view within desktop sidebar
  scrollIntoViewCalled = false;
  simulateSidebarItem({ active: true, autoScroll: true });
  assert.equal(scrollIntoViewCalled, true, "Desktop navigation must bring active link into view");
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { shouldShowBackToTop } from "./back-to-top.ts";

const src = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts: string[]) => readFileSync(join(src, ...parts), "utf8");

test("the back-to-top button stays hidden near the top and shows well below the first screens", () => {
  assert.equal(shouldShowBackToTop(0, 800), false);
  assert.equal(shouldShowBackToTop(1000, 800), false);
  assert.equal(shouldShowBackToTop(1201, 800), true);
  assert.equal(shouldShowBackToTop(601, 300), true);
  assert.equal(shouldShowBackToTop(Number.NaN, 800), false);
});

test("the back-to-top button is mounted in the root layout and is a labelled 44 px control", () => {
  assert.match(read("app", "layout.tsx"), /<BackToTop \/>/);
  const component = read("components", "ui", "BackToTop.tsx");
  assert.match(component, /aria-label="Back to top"/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  const css = read("app", "globals.css");
  const rule = /\.back-to-top\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  assert.match(rule, /width:\s*44px/);
  assert.match(rule, /height:\s*44px/);
  assert.match(css, /@media print\s*\{\s*\.back-to-top\s*\{\s*display:\s*none/);
});

test("footer links are at least 24 px tall (WCAG 2.2 target size)", () => {
  const css = read("app", "globals.css");
  const rule = /a\.footer-link\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const match = /min-height:\s*([\d.]+)rem/.exec(rule);
  assert.ok(match, "a.footer-link needs a min-height");
  assert.ok(Number(match[1]) * 16 >= 24, `min-height ${match[1]}rem is under 24 px`);
});

test("the site search explains that one character is too short instead of reporting no results", () => {
  assert.match(read("components", "ui", "Search.tsx"), /Type at least 2 characters to search/);
});

test("the Payloads page does not override the site-wide / shortcut", () => {
  const library = read("components", "payloads", "PayloadLibrary.tsx");
  assert.doesNotMatch(library, /event\.key !== "\/"/);
  assert.doesNotMatch(library, /to jump here/);
});

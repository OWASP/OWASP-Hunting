import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTheme, nextThemePreference } from "./theme.ts";

test("resolveTheme: explicit light preference always resolves to light", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("light", false), "light");
});

test("resolveTheme: explicit dark preference always resolves to dark", () => {
  assert.equal(resolveTheme("dark", true), "dark");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("resolveTheme: system preference reflects OS color-scheme preference", () => {
  assert.equal(resolveTheme("system", true), "light");
  assert.equal(resolveTheme("system", false), "dark");
});

test("resolveTheme: first visit with uninitialized storage falls back to system preference", () => {
  assert.equal(resolveTheme(null, true), "light");
  assert.equal(resolveTheme(null, false), "dark");
  assert.equal(resolveTheme(undefined, true), "light");
  assert.equal(resolveTheme(undefined, false), "dark");
});

test("nextThemePreference: cycles through system -> light -> dark -> system", () => {
  assert.equal(nextThemePreference("system"), "light");
  assert.equal(nextThemePreference("light"), "dark");
  assert.equal(nextThemePreference("dark"), "system");
});

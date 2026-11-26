import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveTheme,
  nextThemePreference,
  getThemePreference,
  setThemePreference,
  resetInMemoryThemePreference,
} from "./theme.ts";

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

test("blocked storage: cycles through system -> light -> dark -> system using in-memory preference", () => {
  resetInMemoryThemePreference();
  const blockedStorage = {
    getItem: () => {
      throw new Error("SecurityError: localStorage is disabled");
    },
    setItem: () => {
      throw new Error("SecurityError: localStorage is disabled");
    },
  };

  // Initially fallback is system
  assert.equal(getThemePreference(blockedStorage), "system");

  // Cycle 1: system -> light
  const pref1 = nextThemePreference(getThemePreference(blockedStorage));
  assert.equal(pref1, "light");
  setThemePreference(pref1, blockedStorage);
  assert.equal(getThemePreference(blockedStorage), "light");

  // Cycle 2: light -> dark
  const pref2 = nextThemePreference(getThemePreference(blockedStorage));
  assert.equal(pref2, "dark");
  setThemePreference(pref2, blockedStorage);
  assert.equal(getThemePreference(blockedStorage), "dark");

  // Cycle 3: dark -> system
  const pref3 = nextThemePreference(getThemePreference(blockedStorage));
  assert.equal(pref3, "system");
  setThemePreference(pref3, blockedStorage);
  assert.equal(getThemePreference(blockedStorage), "system");
});

test("storage available: persists preference and reads back from storage", () => {
  resetInMemoryThemePreference();
  const map = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, val: string) => {
      map.set(key, val);
    },
  };

  assert.equal(getThemePreference(mockStorage), "system");
  setThemePreference("light", mockStorage);
  assert.equal(getThemePreference(mockStorage), "light");
  assert.equal(map.get("theme"), "light");

  setThemePreference("dark", mockStorage);
  assert.equal(getThemePreference(mockStorage), "dark");
  assert.equal(map.get("theme"), "dark");
});

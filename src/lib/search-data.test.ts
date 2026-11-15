import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import Fuse from "fuse.js";

import { categorySearchItems, CATEGORY_ALIASES, SEARCH_INDEX } from "./search-data.ts";
import type { SearchItem } from "./search-data.ts";
import type { CatalogIndex } from "./payload-types.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "payload-catalog");
const index: CatalogIndex = JSON.parse(readFileSync(join(dir, "index.json"), "utf8"));
const items: SearchItem[] = [...SEARCH_INDEX, ...categorySearchItems(index.categories)];

const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "tags", weight: 0.35 },
    { name: "excerpt", weight: 0.15 },
    { name: "category", weight: 0.1 },
  ],
  threshold: 0.35,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
};

test("categorySearchItems: attaches security acronym aliases and directory tags", () => {
  const sqli = items.find((i) => i.id === "payload-sql-injection");
  assert.ok(sqli, "payload-sql-injection must exist");
  assert.ok(sqli.tags.includes("sqli"), "SQL injection tags must include 'sqli'");
  assert.ok(sqli.tags.includes("sql"), "SQL injection tags must include 'sql'");

  const rce = items.find((i) => i.id === "payload-command-injection");
  assert.ok(rce, "payload-command-injection must exist");
  assert.ok(rce.tags.includes("rce"), "Command injection tags must include 'rce'");

  const lfi = items.find((i) => i.id === "payload-path-traversal");
  assert.ok(lfi, "payload-path-traversal must exist");
  assert.ok(lfi.tags.includes("lfi"), "Path traversal tags must include 'lfi'");
});

test("search queries for 'sqli' return SQL Injection first without unrelated noisy matches", () => {
  const fuse = new Fuse(items, FUSE_OPTIONS);
  const q = "sqli";
  const searchThreshold = q.length <= 4 ? 0.25 : 0.35;
  const results = fuse
    .search(q, { limit: 12 })
    .filter((r) => (r.score ?? 1) <= searchThreshold)
    .map((r) => r.item.title);

  assert.ok(results.length >= 1, "At least SQL Injection must be returned");
  assert.equal(results[0], "SQL Injection", "SQL Injection must rank first for 'sqli'");
  assert.ok(results.includes("NoSQL Injection"), "NoSQL Injection should also match 'sqli'");

  // Verify noisy unrelated categories are excluded
  assert.ok(!results.includes("Timing Attacks"), "Timing Attacks must not appear for 'sqli'");
  assert.ok(!results.includes("Symbolic Link Attacks"), "Symbolic Link Attacks must not appear for 'sqli'");
});

test("short security acronym queries ('rce', 'lfi') accurately match their primary categories", () => {
  const fuse = new Fuse(items, FUSE_OPTIONS);

  const rceResults = fuse
    .search("rce", { limit: 12 })
    .filter((r) => (r.score ?? 1) <= 0.25)
    .map((r) => r.item.title);
  assert.equal(rceResults[0], "Command Injection", "Command Injection must rank first for 'rce'");

  const lfiResults = fuse
    .search("lfi", { limit: 12 })
    .filter((r) => (r.score ?? 1) <= 0.25)
    .map((r) => r.item.title);
  assert.equal(lfiResults[0], "Path Traversal", "Path Traversal must rank first for 'lfi'");
});

// Checks the committed catalog in public/payload-catalog, the data the website ships.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { fileBytes, toDisplayLines } from "./payload-files.ts";
import { highlight, parseQuery, searchFile } from "./payload-search.ts";
import type { CatalogIndex, CategoryChunk } from "./payload-types.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "payload-catalog");
const index: CatalogIndex = JSON.parse(readFileSync(join(dir, "index.json"), "utf8"));
const chunks = new Map<string, CategoryChunk>(index.categories.map((c) => [c.slug, JSON.parse(readFileSync(join(dir, c.chunk), "utf8"))]));
const sha = (data: Uint8Array | string) => createHash("sha256").update(data).digest("hex");

test("index and chunks agree, and every file hashes to its recorded digest after the download path", () => {
  assert.ok(index.categories.length >= 65);
  let files = 0;
  let entries = 0;
  for (const category of index.categories) {
    const chunk = chunks.get(category.slug)!;
    assert.equal(sha(readFileSync(join(dir, category.chunk), "utf8")), category.chunkSha256, `${category.slug}: chunk hash`);
    assert.equal(chunk.files.length, category.files.length);
    for (const file of chunk.files) {
      // This is exactly what the Download button writes: the UTF-8 bytes of `content`.
      assert.equal(sha(fileBytes(file.content)), file.sha256, `${file.path}: download bytes differ from the source file`);
      assert.equal(fileBytes(file.content).length, file.bytes);
      files += 1;
      entries += file.entries;
    }
  }
  assert.equal(files, index.stats.files);
  assert.equal(entries, index.stats.entries);
});

test("every file's displayed entry lines add up to the counts shown in the interface", () => {
  for (const chunk of chunks.values()) {
    for (const file of chunk.files) {
      const shown = toDisplayLines(file.content).filter((l) => l.kind === "entry").length;
      assert.equal(shown, file.entries, `${file.path}: displayed entries`);
    }
  }
});

test("catalog is complete: categories have names, groups, descriptions, README blocks and unique slugs", () => {
  const slugs = new Set<string>();
  for (const c of index.categories) {
    assert.ok(!slugs.has(c.slug));
    slugs.add(c.slug);
    assert.ok(c.name && c.group && c.description, `${c.slug}: missing metadata`);
    assert.ok(chunks.get(c.slug)!.readme.blocks.length > 0, `${c.slug}: empty README`);
  }
  assert.ok(index.groups.every((g) => index.categories.some((c) => c.group === g)));
  assert.deepEqual(readdirSync(dir).sort(), ["index.json", ...index.categories.map((c) => c.chunk)].sort());
});

test("source revision is recorded and links to the commit", () => {
  assert.match(index.source.revision, /^[0-9a-f]{40}$/);
  assert.equal(index.source.commitUrl, `https://github.com/${index.source.repository}/commit/${index.source.revision}`);
  assert.match(index.project.version, /^\d+\.\d+\.\d+/);
});

test("searching the real catalog: known payloads are found and hostile entries stay plain text", () => {
  const xss = chunks.get("xss")!;
  const hits = xss.files.flatMap((f) => searchFile(f, parseQuery("onerror")).matches);
  assert.ok(hits.length > 20, "expected many onerror payloads");
  const hostile = hits.find((h) => h.text.includes("<"));
  assert.ok(hostile);
  const segments = highlight(hostile.text, ["onerror"]);
  assert.equal(segments.map((s) => s.text).join(""), hostile.text);
});

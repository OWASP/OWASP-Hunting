import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import { chunkUrl, clearChunkCache, loadChunk, ChunkError } from "./payload-client.ts";

const chunk = { schemaVersion: 1, slug: "xss", dir: "XSS", readme: { path: "XSS/README.md", sha256: "", title: "", blocks: [] }, files: [{ path: "XSS/a.txt", name: "a.txt", bytes: 3, sha256: "", lines: 1, entries: 1, sections: [], content: "<x>" }] };
const text = `${JSON.stringify(chunk)}\n`;
const hash = createHash("sha256").update(text).digest("hex");
const ref = { slug: "xss", chunk: "xss.json", chunkSha256: hash };
const ok = (body: string) => async () => ({ ok: true, status: 200, text: async () => body });

test("chunkUrl: only plain json file names under the catalog path", () => {
  assert.equal(chunkUrl("/OWASP-Hunting", "xss.json"), "/OWASP-Hunting/payload-catalog/xss.json");
  assert.equal(chunkUrl("", "sql-injection.json"), "/payload-catalog/sql-injection.json");
  for (const bad of ["../x.json", "a/b.json", "x.html", "http://evil.test/x.json", ""]) assert.throws(() => chunkUrl("", bad), ChunkError);
});

test("loadChunk verifies the hash, parses, and caches per category", async () => {
  clearChunkCache();
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return { ok: true, status: 200, text: async () => text };
  };
  const a = await loadChunk("", ref, fetcher);
  const b = await loadChunk("", ref, fetcher);
  assert.equal(a.files[0].content, "<x>");
  assert.equal(a, b);
  assert.equal(calls, 1);
});

test("loadChunk rejects tampered data, bad JSON, wrong slug, and HTTP errors; failures are not cached", async () => {
  clearChunkCache();
  await assert.rejects(loadChunk("", ref, ok(text.replace("<x>", "<y>"))), /integrity/);
  const bad = "{not json";
  await assert.rejects(loadChunk("", { ...ref, chunkSha256: createHash("sha256").update(bad).digest("hex") }, ok(bad)), /could not be read/);
  const wrong = JSON.stringify({ ...chunk, slug: "other" });
  await assert.rejects(loadChunk("", { ...ref, chunkSha256: createHash("sha256").update(wrong).digest("hex") }, ok(wrong)), /malformed/);
  await assert.rejects(loadChunk("", ref, async () => ({ ok: false, status: 404, text: async () => "" })), /404/);
  // After failures a good response still works.
  assert.equal((await loadChunk("", ref, ok(text))).slug, "xss");
});

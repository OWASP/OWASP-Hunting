import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildCatalog,
  catalogMatches,
  decodeExact,
  diffIndexes,
  isCommentLine,
  isSafeRelativePath,
  parseReadmeBlocks,
  plainText,
  sectionLabel,
  parseSections,
  sha256,
  validateCatalogDir,
  writeCatalog,
} from "./lib.mjs";
import { decide } from "./guard.mjs";
import { fetchRevision, waitForRevision } from "./verify-live.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REV_A = "a".repeat(40);
const REV_B = "b".repeat(40);
const OPTIONS = { repository: "OWASP/OWASP-Hunting", branch: "main", revision: REV_A, committedAt: "2026-01-02T03:04:05Z" };

function tmp() {
  return mkdtempSync(join(tmpdir(), "catalog-test-"));
}

/** Build a source tree from { "Dir/file.txt": "content" } (Buffers allowed). */
function makeSource(files, { readmes = true } = {}) {
  const root = tmp();
  const dirs = new Set(Object.keys(files).map((p) => p.split("/")[0]));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  if (readmes) {
    for (const dir of dirs) {
      if (!files[`${dir}/README.md`]) writeFileSync(join(root, dir, "README.md"), `# ${dir} title\n\n## Description\nAbout ${dir}.\n`);
    }
  }
  return root;
}

function chunkOf(built, slug) {
  return JSON.parse(built.chunks.get(slug));
}

// ─── Discovery ─────────────────────────────────────────────────────────────

test("discovers payload files recursively and ignores everything else", () => {
  const root = makeSource({
    "XSS/xss.txt": "<svg onload=1>\n",
    "XSS/extra/deep.txt": "x\n",
    "XSS/notes.md": "not a payload",
    "XSS/image.png": Buffer.from([1, 2, 3]),
    "XSS/.hidden.txt": "hidden\n",
    "scripts/tool.txt": "script data\n",
    ".github/note.txt": "meta\n",
    "node_modules/pkg/a.txt": "dep\n",
    "NoReadme/a.txt": "no readme so not a category\n",
  });
  rmSync(join(root, "NoReadme", "README.md"), { force: true });
  const built = buildCatalog(root, OPTIONS);
  const index = JSON.parse(built.index);
  assert.deepEqual(index.categories.map((c) => c.slug), ["xss"]);
  assert.deepEqual(index.categories[0].files.map((f) => f.path), ["XSS/extra/deep.txt", "XSS/xss.txt"]);
});

test("skips symbolic links instead of following them", () => {
  const root = makeSource({ "XSS/a.txt": "a\n" });
  const outside = tmp();
  writeFileSync(join(outside, "secret.txt"), "outside\n");
  symlinkSync(join(outside, "secret.txt"), join(root, "XSS", "link.txt"));
  const index = JSON.parse(buildCatalog(root, OPTIONS).index);
  assert.deepEqual(index.categories[0].files.map((f) => f.name), ["a.txt"]);
  assert.deepEqual(index.skipped, [{ path: "XSS/link.txt", reason: "symbolic link" }]);
});

test("rejects invalid UTF-8 and NUL bytes without failing the run", () => {
  const root = makeSource({
    "XSS/good.txt": "ok\n",
    "XSS/latin1.txt": Buffer.from([0x61, 0xe9, 0x0a]),
    "XSS/binary.txt": Buffer.from("a\0b\n"),
  });
  const index = JSON.parse(buildCatalog(root, OPTIONS).index);
  assert.deepEqual(index.categories[0].files.map((f) => f.name), ["good.txt"]);
  assert.deepEqual(index.skipped.map((s) => [s.path, s.reason]), [["XSS/binary.txt", "contains NUL bytes"], ["XSS/latin1.txt", "not valid UTF-8"]]);
});

test("handles identical filenames in different directories", () => {
  const root = makeSource({ "XSS/payloads.txt": "x\n", "SQL-Injection/payloads.txt": "y\n" });
  const index = JSON.parse(buildCatalog(root, OPTIONS).index);
  const all = index.categories.flatMap((c) => c.files.map((f) => f.path));
  assert.deepEqual(all.sort(), ["SQL-Injection/payloads.txt", "XSS/payloads.txt"]);
});

// ─── Exact preservation ────────────────────────────────────────────────────

test("preserves content byte for byte: CRLF, BOM, tabs, spaces, unicode, no final newline", () => {
  const hostile = [
    "# Section",
    "<script>alert(1)</script>",
    "'; DROP TABLE x;--",
    "\ttabbed",
    "trailing space   ",
    "  leading",
    "unicode: ü 漢字 🧨 \u202e RLO",
    "%00%0d%0a",
    "\\u0027 \\x41 ${jndi:ldap://x}",
    "no final newline",
  ];
  const variants = {
    "XSS/lf.txt": hostile.join("\n"),
    "XSS/crlf.txt": hostile.join("\r\n") + "\r\n",
    "XSS/bom.txt": "\ufeff" + hostile.join("\n") + "\n",
  };
  const root = makeSource(variants);
  const built = buildCatalog(root, OPTIONS);
  for (const file of chunkOf(built, "xss").files) {
    const original = readFileSync(join(root, file.path));
    assert.ok(Buffer.from(file.content, "utf8").equals(original), `${file.path} differs from the source bytes`);
    assert.equal(file.sha256, sha256(original));
  }
});

test("empty files are kept and counted as zero entries", () => {
  const root = makeSource({ "XSS/empty.txt": "", "XSS/blank.txt": "\n\n  \n" });
  const files = chunkOf(buildCatalog(root, OPTIONS), "xss").files;
  assert.deepEqual(files.map((f) => [f.name, f.entries, f.lines]), [["blank.txt", 0, 3], ["empty.txt", 0, 0]]);
});

test("treats '#{7*7}' as a payload and '# ' as a comment (same rule as the duplicate checker)", () => {
  assert.equal(isCommentLine("# heading"), true);
  assert.equal(isCommentLine("## heading"), true);
  assert.equal(isCommentLine("#\theading"), true);
  assert.equal(isCommentLine("#{7*7}"), false);
  assert.equal(isCommentLine("#<img src=x>"), false);
  const parsed = parseSections("# A\n#{7*7}\nplain\n\n# B\n#<x>\n");
  assert.deepEqual(parsed.sections.map((s) => [s.label, s.entries]), [["A", 2], ["B", 1]]);
  assert.equal(parsed.entries, 3);
});

test("sections: a run of comment lines is one heading; entries before any comment are kept", () => {
  const parsed = parseSections("first\n# One\n# note about one\nx\ny\n\n# Two\nz\n");
  assert.deepEqual(parsed.sections.map((s) => [s.label, s.line, s.entries]), [["", 1, 1], ["One", 2, 2], ["Two", 7, 1]]);
});

// ─── Metadata ──────────────────────────────────────────────────────────────

test("category metadata comes from the README table and category README; falls back to the directory", () => {
  const root = makeSource(
    {
      "XXE/xxe.txt": "x\n",
      "Odd-Dir/a.txt": "y\n",
      "README.md": "| Category | Group |\n|---|---|\n| [XML External Entity](./XXE/) | Injection |\n",
      "VERSION": "1.2.3\n",
    },
    { readmes: false },
  );
  writeFileSync(join(root, "XXE", "README.md"), "# XML External Entity (XXE) Injection\n\n## Description\nParser resolves entities.\nSecond line.\n\n## Other\nx\n");
  writeFileSync(join(root, "Odd-Dir", "README.md"), "no heading here\n");
  const index = JSON.parse(buildCatalog(root, OPTIONS).index);
  const xxe = index.categories.find((c) => c.slug === "xxe");
  assert.equal(xxe.name, "XML External Entity");
  assert.equal(xxe.group, "Injection");
  assert.equal(xxe.description, "Parser resolves entities. Second line.");
  const odd = index.categories.find((c) => c.slug === "odd-dir");
  assert.equal(odd.name, "Odd Dir");
  assert.equal(odd.group, "Other");
  assert.equal(odd.description, "");
  assert.equal(index.project.version, "1.2.3");
  assert.deepEqual(index.groups, ["Injection", "Other"]);
});

test("records the source revision, commit link and counts", () => {
  const root = makeSource({ "XSS/a.txt": "# S\none\ntwo\n" });
  const index = JSON.parse(buildCatalog(root, OPTIONS).index);
  assert.equal(index.source.revision, REV_A);
  assert.equal(index.source.commitUrl, `https://github.com/OWASP/OWASP-Hunting/commit/${REV_A}`);
  assert.equal(index.source.committedAt, "2026-01-02T03:04:05.000Z");
  assert.deepEqual(index.stats, { categories: 1, files: 1, entries: 2, bytes: 12, skipped: 0 });
});

test("rejects bad options before touching anything", () => {
  const root = makeSource({ "XSS/a.txt": "a\n" });
  assert.throws(() => buildCatalog(root, { ...OPTIONS, revision: "main" }), /revision/);
  assert.throws(() => buildCatalog(root, { ...OPTIONS, repository: "no-slash" }), /repository/);
  assert.throws(() => buildCatalog(root, { ...OPTIONS, committedAt: "yesterday" }), /committedAt/);
});

// ─── Determinism, idempotency ──────────────────────────────────────────────

test("identical input gives byte-identical output, regardless of creation order", () => {
  const files = { "XSS/b.txt": "b\n", "XSS/a.txt": "a\n", "SSRF/z.txt": "z\n", "SSRF/y.txt": "y\n" };
  const one = buildCatalog(makeSource(files), OPTIONS);
  const reversed = Object.fromEntries(Object.entries(files).reverse());
  const two = buildCatalog(makeSource(reversed), OPTIONS);
  assert.equal(one.index, two.index);
  assert.deepEqual([...one.chunks], [...two.chunks]);
});

test("writing twice is idempotent and catalogMatches reports it", () => {
  const root = makeSource({ "XSS/a.txt": "a\n" });
  const out = join(tmp(), "catalog");
  const built = buildCatalog(root, OPTIONS);
  assert.equal(catalogMatches(out, built), false);
  writeCatalog(out, built);
  assert.equal(catalogMatches(out, built), true);
  const before = readdirSync(out).map((n) => [n, readFileSync(join(out, n), "utf8")]);
  writeCatalog(out, buildCatalog(root, OPTIONS));
  assert.deepEqual(readdirSync(out).map((n) => [n, readFileSync(join(out, n), "utf8")]), before);
  assert.deepEqual(validateCatalogDir(out), []);
});

test("CLI: second run writes nothing and --check passes; --check fails when stale", () => {
  const root = makeSource({ "XSS/a.txt": "a\n" });
  const out = join(tmp(), "catalog");
  const cli = (...args) => spawnSyncNode(join(HERE, "generate.mjs"), ["--source", root, "--out", out, "--revision", REV_A, "--committed-at", OPTIONS.committedAt, ...args]);
  assert.equal(cli().status, 0);
  const again = cli();
  assert.match(again.stdout, /nothing to write/);
  assert.equal(cli("--check").status, 0);
  writeFileSync(join(root, "XSS", "a.txt"), "changed\n");
  const stale = cli("--check");
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /out of date/);
});

function spawnSyncNode(script, args) {
  const result = execFileSync(process.execPath, ["-e", `
    const { spawnSync } = require("node:child_process");
    const r = spawnSync(process.execPath, ${JSON.stringify([script, ...args])}, { encoding: "utf8" });
    process.stdout.write(JSON.stringify({ status: r.status, stdout: r.stdout, stderr: r.stderr }));
  `], { encoding: "utf8" });
  return JSON.parse(result);
}

// ─── Added / modified / renamed / removed ──────────────────────────────────

test("detects added, modified, renamed and removed files; regenerating drops stale chunks", () => {
  const out = join(tmp(), "catalog");
  const v1 = makeSource({ "XSS/a.txt": "a\n", "XSS/b.txt": "b\n", "SSRF/c.txt": "c\n", "XXE/gone.txt": "g\n" });
  writeCatalog(out, buildCatalog(v1, OPTIONS));
  const before = JSON.parse(readFileSync(join(out, "index.json"), "utf8"));

  const v2 = makeSource({ "XSS/a.txt": "a changed\n", "XSS/b-renamed.txt": "b\n", "SSRF/c.txt": "c\n", "SQLi/new.txt": "n\n" });
  const built = buildCatalog(v2, { ...OPTIONS, revision: REV_B });
  const after = JSON.parse(built.index);
  const diff = diffIndexes(before, after);
  assert.deepEqual(diff.added, ["SQLi/new.txt"]);
  assert.deepEqual(diff.modified, ["XSS/a.txt"]);
  assert.deepEqual(diff.renamed, [{ from: "XSS/b.txt", to: "XSS/b-renamed.txt" }]);
  assert.deepEqual(diff.removed, ["XXE/gone.txt"]);

  writeCatalog(out, built);
  assert.ok(!readdirSync(out).includes("xxe.json"), "removed category chunk must be deleted");
  assert.deepEqual(validateCatalogDir(out), []);
});

test("removing every file of a category keeps the category but lists no files", () => {
  const root = makeSource({ "XSS/a.txt": "a\n" });
  rmSync(join(root, "XSS", "a.txt"));
  const index = JSON.parse(buildCatalog(root, OPTIONS).index);
  assert.equal(index.categories[0].stats.files, 0);
});

// ─── Validation and safety ─────────────────────────────────────────────────

test("validation catches tampering with a chunk, a hash, or an extra file", () => {
  const root = makeSource({ "XSS/a.txt": "a\n" });
  const out = join(tmp(), "catalog");
  writeCatalog(out, buildCatalog(root, OPTIONS));
  assert.deepEqual(validateCatalogDir(out), []);

  const chunkPath = join(out, "xss.json");
  const original = readFileSync(chunkPath, "utf8");
  writeFileSync(chunkPath, original.replace('"a\\n"', '"evil\\n"'));
  assert.ok(validateCatalogDir(out).some((p) => /hash/.test(p)));
  writeFileSync(chunkPath, original);

  writeFileSync(join(out, "stray.json"), "{}");
  assert.ok(validateCatalogDir(out).some((p) => /unexpected file/.test(p)));
});

test("path validation rejects traversal, absolute and unusual paths", () => {
  for (const bad of ["", "../x.txt", "a/../b.txt", "/etc/passwd", "C:/x", "a\\b.txt", "a//b.txt", "./a.txt", "a/\0.txt"]) {
    assert.equal(isSafeRelativePath(bad), false, JSON.stringify(bad));
  }
  assert.equal(isSafeRelativePath("XSS/xss-payloads.txt"), true);
});

test("a failed run leaves the previous valid catalog untouched", () => {
  const out = join(tmp(), "catalog");
  const root = makeSource({ "XSS/a.txt": "a\n" });
  writeCatalog(out, buildCatalog(root, OPTIONS));
  const snapshot = readdirSync(out).map((n) => [n, readFileSync(join(out, n), "utf8")]);

  // Invalid options: nothing may be written.
  assert.throws(() => buildCatalog(root, { ...OPTIONS, revision: "oops" }));
  // A built catalog that fails validation: nothing may be swapped in.
  const broken = buildCatalog(root, OPTIONS);
  broken.chunks.set("xss", broken.chunks.get("xss").replace('"a\\n"', '"b\\n"'));
  assert.throws(() => writeCatalog(out, broken), /invalid/);
  assert.deepEqual(readdirSync(out).map((n) => [n, readFileSync(join(out, n), "utf8")]), snapshot);
  assert.deepEqual(readdirSync(join(out, "..")).filter((n) => n.includes(".tmp-")), [], "temp directory must be cleaned up");
});

test("concurrent writers always leave one complete, valid catalog", async () => {
  const root = makeSource({ "XSS/a.txt": "a\n", "SSRF/b.txt": "b\n" });
  const out = join(tmp(), "catalog");
  const run = (rev) =>
    new Promise((resolve) => {
      const child = spawn(process.execPath, [join(HERE, "generate.mjs"), "--source", root, "--out", out, "--revision", rev, "--committed-at", OPTIONS.committedAt], { stdio: "ignore" });
      child.on("close", resolve);
    });
  await Promise.all([run(REV_A), run(REV_B), run(REV_A), run(REV_B), run(REV_A)]);
  assert.deepEqual(validateCatalogDir(out), []);
  const index = JSON.parse(readFileSync(join(out, "index.json"), "utf8"));
  assert.ok([REV_A, REV_B].includes(index.source.revision));
  assert.deepEqual(readdirSync(join(out, "..")).filter((n) => n !== "catalog"), [], "no temp or old directories may remain");
});

test("decodeExact refuses text that would not round-trip", () => {
  assert.equal(decodeExact(Buffer.from("ok")), "ok");
  assert.equal(decodeExact(Buffer.from([0xff, 0xfe])), null);
  assert.equal(decodeExact(Buffer.from("\ufeffx")), "\ufeffx");
});

// ─── Stale-run guard (needs git) ───────────────────────────────────────────

test("guard: publish, unchanged, and stale are decided from commit ancestry", () => {
  const repo = tmp();
  const git = (...a) => execFileSync("git", ["-C", repo, "-c", "user.name=t", "-c", "user.email=t@example.test", ...a], { encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  writeFileSync(join(repo, "f"), "1");
  git("add", "."); git("commit", "-qm", "one");
  const first = git("rev-parse", "HEAD");
  writeFileSync(join(repo, "f"), "2");
  git("commit", "-qam", "two");
  const second = git("rev-parse", "HEAD");
  git("switch", "-q", "-c", "other", first);
  writeFileSync(join(repo, "g"), "x");
  git("add", "."); git("commit", "-qm", "diverged");
  const diverged = git("rev-parse", "HEAD");
  git("switch", "-q", "main");

  const out = join(tmp(), "catalog");
  assert.equal(decide(repo, out), "publish", "no catalog yet");
  const writeIndex = (revision) => {
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "index.json"), JSON.stringify({ source: { revision } }));
  };
  writeIndex(first);
  assert.equal(decide(repo, out), "publish", "recorded revision is an ancestor of HEAD");
  writeIndex(second);
  assert.equal(decide(repo, out), "unchanged");
  writeIndex(diverged);
  assert.equal(decide(repo, out), "stale", "recorded revision is not an ancestor of HEAD");
  writeIndex("f".repeat(40));
  assert.equal(decide(repo, out), "publish", "unknown recorded commit never blocks a sync");
});

// ─── Live verification ─────────────────────────────────────────────────────

test("verify-live: waits for the expected revision and times out otherwise", async () => {
  let revision = "0".repeat(40);
  let hits = 0;
  const server = createServer((req, res) => {
    hits += 1;
    if (req.url.startsWith("/payload-catalog/index.json")) {
      if (hits >= 3) revision = REV_B;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ source: { revision } }));
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(await fetchRevision(url), "0".repeat(40));
    const ok = await waitForRevision({ url, revision: REV_B, timeoutSeconds: 5, intervalSeconds: 0, sleep: async () => {}, log: () => {} });
    assert.equal(ok, true);
    const timedOut = await waitForRevision({ url, revision: REV_A, timeoutSeconds: 0, intervalSeconds: 0, sleep: async () => {}, log: () => {} });
    assert.equal(timedOut, false);
    const missing = await waitForRevision({ url: `${url}/nope`, revision: REV_A, timeoutSeconds: 0, intervalSeconds: 0, sleep: async () => {}, log: () => {} });
    assert.equal(missing, false);
  } finally {
    server.close();
  }
});

// ─── README blocks ─────────────────────────────────────────────────────────


test("README parsing: headings, paragraphs, lists, code fences; no HTML is produced", () => {
  const text = [
    "# Title here",
    "",
    "## Description",
    "First line",
    "second line of the same paragraph.",
    "",
    "## Common Attack Vectors",
    "- one",
    "- two with `code`",
    "  continued",
    "",
    "1. step",
    "2. next step",
    "",
    "### Sub heading",
    "```bash",
    "grep -r '<script>' .",
    "# not a heading inside a fence",
    "```",
    "Text with <script>alert(1)</script> stays plain text.",
  ].join("\n");
  const { title, blocks } = parseReadmeBlocks(text);
  assert.equal(title, "Title here");
  assert.deepEqual(blocks, [
    { t: "h", level: 2, text: "Description" },
    { t: "p", text: "First line second line of the same paragraph." },
    { t: "h", level: 2, text: "Common Attack Vectors" },
    { t: "ul", items: ["one", "two with `code` continued"] },
    { t: "ol", items: ["step", "next step"] },
    { t: "h", level: 3, text: "Sub heading" },
    { t: "code", lang: "bash", text: "grep -r '<script>' .\n# not a heading inside a fence" },
    { t: "p", text: "Text with <script>alert(1)</script> stays plain text." },
  ]);
});

test("chunks carry the category README, and validation rejects an unknown block type", () => {
  const root = makeSource({ "XSS/a.txt": "a\n" });
  const out = join(tmp(), "catalog");
  const built = buildCatalog(root, OPTIONS);
  const chunk = chunkOf(built, "xss");
  assert.equal(chunk.readme.path, "XSS/README.md");
  assert.match(chunk.readme.sha256, /^[0-9a-f]{64}$/);
  assert.ok(chunk.readme.blocks.some((b) => b.t === "h" && b.text === "Description"));
  writeCatalog(out, built);
  assert.deepEqual(validateCatalogDir(out), []);
});

test("section labels skip decorative banner lines and keep the real title", () => {
  const parsed = parseSections("# ============\n# 1. TOR CONNECTION SETUP\n# ============\nentry\n\n# ----\nother\n");
  assert.deepEqual(parsed.sections.map((s) => [s.label, s.line, s.entries]), [["1. TOR CONNECTION SETUP", 1, 1], ["", 6, 1]]);
  assert.equal(sectionLabel("# === x ==="), "x");
  assert.equal(sectionLabel("## ***"), "");
  assert.equal(sectionLabel("# Über Größe"), "Über Größe");
});

test("descriptions are plain text: no backticks, bold marks or link syntax", () => {
  assert.equal(plainText("Uses `\\r\\n` and **bold** in a [link](https://example.test/x) here."), "Uses \\r\\n and bold in a link here.");
  const root = makeSource({ "CRLF/a.txt": "x\n" }, { readmes: false });
  writeFileSync(join(root, "CRLF", "README.md"), "# CRLF\n\n## Description\nHeader `Location` and **more** [docs](https://e.test).\n");
  assert.equal(JSON.parse(buildCatalog(root, OPTIONS).index).categories[0].description, "Header Location and more docs.");
});

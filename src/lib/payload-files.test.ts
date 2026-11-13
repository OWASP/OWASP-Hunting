import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { buildZip, classifyLine, crc32, fileBytes, safeArchivePath, safeFileName, toDisplayLines } from "./payload-files.ts";

test("toDisplayLines keeps every line's text and numbers lines from 1", () => {
  const lines = toDisplayLines("# Section\n\t<svg onload=1>  \n\n#{7*7}\nlast");
  assert.deepEqual(lines.map((l) => [l.number, l.kind, l.text]), [
    [1, "comment", "# Section"],
    [2, "entry", "\t<svg onload=1>  "],
    [3, "blank", ""],
    [4, "entry", "#{7*7}"],
    [5, "entry", "last"],
  ]);
  assert.deepEqual(toDisplayLines(""), []);
  assert.deepEqual(toDisplayLines("a\r\nb\r\n").map((l) => l.text), ["a", "b"]);
});

test("classifyLine uses the repository comment rule", () => {
  assert.equal(classifyLine("## x"), "comment");
  assert.equal(classifyLine("#\tx"), "comment");
  assert.equal(classifyLine("#x"), "entry");
  assert.equal(classifyLine("   "), "blank");
});

test("fileBytes returns the exact UTF-8 bytes, including a BOM, CRLF and unicode", () => {
  const original = Buffer.from("\ufeffü 漢字 🧨\r\n<script>\n", "utf8");
  assert.ok(Buffer.from(fileBytes(original.toString("utf8"))).equals(original));
});

test("safeFileName strips paths and unusual characters", () => {
  assert.equal(safeFileName("XSS/xss-payloads.txt"), "xss-payloads.txt");
  assert.equal(safeFileName("../../etc/passwd"), "passwd");
  assert.equal(safeFileName("a b<c>.txt"), "a_b_c_.txt");
  assert.equal(safeFileName("..."), "payloads.txt");
  assert.equal(safeFileName(""), "payloads.txt");
  assert.equal(safeFileName(".hidden"), "hidden");
});

test("safeArchivePath rejects traversal and absolute paths", () => {
  for (const bad of ["", "../a", "a/../b", "/abs", "C:/x", "a\\b", "a//b", "./a", "a\0b"]) assert.equal(safeArchivePath(bad), null, JSON.stringify(bad));
  assert.equal(safeArchivePath("XSS/xss-payloads.txt"), "XSS/xss-payloads.txt");
});

test("crc32 matches the standard check value", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  assert.equal(crc32(new Uint8Array()), 0);
});

test("buildZip produces an archive that python's zipfile reads back byte for byte", { skip: spawnSync("python3", ["--version"]).status !== 0 }, () => {
  const files = [
    { path: "XSS/a.txt", data: fileBytes("<svg onload=1>\r\n\ufeff漢字\n") },
    { path: "XSS/empty.txt", data: new Uint8Array() },
    { path: "SSRF/b.txt", data: fileBytes("# x\nhttp://169.254.169.254/\n") },
  ];
  const zip = buildZip(files, new Date("2026-11-13T18:47:39Z"));
  const dir = mkdtempSync(join(tmpdir(), "zip-test-"));
  const path = join(dir, "out.zip");
  writeFileSync(path, zip);
  const script = `
import json, sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
assert z.testzip() is None
print(json.dumps({i.filename: z.read(i).hex() for i in z.infolist()}))
print(json.dumps([i.compress_type for i in z.infolist()]))
print(json.dumps(z.infolist()[0].date_time))
`;
  const r = spawnSync("python3", ["-c", script, path], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const [contents, methods, date] = r.stdout.trim().split("\n").map((l) => JSON.parse(l));
  for (const f of files) assert.equal(contents[f.path], Buffer.from(f.data).toString("hex"), f.path);
  assert.deepEqual(methods, [0, 0, 0], "entries are stored, not compressed");
  assert.deepEqual(date, [2026, 11, 13, 18, 47, 38]);
});

test("buildZip is reproducible and refuses unsafe paths", () => {
  const entries = [{ path: "XSS/a.txt", data: fileBytes("x\n") }];
  const when = new Date("2026-01-01T00:00:00Z");
  assert.deepEqual(buildZip(entries, when), buildZip(entries, when));
  assert.throws(() => buildZip([{ path: "../evil.txt", data: new Uint8Array() }], when), /Unsafe path/);
});

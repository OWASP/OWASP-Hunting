import assert from "node:assert/strict";
import { test } from "node:test";

import { highlight, isCommentLine, parseQuery, searchFile, sortHits } from "./payload-search.ts";
import type { ChunkFile } from "./payload-types.ts";

function file(content: string, sections: { label: string; line: number; entries: number }[] = []): ChunkFile {
  return { path: "XSS/x.txt", name: "x.txt", bytes: content.length, sha256: "", lines: 0, entries: 0, sections, content };
}

test("parseQuery: terms, quoted phrases, case and duplicates", () => {
  assert.deepEqual(parseQuery("Alert  ONERROR").terms, ["alert", "onerror"]);
  assert.deepEqual(parseQuery('"onerror=" alert').terms, ["onerror=", "alert"]);
  assert.deepEqual(parseQuery("a A a").terms, ["a"]);
  assert.equal(parseQuery("").searchable, false);
  assert.equal(parseQuery("a").searchable, false, "one character is too broad to search");
  assert.equal(parseQuery("a b").searchable, false);
  assert.equal(parseQuery("ab").searchable, true);
  assert.equal(parseQuery('"a b"').searchable, true);
});

test("comments follow the repository rule: '# ' is a comment, '#{7*7}' is a payload", () => {
  assert.equal(isCommentLine("# heading"), true);
  assert.equal(isCommentLine("#{7*7}"), false);
});

test("searchFile: finds entries, ignores comments and blanks, reports 1-based lines", () => {
  const f = file("# onerror in a comment\n<img src=x onerror=alert(1)>\n\n<svg onload=alert(1)>\n", [
    { label: "onerror in a comment", line: 1, entries: 2 },
  ]);
  const { matches, total } = searchFile(f, parseQuery("alert"));
  assert.equal(total, 2);
  assert.deepEqual(matches.map((m) => m.line), [2, 4]);
  assert.equal(searchFile(f, parseQuery("comment")).total, 0, "comment lines are not payloads");
});

test("searchFile: all terms must match; a section heading can supply a term", () => {
  const f = file("# Polyglot XSS\n<svg onload=1>\nplain text\n# Other\n<svg onload=2>\n", [
    { label: "Polyglot XSS", line: 1, entries: 2 },
    { label: "Other", line: 4, entries: 1 },
  ]);
  const both = searchFile(f, parseQuery("svg onload"));
  assert.deepEqual(both.matches.map((m) => [m.line, m.tier]), [[2, 0], [5, 0]]);
  const assisted = searchFile(f, parseQuery("svg polyglot"));
  assert.deepEqual(assisted.matches.map((m) => [m.line, m.tier, m.section]), [[2, 1, "Polyglot XSS"]]);
  assert.equal(searchFile(f, parseQuery("nomatch")).total, 0);
});

test("searchFile: limit caps the list but not the total; case-insensitive; special characters are literal", () => {
  const lines = Array.from({ length: 50 }, (_, i) => `PAYLOAD-${i} (a+b)*c`).join("\n");
  const r = searchFile(file(lines), parseQuery("payload-"), 10);
  assert.equal(r.matches.length, 10);
  assert.equal(r.total, 50);
  assert.equal(searchFile(file(lines), parseQuery("(a+b)*c")).total, 50, "regex characters must be literal");
});

test("searchFile: CRLF files and files without a final newline", () => {
  const r = searchFile(file("one needle\r\ntwo\r\nthree needle"), parseQuery("needle"));
  assert.deepEqual(r.matches.map((m) => [m.line, m.text]), [[1, "one needle"], [3, "three needle"]]);
});

test("sortHits: full matches first, then category order, file and line", () => {
  const order = new Map([["a", 0], ["b", 1]]);
  const mk = (cat: string, line: number, tier: 0 | 1) => ({ categorySlug: cat, filePath: "f", fileName: "f", match: { line, text: "", section: "", tier } });
  const sorted = sortHits([mk("b", 1, 0), mk("a", 9, 1), mk("a", 2, 0), mk("a", 1, 0)], order);
  assert.deepEqual(sorted.map((h) => [h.categorySlug, h.match.line, h.match.tier]), [["a", 1, 0], ["a", 2, 0], ["b", 1, 0], ["a", 9, 1]]);
});

test("highlight: segments always rebuild the original text; matching is literal and case-insensitive", () => {
  const text = "<IMG src=x onerror=alert(1)> and <img>";
  const segs = highlight(text, ["img", "alert(1)"]);
  assert.equal(segs.map((s) => s.text).join(""), text);
  assert.deepEqual(segs.filter((s) => s.hit).map((s) => s.text), ["IMG", "alert(1)", "img"]);
  assert.deepEqual(highlight("nothing here", []), [{ text: "nothing here", hit: false }]);
  assert.equal(highlight("a.b", ["."]).filter((s) => s.hit).length, 1, "a dot must not match every character");
});

test("hostile text is only ever data: highlight keeps markup characters as plain segment text", () => {
  const hostile = `<script>document.title='x'</script>`;
  const segs = highlight(hostile, ["script"]);
  assert.equal(segs.map((s) => s.text).join(""), hostile);
  assert.ok(segs.every((s) => typeof s.text === "string" && typeof s.hit === "boolean"));
});

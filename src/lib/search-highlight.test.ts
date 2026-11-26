import assert from "node:assert/strict";
import { test } from "node:test";

import { markRanges, resultMatches } from "./search-highlight.ts";

test("markRanges marks the given inclusive ranges", () => {
  assert.deepEqual(markRanges("SQL Injection", [[4, 12]]), [
    { text: "SQL ", mark: false },
    { text: "Injection", mark: true },
  ]);
});

test("markRanges merges overlapping and touching ranges, in any order", () => {
  assert.deepEqual(
    markRanges("Command Injection", [
      [8, 10],
      [0, 2],
      [11, 16],
      [1, 3],
    ]),
    [
      { text: "Comm", mark: true },
      { text: "and ", mark: false },
      { text: "Injection", mark: true },
    ],
  );
});

test("markRanges clamps ranges to the text and ignores empty ones", () => {
  assert.deepEqual(markRanges("XSS", [[-2, 0], [2, 9], [5, 1]]), [
    { text: "X", mark: true },
    { text: "S", mark: false },
    { text: "S", mark: true },
  ]);
});

test("markRanges leaves text without ranges unmarked", () => {
  assert.deepEqual(markRanges("SSRF", []), [{ text: "SSRF", mark: false }]);
  assert.deepEqual(markRanges("", [[0, 3]]), [{ text: "", mark: false }]);
});

test("resultMatches keeps the title and category ranges only", () => {
  assert.deepEqual(
    resultMatches([
      { key: "title", indices: [[0, 2]] },
      { key: "tags", indices: [[0, 4]] },
      { key: "category", indices: [[1, 3]] },
      { key: "title", indices: [[5, 6]] },
    ]),
    { title: [[0, 2], [5, 6]], category: [[1, 3]] },
  );
  assert.deepEqual(resultMatches(undefined), { title: [], category: [] });
});

// The README inline renderer lives in a .tsx file that node:test cannot import,
// so this reads its TOKEN pattern from the source and checks what it matches.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "components", "payloads", "Inline.tsx"), "utf8");
const literal = /const TOKEN = \/(.+)\/([a-z]*);/.exec(source);
assert.ok(literal, "TOKEN pattern not found in Inline.tsx");
const TOKEN = new RegExp(literal[1], literal[2]);

function links(text: string): { label: string; href: string }[] {
  return [...text.matchAll(TOKEN)].filter((m) => m[3]).map((m) => ({ label: m[4], href: m[5] }));
}

test("a link keeps parentheses that are part of its URL", () => {
  const url = "https://owasp.org/www-community/attacks/Server-Side_Includes_(SSI)_Injection";
  assert.deepEqual(links(`See [SSI injection](${url}) for details.`), [{ label: "SSI injection", href: url }]);
});

test("a plain link and one followed by text in parentheses still end at the closing bracket", () => {
  assert.deepEqual(links("[A](https://example.com/a) and (see [B](https://example.com/b))"), [
    { label: "A", href: "https://example.com/a" },
    { label: "B", href: "https://example.com/b" },
  ]);
});

test("non-http schemes are not turned into links", () => {
  assert.deepEqual(links("[x](javascript:alert(1)) [y](data:text/html,hi)"), []);
});

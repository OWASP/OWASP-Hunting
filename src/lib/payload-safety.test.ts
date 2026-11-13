// Source-level guards for the two rules the Payload Explorer must never break:
//   1. payload text is untrusted and is only ever rendered as plain text;
//   2. payload strings come from the generated catalog, never from the UI code.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

const sources = (dir: string, ext: RegExp) => walk(join(ROOT, dir)).filter((f) => ext.test(f) && !/\.test\.ts$/.test(f));

// Code that renders, searches, copies or downloads payload text.
const PAYLOAD_RENDERING = [
  ...sources("src/components/payloads", /\.(ts|tsx)$/),
  ...sources("src/app/payloads", /\.(ts|tsx)$/),
  ...["payload-client", "payload-files", "payload-search", "copy-text", "payload-catalog"].map((n) => join(ROOT, "src", "lib", `${n}.ts`)),
];

const UNSAFE: [RegExp, string][] = [
  [/dangerouslySetInnerHTML/, "dangerouslySetInnerHTML"],
  [/\.innerHTML\b|\.outerHTML\b/, "innerHTML / outerHTML"],
  [/insertAdjacentHTML/, "insertAdjacentHTML"],
  [/document\.write\b/, "document.write"],
  [/\beval\s*\(/, "eval()"],
  [/new\s+Function\b/, "new Function"],
  [/\.srcdoc\b|srcDoc=/, "srcdoc"],
  [/DOMParser|createContextualFragment/, "HTML parsing"],
  [/window\.open\s*\(/, "window.open"],
  [/(?:location|location\.href)\s*=[^=]/, "assigning location"],
  [/<iframe|<object|<embed/i, "embedding elements"],
  [/setAttribute\(\s*["']on/i, "inline event handler attribute"],
];

test("payload-rendering code uses no API that can turn text into markup, script or navigation", () => {
  assert.ok(PAYLOAD_RENDERING.length > 10, "expected to scan the explorer sources");
  const problems: string[] = [];
  for (const file of PAYLOAD_RENDERING) {
    const text = readFileSync(file, "utf8");
    for (const [pattern, name] of UNSAFE) if (pattern.test(text)) problems.push(`${relative(ROOT, file)}: ${name}`);
  }
  assert.deepEqual(problems, []);
});

test("payload-rendering code makes no outbound requests other than same-origin catalog chunks", () => {
  const problems: string[] = [];
  for (const file of PAYLOAD_RENDERING) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/\bfetch\s*\(/g)) {
      const context = text.slice(Math.max(0, (m.index ?? 0) - 120), (m.index ?? 0) + 160);
      if (!/chunkUrl|fetcher|\/payload-catalog\//.test(context) && !/payload-client\.ts$/.test(file)) problems.push(relative(ROOT, file));
    }
    if (/XMLHttpRequest|sendBeacon|WebSocket|EventSource/.test(text)) problems.push(`${relative(ROOT, file)}: network API`);
  }
  assert.deepEqual(problems, []);
});

// Illustrative probes inside methodology steps and the docs' file-format example are
// documentation, not payload entries, and are kept. UI and logic code has none.
const EDUCATIONAL = new Set(["docs-data.ts", "payload-data.ts"]);
const MARKERS: [RegExp, string][] = [
  [/alert\((?:1|'XSS'|"XSS"|document\.domain)\)/, "xss payload"],
  [/'\s*OR\s*'?1'?\s*=\s*'?1/i, "sql payload"],
  [/\.\.\/\.\.\/\.\.\/etc\/passwd/, "traversal payload"],
  [/\$\{jndi:/i, "jndi payload"],
  [/169\.254\.169\.254\/latest/, "metadata payload"],
  [/<!ENTITY\s/, "xxe payload"],
  [/UNION\s+SELECT/i, "sql payload"],
];

test("no payload strings are hardcoded in UI or logic code; payloads come from the catalog", () => {
  const files = [...sources("src/components", /\.tsx?$/), ...sources("src/app", /\.tsx?$/), ...sources("src/lib", /\.ts$/)].filter(
    (f) => !EDUCATIONAL.has(f.split("/").pop() ?? ""),
  );
  const problems: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const [pattern, name] of MARKERS) if (pattern.test(text)) problems.push(`${relative(ROOT, file)}: ${name}`);
  }
  assert.deepEqual(problems, []);
});

test("the educational data files stay prose: only a few illustrative probes, never a payload list", () => {
  for (const name of EDUCATIONAL) {
    const text = readFileSync(join(ROOT, "src", "lib", name), "utf8");
    const hits = MARKERS.reduce((n, [pattern]) => n + (text.match(new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`)) ?? []).length, 0);
    assert.ok(hits <= 12, `${name} has ${hits} payload-like strings; payloads belong in the catalog`);
  }
});

test("payload-data.ts keeps only educational fields (no payload lists)", () => {
  const text = readFileSync(join(ROOT, "src", "lib", "payload-data.ts"), "utf8");
  assert.doesNotMatch(text, /payloadSections|payloads\s*:\s*\[/);
  assert.match(text, /whatItIs/);
  assert.match(text, /mitigations/);
});

test("every category in the catalog gets a page without a code change", () => {
  const index = JSON.parse(readFileSync(join(ROOT, "public", "payload-catalog", "index.json"), "utf8")) as { categories: { slug: string }[] };
  const page = readFileSync(join(ROOT, "src", "app", "payloads", "[slug]", "page.tsx"), "utf8");
  assert.match(page, /generateStaticParams[\s\S]*getAllCategorySlugs\(\)/, "static params must come from the catalog");
  assert.ok(index.categories.length >= 65);
});

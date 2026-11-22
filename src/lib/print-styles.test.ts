import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "app", "globals.css"),
  "utf8"
);

function getPrintBlock(): string {
  const match = css.match(/@media print\s*\{([\s\S]*?\n\})/);
  assert.ok(match, "@media print block must be defined in globals.css");
  return match[1];
}

test("print styles: defines @media print block", () => {
  const printBlock = getPrintBlock();
  assert.ok(printBlock.length > 0);
});

test("print styles: hides header, footer, sidebars, TOC, and interactive chrome", () => {
  const printBlock = getPrintBlock();
  assert.match(printBlock, /header[\s\S]*?footer[\s\S]*?display:\s*none\s*!important/);
  assert.match(printBlock, /\.docs-sidebar/);
  assert.match(printBlock, /\.docs-toc/);
  assert.match(printBlock, /\.mobile-nav-trigger/);
  assert.match(printBlock, /\.skip-link/);
});

test("print styles: resets background to white and ink to black for high-contrast ink-saving", () => {
  const printBlock = getPrintBlock();
  assert.match(printBlock, /html,\s*body\s*\{[^}]*background-color:\s*#fff\s*!important/);
  assert.match(printBlock, /html,\s*body\s*\{[^}]*color:\s*#000\s*!important/);
});

test("print styles: removes max-width and resets layout to full printable width", () => {
  const printBlock = getPrintBlock();
  assert.match(printBlock, /--site-width:\s*100%\s*!important/);
  assert.match(printBlock, /--site-max-width:\s*none\s*!important/);
  assert.match(printBlock, /\.reference-layout[\s\S]*?display:\s*block\s*!important/);
});

test("print styles: avoids page breaks inside code blocks, tables, and blockquotes", () => {
  const printBlock = getPrintBlock();
  assert.match(
    printBlock,
    /(?:pre|code|table)[\s\S]*?break-inside:\s*avoid[\s\S]*?page-break-inside:\s*avoid/
  );
  assert.match(
    printBlock,
    /pre,\s*code\s*\{[^}]*white-space:\s*pre-wrap\s*!important/
  );
});

test("print styles: avoids orphan headings with break-after avoid", () => {
  const printBlock = getPrintBlock();
  assert.match(
    printBlock,
    /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*break-after:\s*avoid/
  );
  assert.match(
    printBlock,
    /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*page-break-after:\s*avoid/
  );
});

test("print styles: prints external link destinations using attr(href)", () => {
  const printBlock = getPrintBlock();
  assert.match(printBlock, /a\[href\^="http"\]::after\s*\{[^}]*content:\s*" \("\s*attr\(href\)\s*"\)"/);
});

#!/usr/bin/env node
// Generate the payload catalog from a checkout of OWASP-Hunting `main`.
//
//   node generate.mjs --source <dir> --out <dir> [--check] [--summary <file>]
//        [--repository OWASP/OWASP-Hunting] [--branch main]
//        [--revision <sha> --committed-at <iso>]
//
// --revision and --committed-at default to the HEAD of the source checkout.
// --check writes nothing: it exits 1 when the catalog on disk is out of date.
// --summary writes a Markdown description of what changed.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { buildCatalog, catalogMatches, diffIndexes, formatDiff, validateCatalogDir, writeCatalog, CatalogError } from "./lib.mjs";

function git(cwd, ...args) {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function main() {
  const { values } = parseArgs({
    options: {
      source: { type: "string" },
      out: { type: "string" },
      repository: { type: "string", default: "OWASP/OWASP-Hunting" },
      branch: { type: "string", default: "main" },
      revision: { type: "string" },
      "committed-at": { type: "string" },
      summary: { type: "string" },
      check: { type: "boolean", default: false },
      validate: { type: "boolean", default: false },
    },
  });

  if (values.validate) {
    if (!values.out) throw new CatalogError("--out is required");
    const problems = validateCatalogDir(resolve(values.out));
    if (problems.length) throw new CatalogError(`Catalog is invalid:\n  ${problems.join("\n  ")}`);
    console.log("Catalog is valid.");
    return;
  }

  if (!values.source || !values.out) throw new CatalogError("--source and --out are required");
  const source = resolve(values.source);
  const out = resolve(values.out);
  const revision = values.revision ?? git(source, "rev-parse", "HEAD");
  const committedAt = values["committed-at"] ?? git(source, "log", "-1", "--format=%cI");

  const built = buildCatalog(source, {
    repository: values.repository,
    branch: values.branch,
    revision,
    committedAt,
  });

  let previous = null;
  if (existsSync(join(out, "index.json"))) {
    try {
      previous = JSON.parse(readFileSync(join(out, "index.json"), "utf8"));
    } catch {
      previous = null;
    }
  }
  const next = JSON.parse(built.index);
  const diff = diffIndexes(previous, next);
  const upToDate = catalogMatches(out, built);

  if (values.summary) {
    const stats = next.stats;
    const body = [
      `### Payload catalog`,
      "",
      `Source: \`${next.source.repository}@${next.source.branch}\` \`${next.source.revision.slice(0, 7)}\``,
      `Categories: ${stats.categories} · files: ${stats.files} · entries: ${stats.entries}`,
      "",
      upToDate ? "The catalog was already up to date." : formatDiff(diff),
      next.skipped.length ? `Skipped files: ${next.skipped.map((s) => `\`${s.path}\` (${s.reason})`).join(", ")}` : "",
      "",
    ].join("\n");
    writeFileSync(resolve(values.summary), body);
  }

  if (values.check) {
    if (!upToDate) {
      console.error("Payload catalog is out of date.");
      console.error(formatDiff(diff));
      process.exitCode = 1;
    } else {
      console.log("Payload catalog is up to date.");
    }
    return;
  }

  if (upToDate) {
    console.log(`Catalog already matches ${revision.slice(0, 7)}; nothing to write.`);
    return;
  }
  writeCatalog(out, built);
  console.log(
    `Wrote catalog for ${revision.slice(0, 7)}: ${next.stats.categories} categories, ${next.stats.files} files, ${next.stats.entries} entries.`,
  );
  if (next.skipped.length) console.warn(`Skipped ${next.skipped.length} file(s): ${next.skipped.map((s) => s.path).join(", ")}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof CatalogError ? error.message : error);
  process.exitCode = 2;
}

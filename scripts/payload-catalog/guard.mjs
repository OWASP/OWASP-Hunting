#!/usr/bin/env node
// Decide whether a sync run may publish its catalog.
//
//   node guard.mjs --source <git checkout of main> --out <catalog dir>
//
// Prints one of: publish | unchanged | stale. Exit code is always 0 unless the
// arguments are wrong, so a workflow can branch on the printed word.
//
//   publish   no catalog yet, or the catalog's revision is an ancestor of HEAD
//   unchanged the catalog already records HEAD
//   stale     the catalog records a revision that is NOT an ancestor of HEAD
//             (a newer or diverged run already published): do not overwrite it

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

export function decide(sourceDir, outDir) {
  const indexPath = join(resolve(outDir), "index.json");
  if (!existsSync(indexPath)) return "publish";
  let recorded;
  try {
    recorded = JSON.parse(readFileSync(indexPath, "utf8")).source?.revision;
  } catch {
    return "publish";
  }
  if (!/^[0-9a-f]{40}$/.test(recorded ?? "")) return "publish";
  const git = (...args) => execFileSync("git", ["-C", resolve(sourceDir), ...args], { stdio: ["ignore", "pipe", "pipe"] });
  const head = git("rev-parse", "HEAD").toString().trim();
  if (head === recorded) return "unchanged";
  try {
    git("cat-file", "-e", `${recorded}^{commit}`);
  } catch {
    return "publish"; // recorded commit is unknown here (for example rewritten history)
  }
  try {
    git("merge-base", "--is-ancestor", recorded, head);
    return "publish";
  } catch {
    return "stale";
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values } = parseArgs({ options: { source: { type: "string" }, out: { type: "string" } } });
  if (!values.source || !values.out) {
    console.error("--source and --out are required");
    process.exit(2);
  }
  console.log(decide(values.source, values.out));
}

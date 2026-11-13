// Payload catalog generator: reads the canonical OWASP-Hunting payload tree
// (a checkout of the `main` branch) and produces a deterministic, validated
// catalog for the website. Payload files are read as data only: nothing in
// them is ever executed, evaluated or fetched.
//
// No dependencies. Runs on Node 20+.

import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join, posix, resolve } from "node:path";

export const SCHEMA_VERSION = 1;
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

// Same comment rule as scripts/check_duplicates.py on main: a line is a comment
// only when it starts with "# ", "##" or "#<tab>". A line such as "#{7*7}" or
// "#<img src=x>" is a payload.
export const COMMENT_PREFIXES = ["# ", "##", "#\t"];

// Top-level directories that are never payload categories.
const EXCLUDED_DIRS = new Set([
  ".git",
  ".github",
  "scripts",
  "node_modules",
  "src",
  "public",
  "out",
  "website-source",
  "review-evidence",
]);

const CATEGORY_DIR = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SHA40 = /^[0-9a-f]{40}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export class CatalogError extends Error {}

// ─── Small helpers ─────────────────────────────────────────────────────────

export function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

export function isCommentLine(line) {
  const stripped = line.trimStart();
  return COMMENT_PREFIXES.some((prefix) => stripped.startsWith(prefix));
}

export function isEntryLine(line) {
  return line.trim() !== "" && !isCommentLine(line);
}

/** True for a relative POSIX path that cannot escape its root. */
export function isSafeRelativePath(path) {
  if (typeof path !== "string" || path === "" || path.length > 300) return false;
  if (path.includes("\0") || path.includes("\\")) return false;
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) return false;
  return path.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

export function slugify(dirName) {
  return dirName.toLowerCase();
}

/** Decode bytes as UTF-8 only if they round-trip exactly; otherwise null. */
export function decodeExact(buffer) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(buffer);
  } catch {
    return null;
  }
  return Buffer.from(text, "utf8").equals(buffer) ? text : null;
}

// ─── Discovery ─────────────────────────────────────────────────────────────

function sortedNames(dir) {
  return readdirSync(dir).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Walk one category directory and return payload file paths (relative to the
 * source root, POSIX style) plus anything that was skipped, with the reason.
 */
function walkCategory(sourceDir, dirName, skipped) {
  const files = [];
  const stack = [""];
  while (stack.length) {
    const rel = stack.pop();
    const abs = join(sourceDir, dirName, rel);
    for (const name of sortedNames(abs)) {
      if (name.startsWith(".")) continue;
      const relPath = rel ? `${rel}/${name}` : name;
      const catalogPath = `${dirName}/${relPath}`;
      const st = lstatSync(join(sourceDir, dirName, relPath));
      if (st.isSymbolicLink()) {
        skipped.push({ path: catalogPath, reason: "symbolic link" });
      } else if (st.isDirectory()) {
        stack.push(relPath);
      } else if (st.isFile() && name.toLowerCase().endsWith(".txt")) {
        files.push(catalogPath);
      }
    }
  }
  return files.sort();
}

export function discoverCategories(sourceDir) {
  const skipped = [];
  const categories = [];
  for (const name of sortedNames(sourceDir)) {
    if (name.startsWith(".") || EXCLUDED_DIRS.has(name) || !CATEGORY_DIR.test(name)) continue;
    const st = lstatSync(join(sourceDir, name));
    if (st.isSymbolicLink()) {
      skipped.push({ path: name, reason: "symbolic link" });
      continue;
    }
    if (!st.isDirectory()) continue;
    // A category is a directory that documents itself with a README.md.
    const readme = join(sourceDir, name, "README.md");
    if (!existsSync(readme) || !lstatSync(readme).isFile()) continue;
    categories.push({ dir: name, files: walkCategory(sourceDir, name, skipped) });
  }
  return { categories, skipped };
}

// ─── Parsing ───────────────────────────────────────────────────────────────

/**
 * Split a payload file into sections. A section heading is the first comment
 * line of a run of comment lines; entries are counted until the next heading.
 * Parsing is for navigation only: the file content itself is stored verbatim.
 */
export function parseSections(content) {
  const lines = content.split("\n");
  const sections = [];
  let current = null;
  let inCommentRun = false;
  let entries = 0;
  lines.forEach((raw, index) => {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    if (isCommentLine(line)) {
      if (!inCommentRun) {
        current = { label: line.trim().replace(/^#+\s*/, ""), line: index + 1, entries: 0 };
        sections.push(current);
      }
      inCommentRun = true;
    } else {
      inCommentRun = false;
      if (isEntryLine(line)) {
        entries += 1;
        if (!current) {
          current = { label: "", line: 1, entries: 0 };
          sections.push(current);
        }
        current.entries += 1;
      }
    }
  });
  return { sections, entries, lines: content === "" ? 0 : lines.length - (content.endsWith("\n") ? 1 : 0) };
}

function buildFile(sourceDir, catalogPath, skipped) {
  const abs = join(sourceDir, ...catalogPath.split("/"));
  const st = lstatSync(abs);
  if (st.size > MAX_FILE_BYTES) {
    skipped.push({ path: catalogPath, reason: `larger than ${MAX_FILE_BYTES} bytes` });
    return null;
  }
  const buffer = readFileSync(abs);
  const content = decodeExact(buffer);
  if (content === null) {
    skipped.push({ path: catalogPath, reason: "not valid UTF-8" });
    return null;
  }
  if (content.includes("\0")) {
    skipped.push({ path: catalogPath, reason: "contains NUL bytes" });
    return null;
  }
  const parsed = parseSections(content);
  return {
    path: catalogPath,
    name: posix.basename(catalogPath),
    bytes: buffer.length,
    sha256: sha256(buffer),
    lines: parsed.lines,
    entries: parsed.entries,
    sections: parsed.sections,
    content,
  };
}

/** Parse the category table in the root README: | [Name](./Dir/) | Group | */
export function parseCategoryTable(readmeText) {
  const map = new Map();
  const groupOrder = [];
  for (const line of readmeText.split("\n")) {
    const m = line.match(/^\|\s*\[([^\]]+)\]\(\.\/([^/)]+)\/?\)\s*\|\s*([^|]+?)\s*\|\s*$/);
    if (!m) continue;
    const [, name, dir, group] = m;
    map.set(dir, { name, group });
    if (!groupOrder.includes(group)) groupOrder.push(group);
  }
  return { map, groupOrder };
}

/** Pull the title and the Description paragraph out of a category README. */
export function parseCategoryReadme(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const title = (lines.find((l) => l.startsWith("# ")) ?? "").replace(/^#\s+/, "").trim();
  let description = "";
  const start = lines.findIndex((l) => /^##\s+Description\s*$/i.test(l));
  if (start >= 0) {
    const para = [];
    for (let i = start + 1; i < lines.length; i += 1) {
      if (lines[i].startsWith("#")) break;
      if (lines[i].trim() === "") {
        if (para.length) break;
        continue;
      }
      para.push(lines[i].trim());
    }
    description = para.join(" ");
  }
  return { title, description };
}

// ─── Catalog build ─────────────────────────────────────────────────────────

function requireOption(value, name, check) {
  if (!check(value)) throw new CatalogError(`Invalid or missing ${name}: ${JSON.stringify(value)}`);
}

export function buildCatalog(sourceDir, options) {
  const { repository, branch, revision, committedAt } = options;
  requireOption(repository, "repository", (v) => /^[\w.-]+\/[\w.-]+$/.test(v ?? ""));
  requireOption(branch, "branch", (v) => /^[\w./-]+$/.test(v ?? ""));
  requireOption(revision, "revision", (v) => SHA40.test(v ?? ""));
  requireOption(committedAt, "committedAt", (v) => !Number.isNaN(Date.parse(v ?? "")));

  const root = resolve(sourceDir);
  const versionFile = join(root, "VERSION");
  const version = existsSync(versionFile) ? readFileSync(versionFile, "utf8").trim() : "";
  if (version && !SEMVER.test(version)) throw new CatalogError(`VERSION is not a version: ${version}`);

  const readmePath = join(root, "README.md");
  const table = existsSync(readmePath)
    ? parseCategoryTable(readFileSync(readmePath, "utf8"))
    : { map: new Map(), groupOrder: [] };

  const { categories: discovered, skipped } = discoverCategories(root);
  const chunks = new Map();
  const categories = [];
  const seenSlugs = new Set();
  const seenPaths = new Set();

  for (const entry of discovered) {
    const slug = slugify(entry.dir);
    if (seenSlugs.has(slug)) throw new CatalogError(`Duplicate category slug: ${slug}`);
    seenSlugs.add(slug);

    const files = [];
    for (const catalogPath of entry.files) {
      if (!isSafeRelativePath(catalogPath)) throw new CatalogError(`Unsafe path: ${catalogPath}`);
      if (seenPaths.has(catalogPath)) throw new CatalogError(`Duplicate file path: ${catalogPath}`);
      seenPaths.add(catalogPath);
      const file = buildFile(root, catalogPath, skipped);
      if (file) files.push(file);
    }

    const meta = table.map.get(entry.dir);
    const readme = parseCategoryReadme(readFileSync(join(root, entry.dir, "README.md"), "utf8"));
    const chunk = { schemaVersion: SCHEMA_VERSION, slug, dir: entry.dir, files };
    const chunkText = `${JSON.stringify(chunk)}\n`;
    chunks.set(slug, chunkText);

    categories.push({
      slug,
      dir: entry.dir,
      name: meta?.name ?? (readme.title || entry.dir.replace(/-/g, " ")),
      group: meta?.group ?? "Other",
      description: readme.description,
      stats: {
        files: files.length,
        entries: files.reduce((n, f) => n + f.entries, 0),
        bytes: files.reduce((n, f) => n + f.bytes, 0),
      },
      files: files.map((f) => ({
        path: f.path,
        name: f.name,
        bytes: f.bytes,
        entries: f.entries,
        sections: f.sections.length,
        sha256: f.sha256,
      })),
      chunk: `${slug}.json`,
      chunkSha256: sha256(chunkText),
    });
  }

  categories.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  const usedGroups = new Set(categories.map((c) => c.group));
  const groups = [...table.groupOrder.filter((g) => usedGroups.has(g)), ...[...usedGroups].filter((g) => !table.groupOrder.includes(g)).sort()];

  skipped.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const index = {
    schemaVersion: SCHEMA_VERSION,
    project: { version },
    source: {
      repository,
      branch,
      revision,
      committedAt: new Date(committedAt).toISOString(),
      commitUrl: `https://github.com/${repository}/commit/${revision}`,
    },
    stats: {
      categories: categories.length,
      files: categories.reduce((n, c) => n + c.stats.files, 0),
      entries: categories.reduce((n, c) => n + c.stats.entries, 0),
      bytes: categories.reduce((n, c) => n + c.stats.bytes, 0),
      skipped: skipped.length,
    },
    groups,
    categories,
    skipped,
  };
  return { index: `${JSON.stringify(index, null, 2)}\n`, chunks };
}

// ─── Validation ────────────────────────────────────────────────────────────

/** Validate a catalog on disk. Returns a list of problems (empty when valid). */
export function validateCatalogDir(dir) {
  const problems = [];
  const fail = (msg) => problems.push(msg);
  const indexPath = join(dir, "index.json");
  if (!existsSync(indexPath)) return ["index.json is missing"];
  let index;
  try {
    index = JSON.parse(readFileSync(indexPath, "utf8"));
  } catch (error) {
    return [`index.json is not valid JSON: ${error.message}`];
  }
  if (index.schemaVersion !== SCHEMA_VERSION) fail(`unsupported schemaVersion ${index.schemaVersion}`);
  if (!SHA40.test(index.source?.revision ?? "")) fail("source.revision is not a 40-character SHA");
  if (!Array.isArray(index.categories) || index.categories.length === 0) fail("no categories");

  const slugs = new Set();
  const paths = new Set();
  const expectedChunks = new Set(["index.json"]);
  let files = 0;
  let entries = 0;
  let bytes = 0;

  for (const cat of index.categories ?? []) {
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(cat.slug ?? "")) fail(`bad slug ${JSON.stringify(cat.slug)}`);
    if (slugs.has(cat.slug)) fail(`duplicate slug ${cat.slug}`);
    slugs.add(cat.slug);
    if (cat.chunk !== `${cat.slug}.json`) fail(`${cat.slug}: unexpected chunk name ${cat.chunk}`);
    expectedChunks.add(cat.chunk);

    const chunkPath = join(dir, cat.chunk ?? "");
    if (!isSafeRelativePath(cat.chunk) || !existsSync(chunkPath)) {
      fail(`${cat.slug}: chunk file is missing`);
      continue;
    }
    const chunkText = readFileSync(chunkPath, "utf8");
    if (sha256(chunkText) !== cat.chunkSha256) fail(`${cat.slug}: chunk hash does not match the index`);
    let chunk;
    try {
      chunk = JSON.parse(chunkText);
    } catch {
      fail(`${cat.slug}: chunk is not valid JSON`);
      continue;
    }
    if (chunk.slug !== cat.slug || chunk.files?.length !== cat.files.length) fail(`${cat.slug}: chunk does not match the index`);

    chunk.files?.forEach((file, i) => {
      const meta = cat.files[i];
      if (!isSafeRelativePath(file.path) || !file.path.startsWith(`${cat.dir}/`)) fail(`${cat.slug}: unsafe path ${file.path}`);
      if (paths.has(file.path)) fail(`duplicate file path ${file.path}`);
      paths.add(file.path);
      const raw = Buffer.from(file.content, "utf8");
      if (sha256(raw) !== file.sha256) fail(`${file.path}: content hash mismatch`);
      if (raw.length !== file.bytes) fail(`${file.path}: byte count mismatch`);
      if (meta?.path !== file.path || meta?.sha256 !== file.sha256) fail(`${file.path}: index entry mismatch`);
      const parsed = parseSections(file.content);
      if (parsed.entries !== file.entries) fail(`${file.path}: entry count mismatch`);
      files += 1;
      entries += file.entries;
      bytes += file.bytes;
    });
  }

  const s = index.stats ?? {};
  if (s.categories !== (index.categories ?? []).length) fail("stats.categories does not match");
  if (s.files !== files) fail("stats.files does not match");
  if (s.entries !== entries) fail("stats.entries does not match");
  if (s.bytes !== bytes) fail("stats.bytes does not match");

  for (const name of readdirSync(dir)) {
    if (!expectedChunks.has(name)) fail(`unexpected file ${name}`);
  }
  return problems;
}

// ─── Writing ───────────────────────────────────────────────────────────────

/**
 * Write the catalog to `outDir` without ever leaving a half-written catalog:
 * build and validate in a sibling temp directory first, then swap. If anything
 * fails, the previous catalog is left untouched.
 */
export function writeCatalog(outDir, built) {
  const target = resolve(outDir);
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  const old = `${target}.old-${process.pid}-${Date.now()}`;
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  try {
    writeFileSync(join(tmp, "index.json"), built.index);
    for (const [slug, text] of built.chunks) writeFileSync(join(tmp, `${slug}.json`), text);
    const problems = validateCatalogDir(tmp);
    if (problems.length) throw new CatalogError(`Generated catalog is invalid:\n  ${problems.join("\n  ")}`);
    if (existsSync(target)) renameSync(target, old);
    try {
      renameSync(tmp, target);
    } catch (error) {
      if (existsSync(old)) renameSync(old, target);
      throw error;
    }
    rmSync(old, { recursive: true, force: true });
  } catch (error) {
    rmSync(tmp, { recursive: true, force: true });
    throw error;
  }
}

/** Compare freshly built output to the catalog on disk. */
export function catalogMatches(outDir, built) {
  const target = resolve(outDir);
  if (!existsSync(join(target, "index.json"))) return false;
  const current = new Map();
  for (const name of readdirSync(target)) current.set(name, readFileSync(join(target, name), "utf8"));
  const wanted = new Map([["index.json", built.index]]);
  for (const [slug, text] of built.chunks) wanted.set(`${slug}.json`, text);
  if (current.size !== wanted.size) return false;
  for (const [name, text] of wanted) if (current.get(name) !== text) return false;
  return true;
}

// ─── Change detection ──────────────────────────────────────────────────────

/** Describe what changed between two index.json documents (as parsed objects). */
export function diffIndexes(before, after) {
  const flat = (index) => {
    const map = new Map();
    for (const cat of index?.categories ?? []) for (const f of cat.files) map.set(f.path, f.sha256);
    return map;
  };
  const a = flat(before);
  const b = flat(after);
  const added = [];
  const removed = [];
  const modified = [];
  for (const [path, hash] of b) {
    if (!a.has(path)) added.push(path);
    else if (a.get(path) !== hash) modified.push(path);
  }
  for (const path of a.keys()) if (!b.has(path)) removed.push(path);
  // A removed and an added file with identical content is a rename.
  const renamed = [];
  for (const from of [...removed]) {
    const to = added.find((candidate) => b.get(candidate) === a.get(from));
    if (to) {
      renamed.push({ from, to });
      removed.splice(removed.indexOf(from), 1);
      added.splice(added.indexOf(to), 1);
    }
  }
  return { added: added.sort(), removed: removed.sort(), modified: modified.sort(), renamed };
}

export function formatDiff(diff) {
  const lines = [];
  const list = (title, items) => {
    if (items.length) lines.push(`**${title} (${items.length})**`, ...items.map((i) => `- \`${i}\``), "");
  };
  list("Added", diff.added);
  list("Modified", diff.modified);
  list("Removed", diff.removed);
  if (diff.renamed.length) {
    lines.push(`**Renamed (${diff.renamed.length})**`, ...diff.renamed.map((r) => `- \`${r.from}\` → \`${r.to}\``), "");
  }
  return lines.length ? lines.join("\n") : "No payload files changed.\n";
}

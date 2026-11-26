// Full-text search over payload files. Pure functions: no DOM, no network.
//
// Matching is on plain text only. A line matches when every search term occurs
// in the entry itself or in the heading of the section it belongs to, and at
// least one term occurs in the entry. Entries that contain every term come
// first. Nothing here evaluates, parses or renders payload content.

import type { ChunkFile } from "./payload-types";

export const MIN_QUERY_LENGTH = 2;

export interface ParsedQuery {
  terms: string[];
  /** True when the query is long enough to search for. */
  searchable: boolean;
}

export interface Match {
  /** 1-based line number in the file. */
  line: number;
  text: string;
  section: string;
  /** 0: the entry contains every term. 1: it matched with the help of its section heading. */
  tier: 0 | 1;
}

const COMMENT_PREFIXES = ["# ", "##", "#\t"];

export function isCommentLine(line: string): boolean {
  const stripped = line.trimStart();
  return COMMENT_PREFIXES.some((prefix) => stripped.startsWith(prefix));
}

/** Split into terms. Double quotes keep a phrase together: "onerror=" alert */
export function parseQuery(input: string): ParsedQuery {
  const terms: string[] = [];
  const pattern = /"([^"]+)"|(\S+)/g;
  for (const m of input.matchAll(pattern)) {
    const term = (m[1] ?? m[2] ?? "").trim();
    if (term) terms.push(term.toLowerCase());
  }
  const unique = [...new Set(terms)];
  const longest = unique.reduce((n, t) => Math.max(n, t.length), 0);
  return { terms: unique, searchable: unique.length > 0 && longest >= MIN_QUERY_LENGTH };
}

function splitLines(content: string): string[] {
  const lines = content.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
}

/**
 * Search one file. `limit` caps the number of matches returned; `total` always
 * counts every match so the UI can say "showing 200 of 1,204".
 */
export function searchFile(file: ChunkFile, query: ParsedQuery, limit = Infinity): { matches: Match[]; total: number } {
  if (!query.searchable) return { matches: [], total: 0 };
  const lines = splitLines(file.content);
  const headings = file.sections;
  const matches: Match[] = [];
  let total = 0;
  let sectionIndex = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    while (sectionIndex + 1 < headings.length && headings[sectionIndex + 1].line <= lineNumber) sectionIndex += 1;
    const line = lines[i];
    if (line.trim() === "" || isCommentLine(line)) continue;

    const lower = line.toLowerCase();
    const section = sectionIndex >= 0 ? headings[sectionIndex].label : "";
    const inEntry = query.terms.filter((t) => lower.includes(t));
    if (inEntry.length === 0) continue;
    let tier: 0 | 1;
    if (inEntry.length === query.terms.length) {
      tier = 0;
    } else {
      const withSection = `${lower} ${section.toLowerCase()}`;
      if (!query.terms.every((t) => withSection.includes(t))) continue;
      tier = 1;
    }
    total += 1;
    if (matches.length < limit) matches.push({ line: lineNumber, text: line, section, tier });
  }
  return { matches, total };
}

export interface Hit {
  categorySlug: string;
  filePath: string;
  fileName: string;
  match: Match;
}

/** Order results: entries containing every term first, then by category and position. */
export function sortHits(hits: Hit[], categoryOrder: Map<string, number>): Hit[] {
  return [...hits].sort(
    (a, b) =>
      a.match.tier - b.match.tier ||
      (categoryOrder.get(a.categorySlug) ?? 0) - (categoryOrder.get(b.categorySlug) ?? 0) ||
      (a.filePath < b.filePath ? -1 : a.filePath > b.filePath ? 1 : 0) ||
      a.match.line - b.match.line,
  );
}

export interface Segment {
  text: string;
  hit: boolean;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split a line into plain and highlighted segments. Concatenating them gives the original text. */
export function highlight(text: string, terms: string[]): Segment[] {
  if (terms.length === 0) return [{ text, hit: false }];
  const pattern = new RegExp(terms.map(escapeRegExp).sort((a, b) => b.length - a.length).join("|"), "giu");
  const segments: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index === undefined || m[0] === "") continue;
    if (m.index > last) segments.push({ text: text.slice(last, m.index), hit: false });
    segments.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), hit: false });
  return segments.length ? segments : [{ text, hit: false }];
}

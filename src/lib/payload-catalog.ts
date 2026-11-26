// Build-time access to the generated payload catalog (public/payload-catalog).
// Only server components call this: it reads files with fs while the static
// export is built. The browser gets slim props and fetches chunks lazily.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NavSection } from "@/lib/navigation";
import type { CatalogCategory, CatalogIndex, CategoryChunk } from "@/lib/payload-types";

const CATALOG_DIR = join(process.cwd(), "public", "payload-catalog");

// Cached during a production build. In development the catalog can be
// regenerated while the server runs, so it is read fresh each time.
const CACHE = process.env.NODE_ENV === "production";
let cachedIndex: CatalogIndex | null = null;
const cachedReadmes = new Map<string, CategoryChunk["readme"]>();

export function getCatalogIndex(): CatalogIndex {
  if (CACHE && cachedIndex) return cachedIndex;
  const index = JSON.parse(readFileSync(join(CATALOG_DIR, "index.json"), "utf8")) as CatalogIndex;
  if (CACHE) cachedIndex = index;
  return index;
}

/** Categories in the order the library shows them: by group, then by name. */
export function getOrderedCategories(): CatalogCategory[] {
  const index = getCatalogIndex();
  const rank = new Map(index.groups.map((g, i) => [g, i]));
  return [...index.categories].sort(
    (a, b) => (rank.get(a.group) ?? 99) - (rank.get(b.group) ?? 99) || a.name.localeCompare(b.name, "en"),
  );
}

export function getCategory(slug: string): CatalogCategory | undefined {
  return getCatalogIndex().categories.find((c) => c.slug === slug);
}

export function getAllCategorySlugs(): string[] {
  return getCatalogIndex().categories.map((c) => c.slug);
}

/** The README of a category as structured blocks (read from the chunk at build time). */
export function getReadme(slug: string): CategoryChunk["readme"] | undefined {
  const category = getCategory(slug);
  if (!category) return undefined;
  let readme = CACHE ? cachedReadmes.get(slug) : undefined;
  if (!readme) {
    const chunk = JSON.parse(readFileSync(join(CATALOG_DIR, category.chunk), "utf8")) as CategoryChunk;
    readme = chunk.readme;
    if (CACHE) cachedReadmes.set(slug, readme);
  }
  return readme;
}

export function getPayloadNav(): NavSection[] {
  const index = getCatalogIndex();
  const ordered = getOrderedCategories();
  return index.groups.map((group) => ({
    title: group,
    items: ordered.filter((c) => c.group === group).map((c) => ({ title: c.name, href: `/payloads/${c.slug}` })),
  }));
}

export function getNeighbours(slug: string): { prev?: CatalogCategory; next?: CatalogCategory } {
  const ordered = getOrderedCategories();
  const i = ordered.findIndex((c) => c.slug === slug);
  return { prev: i > 0 ? ordered[i - 1] : undefined, next: i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : undefined };
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

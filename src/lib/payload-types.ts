// Shape of the generated payload catalog (see scripts/payload-catalog/lib.mjs).
// The catalog is the source of truth for payload content: the website never
// carries its own copy of a payload string.

export interface CatalogSource {
  repository: string;
  branch: string;
  revision: string;
  committedAt: string;
  commitUrl: string;
}

export interface CatalogFileMeta {
  path: string;
  name: string;
  bytes: number;
  entries: number;
  sections: number;
  sha256: string;
}

export interface CatalogCategory {
  slug: string;
  dir: string;
  name: string;
  group: string;
  description: string;
  stats: { files: number; entries: number; bytes: number };
  files: CatalogFileMeta[];
  chunk: string;
  chunkSha256: string;
}

export interface CatalogIndex {
  schemaVersion: number;
  project: { version: string };
  source: CatalogSource;
  stats: { categories: number; files: number; entries: number; bytes: number; skipped: number };
  groups: string[];
  categories: CatalogCategory[];
  skipped: { path: string; reason: string }[];
}

export interface FileSection {
  label: string;
  line: number;
  entries: number;
}

export interface ChunkFile {
  path: string;
  name: string;
  bytes: number;
  sha256: string;
  lines: number;
  entries: number;
  sections: FileSection[];
  /** The file exactly as it is on main. Treat as untrusted text. */
  content: string;
}

export type ReadmeBlock =
  | { t: "h"; level: 2 | 3 | 4; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "code"; lang: string; text: string };

export interface CategoryChunk {
  schemaVersion: number;
  slug: string;
  dir: string;
  readme: { path: string; sha256: string; title: string; blocks: ReadmeBlock[] };
  files: ChunkFile[];
}

/** The slim part of the index the browser needs to browse and search. */
export interface CategorySummary {
  slug: string;
  dir: string;
  name: string;
  group: string;
  description: string;
  files: number;
  entries: number;
  chunk: string;
  chunkSha256: string;
}

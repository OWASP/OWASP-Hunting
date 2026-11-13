// Lazy loading of catalog chunks in the browser, with an integrity check.
// The only network request this makes is a GET for a chunk file that lives on
// the same origin as the site. Payload content is never fetched or followed.

import type { CategoryChunk } from "./payload-types";

export interface ChunkRef {
  slug: string;
  chunk: string;
  chunkSha256: string;
}

export class ChunkError extends Error {}

export async function sha256Hex(text: string): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function chunkUrl(basePath: string, chunk: string): string {
  if (!/^[a-z0-9][a-z0-9._-]*\.json$/.test(chunk)) throw new ChunkError(`Invalid chunk name: ${chunk}`);
  return `${basePath}/payload-catalog/${chunk}`;
}

function assertChunk(value: unknown, slug: string): CategoryChunk {
  const chunk = value as CategoryChunk;
  const ok =
    chunk &&
    typeof chunk === "object" &&
    chunk.slug === slug &&
    Array.isArray(chunk.files) &&
    chunk.files.every((f) => f && typeof f.content === "string" && typeof f.path === "string" && Array.isArray(f.sections));
  if (!ok) throw new ChunkError("The payload data for this category is malformed.");
  return chunk;
}

export type Fetcher = (input: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

const cache = new Map<string, Promise<CategoryChunk>>();

/** Fetch, verify and parse one category chunk. Results are cached per slug. */
export function loadChunk(basePath: string, ref: ChunkRef, fetcher: Fetcher = fetch as unknown as Fetcher, signal?: AbortSignal): Promise<CategoryChunk> {
  const cached = cache.get(ref.slug);
  if (cached) return cached;
  const pending = (async () => {
    const response = await fetcher(chunkUrl(basePath, ref.chunk), { signal });
    if (!response.ok) throw new ChunkError(`The server answered ${response.status} for ${ref.chunk}.`);
    const text = await response.text();
    const actual = await sha256Hex(text);
    if (actual !== null && actual !== ref.chunkSha256) {
      throw new ChunkError("The payload data failed its integrity check. Reload the page; if it keeps happening, the deployment may be mid-update.");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ChunkError("The payload data could not be read.");
    }
    return assertChunk(parsed, ref.slug);
  })();
  // A failed or cancelled load must not poison the cache.
  pending.catch(() => cache.delete(ref.slug));
  cache.set(ref.slug, pending);
  return pending;
}

export function clearChunkCache(): void {
  cache.clear();
}

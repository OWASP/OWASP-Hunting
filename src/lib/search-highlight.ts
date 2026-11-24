// Marks the parts of a search result that matched the query, from the index ranges Fuse returns.

/** An inclusive [start, end] range of character indices, as Fuse reports matches. */
export type MatchRange = readonly [number, number];

export interface MarkedSegment {
  text: string;
  mark: boolean;
}

export interface ResultMatches {
  title: MatchRange[];
  category: MatchRange[];
}

/** Splits text into marked and unmarked segments. Overlapping or touching ranges are merged. */
export function markRanges(text: string, ranges: readonly MatchRange[]): MarkedSegment[] {
  const sorted = ranges
    .map(([start, end]) => [Math.max(0, start), Math.min(text.length - 1, end)] as [number, number])
    .filter(([start, end]) => start <= end)
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && range[0] <= previous[1] + 1) previous[1] = Math.max(previous[1], range[1]);
    else merged.push([range[0], range[1]]);
  }

  const segments: MarkedSegment[] = [];
  let last = 0;
  for (const [start, end] of merged) {
    if (start > last) segments.push({ text: text.slice(last, start), mark: false });
    segments.push({ text: text.slice(start, end + 1), mark: true });
    last = end + 1;
  }
  if (last < text.length) segments.push({ text: text.slice(last), mark: false });
  return segments.length ? segments : [{ text, mark: false }];
}

/** Picks the ranges for the fields the result list shows: the title and the category. */
export function resultMatches(
  matches: readonly { key?: string; indices: readonly MatchRange[] }[] | undefined,
): ResultMatches {
  const rangesFor = (key: string) => (matches ?? []).filter((m) => m.key === key).flatMap((m) => [...m.indices]);
  return { title: rangesFor("title"), category: rangesFor("category") };
}

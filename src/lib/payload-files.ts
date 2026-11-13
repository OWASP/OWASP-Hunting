// Helpers for showing, copying and downloading payload files. Pure and
// dependency free so they can be tested without a browser.

export type LineKind = "comment" | "entry" | "blank";

export interface DisplayLine {
  /** 1-based line number in the source file. */
  number: number;
  /** The line without its line ending. This is also what "copy" puts on the clipboard. */
  text: string;
  kind: LineKind;
}

const COMMENT_PREFIXES = ["# ", "##", "#\t"];

export function classifyLine(line: string): LineKind {
  if (line.trim() === "") return "blank";
  const stripped = line.trimStart();
  return COMMENT_PREFIXES.some((p) => stripped.startsWith(p)) ? "comment" : "entry";
}

/** Split file content into lines for display. Does not alter the text of any line. */
export function toDisplayLines(content: string): DisplayLine[] {
  const parts = content.split("\n");
  if (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts.map((raw, i) => {
    const text = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    return { number: i + 1, text, kind: classifyLine(text) };
  });
}

// ─── Reading comments as headings ──────────────────────────────────────────

/**
 * The words of a comment line without its "# " marker or decorative rules.
 * Returns "" for banner lines such as "# ========" that have no words.
 */
export function commentText(line: string): string {
  const text = line.trim().replace(/^#+\s*/, "");
  if (!/[\p{L}\p{N}]/u.test(text)) return "";
  return text.replace(/^[=\-#*_\s]+|[=\-#*_\s]+$/g, "");
}

export type LineRole =
  | "title" // a heading with no payloads of its own, such as a file or group title
  | "section" // a heading followed by payloads
  | "note" // a comment under a heading, shown as a plain sentence
  | "rule" // a decorative banner line, not shown
  | "entry"
  | "blank";

export interface RoleInfo {
  role: LineRole;
  /** Comment text without the marker. */
  text: string;
  /** For headings: the payload lines up to the next heading, exactly as in the file. */
  payloads?: string[];
}

/**
 * Work out how each line of a payload file should be shown. A run of comment
 * lines is a heading (its first line with words) followed by notes; banner
 * lines are rules. A heading is a "section" when payloads follow it. This only
 * affects display: copying always uses the original line text.
 */
export function buildLineRoles(lines: DisplayLine[]): Map<number, RoleInfo> {
  const roles = new Map<number, RoleInfo>();
  const headings: { line: number; index: number }[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.kind === "entry") {
      roles.set(line.number, { role: "entry", text: line.text });
      i += 1;
    } else if (line.kind === "blank") {
      roles.set(line.number, { role: "blank", text: "" });
      i += 1;
    } else {
      let headingSeen = false;
      while (i < lines.length && lines[i].kind === "comment") {
        const text = commentText(lines[i].text);
        if (text === "") roles.set(lines[i].number, { role: "rule", text: "" });
        else if (!headingSeen) {
          headingSeen = true;
          roles.set(lines[i].number, { role: "title", text, payloads: [] });
          headings.push({ line: lines[i].number, index: i });
        } else roles.set(lines[i].number, { role: "note", text });
        i += 1;
      }
    }
  }
  headings.forEach((heading, h) => {
    const end = h + 1 < headings.length ? headings[h + 1].index : lines.length;
    const payloads = lines.slice(heading.index + 1, end).filter((l) => l.kind === "entry").map((l) => l.text);
    const info = roles.get(heading.line) as RoleInfo;
    info.payloads = payloads;
    info.role = payloads.length > 0 ? "section" : "title";
  });
  return roles;
}

/** The exact bytes of a file as it is on main (valid UTF-8, BOM preserved). */
export function fileBytes(content: string): Uint8Array {
  return new TextEncoder().encode(content);
}

/** A file name that is safe to hand to the browser's download dialog. */
export function safeFileName(name: string, fallback = "payloads.txt"): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^[._]+/, "");
  return cleaned === "" ? fallback : cleaned.slice(0, 120);
}

/** A relative, forward-slash path with no traversal; null when it is not safe. */
export function safeArchivePath(path: string): string | null {
  if (!path || path.length > 300 || path.includes("\0") || path.includes("\\")) return null;
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) return null;
  const parts = path.split("/");
  return parts.every((p) => p !== "" && p !== "." && p !== "..") ? path : null;
}

// ─── ZIP (stored, no compression) ──────────────────────────────────────────

let crcTable: Uint32Array | null = null;

export function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  path: string;
  data: Uint8Array;
}

function dosDateTime(date: Date): { time: number; day: number } {
  const year = Math.max(1980, date.getUTCFullYear());
  return {
    time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >> 1),
    day: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  };
}

/**
 * Build a ZIP archive that stores each file uncompressed, so every byte of a
 * payload file is preserved. `modified` is stamped on every entry, which keeps
 * the output reproducible for a given catalog revision.
 */
export function buildZip(entries: ZipEntry[], modified: Date): Uint8Array {
  const encoder = new TextEncoder();
  const { time, day } = dosDateTime(modified);
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const safe = safeArchivePath(entry.path);
    if (!safe) throw new Error(`Unsafe path in archive: ${entry.path}`);
    const name = encoder.encode(safe);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint16(10, time, true);
    local.setUint16(12, day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), name, entry.data);

    const header = new DataView(new ArrayBuffer(46));
    header.setUint32(0, 0x02014b50, true);
    header.setUint16(4, 20, true);
    header.setUint16(6, 20, true);
    header.setUint16(8, 0x0800, true);
    header.setUint16(10, 0, true);
    header.setUint16(12, time, true);
    header.setUint16(14, day, true);
    header.setUint32(16, crc, true);
    header.setUint32(20, size, true);
    header.setUint32(24, size, true);
    header.setUint16(28, name.length, true);
    header.setUint32(42, offset, true);
    central.push(new Uint8Array(header.buffer), name);

    offset += 30 + name.length + size;
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let pos = 0;
  for (const part of all) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}

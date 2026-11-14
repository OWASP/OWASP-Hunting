"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, Copy, Download, ExternalLink, TriangleAlert, X } from "lucide-react";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { SITE_CONFIG } from "@/lib/navigation";
import { copyText } from "@/lib/copy-text";
import { ChunkError, clearChunkCache, loadChunk } from "@/lib/payload-client";
import { buildLineRoles, buildZip, fileBytes, toDisplayLines } from "@/lib/payload-files";
import type { DisplayLine, RoleInfo } from "@/lib/payload-files";
import { parseQuery, searchFile } from "@/lib/payload-search";
import type { CatalogCategory, CatalogSource, CategoryChunk, ChunkFile } from "@/lib/payload-types";
import { downloadBytes } from "./download";
import { HighlightedText } from "./HighlightedText";
import { useMediaQuery } from "./useMediaQuery";
import styles from "./payloads.module.css";

interface Props {
  category: CatalogCategory;
  source: CatalogSource;
}

type Load = { state: "loading" } | { state: "ready"; chunk: CategoryChunk } | { state: "error"; message: string };
type Feedback = { key: string; ok: boolean } | null;

const n = (value: number) => new Intl.NumberFormat("en-US").format(value);
const kb = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`);

/** Reads "#file.txt" or "#file.txt:120" from the URL hash. */
function parseHash(hash: string): { name: string; line: number | null } | null {
  let raw = hash.replace(/^#/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!raw) return null;
  const m = raw.match(/^(.+?):(\d+)$/);
  return m ? { name: m[1], line: Number(m[2]) } : { name: raw, line: null };
}

/** The file people expect first: <slug>-payloads.txt, otherwise the one with the most payloads. */
function defaultFilePath(category: CatalogCategory): string {
  const main = category.files.find((f) => f.name === `${category.slug}-payloads.txt`);
  if (main) return main.path;
  return [...category.files].sort((a, b) => b.entries - a.entries)[0]?.path ?? "";
}

/**
 * Focus a row and bring it into view at once. The site sets smooth scrolling, which makes
 * repeated arrow keys or a section jump lag behind focus on a long file, so scrolling is
 * done here explicitly. Rows carry a scroll margin that keeps them clear of the sticky toolbar.
 */
function focusRow(id: string, block: "nearest" | "start"): void {
  const row = document.getElementById(id);
  if (!row) return;
  row.focus({ preventScroll: true });
  row.scrollIntoView({ block, behavior: "instant" });
}

const rowId = (fileName: string, line: number) => `row-${fileName.replace(/[^A-Za-z0-9_-]/g, "_")}-${line}`;

interface RowProps {
  line: DisplayLine;
  id: string;
  role: RoleInfo["role"];
  /** Comment text without its marker (headings and notes). */
  text: string;
  /** For section headings: the payloads under it, for "Copy section". */
  payloadCount: number;
  terms: string[];
  section?: string;
  target: boolean;
  roving: boolean;
  copied: Feedback;
  onCopy: (key: string, text: string, message: string) => void;
  onCopySection: (line: number, label: string) => void;
}

const Row = memo(function Row({ line, id, role, text, payloadCount, terms, section, target, roving, copied, onCopy, onCopySection }: RowProps) {
  const key = `line-${line.number}`;
  const state = copied && copied.key === key ? (copied.ok ? "done" : "error") : undefined;

  if (role === "rule") return <li id={id} className={styles.line} data-role="rule" aria-hidden />;

  // An empty line stays empty: just a small gap, no number.
  if (role === "blank") return <li id={id} className={styles.line} data-role="blank" aria-hidden />;

  if (role === "title" || role === "section") {
    const sectionState = copied && copied.key === `section-${line.number}` ? (copied.ok ? "done" : "error") : undefined;
    return (
      <li id={id} className={styles.line} data-role={role} data-heading="true" data-line={line.number} data-target={target ? "true" : undefined} tabIndex={-1}>
        <h4 className={styles.headingText}>{text}</h4>
        <span className={styles.lineAction}>
          {role === "section" && payloadCount > 1 ? (
            <button
              type="button"
              tabIndex={-1}
              className={styles.sectionCopy}
              data-state={sectionState}
              aria-label={`Copy all ${payloadCount} payloads in ${text}`}
              title={`Copy all ${payloadCount} payloads in this section`}
              onClick={() => onCopySection(line.number, text)}
            >
              {sectionState === "done" ? <Check size={13} aria-hidden /> : sectionState === "error" ? <TriangleAlert size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
              {sectionState === "done" ? "Copied" : `Copy ${payloadCount}`}
            </button>
          ) : null}
        </span>
      </li>
    );
  }

  if (role === "note") {
    return (
      <li id={id} className={styles.line} data-role="note" data-line={line.number}>
        <p className={styles.noteText}>{text}</p>
      </li>
    );
  }

  return (
    <li
      id={id}
      className={styles.line}
      data-role="entry"
      data-entry="true"
      data-line={line.number}
      data-target={target ? "true" : undefined}
      tabIndex={roving ? 0 : -1}
      aria-describedby="row-help"
    >
      <span className={styles.lineText}>
        <HighlightedText text={line.text} terms={terms} />
        {section ? <span className={styles.matchSection}>in {section}</span> : null}
      </span>
      <span className={styles.lineAction}>
        <button
          type="button"
          tabIndex={-1}
          className={styles.iconBtn}
          data-state={state}
          aria-label={`Copy payload: ${line.text.length > 60 ? `${line.text.slice(0, 60)}...` : line.text}`}
          title="Copy this payload"
          onClick={() => onCopy(key, line.text, "Copied payload")}
        >
          {state === "done" ? <Check size={14} aria-hidden /> : state === "error" ? <TriangleAlert size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        </button>
      </span>
    </li>
  );
});

export function CategoryExplorer({ category, source }: Props) {
  const basePath = SITE_CONFIG.basePath;
  const desktop = useMediaQuery("(min-width: 900px)");
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [activePath, setActivePath] = useState<string>(() => defaultFilePath(category));
  const [filter, setFilter] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [live, setLive] = useState("");
  const [targetLine, setTargetLine] = useState<number | null>(null);
  const [roving, setRoving] = useState<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  // Fetch the category chunk. Its hash is checked against the index before it is used.
  useEffect(() => {
    let cancelled = false;
    loadChunk(basePath, category)
      .then((chunk) => {
        if (!cancelled) setLoad({ state: "ready", chunk });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoad({
          state: "error",
          message: error instanceof ChunkError ? error.message : "The payload data could not be loaded. Check your connection and try again.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [basePath, category, attempt]);

  // Open the file and line named in the URL hash once the data is here.
  const chunkForHash = load.state === "ready" ? load.chunk : null;
  useEffect(() => {
    if (!chunkForHash) return;
    const apply = () => {
      const parsed = parseHash(window.location.hash);
      if (!parsed) return;
      const file = chunkForHash.files.find((f) => f.name === parsed.name || f.path === parsed.name);
      if (!file) return;
      setActivePath(file.path);
      setFilter("");
      setTargetLine(parsed.line);
      const line = parsed.line;
      if (line) {
        window.setTimeout(() => {
          document.getElementById(rowId(file.name, line))?.scrollIntoView({ block: "center", behavior: "instant" });
        }, 0);
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [chunkForHash]);

  useEffect(
    () => () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    },
    [],
  );

  // Publish the sticky toolbar's height so rows scroll to just below it, not under it.
  const hasFiles = category.files.length > 0;
  useEffect(() => {
    const root = rootRef.current;
    const bar = barRef.current;
    if (!root || !bar) return;
    const update = () => root.style.setProperty("--viewer-bar-h", `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [hasFiles]);

  const file: ChunkFile | undefined =
    load.state === "ready" ? (load.chunk.files.find((f) => f.path === activePath) ?? load.chunk.files[0]) : undefined;
  const meta = category.files.find((f) => f.path === (file?.path ?? activePath)) ?? category.files[0];

  const lines = useMemo(() => (file ? toDisplayLines(file.content) : []), [file]);
  const roles = useMemo(() => buildLineRoles(lines), [lines]);
  const query = useMemo(() => parseQuery(filter), [filter]);
  const filtered = useMemo(() => (file && query.searchable ? searchFile(file, query) : null), [file, query]);
  const entryLines = useMemo(() => lines.filter((l) => l.kind === "entry").map((l) => l.number), [lines]);
  const rovingLine = roving !== null && entryLines.includes(roving) ? roving : (entryLines[0] ?? null);
  const namedSections = (file?.sections ?? []).filter((s) => s.label && s.entries > 0);

  const copy = useCallback((key: string, text: string, message: string) => {
    void copyText(text).then((ok) => {
      setFeedback({ key, ok });
      setLive(ok ? message : "Copy failed. Select the text and copy it manually.");
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = window.setTimeout(() => setFeedback(null), 1800);
    });
  }, []);

  const selectFile = (path: string, name: string) => {
    setActivePath(path);
    setFilter("");
    setTargetLine(null);
    setRoving(null);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${encodeURIComponent(name)}`);
  };

  const gotoSection = (line: number) => {
    if (!file) return;
    setFilter("");
    // A section starts at its first comment line, which may be a hidden banner: use the heading itself.
    let target = line;
    while (roles.get(target)?.role === "rule") target += 1;
    window.setTimeout(() => focusRow(rowId(file.name, target), "start"), 0);
  };

  const copySection = (line: number, label: string) => {
    const payloads = roles.get(line)?.payloads ?? [];
    copy(`section-${line}`, payloads.join("\n"), `Copied ${payloads.length} payloads from ${label}`);
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const current = (event.target as HTMLElement).closest<HTMLElement>('[data-entry="true"]');
    if (!current || !file) return;
    const order = filtered ? filtered.matches.map((m) => m.line) : entryLines;
    const at = order.indexOf(Number(current.dataset.line));
    const move = (target: number | undefined) => {
      if (target === undefined) return;
      event.preventDefault();
      setRoving(target);
      focusRow(rowId(file.name, target), "nearest");
    };
    if (event.key === "ArrowDown") move(order[Math.min(at + 1, order.length - 1)]);
    else if (event.key === "ArrowUp") move(order[Math.max(at - 1, 0)]);
    else if (event.key === "PageDown") move(order[Math.min(at + 10, order.length - 1)]);
    else if (event.key === "PageUp") move(order[Math.max(at - 10, 0)]);
    else if (event.key === "Home") move(order[0]);
    else if (event.key === "End") move(order[order.length - 1]);
    else if ((event.key === "Enter" || event.key === "c") && event.target === current) {
      event.preventDefault();
      const row = lines.find((l) => l.number === Number(current.dataset.line));
      if (row) copy(`line-${row.number}`, row.text, "Copied payload");
    }
  };

  const copyFile = () => {
    if (file) copy("file", file.content, `Copied ${file.name}, ${n(file.entries)} payloads`);
  };
  const downloadFile = () => {
    if (!file) return;
    downloadBytes(file.name, fileBytes(file.content));
    setLive(`Downloaded ${file.name}`);
  };
  const downloadAll = () => {
    if (load.state !== "ready") return;
    const zip = buildZip(
      load.chunk.files.map((f) => ({ path: f.path, data: fileBytes(f.content) })),
      new Date(source.committedAt),
    );
    downloadBytes(`${category.slug}-payloads.zip`, zip, "application/zip");
    setLive(`Downloaded ${category.slug}-payloads.zip with ${load.chunk.files.length} files`);
  };
  const retry = () => {
    clearChunkCache();
    setLoad({ state: "loading" });
    setAttempt((a) => a + 1);
  };

  const repoUrl = `https://github.com/${source.repository}`;
  const fileState = feedback?.key === "file" ? (feedback.ok ? "done" : "error") : undefined;

  // Rows to show: the whole file, or only the entries that match the filter.
  const rows: { line: DisplayLine; section?: string }[] = filtered
    ? filtered.matches.map((m) => ({ line: { number: m.line, text: m.text, kind: "entry" as const }, section: m.section }))
    : lines.map((line) => ({ line }));

  return (
    <section ref={rootRef} className={styles.explorer} aria-labelledby="explorer-title">
      <div className={styles.explorerTop}>
        <h2 id="explorer-title" className={styles.explorerTitle}>
          Payload files
        </h2>
        <div className={styles.viewerActions}>
          <button type="button" className={styles.btn} onClick={downloadAll} disabled={load.state !== "ready"} title={load.state === "ready" ? undefined : "Available when the payloads have loaded"}>
            <Download size={14} aria-hidden />
            Download all (.zip)
          </button>
          <a className={styles.btn} href={`${repoUrl}/tree/${source.revision}/${category.dir}`} target="_blank" rel="noopener noreferrer">
            <GithubIcon size={14} aria-hidden />
            Folder on GitHub
            <ExternalLink size={12} aria-hidden />
          </a>
        </div>
      </div>

      <p id="row-help" className={styles.srOnly}>
        Use the arrow keys to move between payloads. Press Enter or C to copy the focused payload.
      </p>
      <div role="status" className={styles.srOnly}>
        {live}
      </div>

      {category.files.length === 0 ? (
        <div className={styles.state}>
          <p className={styles.stateTitle}>No payload files yet</p>
          <p className={styles.stateText}>
            This category has a README but no payload files on main. Add a <code>.txt</code> file to {category.dir}/ and it will appear here after the next sync.
          </p>
        </div>
      ) : (
        <div className={styles.explorerBody}>
          <nav className={styles.rail} aria-label="Files and sections">
            <div className={styles.railSticky}>
              <h3 className={styles.railTitle}>Files</h3>
              <ul className={styles.fileList}>
                {category.files.map((f) => (
                  <li key={f.path}>
                    <button type="button" className={styles.fileBtn} aria-current={f.path === (file?.path ?? activePath) ? "true" : undefined} onClick={() => selectFile(f.path, f.name)}>
                      <span className={styles.fileName}>{f.name}</span>
                      <span className={styles.fileCount}>
                        {n(f.entries)} payloads · {kb(f.bytes)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {namedSections.length > 0 ? (
                <details className={styles.sectionsDetails} open={desktop}>
                  <summary>Sections in this file ({namedSections.length})</summary>
                  <h3 className={`${styles.railTitle} ${styles.desktopOnly}`}>Sections</h3>
                  <ul className={styles.sections}>
                    {namedSections.map((s) => (
                      <li key={s.line}>
                        <button type="button" className={styles.sectionBtn} onClick={() => gotoSection(s.line)}>
                          <span>{s.label}</span>
                          <span>{n(s.entries)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </nav>

          <div className={styles.viewer}>
            <div ref={barRef} className={styles.viewerBar}>
              <div className={styles.viewerId}>
                <h3 className={styles.viewerName}>{meta?.name}</h3>
                <span className={styles.viewerMeta}>{meta ? `${n(meta.entries)} payloads · ${kb(meta.bytes)}` : ""}</span>
              </div>
              <div className={styles.filterRow}>
                <label className={styles.filterLabel} htmlFor="file-filter">
                  Filter<span className={styles.srOnly}> payloads in {meta?.name}</span>
                </label>
                <input
                  id="file-filter"
                  className={styles.filterInput}
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="e.g. onerror"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={!file}
                />
                {filtered ? (
                  <p className={styles.filterStatus}>
                    {n(filtered.total)} of {n(meta?.entries ?? 0)}
                  </p>
                ) : null}
              </div>
              <div className={styles.viewerActions}>
                <button type="button" className={styles.btn} data-state={fileState} onClick={copyFile} disabled={!file} aria-label="Copy file" title="Copy the whole file">
                  {fileState === "done" ? <Check size={14} aria-hidden /> : fileState === "error" ? <TriangleAlert size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                  <span className={styles.btnLabel}>{fileState === "done" ? "Copied" : fileState === "error" ? "Copy failed" : "Copy file"}</span>
                </button>
                <button type="button" className={styles.btn} onClick={downloadFile} disabled={!file} aria-label="Download" title="Download this file">
                  <Download size={14} aria-hidden />
                  <span className={styles.btnLabel}>Download</span>
                </button>
                {meta ? (
                  <a className={styles.btn} href={`${repoUrl}/blob/${source.revision}/${meta.path}`} target="_blank" rel="noopener noreferrer" aria-label="Source on GitHub" title="View this file on GitHub">
                    <GithubIcon size={14} aria-hidden />
                    <span className={styles.btnLabel}>Source</span>
                    <ExternalLink size={12} aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>

            {load.state === "loading" ? (
              <p className={styles.loadingText} role="status">
                Loading payloads for {category.name}…
              </p>
            ) : load.state === "error" ? (
              <div className={`${styles.state} ${styles.stateError}`} role="alert">
                <p className={styles.stateTitle}>The payloads could not be loaded</p>
                <p className={styles.stateText}>{load.message}</p>
                <button type="button" className={styles.btn} onClick={retry}>
                  Try again
                </button>
              </div>
            ) : filtered && filtered.matches.length === 0 ? (
              <div className={styles.state}>
                <p className={styles.stateTitle}>No payloads in this file match “{filter}”</p>
                <p className={styles.stateText}>All words must match. Remove one, or put an exact phrase in double quotes.</p>
                <button type="button" className={styles.btn} onClick={() => setFilter("")}>
                  <X size={14} aria-hidden />
                  Clear filter
                </button>
              </div>
            ) : file && rows.length === 0 ? (
              <div className={styles.state}>
                <p className={styles.stateTitle}>This file is empty</p>
                <p className={styles.stateText}>{meta?.name} exists on main but contains no lines.</p>
              </div>
            ) : file ? (
              <ol key={file.path} className={`${styles.lines} ${styles.linesFade}`} aria-label={`Contents of ${file.name}`} onKeyDown={onListKeyDown}>
                {rows.map(({ line, section }) => {
                  const info = filtered ? undefined : roles.get(line.number);
                  const role = filtered ? "entry" : (info?.role ?? "entry");
                  return (
                    <Row
                      key={line.number}
                      line={line}
                      id={rowId(file.name, line.number)}
                      role={role}
                      text={info?.text ?? ""}
                      payloadCount={info?.payloads?.length ?? 0}
                      terms={filtered ? query.terms : []}
                      section={section}
                      target={targetLine === line.number}
                      roving={line.number === (filtered ? (filtered.matches[0]?.line ?? null) : rovingLine)}
                      copied={feedback}
                      onCopy={copy}
                      onCopySection={copySection}
                    />
                  );
                })}
              </ol>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { Check, Copy, Search, TriangleAlert, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/navigation";
import { copyText } from "@/lib/copy-text";
import { loadChunk } from "@/lib/payload-client";
import { parseQuery, searchFile, sortHits } from "@/lib/payload-search";
import type { Hit } from "@/lib/payload-search";
import type { CategorySummary } from "@/lib/payload-types";
import { HighlightedText } from "./HighlightedText";
import styles from "./payloads.module.css";

export interface LibraryCategory extends CategorySummary {
  fileNames: string[];
}

interface Props {
  categories: LibraryCategory[];
  groups: string[];
}

type SearchState =
  | { status: "idle" }
  | { status: "searching" | "done"; checked: number; total: number; hits: Hit[]; count: number; failed: number };

const PER_FILE_CAP = 200;
const PAGE = 100;
const CONCURRENCY = 6;
const n = (value: number) => new Intl.NumberFormat("en-US").format(value);
const groupSlug = (group: string) => group.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function PayloadLibrary({ categories, groups }: Props) {
  const basePath = SITE_CONFIG.basePath;
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [shown, setShown] = useState(PAGE);
  const [feedback, setFeedback] = useState<{ key: string; ok: boolean } | null>(null);
  const [live, setLive] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLUListElement | null>(null);
  const token = useRef(0);
  const debounce = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  const order = useMemo(() => new Map(categories.map((c, i) => [c.slug, i])), [categories]);
  const parsed = useMemo(() => parseQuery(query), [query]);

  const runSearch = useCallback(
    async (text: string) => {
      const mine = ++token.current;
      const q = parseQuery(text);
      const url = new URL(window.location.href);
      if (text.trim()) url.searchParams.set("q", text.trim());
      else url.searchParams.delete("q");
      window.history.replaceState(null, "", url);

      if (!q.searchable) {
        setSearch({ status: "idle" });
        return;
      }
      setShown(PAGE);
      const hits: Hit[] = [];
      let count = 0;
      let checked = 0;
      let failed = 0;
      const total = categories.length;
      const publish = () => {
        if (token.current !== mine) return;
        setSearch({ status: checked === total ? "done" : "searching", checked, total, hits: [...hits], count, failed });
      };
      publish();
      const queue = [...categories];
      const worker = async () => {
        while (queue.length && token.current === mine) {
          const category = queue.shift() as LibraryCategory;
          try {
            const chunk = await loadChunk(basePath, category);
            if (token.current !== mine) return;
            for (const file of chunk.files) {
              const result = searchFile(file, q, PER_FILE_CAP);
              count += result.total;
              for (const match of result.matches) hits.push({ categorySlug: category.slug, filePath: file.path, fileName: file.name, match });
            }
          } catch {
            failed += 1;
          }
          checked += 1;
          publish();
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    },
    [basePath, categories],
  );

  const onChange = (value: string) => {
    setQuery(value);
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => void runSearch(value), 200);
  };

  const clear = () => {
    setQuery("");
    token.current += 1;
    void runSearch("");
    inputRef.current?.focus();
  };

  // Restore a shared search from ?q=, deferred so state is not set during the effect itself.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (!initial) return;
    const id = window.setTimeout(() => {
      setQuery(initial);
      void runSearch(initial);
    }, 0);
    return () => window.clearTimeout(id);
  }, [runSearch]);

  // "/" focuses this page's search box from anywhere that is not a text field. The
  // site header also binds "/" (it opens the site-wide search), so this listens in
  // the capture phase and stops the event: on this page the payload search comes first.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const el = event.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (document.querySelector("[role=dialog][aria-modal=true]")) return;
      event.preventDefault();
      event.stopPropagation();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  useEffect(
    () => () => {
      if (debounce.current) window.clearTimeout(debounce.current);
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
      token.current += 1;
    },
    [],
  );

  const copy = (key: string, text: string, message: string) => {
    void copyText(text).then((ok) => {
      setFeedback({ key, ok });
      setLive(ok ? message : "Copy failed. Select the text and copy it manually.");
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = window.setTimeout(() => setFeedback(null), 1800);
    });
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && query) {
      event.preventDefault();
      clear();
    } else if (event.key === "ArrowDown") {
      const first = resultsRef.current?.querySelector<HTMLElement>("[data-result-link]");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const onResultsKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-result-link]"));
    const at = links.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    event.preventDefault();
    if (event.key === "ArrowDown") links[Math.min(at + 1, links.length - 1)]?.focus();
    else if (at === 0) inputRef.current?.focus();
    else links[at - 1]?.focus();
  };

  const matchingCategories = useMemo(() => {
    if (!parsed.searchable) return [];
    return categories.filter((c) => {
      const hay = `${c.name} ${c.dir} ${c.description} ${c.fileNames.join(" ")}`.toLowerCase();
      return parsed.terms.every((t) => hay.includes(t));
    });
  }, [categories, parsed]);

  const hits = useMemo(() => (search.status === "idle" ? [] : sortHits(search.hits, order)), [search, order]);
  const categoryName = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);
  const active = search.status !== "idle" && parsed.searchable ? search : null;

  const filesWithHits = new Set(hits.map((h) => h.filePath)).size;
  const categoriesWithHits = new Set(hits.map((h) => h.categorySlug)).size;

  return (
    <>
      <div className={styles.searchWrap} role="search">
        <label className={styles.searchLabel} htmlFor="payload-search">
          Search all payloads
        </label>
        <div className={styles.searchField}>
          <Search size={18} className={styles.searchIcon} aria-hidden />
          <input
            ref={inputRef}
            id="payload-search"
            className={styles.searchInput}
            type="search"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="e.g. onerror, 169.254.169.254, jndi:ldap"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="payload-search-hint"
          />
          <div className={styles.searchEnd}>
            {query ? (
              <button type="button" className={styles.iconBtn} onClick={clear} aria-label="Clear search" title="Clear search">
                <X size={16} aria-hidden />
              </button>
            ) : (
              <kbd className={styles.kbd} aria-hidden>
                /
              </kbd>
            )}
          </div>
        </div>
        <p id="payload-search-hint" className={styles.searchHint}>
          All words must match. Use double quotes for an exact phrase.
          <span className={styles.kbdHint}>
            {" "}
            Press <span className={styles.kbd}>/</span> to jump here.
          </span>
        </p>
      </div>
      <div role="status" className={styles.srOnly}>
        {live}
      </div>

      {active ? (
        <section aria-labelledby="results-title">
          {matchingCategories.length > 0 ? (
            <>
              <div className={styles.resultsHead}>
                <h2 className={styles.resultsTitle}>Categories</h2>
                <p className={styles.resultsStatus}>{n(matchingCategories.length)} matching name, description or file</p>
              </div>
              <ul className={styles.catList}>
                {matchingCategories.slice(0, 8).map((c) => (
                  <li key={c.slug}>
                    <CategoryRow category={c} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <div className={styles.resultsHead}>
            <h2 id="results-title" className={styles.resultsTitle}>
              Payloads
            </h2>
            <p className={styles.resultsStatus} role="status">
              {active.status === "searching"
                ? `Searching… ${n(active.checked)} of ${n(active.total)} categories, ${n(active.count)} matches so far`
                : active.count === 0
                  ? "No matches"
                  : `${n(active.count)} matches in ${n(filesWithHits)} files across ${n(categoriesWithHits)} categories${active.count > Math.min(hits.length, shown) ? `, showing ${n(Math.min(hits.length, shown))}` : ""}`}
            </p>
          </div>

          {active.failed > 0 ? (
            <p className={styles.notice} role="alert">
              {active.failed === 1 ? "One category" : `${n(active.failed)} categories`} could not be loaded, so its payloads are missing from these results.{" "}
              <button type="button" className={styles.btn} onClick={() => void runSearch(query)}>
                Search again
              </button>
            </p>
          ) : null}

          {active.status === "done" && active.count === 0 ? (
            <div className={styles.state}>
              <p className={styles.stateTitle}>No payload matches “{query}”</p>
              <p className={styles.stateText}>All words have to match the same line, or its section heading. Try fewer words, or remove the quotes around a phrase.</p>
              <button type="button" className={styles.btn} onClick={clear}>
                <X size={14} aria-hidden />
                Clear search
              </button>
            </div>
          ) : (
            <ul ref={resultsRef} className={styles.resultList} onKeyDown={onResultsKeyDown} aria-label="Payload matches">
              {hits.slice(0, shown).map((hit) => {
                const key = `${hit.filePath}:${hit.match.line}`;
                const state = feedback && feedback.key === key ? (feedback.ok ? "done" : "error") : undefined;
                return (
                  <li key={key} className={styles.result}>
                    <div className={styles.resultWhere}>
                      <Link href={`/payloads/${hit.categorySlug}`}>{categoryName.get(hit.categorySlug)}</Link>
                      <Link
                        href={`/payloads/${hit.categorySlug}/#${encodeURIComponent(hit.fileName)}:${hit.match.line}`}
                        data-result-link
                        className={styles.mono}
                        aria-label={`Open ${hit.fileName} line ${hit.match.line} in ${categoryName.get(hit.categorySlug)}`}
                      >
                        {hit.fileName}:{hit.match.line}
                      </Link>
                    </div>
                    <p className={styles.resultText}>
                      <HighlightedText text={hit.match.text} terms={parsed.terms} />
                    </p>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      data-state={state}
                      aria-label={`Copy payload from ${hit.fileName} line ${hit.match.line}`}
                      title="Copy this payload"
                      onClick={() => copy(key, hit.match.text, `Copied line ${hit.match.line} of ${hit.fileName}`)}
                    >
                      {state === "done" ? <Check size={14} aria-hidden /> : state === "error" ? <TriangleAlert size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                    </button>
                    {hit.match.section ? <span className={styles.resultSection}>in {hit.match.section}</span> : null}
                  </li>
                );
              })}
            </ul>
          )}

          {hits.length > shown ? (
            <div className={styles.more}>
              <button type="button" className={styles.btn} onClick={() => setShown((s) => s + PAGE)}>
                Show {Math.min(PAGE, hits.length - shown)} more
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <div className={styles.library}>
          {query.trim() && !parsed.searchable ? <p className={styles.searchHint}>Type at least two characters to search the payloads.</p> : null}
          {groups.map((group) => {
            const inGroup = categories.filter((c) => c.group === group);
            const total = inGroup.reduce((sum, c) => sum + c.entries, 0);
            return (
              <section key={group} id={groupSlug(group)} className={styles.group} aria-labelledby={`${groupSlug(group)}-title`}>
                <div className={styles.groupHead}>
                  <h2 id={`${groupSlug(group)}-title`} className={styles.groupTitle}>
                    {group}
                  </h2>
                  <span className={styles.groupMeta}>
                    {n(inGroup.length)} categories · {n(total)} payloads
                  </span>
                </div>
                <div className={styles.colHead} aria-hidden>
                  <span>Category</span>
                  <span>Files</span>
                  <span>Payloads</span>
                </div>
                <ul className={styles.catList}>
                  {inGroup.map((c) => (
                    <li key={c.slug}>
                      <CategoryRow category={c} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function CategoryRow({ category }: { category: LibraryCategory }) {
  return (
    <Link href={`/payloads/${category.slug}`} className={styles.catRow}>
      <span>
        <span className={styles.catName}>{category.name}</span>
        <span className={styles.catDesc}>{category.description}</span>
        <span className={styles.catMeta}>
          {n(category.files)} {category.files === 1 ? "file" : "files"} · {n(category.entries)} payloads
        </span>
      </span>
      <span className={styles.num}>
        {n(category.files)}
        <span className={styles.srOnly}> files</span>
      </span>
      <span className={styles.num}>
        {n(category.entries)}
        <span className={styles.srOnly}> payloads</span>
      </span>
    </Link>
  );
}

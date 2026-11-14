"use client";


import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { X, Search as SearchIcon, FileText, Code, Users, ArrowRight } from "lucide-react";
import { SEARCH_INDEX, SearchItem } from "@/lib/search-data";
import { SITE_CONFIG } from "@/lib/navigation";
import type { CatalogIndex } from "@/lib/payload-types";

const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "tags", weight: 0.3 },
    { name: "excerpt", weight: 0.2 },
    { name: "category", weight: 0.1 },
  ],
  threshold: 0.35,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
};

/** Payload categories come from the generated catalog, so new ones appear without a code change. */
function catalogItems(index: CatalogIndex): SearchItem[] {
  return index.categories.map((c) => ({
    id: `payload-${c.slug}`,
    title: c.name,
    category: c.group,
    href: `/payloads/${c.slug}`,
    excerpt: c.description,
    tags: [c.dir, c.slug, ...c.files.map((f) => f.name)],
    type: "payload" as const,
  }));
}

const TYPE_ICONS: Record<SearchItem["type"], React.ReactNode> = {
  payload: <Code size={14} aria-hidden />,
  doc: <FileText size={14} aria-hidden />,
  page: <Users size={14} aria-hidden />,
};

const DEFAULT_ITEMS = ["/docs/getting-started", "/payloads", "/contributing"]
  .flatMap((href) => SEARCH_INDEX.filter((item) => item.href === href));

interface SearchProps {
  open: boolean;
  onClose: () => void;
}

export function Search({ open, onClose }: SearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const [payloadItems, setPayloadItems] = useState<SearchItem[]>([]);
  const fuse = useMemo(() => new Fuse<SearchItem>([...SEARCH_INDEX, ...payloadItems], FUSE_OPTIONS), [payloadItems]);
  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const found = fuse.search(q).slice(0, 12).map((r) => r.item);
    if (q.length < 2) return found;
    const textSearch: SearchItem = {
      id: "payload-text-search",
      title: `Search payload text for \u201c${q}\u201d`,
      category: "Payloads",
      href: `/payloads?q=${encodeURIComponent(q)}`,
      excerpt: "Full-text search across every payload line in the collection.",
      tags: [],
      type: "payload",
    };
    return [...found, textSearch];
  }, [query, fuse]);

  // Load the category list once, the first time the dialog opens.
  useEffect(() => {
    if (!open || payloadItems.length > 0) return;
    let cancelled = false;
    fetch(`${SITE_CONFIG.basePath}/payload-catalog/index.json`)
      .then((response) => (response.ok ? (response.json() as Promise<CatalogIndex>) : Promise.reject(new Error(String(response.status)))))
      .then((index) => {
        if (!cancelled) setPayloadItems(catalogItems(index));
      })
      .catch(() => {
        /* Docs and pages stay searchable; the payload library is one click away. */
      });
    return () => {
      cancelled = true;
    };
  }, [open, payloadItems.length]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([tabindex="-1"]), input, a[href]');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKey);
    return () => {
      document.removeEventListener("keydown", handleDialogKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, onClose]);

  const visibleItems = query.trim() ? results : DEFAULT_ITEMS;

  const navigate = useCallback(
    (item: SearchItem) => {
      router.push(item.href);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, Math.min(i + 1, visibleItems.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (visibleItems[activeIndex]) navigate(visibleItems[activeIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [visibleItems, activeIndex, navigate, onClose]
  );

  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector("[data-active='true']");
      active?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "8vh",
        padding: "8vh 1rem 1rem",
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="search-scrim"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--color-scrim)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div
        className="search-panel"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          backgroundColor: "var(--color-surface-raised)",
          border: "1px solid var(--color-line-strong)",
          borderRadius: "10px",
          boxShadow: "var(--shadow-overlay)",
          overflow: "hidden",
          zIndex: 101,
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.875rem 1rem",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <SearchIcon size={18} style={{ color: "var(--color-ink-muted)", flexShrink: 0 }} aria-hidden />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation, payloads, methodology…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search"
            role="combobox"
            aria-expanded={visibleItems.length > 0}
            aria-autocomplete="list"
            aria-controls={visibleItems.length ? "search-results" : undefined}
            aria-activedescendant={visibleItems[activeIndex] ? `result-${activeIndex}` : undefined}
            style={{
              flex: 1,
              minWidth: 0,
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--color-ink)",
              fontSize: "1rem",
              fontFamily: "var(--font-sans)",
            }}
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "5px",
              border: "1px solid var(--color-line)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-ink-muted)",
              cursor: "pointer",
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Results / default */}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {query.trim() === "" ? (
            <div>
              <p
                style={{
                  padding: "0.625rem 1rem 0.25rem",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--color-ink-muted)",
                  margin: 0,
                }}
              >
                Quick links
              </p>
              <ul
                style={{ listStyle: "none", margin: 0, padding: "0 0 0.5rem" }}
                role="listbox"
                aria-label="Quick links"
                id="search-results"
                ref={listRef}
              >
                {DEFAULT_ITEMS.map((item, i) => (
                  <ResultItem
                    key={item.id}
                    id={`result-${i}`}
                    item={item}
                    active={i === activeIndex}
                    onSelect={() => navigate(item)}
                  />
                ))}
              </ul>
            </div>
          ) : results.length === 0 ? (
            <p
              role="status"
              style={{
                padding: "2rem 1rem",
                textAlign: "center",
                fontSize: "0.875rem",
                color: "var(--color-ink-muted)",
              }}
            >
              No results for <strong style={{ color: "var(--color-ink-secondary)" }}>&ldquo;{query}&rdquo;</strong>
            </p>
          ) : (
            <ul
              style={{ listStyle: "none", margin: 0, padding: "0.375rem 0 0.5rem" }}
              id="search-results"
              role="listbox"
              aria-label="Search results"
              ref={listRef}
            >
              {results.map((item, i) => (
                <ResultItem
                  key={item.id}
                  id={`result-${i}`}
                  item={item}
                  active={i === activeIndex}
                  onSelect={() => navigate(item)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0.5rem 1rem",
            borderTop: "1px solid var(--color-line)",
            display: "flex",
            gap: "1.25rem",
            alignItems: "center",
          }}
        >
          {[
            ["↑↓", "navigate"],
            ["↵", "select"],
            ["esc", "close"],
          ].map(([key, label]) => (
            <span
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.6875rem",
                color: "var(--color-ink-muted)",
              }}
            >
              <kbd
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.35rem",
                  border: "1px solid var(--color-line)",
                  borderRadius: "3px",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-ink-secondary)",
                }}
              >
                {key}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultItem({
  id,
  item,
  active,
  onSelect,
}: {
  id: string;
  item: SearchItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li
      data-active={active}
      role="presentation"
    >
      <button
        id={id}
        role="option"
        aria-selected={active}
        tabIndex={-1}
        onClick={onSelect}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          width: "100%",
          padding: "0.625rem 1rem",
          backgroundColor: active ? "var(--color-accent-subtle)" : "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background-color 0.1s",
        }}
        onMouseEnter={(e) => {
          if (!active)
            (e.currentTarget).style.backgroundColor = "var(--color-surface-overlay)";
        }}
        onMouseLeave={(e) => {
          if (!active)
            (e.currentTarget).style.backgroundColor = "transparent";
        }}
      >
        <span
          style={{
            flexShrink: 0,
            color: active ? "var(--color-accent-hover)" : "var(--color-ink-muted)",
            display: "flex",
            alignItems: "center",
          }}
        >
          {TYPE_ICONS[item.type]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              color: active ? "var(--color-accent-hover)" : "var(--color-ink)",
              fontWeight: active ? 500 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.title}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--color-ink-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.category}
          </p>
        </div>
        {active && (
          <ArrowRight size={14} style={{ color: "var(--color-accent)", flexShrink: 0 }} aria-hidden />
        )}
      </button>
    </li>
  );
}

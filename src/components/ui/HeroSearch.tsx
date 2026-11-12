"use client";

import { Search as SearchIcon } from "lucide-react";

// The header owns the search dialog; this asks it to open.
export const OPEN_SEARCH_EVENT = "open-search";

export function HeroSearch() {
  return (
    <button
      type="button"
      className="hero-search"
      aria-haspopup="dialog"
      aria-label="Search payloads and documentation"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
    >
      <SearchIcon size={18} aria-hidden />
      <span className="hero-search-label">Search payloads and docs, e.g. XSS or SSRF</span>
      <kbd className="hero-search-key" aria-hidden>
        /
      </kbd>
    </button>
  );
}

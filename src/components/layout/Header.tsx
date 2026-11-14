"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search } from "@/components/ui/Search";
import { HEADER_NAV, SITE_CONFIG } from "@/lib/navigation";
import { Menu, X } from "lucide-react";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { OwaspIcon } from "@/components/ui/OwaspIcon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { OPEN_SEARCH_EVENT } from "@/components/ui/HeroSearch";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        document.querySelector<HTMLButtonElement>('button[aria-label="Close menu"]')?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handler);
    // Other components (the home hero search) ask for the dialog with this event.
    window.addEventListener(OPEN_SEARCH_EVENT, openSearch);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener(OPEN_SEARCH_EVENT, openSearch);
    };
  }, [openSearch]);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: scrolled
            ? "var(--color-header-glass)"
            : "var(--color-canvas)",
          borderBottom: "1px solid var(--color-line)",
          backdropFilter: scrolled ? "blur(8px)" : "none",
          transition: "background-color 0.2s, backdrop-filter 0.2s",
        }}
        role="banner"
      >
        <div
          style={{
            width: "var(--site-width)",
          maxWidth: "var(--site-max-width)",
            margin: "0 auto",
            padding: "0",
            height: "52px",
            display: "flex",
            alignItems: "center",
            gap: "0",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="site-brand"
            aria-label="OWASP Hunting home"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              marginRight: "2rem",
              flexShrink: 0,
            }}
          >
            <OwaspIcon
              size={28}
              aria-hidden
              style={{ color: "var(--color-ink)", flexShrink: 0 }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "var(--color-ink)",
                letterSpacing: "-0.01em",
              }}
            >
             OWASP Hunting
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            style={{ display: "flex", alignItems: "center", gap: "0.125rem", flex: 1 }}
            className="hidden-mobile"
          >
            {HEADER_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "5px",
                    fontSize: "0.875rem",
                    fontWeight: active ? 500 : 400,
                    color: active ? "var(--color-accent-hover)" : "var(--color-ink-secondary)",
                    textDecoration: "none",
                    transition: "color 0.15s, background-color 0.15s",
                    backgroundColor: active ? "var(--color-accent-subtle)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.target as HTMLElement).style.color = "var(--color-ink)";
                      (e.target as HTMLElement).style.backgroundColor = "var(--color-surface-raised)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.target as HTMLElement).style.color = "var(--color-ink-secondary)";
                      (e.target as HTMLElement).style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}
          >
            {/* Search trigger */}
            <button
              onClick={openSearch}
              aria-label="Search (/ or Ctrl+K)"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.3125rem 0.75rem",
                borderRadius: "5px",
                border: "1px solid var(--color-line)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-ink-muted)",
                fontSize: "0.8125rem",
                cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--color-line-strong)";
                el.style.color = "var(--color-ink-secondary)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--color-line)";
                el.style.color = "var(--color-ink-muted)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <span className="hidden-mobile">Search</span>
              <kbd
                className="hidden-mobile"
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.0625rem 0.375rem",
                  border: "1px solid var(--color-line)",
                  borderRadius: "3px",
                  backgroundColor: "var(--color-surface-raised)",
                  color: "var(--color-ink-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />

            {/* GitHub */}
            <a
              href={SITE_CONFIG.upstreamRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden-mobile"
              aria-label="View OWASP Hunting on GitHub"
              title="Upstream OWASP Repository"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "5px",
                color: "var(--color-ink-secondary)",
                textDecoration: "none",
                transition: "color 0.15s, background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.color = "var(--color-ink)";
                el.style.backgroundColor = "var(--color-surface-raised)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.color = "var(--color-ink-secondary)";
                el.style.backgroundColor = "transparent";
              }}
            >
              <GithubIcon size={18} aria-hidden />
            </a>

            {/* Mobile menu toggle */}
            <button
              className="mobile-only"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--color-ink-secondary)",
                cursor: "pointer",
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div
            className="mobile-only mobile-menu"
            style={{
              borderTop: "1px solid var(--color-line)",
              backgroundColor: "var(--color-surface)",
              padding: "0.75rem 1.5rem 1rem",
              maxHeight: "calc(100dvh - 4rem)",
              overflowY: "auto",
            }}
          >
            <nav aria-label="Mobile navigation">
              {HEADER_NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "block",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "5px",
                      fontSize: "0.9375rem",
                      fontWeight: active ? 500 : 400,
                      color: active ? "var(--color-accent-hover)" : "var(--color-ink-secondary)",
                      textDecoration: "none",
                      backgroundColor: active ? "var(--color-accent-subtle)" : "transparent",
                      marginBottom: "0.125rem",
                    }}
                  >
                    {item.title}
                  </Link>
                );
              })}
              <div
                style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid var(--color-line)",
                  display: "flex",
                  gap: "0.75rem",
                  flexDirection: "column",
                }}
              >
                <a
                  href={SITE_CONFIG.upstreamRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-ink-secondary)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <GithubIcon size={15} /> Upstream Repository
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {searchOpen && <Search open onClose={() => setSearchOpen(false)} />}
    </>
  );
}

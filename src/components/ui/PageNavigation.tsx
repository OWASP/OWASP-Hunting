import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavEntry {
  title: string;
  href: string;
}

interface PageNavigationProps {
  prev?: NavEntry;
  next?: NavEntry;
}

export function PageNavigation({ prev, next }: PageNavigationProps) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Page navigation"
      style={{
        display: "flex",
        gap: "1rem",
        marginTop: "3rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid var(--color-line)",
      }}
    >
      {prev ? (
        <Link
          href={prev.href}
          rel="prev"
          className="hvr-border"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "0.875rem 1rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            borderRadius: "6px",
            textDecoration: "none",
            transition: "border-color 0.15s",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.75rem",
              color: "var(--color-ink-muted)",
              fontWeight: 500,
            }}
          >
            <ChevronLeft size={12} aria-hidden /> Previous
          </span>
          <span style={{ fontSize: "0.875rem", color: "var(--color-ink-secondary)", fontWeight: 500 }}>
            {prev.title}
          </span>
        </Link>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {next ? (
        <Link
          href={next.href}
          rel="next"
          className="hvr-border"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.25rem",
            padding: "0.875rem 1rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            borderRadius: "6px",
            textDecoration: "none",
            transition: "border-color 0.15s",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.75rem",
              color: "var(--color-ink-muted)",
              fontWeight: 500,
            }}
          >
            Next <ChevronRight size={12} aria-hidden />
          </span>
          <span style={{ fontSize: "0.875rem", color: "var(--color-ink-secondary)", fontWeight: 500 }}>
            {next.title}
          </span>
        </Link>
      ) : (
        <div style={{ flex: 1 }} />
      )}
    </nav>
  );
}

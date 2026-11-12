"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-60px 0% -70% 0%" }
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      style={{
        position: "sticky",
        top: "52px",
        height: "calc(100vh - 52px)",
        overflowY: "auto",
        padding: "1.5rem 0 2rem 1.25rem",
        width: "220px",
        flexShrink: 0,
      }}
    >
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-ink-muted)",
          margin: "0 0 0.75rem",
        }}
      >
        On this page
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                style={{
                  display: "block",
                  paddingLeft: item.level === 3 ? "1rem" : "0.5rem",
                  paddingTop: "0.25rem",
                  paddingBottom: "0.25rem",
                  fontSize: item.level === 3 ? "0.75rem" : "0.8125rem",
                  color: active ? "var(--color-accent-hover)" : "var(--color-ink-muted)",
                  textDecoration: "none",
                  fontWeight: active ? 500 : 400,
                  borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                  marginLeft: "-2px",
                  transition: "color 0.15s",
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget).style.color = "var(--color-ink-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget).style.color = "var(--color-ink-muted)";
                }}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function buildTocFromHeadings(content: string): TocItem[] {
  const headings: TocItem[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");
    headings.push({ id, text, level });
  }
  return headings;
}

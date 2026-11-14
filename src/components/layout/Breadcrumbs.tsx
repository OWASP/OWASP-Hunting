import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: "1.5rem" }}>
      <ol
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.25rem",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((item, i) => (
          <li
            key={i}
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            {i > 0 && (
              <ChevronRight
                size={13}
                style={{ color: "var(--color-ink-muted)", flexShrink: 0 }}
                aria-hidden
              />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hvr-text-ink"
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-secondary)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                style={{ fontSize: "0.8125rem", color: "var(--color-ink-muted)" }}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

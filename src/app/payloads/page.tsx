import Link from "next/link";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { PAYLOAD_NAV, SITE_CONFIG } from "@/lib/navigation";
import { PAYLOAD_CATEGORIES } from "@/lib/payload-data";
import { ArrowRight, Shield } from "lucide-react";

export const metadata = {
  title: "Payload Reference",
  description: "Security testing payload reference for 30+ vulnerability classes. Organized by attack category with methodology and mitigation guidance.",
};

export default function PayloadsIndexPage() {
  return (
    <DocsLayout navSections={PAYLOAD_NAV} wide>
      <div style={{ maxWidth: "900px" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
            <Shield size={16} style={{ color: "var(--color-accent)" }} aria-hidden />
            <span style={{ fontSize: "0.75rem", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Payload Reference
            </span>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--color-ink)",
              margin: "0 0 0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            Security Testing Payloads
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--color-ink-secondary)", margin: 0, lineHeight: 1.6 }}>
            Payload reference for authorized security testing, organized by vulnerability class.
            Each page includes attack vectors, testing methodology, example payloads, and mitigation guidance.
          </p>
        </div>

        {/* Responsible use note */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "var(--color-surface-raised)",
            border: "1px solid var(--color-line)",
            borderLeft: "3px solid var(--color-accent-dim)",
            borderRadius: "0 5px 5px 0",
            marginBottom: "2rem",
          }}
        >
          <Shield size={14} style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: "2px" }} aria-hidden />
          <p style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", margin: 0, lineHeight: 1.5 }}>
            For{" "}
            <strong style={{ color: "var(--color-ink-secondary)" }}>authorized testing only</strong>
            {" — "}systems you own, authorized bug bounty programs, or controlled lab environments.
            Content originates from the{" "}
            <a href={SITE_CONFIG.upstreamRepo} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-ink-secondary)" }}>
              OWASP Hunting repository
            </a>
            .
          </p>
        </div>

        {/* Category grid */}
        {PAYLOAD_CATEGORIES.map((cat) => (
          <section key={cat.slug} id={cat.slug} style={{ marginBottom: "2.5rem" }}>
            <h2
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-ink-muted)",
                margin: "0 0 0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--color-line)",
              }}
            >
              {cat.name}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "0.625rem",
              }}
            >
              {cat.items.map((item) => (
                <Link
                  key={item.slug}
                  href={`/payloads/${item.slug}`}
                  className="card-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-line)",
                    borderRadius: "6px",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: "0.75rem" }}>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "var(--color-ink)",
                        margin: "0 0 0.125rem",
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-ink-muted)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.shortDescription}
                    >
                      {item.shortDescription}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    style={{ color: "var(--color-ink-muted)", flexShrink: 0 }}
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DocsLayout>
  );
}

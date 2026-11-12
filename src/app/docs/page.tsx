import { GithubIcon } from "@/components/ui/GithubIcon";
import Link from "next/link";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { DOCS_NAV, SITE_CONFIG } from "@/lib/navigation";
import { DOC_PAGES } from "@/lib/docs-data";
import { Callout } from "@/components/ui/Callout";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Documentation",
  description: "OWASP Hunting documentation: getting started, installation, usage, and methodology.",
};

export default function DocsIndexPage() {
  return (
    <DocsLayout navSections={DOCS_NAV}>
      <div className="prose">
        {/* Project identity */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div>
            <h1 style={{ margin: 0, marginBottom: "0.375rem" }}>OWASP Hunting</h1>
            <p style={{ margin: 0, color: "var(--color-ink-secondary)", fontSize: "1rem" }}>
              Security Testing Resources &amp; Payload Reference
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <a
              href={SITE_CONFIG.upstreamRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.3125rem 0.75rem",
                fontSize: "0.8125rem",
                color: "var(--color-ink-secondary)",
                backgroundColor: "var(--color-surface-raised)",
                border: "1px solid var(--color-line)",
                borderRadius: "5px",
                textDecoration: "none",
              }}
            >
              <GithubIcon size={13} aria-hidden /> Upstream Repository
            </a>
            <Link
              href="/contributing"
              className="btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.3125rem 0.75rem",
                fontSize: "0.8125rem",
                color: "var(--color-ink-secondary)",
                backgroundColor: "var(--color-surface-raised)",
                border: "1px solid var(--color-line)",
                borderRadius: "5px",
                textDecoration: "none",
              }}
            >
              Contributing
            </Link>
          </div>
        </div>

        <Callout type="info">
          This documentation covers the{" "}
          <a href={SITE_CONFIG.upstreamRepo} target="_blank" rel="noopener noreferrer">
            OWASP Hunting project
          </a>
          . Content is for authorized security testing only. Always obtain proper permission before testing.
        </Callout>

        <h2 id="overview">Overview</h2>
        <p>
          OWASP Hunting is a curated collection of security testing resources and payloads covering
          over 30 vulnerability classes. It&rsquo;s designed to serve as a technical reference for
          security professionals conducting authorized assessments, bug bounty research, and security
          education.
        </p>

        <h2 id="get-started">Get Started</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
            margin: "1.25rem 0",
          }}
        >
          {DOC_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/docs/${page.slug}`}
              className="card-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.125rem",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-line)",
                borderRadius: "7px",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BookOpen size={15} style={{ color: "var(--color-accent)" }} aria-hidden />
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)" }}>
                  {page.title}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <h2 id="payload-categories">Payload Categories</h2>
        <p>
          The payload reference covers{" "}
          <Link href="/payloads">30+ vulnerability classes</Link> organized by attack category.
          Each page includes attack vectors, testing methodology, example payloads, detection
          guidance, and mitigation recommendations.
        </p>

        <Link
          href="/payloads"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-canvas)",
            borderRadius: "5px",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Browse All Payloads
        </Link>
      </div>
    </DocsLayout>
  );
}

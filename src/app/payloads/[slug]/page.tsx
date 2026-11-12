import { GithubIcon } from "@/components/ui/GithubIcon";
import { notFound } from "next/navigation";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TableOfContents } from "@/components/layout/TableOfContents";
import { PayloadBlock } from "@/components/ui/PayloadBlock";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { PageNavigation } from "@/components/ui/PageNavigation";
import { PAYLOAD_NAV, SITE_CONFIG } from "@/lib/navigation";
import { getPayloadPage, getAllPayloadSlugs, PAYLOAD_PAGES } from "@/lib/payload-data";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPayloadSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPayloadPage(slug);
  if (!page) return {};
  return {
    title: `${page.title}: Payload Reference`,
    description: page.description,
  };
}

const TOC_ITEMS = [
  { id: "what-it-is", text: "What it is", level: 2 },
  { id: "attack-vectors", text: "Attack Vectors", level: 2 },
  { id: "testing-methodology", text: "Testing Methodology", level: 2 },
  { id: "payloads", text: "Payloads", level: 2 },
  { id: "indicators", text: "Indicators", level: 2 },
  { id: "detection", text: "Detection", level: 2 },
  { id: "mitigation", text: "Mitigation", level: 2 },
  { id: "references", text: "References", level: 2 },
];

export default async function PayloadPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPayloadPage(slug);
  if (!page) notFound();

  const allPages = PAYLOAD_PAGES;
  const currentIndex = allPages.findIndex((p) => p.slug === slug);
  const prev = currentIndex > 0 ? allPages[currentIndex - 1] : undefined;
  const next = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : undefined;

  return (
    <DocsLayout
      navSections={PAYLOAD_NAV}
      toc={<TableOfContents items={TOC_ITEMS} />}
    >
      <article>
        <Breadcrumbs
          items={[
            { label: "Payloads", href: "/payloads" },
            { label: page.category, href: `/payloads#${page.categorySlug}` },
            { label: page.shortTitle },
          ]}
        />

        {/* Title block */}
        <div
          style={{
            marginBottom: "2rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--color-accent)",
              backgroundColor: "var(--color-accent-subtle)",
              padding: "0.2rem 0.6rem",
              borderRadius: "3px",
              marginBottom: "0.75rem",
            }}
          >
            {page.category}
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
            {page.title}
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--color-ink-secondary)",
              margin: "0 0 1rem",
              lineHeight: 1.6,
            }}
          >
            {page.description}
          </p>

          {/* GitHub source links */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <a
              href={`${SITE_CONFIG.upstreamRepo}/tree/main/${page.upstreamPath}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.75rem",
                color: "var(--color-ink-muted)",
                textDecoration: "none",
                padding: "0.2rem 0.6rem",
                border: "1px solid var(--color-line)",
                borderRadius: "4px",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <GithubIcon size={12} aria-hidden />
              View upstream source
              <ExternalLink size={10} aria-hidden />
            </a>
          </div>
        </div>

        <Disclaimer compact />

        <div className="prose" style={{ maxWidth: "none" }}>
          {/* What it is */}
          <h2 id="what-it-is">What it is</h2>
          <p>{page.whatItIs}</p>

          {/* Attack vectors */}
          <h2 id="attack-vectors">Attack Vectors</h2>
          <ul>
            {page.whereItAppears.map((vec, i) => (
              <li key={i}>{vec}</li>
            ))}
          </ul>

          {/* Testing methodology */}
          <h2 id="testing-methodology">Testing Methodology</h2>
          <ol>
            {page.testingMethodology.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Payloads */}
        <section>
          <h2
            id="payloads"
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-ink)",
              margin: "2rem 0 1rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--color-line)",
              letterSpacing: "-0.01em",
            }}
          >
            Payloads
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-ink-secondary)", marginBottom: "1rem" }}>
            Reference payloads for authorized testing. Always verify you have permission before use.
          </p>
          <PayloadBlock sections={page.payloadSections} collapsible={page.payloadSections.length > 3} />
        </section>

        <div className="prose" style={{ maxWidth: "none" }}>
          {/* Indicators */}
          <h2 id="indicators">Indicators of Vulnerability</h2>
          <ul>
            {page.indicators.map((ind, i) => (
              <li key={i}>{ind}</li>
            ))}
          </ul>

          {/* Detection */}
          <h2 id="detection">Detection Guidance</h2>
          <p>{page.detectionGuidance}</p>

          {/* Mitigation */}
          <h2 id="mitigation">Mitigation &amp; Remediation</h2>
          <ul>
            {page.mitigations.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>

          {/* References */}
          <h2 id="references">References</h2>
          <ul>
            {page.references.map((ref, i) => (
              <li key={i}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-external"
                >
                  {ref.title}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`${SITE_CONFIG.upstreamRepo}/tree/main/${page.upstreamPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-external"
              >
                OWASP Hunting: {page.title} (upstream)
              </a>
            </li>
          </ul>
        </div>

        <Disclaimer />

        <PageNavigation
          prev={prev ? { title: prev.title, href: `/payloads/${prev.slug}` } : undefined}
          next={next ? { title: next.title, href: `/payloads/${next.slug}` } : undefined}
        />
      </article>
    </DocsLayout>
  );
}

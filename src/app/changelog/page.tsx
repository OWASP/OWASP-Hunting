import { GithubIcon } from "@/components/ui/GithubIcon";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE_CONFIG } from "@/lib/navigation";
import { ExternalLink } from "lucide-react";

export const metadata = {
  title: "Changelog",
  description: "OWASP Hunting project changelog: updates, new vulnerability categories, and improvements.",
};

interface Release {
  version: string;
  date: string;
  summary: string;
  notes?: string;
  groups: { title: string; items: string[] }[];
}

// Kept in step with CHANGELOG.md on main. Dates are release dates.
const RELEASES: Release[] = [
  {
    version: "1.0.2",
    date: "14 November 2026",
    summary: "65 categories, 85 payload and reference files and 10,802 payload entries, plus the searchable Payload Explorer on this site.",
    notes: "RELEASE_NOTES_v1.0.2.md",
    groups: [
      {
        title: "Added",
        items: [
          "Twenty-four categories: XXE, CRLF Injection, XPath and XSLT Injection, SSI and ESI Injection, Expression Language Injection, Email Injection, DOM-Based Attacks, Clickjacking, HTTP Parameter Pollution, Host Header Attacks, Subdomain Takeover, Information Disclosure, Type Juggling, ReDoS, Supply Chain and CI/CD, Cloud and Container Security, SOAP and gRPC Security, Mobile Deep Links, MFA Bypass, Rate-Limit and CAPTCHA Bypass, Race Conditions, WAF Bypass, Secrets Exposure and Discovery Wordlists.",
          "New reference files in Command-Injection, XSS, SQL-Injection, Deserialization, Path-Traversal, SSRF, Cache-Poisoning, Prompt-Injection, Weak-Passwords and Vulnerable-Components.",
          "Payload Explorer: search every payload, filter categories, browse files and sections, copy a line, section or file, and download a file or a category ZIP, with deep links and source links pinned to the synced main commit.",
          "A payload catalog generated from main, with SHA-256 integrity checks, and a sync workflow that a maintainer starts on demand.",
          "Pull request template gate, /take-pr and /remove-pr issue commands, and automatic Website labels for contributors.",
        ],
      },
      {
        title: "Changed",
        items: [
          "Homepage redesigned with an attack-surface topology view; About, Contributing, Docs, Community, header and footer restyled.",
          "Payload pages, home counts, sidebar and search are built from the catalog instead of hand-copied lists.",
          "This changelog now shows the real release history.",
        ],
      },
      {
        title: "Fixed",
        items: [
          "Duplicate checker now indexes payloads that start with # (for example #{7*7}).",
          "Mobile and desktop navigation no longer show together after a resize; section anchors clear the sticky header.",
          "Ordered lists, blockquotes and table-of-contents spacing in the documentation.",
          "Dead reference links on the XML Injection, IDOR and JWT pages; README links containing parentheses; About page group links.",
        ],
      },
    ],
  },
  {
    version: "1.0.1",
    date: "23 October 2026",
    summary: "Ten new categories (41 in total) and a hardened duplicate checker.",
    groups: [
      {
        title: "Added",
        items: [
          "API Authorization, Cache Poisoning, CSRF, CSS Injection, GraphQL Security, OAuth and OIDC, SAML Vulnerabilities, Session Management, WebSocket Security and XS-Leaks.",
          "A root VERSION file, a changelog and offline regression tests for the duplicate checker.",
        ],
      },
      {
        title: "Fixed",
        items: [
          "Duplicate checker accuracy: line numbers, truncated patches, renames, whitespace handling and explicit failures instead of partial results.",
          "Unavailable reference URLs replaced with current official resources.",
        ],
      },
    ],
  },
  {
    version: "1.0.0",
    date: "14 October 2026",
    summary: "Initial tagged release of the security-testing reference collection.",
    groups: [
      {
        title: "Added",
        items: [
          "Project documentation, contribution and AI-disclosure policies, security reporting guidance, and pull request labeling and duplicate-check automation.",
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <main id="main-content" className="site-page">
        <div className="prose">
          <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-line)" }}>
            <h1>Changelog</h1>
            <p style={{ fontSize: "1rem", color: "var(--color-ink-secondary)", margin: 0 }}>
              Notable additions and updates to the OWASP Hunting project.
            </p>
          </div>

          <div
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}
          >
            <a
              href={`${SITE_CONFIG.upstreamRepo}/commits`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                fontSize: "0.8125rem", color: "var(--color-ink-secondary)",
                backgroundColor: "var(--color-surface)", border: "1px solid var(--color-line)",
                borderRadius: "5px", padding: "0.375rem 0.75rem", textDecoration: "none",
              }}
            >
              <GithubIcon size={13} /> Full commit history <ExternalLink size={11} style={{ opacity: 0.5 }} />
            </a>
          </div>

          {RELEASES.map((release) => (
            <section key={release.version} id={`v${release.version}`} style={{ marginBottom: "2.5rem" }}>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--color-ink)",
                  margin: "0 0 0.5rem",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.1875rem 0.625rem",
                    backgroundColor: "var(--color-accent-subtle)",
                    border: "1px solid var(--color-accent-dim)",
                    borderRadius: "4px",
                    fontSize: "0.8125rem",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                  }}
                >
                  v{release.version}
                </span>
                <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-ink-secondary)" }}>{release.date}</span>
              </h2>
              <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "var(--color-ink-secondary)", lineHeight: 1.6 }}>
                {release.summary}
                {release.notes ? (
                  <>
                    {" "}
                    <a href={`${SITE_CONFIG.upstreamRepo}/blob/main/${release.notes}`} target="_blank" rel="noopener noreferrer">
                      Read the full release notes
                    </a>
                    .
                  </>
                ) : null}
              </p>
              {release.groups.map((group) => (
                <div key={group.title}>
                  <h3 style={{ fontSize: "0.9375rem", margin: "1rem 0 0.5rem" }}>{group.title}</h3>
                  <ul style={{ margin: 0, padding: "0 0 0 1.25rem", listStyleType: "disc" }}>
                    {group.items.map((item) => (
                      <li key={item} style={{ marginBottom: "0.4rem", fontSize: "0.875rem", color: "var(--color-ink-secondary)", lineHeight: 1.6 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}

          <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-muted)", marginTop: "1rem" }}>
            For the complete history, see the{" "}
            <a href={`${SITE_CONFIG.upstreamRepo}/commits`} target="_blank" rel="noopener noreferrer">
              upstream repository commit log
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

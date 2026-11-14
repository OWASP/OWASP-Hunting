import { GithubIcon } from "@/components/ui/GithubIcon";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE_CONFIG } from "@/lib/navigation";
import { ExternalLink } from "lucide-react";

export const metadata = {
  title: "Changelog",
  description: "OWASP Hunting project changelog: updates, new vulnerability categories, and improvements.",
};

const CHANGES = [
  {
    date: "2025",
    items: [
      "Added Prompt Injection category covering AI/LLM attack vectors",
      "Added Prototype Pollution with impact chain documentation",
      "Expanded SSRF payloads with cloud metadata endpoint coverage",
      "Added Symbolic Link Attacks category",
      "Added Timing Attacks category with side-channel testing methodology",
      "Expanded JWT Vulnerabilities with algorithm confusion payloads",
      "Added automated duplicate detection via GitHub Actions workflow",
      "Added Discord advisory notifications workflow",
      "Expanded contributors recognition system",
    ],
  },
  {
    date: "2024",
    items: [
      "Initial repository structure established",
      "Core injection payload categories: SQL, NoSQL, XSS, Command, SSTI, SSJI",
      "Access control categories: Path Traversal, IDOR, Open Redirect",
      "Authentication categories: Auth Bypass, Password Reset, Weak Passwords",
      "Server-side categories: SSRF, Deserialization, File Upload",
      "Configuration categories: CORS, HTTP Smuggling, JWT, Business Logic",
      "Added LDAP, Log, XML, CSV injection categories",
      "Added Tor-Based Attacks category",
      "MIT License and DISCLAIMER.md",
      "CONTRIBUTING.md with submission guidelines",
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

          {CHANGES.map((period) => (
            <section key={period.date} style={{ marginBottom: "2.5rem" }}>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--color-ink)",
                  margin: "0 0 1rem",
                  display: "flex",
                  alignItems: "center",
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
                  {period.date}
                </span>
              </h2>
              <ul style={{ margin: 0, padding: "0 0 0 1.25rem", listStyleType: "disc" }}>
                {period.items.map((item, i) => (
                  <li key={i} style={{ marginBottom: "0.4rem", fontSize: "0.875rem", color: "var(--color-ink-secondary)", lineHeight: 1.6 }}>
                    {item}
                  </li>
                ))}
              </ul>
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

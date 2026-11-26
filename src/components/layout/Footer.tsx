import { GithubIcon } from "@/components/ui/GithubIcon";
import Link from "next/link";
import { OwaspIcon } from "@/components/ui/OwaspIcon";
import { ExternalLink } from "lucide-react";
import { SITE_CONFIG } from "@/lib/navigation";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-line)",
        backgroundColor: "var(--color-surface)",
        marginTop: "auto",
      }}
      role="contentinfo"
    >
      <div
        style={{
          width: "var(--site-width)",
          maxWidth: "var(--site-max-width)",
          margin: "0 auto",
          padding: "3rem 0 2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2.5rem",
        }}
      >
        {/* Brand column */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "0.75rem",
            }}
          >
            <OwaspIcon
              size={24}
              aria-hidden
              style={{ color: "var(--color-ink-secondary)", flexShrink: 0 }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "var(--color-ink)",
              }}
            >
              OWASP Hunting
            </span>
          </div>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-ink-muted)",
              lineHeight: 1.6,
              marginBottom: "1rem",
              maxWidth: "240px",
            }}
          >
            Documentation for the OWASP Hunting project. Security testing resources for authorized use.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <a
              href={SITE_CONFIG.upstreamRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.8125rem",
                color: "var(--color-ink-muted)",
                textDecoration: "none",
              }}
            >
              <GithubIcon size={13} aria-hidden />
              Upstream Repository
              <ExternalLink size={11} style={{ opacity: 0.5 }} aria-hidden />
            </a>
          </div>
        </div>

        {/* Documentation */}
        <div>
          <h2
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--color-ink-muted)",
              marginBottom: "0.75rem",
            }}
          >
            Documentation
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {[
              { href: "/docs/getting-started", label: "Getting Started" },
              { href: "/docs/installation", label: "Installation" },
              { href: "/docs/usage", label: "Usage" },
              { href: "/docs/methodology", label: "Methodology" },
              { href: "/docs/repository-structure", label: "Repository Structure" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="footer-link"
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-ink-muted)",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Payloads */}
        <div>
          <h2
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--color-ink-muted)",
              marginBottom: "0.75rem",
            }}
          >
            Payloads
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {[
              { href: "/payloads/sql-injection", label: "SQL Injection" },
              { href: "/payloads/xss", label: "XSS" },
              { href: "/payloads/ssrf", label: "SSRF" },
              { href: "/payloads/command-injection", label: "Command Injection" },
              { href: "/payloads/ssti", label: "SSTI" },
              { href: "/payloads", label: "All Categories" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="footer-link"
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-ink-muted)",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Project */}
        <div>
          <h2
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--color-ink-muted)",
              marginBottom: "0.75rem",
            }}
          >
            Project
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {[
              { href: "/about", label: "About" },
              { href: "/contributing", label: "Contributing" },
              { href: "/changelog", label: "Changelog" },
              { href: "/community", label: "Community" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="footer-link"
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-ink-muted)",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="https://owasp.org"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-muted)",
                  textDecoration: "none",
                }}
              >
                OWASP
                <ExternalLink size={11} style={{ opacity: 0.5 }} aria-hidden />
              </a>
            </li>
            <li>
              <a
                href={`${SITE_CONFIG.upstreamRepo}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-muted)",
                  textDecoration: "none",
                }}
              >
                MIT License
                <ExternalLink size={11} style={{ opacity: 0.5 }} aria-hidden />
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid var(--color-line)",
          padding: "1rem 0",
          width: "var(--site-width)",
          maxWidth: "var(--site-max-width)",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-ink-muted)",
            margin: 0,
          }}
        >
          Documentation for the{" "}
          <a
            href={SITE_CONFIG.upstreamRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            style={{ color: "var(--color-ink-muted)", textDecoration: "none" }}
          >
            OWASP Hunting project
          </a>
          . For authorized security testing only.
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-ink-muted)",
            margin: 0,
          }}
        >
          Licensed under{" "}
          <a
            href={`${SITE_CONFIG.upstreamRepo}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            style={{ color: "var(--color-ink-muted)", textDecoration: "none" }}
          >
            MIT License
          </a>
        </p>
      </div>
    </footer>
  );
}

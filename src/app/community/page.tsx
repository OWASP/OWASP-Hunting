import { GithubIcon } from "@/components/ui/GithubIcon";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/navigation";
import { ExternalLink, BookOpen, Shield } from "lucide-react";

export const metadata = {
  title: "Community",
  description: "OWASP Hunting community links, resources, and how to get involved.",
};

const RESOURCES = [
  {
    title: "OWASP Foundation",
    desc: "The Open Worldwide Application Security Project",
    href: "https://owasp.org",
    icon: <Shield size={16} />,
  },
  {
    title: "OWASP Top 10",
    desc: "The top 10 most critical web application security risks",
    href: "https://owasp.org/www-project-top-ten/",
    icon: <BookOpen size={16} />,
  },
  {
    title: "OWASP Testing Guide",
    desc: "Comprehensive web application security testing framework",
    href: "https://owasp.org/www-project-web-security-testing-guide/",
    icon: <BookOpen size={16} />,
  },
  {
    title: "OWASP Cheat Sheet Series",
    desc: "Concise, high-value security guidance for developers",
    href: "https://cheatsheetseries.owasp.org/",
    icon: <BookOpen size={16} />,
  },
  {
    title: "PortSwigger Web Security Academy",
    desc: "Free, practical web security training",
    href: "https://portswigger.net/web-security",
    icon: <BookOpen size={16} />,
  },
  {
    title: "HackerOne",
    desc: "Bug bounty platform: find programs with defined scope",
    href: "https://www.hackerone.com",
    icon: <Shield size={16} />,
  },
  {
    title: "Bugcrowd",
    desc: "Crowdsourced security platform and bug bounty programs",
    href: "https://www.bugcrowd.com",
    icon: <Shield size={16} />,
  },
];

export default function CommunityPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <main id="main-content" className="site-page">
        <div className="prose">
          <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-line)" }}>
            <h1>Community</h1>
            <p style={{ fontSize: "1rem", color: "var(--color-ink-secondary)", margin: 0 }}>
              Project links, community resources, and security learning materials.
            </p>
          </div>

          <h2 id="project-links">Project Links</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "0.875rem",
              marginBottom: "2rem",
            }}
          >
            {[
              {
                title: "Upstream Repository",
                desc: "Canonical OWASP Hunting project",
                href: SITE_CONFIG.upstreamRepo,
                badge: "OWASP",
              },
              {
                title: "Issues & Discussions",
                desc: "Bug reports, feature requests, and discussion",
                href: `${SITE_CONFIG.upstreamRepo}/issues`,
                badge: "GitHub",
              },
              {
                title: "Pull Requests",
                desc: "Contribute payloads and documentation",
                href: `${SITE_CONFIG.upstreamRepo}/pulls`,
                badge: "GitHub",
              },
            ].map((r) => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-line)",
                  borderRadius: "7px",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
              >
                <GithubIcon size={18} style={{ color: "var(--color-ink-secondary)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 0.125rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)" }}>
                    {r.title}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>
                    {r.desc}
                  </p>
                </div>
                <ExternalLink size={12} style={{ color: "var(--color-ink-muted)", flexShrink: 0 }} />
              </a>
            ))}
          </div>

          <h2 id="contributing">Contributing</h2>
          <p>
            Contributions are welcome. Read the{" "}
            <Link href="/contributing">contribution guide</Link> for guidelines on adding payloads,
            creating new categories, and submitting pull requests.
          </p>
          <p>
            Contributors are listed on the{" "}
            <a href={`${SITE_CONFIG.upstreamRepo}/graphs/contributors`} target="_blank" rel="noopener noreferrer">
              repository contributors graph
            </a>
            .
          </p>

          <h2 id="security-resources">Security Resources</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {RESOURCES.map((r) => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  padding: "0.875rem 1rem",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-line)",
                  borderRadius: "7px",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
              >
                <span style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: "1px" }}>
                  {r.icon}
                </span>
                <div>
                  <p style={{ margin: "0 0 0.125rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)" }}>
                    {r.title} <ExternalLink size={10} style={{ opacity: 0.5 }} />
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-ink-muted)", lineHeight: 1.5 }}>
                    {r.desc}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

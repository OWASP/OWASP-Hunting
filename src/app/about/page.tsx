import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomeMotion } from "@/components/ui/HomeMotion";
import { SITE_CONFIG } from "@/lib/navigation";
import styles from "./about.module.css";

export const metadata = {
  title: "About",
  description: "About the OWASP Hunting project: a curated collection of security testing resources and payloads.",
};

const COVERAGE = [
  { name: "Injection", slug: "injection", text: "SQL, NoSQL, XSS, Command, SSTI, SSJI, CSV, LDAP, Log, XML, Prompt, Prototype Pollution" },
  { name: "Access Control", slug: "access-control", text: "Path Traversal, IDOR, Open Redirect" },
  { name: "Authentication & Authorization", slug: "authentication-authorization", text: "Auth Bypass, Password Reset, Weak Passwords" },
  { name: "Server-Side", slug: "server-side", text: "SSRF, Deserialization, File Upload, Symbolic Link, Timing Attacks" },
  { name: "Configuration & Design", slug: "configuration-design", text: "Misconfiguration, CORS, HTTP Smuggling, JWT, Business Logic, Crypto, Vulnerable Components" },
  { name: "Network & Anonymity", slug: "network-anonymity", text: "Tor-Based Attacks" },
];

export default function AboutPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main id="main-content" className={`site-page ${styles.page}`}>
        <HomeMotion duration={450} className={styles.heading}>
          <h1 data-enter="0">About OWASP Hunting</h1>
          <p data-enter="100">An open-source collection of security testing resources and payloads for authorized security testing.</p>
        </HomeMotion>

        <div className={styles.introduction}>
          <HomeMotion viewport duration={450} className={styles.overview}>
            <section aria-labelledby="project-overview">
              <h2 id="project-overview">Project overview</h2>
              <p>OWASP Hunting is an open-source security testing reference covering over 30 vulnerability classes. It provides curated payloads, testing methodology, and documentation for security professionals conducting authorized assessments.</p>
              <p>The project is organized by vulnerability type, with each category containing a README explaining the attack vector, testing approach, and a payload file for use in authorized testing environments.</p>
            </section>
            <section aria-labelledby="purpose" className={styles.purpose}>
              <h2 id="purpose">Purpose</h2>
              <p>OWASP Hunting serves as a reference for security professionals to:</p>
              <ul>
                <li>Test web applications for common vulnerability classes</li>
                <li>Learn about different attack vectors and techniques</li>
                <li>Prepare for authorized bug bounty hunting</li>
                <li>Conduct structured penetration testing</li>
                <li>Understand security risks and their mitigations</li>
              </ul>
            </section>
          </HomeMotion>
          <HomeMotion viewport duration={450} delay={100} className={styles.repositoryRail}>
            <aside aria-labelledby="repository">
              <h2 id="repository">Repository</h2>
              <a href={SITE_CONFIG.upstreamRepo} target="_blank" rel="noopener noreferrer" className={styles.repositoryLink}>
                <GithubIcon size={24} aria-hidden />
                <span><strong>OWASP / OWASP-Hunting</strong><span>Upstream repository</span></span>
                <ExternalLink size={15} aria-hidden />
              </a>
              <p>The canonical OWASP project repository is the authoritative source. This documentation site is derived from that repository and is not operated by OWASP directly.</p>
              <nav className={styles.railLinks} aria-label="Project quick links">
                <Link href="/docs/getting-started">Getting Started</Link>
                <Link href="/payloads">Payload Reference</Link>
                <Link href="/contributing">How to Contribute</Link>
                <Link href="/community">Community</Link>
              </nav>
            </aside>
          </HomeMotion>
        </div>

        <HomeMotion viewport duration={450}>
          <section className={styles.editorialSection} aria-labelledby="coverage">
            <div className={styles.sectionLabel}><h2 id="coverage">Coverage</h2><p>Vulnerability classes across six categories.</p></div>
            <dl className={styles.coverage}>
              {COVERAGE.map(category => (
                <div key={category.slug}>
                  <dt><Link href={`/payloads#${category.slug}`}>{category.name}</Link></dt>
                  <dd>{category.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        </HomeMotion>

        <HomeMotion viewport duration={450}>
          <section className={styles.editorialSection} aria-labelledby="responsible-use">
            <div className={styles.sectionLabel}><h2 id="responsible-use">Responsible use</h2><p className={styles.authorized}><Shield size={16} aria-hidden />For authorized testing only</p></div>
            <div className={styles.reading}>
              <p>All payloads and techniques are for use on systems you own, authorized penetration testing engagements, approved bug bounty programs, and controlled educational environments. Unauthorized access to computer systems is illegal. The project maintainers are not responsible for misuse.</p>
              <h3 id="license">License</h3>
              <p>OWASP Hunting is released under the <a href={`${SITE_CONFIG.upstreamRepo}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">MIT License</a>. While the repository is open source, all content is for educational and authorized testing purposes only. See the <a href={`${SITE_CONFIG.upstreamRepo}/blob/main/DISCLAIMER.md`} target="_blank" rel="noopener noreferrer">project disclaimer</a> before use.</p>
            </div>
          </section>
        </HomeMotion>

        <HomeMotion viewport duration={450}>
          <section className={styles.editorialSection} aria-labelledby="quick-links">
            <div className={styles.sectionLabel}><h2 id="quick-links">Quick links</h2></div>
            <div className={styles.resources}>
              <a href="https://owasp.org" target="_blank" rel="noopener noreferrer">OWASP Foundation<ExternalLink size={13} aria-hidden /></a>
              <a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noopener noreferrer">OWASP Top 10<ExternalLink size={13} aria-hidden /></a>
            </div>
          </section>
        </HomeMotion>
      </main>
      <Footer />
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, BookOpen, Code2, ExternalLink, Shield } from "lucide-react";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { Header } from "@/components/layout/Header";
import { HeroSearch } from "@/components/ui/HeroSearch";
import { CountUp } from "@/components/home/CountUp";
import { Explorer } from "@/components/home/Explorer";
import { HomeEffects } from "@/components/home/HomeEffects";
import { Reveal } from "@/components/home/Reveal";
import { Topology } from "@/components/home/Topology";
import { PAYLOAD_CATEGORIES, PAYLOAD_PAGES } from "@/lib/payload-data";
import { SITE_CONFIG } from "@/lib/navigation";
import styles from "./home.module.css";

export const metadata = {
  title: "OWASP Hunting: Security Testing Resources",
  description: `Payload references, methodology, and mitigation guidance across ${PAYLOAD_PAGES.length} vulnerability classes for authorized security assessments.`,
};

const SHORTCUTS = [{ title: "SQL Injection", slug: "sql-injection" }, { title: "XSS", slug: "xss" }, { title: "SSRF", slug: "ssrf" }, { title: "IDOR", slug: "idor" }];

const STEPS = [
  { title: "Define what to test", description: "Start from the assessment scope. The methodology helps you pick which behaviors and trust boundaries to examine first.", href: "/docs/methodology", action: "Read the methodology", tag: "Scope" },
  { title: "Find the right reference", description: "Choose a vulnerability class. Read its context, indicators, and examples before adapting a payload to your environment.", href: "/payloads", action: "Browse the references", tag: "Reference" },
  { title: "Validate and document", description: "Confirm the result, understand the impact, and record reproducible evidence next to the relevant mitigation guidance.", href: "/docs/getting-started", action: "Read the project guide", tag: "Evidence" },
];

const PAGE_PARTS = ["What the class is and where it appears", "Testing steps and payload examples", "Indicators, detection guidance, and mitigations"];

export default function HomePage() {
  const nodes = PAYLOAD_CATEGORIES.map(c => ({ slug: c.slug, name: c.name, count: c.items.length }));
  const categories = PAYLOAD_CATEGORIES.map(c => ({ slug: c.slug, name: c.name, count: c.items.length, description: c.description, items: c.items }));
  const payloadCount = PAYLOAD_PAGES.reduce((sum, page) => sum + page.payloadSections.reduce((n, s) => n + s.payloads.length, 0), 0);

  return (
    <div className={styles.page}>
      <HomeEffects heroId="home-hero" />
      <Header />
      <main id="main-content">
        <section id="home-hero" className={styles.hero} aria-labelledby="home-title">
          <div className={`${styles.inner} ${styles.heroGrid}`}>
            <div className={styles.heroText}>
              <p className={styles.kicker} style={{ "--d": "0ms" } as React.CSSProperties}>Open reference for authorized testing</p>
              <h1 id="home-title">
                <span className={styles.line}><span style={{ "--d": "80ms" } as React.CSSProperties}>A working reference</span></span>
                <span className={styles.line}><span className={styles.accent} style={{ "--d": "200ms" } as React.CSSProperties}>for security testing.</span></span>
              </h1>
              <p className={`${styles.intro} ${styles.rise}`} style={{ "--d": "380ms" } as React.CSSProperties}>Find the payload, understand the vulnerability, and know what to check next. Practical resources for penetration testers, bug bounty researchers, and security engineers.</p>
              <div className={`${styles.actions} ${styles.rise}`} style={{ "--d": "480ms" } as React.CSSProperties}>
                <Link href="/payloads" className={styles.primary}><Code2 size={17} aria-hidden />Browse payloads</Link>
                <Link href="/docs/getting-started" className={styles.secondary}><BookOpen size={17} aria-hidden />Read the docs</Link>
              </div>
              <div className={`${styles.search} ${styles.rise}`} style={{ "--d": "580ms" } as React.CSSProperties}><HeroSearch /></div>
              <nav className={`${styles.shortcuts} ${styles.rise}`} style={{ "--d": "680ms" } as React.CSSProperties} aria-label="Quick payload references"><span>Quick lookup</span>{SHORTCUTS.map(item => <Link key={item.slug} href={`/payloads/${item.slug}`}>{item.title}</Link>)}</nav>
            </div>
            <div className={styles.heroMap}><Topology nodes={nodes} /></div>
          </div>
        </section>

        <section className={styles.overview} aria-labelledby="overview-title">
          <div className={`${styles.inner} ${styles.overviewGrid}`}>
            <Reveal>
              <p className={styles.label}>The project</p>
              <h2 id="overview-title">Knowledge you can put to work.</h2>
              <p className={styles.lede}>A shared reference for understanding vulnerabilities, planning assessments, and finding the right payload for the task. Built for authorized testing and security education.</p>
              <Link href="/about" className={styles.textLink}>About OWASP Hunting <ArrowRight size={16} aria-hidden /></Link>
            </Reveal>
            <div>
              <dl className={styles.stats}>
                <Reveal index={0}><dt><CountUp value={PAYLOAD_PAGES.length} /></dt><dd>vulnerability classes</dd></Reveal>
                <Reveal index={1}><dt><CountUp value={PAYLOAD_CATEGORIES.length} /></dt><dd>attack categories</dd></Reveal>
                <Reveal index={2}><dt><CountUp value={payloadCount} /></dt><dd>payload examples</dd></Reveal>
                <Reveal index={3}><dt className={styles.statWord}>MIT</dt><dd>open source license</dd></Reveal>
              </dl>
              <Reveal index={2}>
                <p className={styles.anatomyTitle}>Every class page follows the same shape</p>
                <ol className={styles.anatomy}>{PAGE_PARTS.map(part => <li key={part}>{part}</li>)}</ol>
              </Reveal>
            </div>
          </div>
        </section>

        <section className={styles.surface} aria-labelledby="categories-title">
          <div className={styles.inner}>
            <Reveal className={styles.sectionHead}>
              <div><p className={styles.label}>Attack surface explorer</p><h2 id="categories-title">Start with the attack surface.</h2><p className={styles.lede}>Six categories, {PAYLOAD_PAGES.length} classes. Hover a category and its place on the map lights up.</p></div>
              <Link href="/payloads" className={styles.textLink}>View all {PAYLOAD_PAGES.length} classes<ArrowRight size={16} aria-hidden /></Link>
            </Reveal>
            <Explorer categories={categories} />
          </div>
        </section>

        <section className={styles.workflow} aria-labelledby="workflow-title">
          <div className={styles.inner}>
            <Reveal>
              <p className={styles.label}>How it works</p>
              <h2 id="workflow-title">From a question to a tested understanding.</h2>
              <p className={styles.lede}>Use the collection alongside a deliberate testing process.</p>
            </Reveal>
            <ol className={styles.steps}>
              {STEPS.map((step, index) => (
                <Reveal as="li" key={step.title} index={index} className={styles.step}>
                  <span className={styles.marker} aria-hidden="true"><i /></span>
                  <p className={styles.tag}><span>0{index + 1}</span>{step.tag}</p>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <Link href={step.href} className={styles.textLink}>{step.action}<ArrowRight size={16} aria-hidden /></Link>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.community} aria-labelledby="community-title">
          <div className={`${styles.inner} ${styles.communityGrid}`}>
            <Reveal>
              <p className={styles.label}>Open source &amp; community</p>
              <h2 id="community-title">A better reference starts with shared knowledge.</h2>
              <p className={styles.lede}>Improve an explanation, correct an example, or contribute a payload. Help make security knowledge easier to find and put into practice.</p>
              <a href={SITE_CONFIG.upstreamRepo} target="_blank" rel="noopener noreferrer" className={styles.primary}><GithubIcon size={19} aria-hidden />OWASP / OWASP-Hunting<ExternalLink size={14} aria-hidden /></a>
            </Reveal>
            <nav className={styles.links} aria-label="Participate in the project">
              {[
                { href: "/contributing", title: "Contribute to the project", text: "Read the guidelines and prepare your first contribution." },
                { href: "/community", title: "Meet the community", text: "Find project discussions and ways to get involved." },
                { href: "/changelog", title: "Follow project changes", text: "See what has changed in the reference." },
              ].map((link, index) => (
                <Reveal key={link.href} index={index}><Link href={link.href}><strong>{link.title}</strong><span>{link.text}</span><ArrowRight size={18} aria-hidden /></Link></Reveal>
              ))}
            </nav>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.inner} ${styles.footerGrid}`}>
          <div className={styles.footBrand}>
            <p className={styles.footName}>OWASP Hunting</p>
            <p><Shield size={14} aria-hidden />For authorized testing and security education.</p>
          </div>
          <nav aria-label="Reference"><h2>Reference</h2><Link href="/payloads">Payloads</Link><Link href="/docs">Documentation</Link><Link href="/docs/getting-started">Getting started</Link><Link href="/docs/methodology">Methodology</Link></nav>
          <nav aria-label="Project"><h2>Project</h2><Link href="/about">About</Link><Link href="/contributing">Contribute</Link><Link href="/community">Community</Link><Link href="/changelog">Changelog</Link></nav>
          <nav aria-label="Source"><h2>Source</h2><a href={SITE_CONFIG.upstreamRepo} target="_blank" rel="noopener noreferrer">GitHub</a><a href={`${SITE_CONFIG.upstreamRepo}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">MIT License</a></nav>
        </div>
      </footer>
    </div>
  );
}

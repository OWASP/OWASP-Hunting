import { GithubIcon } from "@/components/ui/GithubIcon";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { SITE_CONFIG } from "@/lib/navigation";
import { ArrowDown, GitBranch, GitCommitHorizontal, GitFork, GitPullRequest, ExternalLink, Plus } from "lucide-react";

import { HomeReveal } from "@/components/ui/HomeReveal";
import styles from "./contributing.module.css";

export const metadata = {
  title: "Contributing",
  description: "How to contribute to the OWASP Hunting website and payload collection, including the correct pull request branches.",
};

export default function ContributingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <main id="main-content" className={`site-page ${styles.page}`}>
        <div className={styles.guide}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>Community / Contribution guide</p>
            <h1>Contributing to OWASP Hunting</h1>
            <p style={{ fontSize: "1rem", color: "var(--color-ink-secondary)", margin: 0 }}>
              Contributions are welcome and encouraged. The project grows through community effort.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            <a
              href={SITE_CONFIG.upstreamRepo}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                padding: "0.375rem 0.75rem", fontSize: "0.875rem",
                color: "var(--color-ink-secondary)", backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-line)", borderRadius: "5px", textDecoration: "none",
              }}
            >
              <GithubIcon size={14} /> Upstream Repository <ExternalLink size={11} style={{ opacity: 0.5 }} />
            </a>
            <a
              href={`${SITE_CONFIG.upstreamRepo}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                padding: "0.375rem 0.75rem", fontSize: "0.875rem",
                color: "var(--color-ink-secondary)", backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-line)", borderRadius: "5px", textDecoration: "none",
              }}
            >
              <Plus size={14} /> Open an Issue <ExternalLink size={11} style={{ opacity: 0.5 }} />
            </a>
          </div>

          <div className={styles.branchNote}><GitBranch size={17} aria-hidden /><span>Payloads & documentation <strong>main</strong></span><span>Website changes <strong>website</strong></span></div>
          <div className={styles.body}>
          <aside className={styles.contents} aria-label="Guide contents">
            <p>In this guide</p>
            <a href="#submission-process">Submission workflow</a>
            <a href="#quality-standards">Quality checklist</a>
            <a href="#code-of-conduct">Code of conduct</a>
          </aside>
          <div className={`prose ${styles.content}`}>
<section className={styles.section}>          <h2 id="submission-process">Payload Submission Process</h2>
          <p>Follow these four steps to submit your payload contribution.</p>

<ol className={styles.flow}><li className={styles.flowItem}><span className={styles.stepBadge} aria-hidden>01</span><HomeReveal className={styles.stepCard}><div className={styles.stepIcon}><GitFork size={20} aria-hidden /></div>          <h3 id="fork-the-repo">Fork the upstream repository</h3>
          <CodeBlock
            code={`git clone https://github.com/owasp/owasp-hunting.git
cd owasp-hunting`}
            language="bash"
          />

          <p>First fork the upstream repository on GitHub. After cloning, point <code>origin</code> to your own fork before pushing. Replace <code>YOUR-USERNAME</code> with your GitHub username:</p>
          <CodeBlock code={`git remote set-url origin https://github.com/YOUR-USERNAME/owasp-hunting.git`} language="bash" />
</HomeReveal><ArrowDown className={styles.connectorArrow} size={16} aria-hidden /></li><li className={styles.flowItem}><span className={styles.stepBadge} aria-hidden>02</span><HomeReveal className={styles.stepCard}><div className={styles.stepIcon}><GitBranch size={20} aria-hidden /></div>          <h3 id="create-branch">Create a branch</h3>
          <CodeBlock
            code={`git checkout -b add-xss-payloads
# or
git checkout -b new-category-api-injection`}
            language="bash"
          />

</HomeReveal><ArrowDown className={styles.connectorArrow} size={16} aria-hidden /></li><li className={styles.flowItem}><span className={styles.stepBadge} aria-hidden>03</span><HomeReveal className={styles.stepCard}><div className={styles.stepIcon}><GitCommitHorizontal size={20} aria-hidden /></div>          <h3 id="commit">Commit your changes</h3>
          <CodeBlock
            code={`git add .
git commit -m "Add DOM-based XSS payloads for event handler contexts"
git push origin add-xss-payloads`}
            language="bash"
          />

</HomeReveal><ArrowDown className={styles.connectorArrow} size={16} aria-hidden /></li><li className={styles.flowItem}><span className={styles.stepBadge} aria-hidden>04</span><HomeReveal className={styles.stepCard}><div className={styles.stepIcon}><GitPullRequest size={20} aria-hidden /></div>          <h3 id="pull-request">Open a Pull Request</h3>
          <p>On GitHub, open a PR to the upstream repository with:</p>
          <ul>
            <li>A clear, descriptive title</li>
            <li>Description of what you&rsquo;re adding and why it&rsquo;s valuable</li>
            <li>Note if you&rsquo;ve tested the payloads</li>
            <li>References to any relevant sources or documentation</li>
          </ul>

</HomeReveal><ArrowDown className={styles.connectorArrow} size={16} aria-hidden /></li></ol></section><section className={styles.section}>          <span id="guidelines" className={styles.anchor} />
          <h2 id="quality-standards">Payload Guidelines & Quality Checklist</h2>
          <p>Before submitting, verify:</p>
          <ul>
            <li>Payloads are properly formatted</li>
            <li>No duplicates exist</li>
            <li>Documentation is clear and accurate, with attack vectors and testing scenarios explained</li>
            <li>Prefer well-documented, tested payloads over raw dumps</li>
            <li>Credit original sources where applicable</li>
            <li>Follows existing structure and conventions</li>
            <li>No personal or sensitive information included</li>
            <li>Content is legal, ethical, and educational</li>
          </ul>

</section><section className={styles.section}>          <h2 id="code-of-conduct">Code of Conduct</h2>
          <ul>
            <li><strong>Be ethical</strong>: All contributions must be for legitimate purposes</li>
            <li><strong>Be respectful</strong>: Treat all contributors professionally</li>
            <li><strong>Be accurate</strong>: Verify payloads and techniques where possible</li>
          </ul>

          <Callout type="warning">
            Do not contribute illegal content, personal credentials from unauthorized sources,
            0-day exploits before responsible disclosure, or content that encourages unauthorized access.
          </Callout>
</section>          </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

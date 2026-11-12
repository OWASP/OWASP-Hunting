import { GithubIcon } from "@/components/ui/GithubIcon";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { SITE_CONFIG } from "@/lib/navigation";
import { ExternalLink, Plus } from "lucide-react";

export const metadata = {
  title: "Contributing",
  description: "How to contribute to the OWASP Hunting website and payload collection, including the correct pull request branches.",
};

export default function ContributingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <main id="main-content" style={{ flex: 1, maxWidth: "860px", margin: "0 auto", padding: "3rem 1.5rem", width: "100%" }}>
        <div className="prose">
          <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-line)" }}>
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

          <Callout type="info">
            All contributions must be for legitimate security testing and educational purposes. Review the{" "}
            <a href={`${SITE_CONFIG.upstreamRepo}/blob/main/DISCLAIMER.md`} target="_blank" rel="noopener noreferrer">
              project disclaimer
            </a>{" "}
            before contributing.
          </Callout>

          <h2 id="types-of-contributions">Types of Contributions</h2>
          <ul>
            <li><strong>New Payloads</strong> — Add payloads to existing vulnerability categories</li>
            <li><strong>New Categories</strong> — Propose and create new vulnerability classes</li>
            <li><strong>Documentation</strong> — Improve README files and category descriptions</li>
            <li><strong>Bug Fixes</strong> — Correct errors in existing payloads or documentation</li>
            <li><strong>Organization</strong> — Improve structure and consistency</li>
            <li><strong>Website</strong> — Improve pages, design, accessibility, and search</li>
          </ul>

          <h2 id="website-contributions">Contributing to this website</h2>
          <p>
            Website changes start from the <code>website</code> branch and use <code>website</code> as the pull request base. The site is published from that branch after a change is merged.
          </p>
          <ol>
            <li>Fork the repository and create a focused branch from the latest <code>website</code> branch.</li>
            <li>Edit the relevant files in <code>src/</code> or <code>public/</code> and review the page locally.</li>
            <li>Run TypeScript, lint, build, and static export validation.</li>
            <li>Open a pull request to <code>OWASP/OWASP-Hunting:website</code>.</li>
          </ol>
          <p>
            Read the{" "}
            <a href={`${SITE_CONFIG.upstreamRepo}/blob/website/WEBSITE_CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">
              complete website contribution guide
            </a>{" "}
            for the commands, file map, GitHub Pages requirements, and PR checklist. Payload collection changes follow the{" "}
            <a href={`${SITE_CONFIG.upstreamRepo}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">
              general contribution guide
            </a>.
          </p>

          <h2 id="guidelines">Payload Contribution Guidelines</h2>
          <ul>
            <li><strong>Quality over quantity</strong> — Well-documented, tested payloads over raw dumps</li>
            <li><strong>Clear documentation</strong> — Each payload should be clearly explained in context</li>
            <li><strong>Proper attribution</strong> — Credit original sources where applicable</li>
            <li><strong>Educational focus</strong> — Include context about attack vectors and testing scenarios</li>
            <li><strong>Legal compliance</strong> — All content must comply with applicable laws</li>
          </ul>

          <h2 id="adding-payloads">Adding New Payloads</h2>
          <p>
            Identify the existing category that fits your payload, check for duplicates, then follow
            the formatting style of existing payload files.
          </p>
          <p>Payload file format:</p>
          <CodeBlock
            code={`# Section Name
payload_1
payload_2
payload_3

# Another Section
# Comment explaining complex payload
another_payload`}
            language="text"
            filename="category-payloads.txt"
          />

          <h2 id="creating-categories">Creating New Categories</h2>
          <p>Create a new category when:</p>
          <ul>
            <li>The vulnerability type doesn&rsquo;t fit existing categories</li>
            <li>There&rsquo;s substantial content (15+ unique payloads)</li>
            <li>The category represents a distinct attack vector</li>
          </ul>
          <p>Required structure:</p>
          <CodeBlock
            code={`New-Category/
├── README.md
└── new-category-payloads.txt`}
            language="text"
          />

          <h2 id="submission-process">Payload Submission Process</h2>
          <p>The following steps submit payload collection changes to <code>main</code>.</p>

          <h3 id="fork-the-repo">1. Fork the upstream repository</h3>
          <p>
  First, fork the upstream repository on GitHub. Replace{" "}
  <code>YOUR_USERNAME</code> in the commands below with your GitHub username.
</p>
          <CodeBlock
  code={`git clone https://github.com/YOUR_USERNAME/OWASP-Hunting.git
cd OWASP-Hunting
git remote add upstream https://github.com/OWASP/OWASP-Hunting.git
git fetch upstream`}
  language="bash"
/>
          <h3 id="create-branch">2. Create a branch</h3>
          <CodeBlock
  code={`git switch -c add-xss-payloads upstream/main
# or
git switch -c new-category-api-injection upstream/main`}
  language="bash"
/>

          <h3 id="commit">3. Commit your changes</h3>
          <CodeBlock
  code={`git add .
git commit -m "Add DOM-based XSS payloads for event handler contexts"
git push -u origin add-xss-payloads
# or, if you created the other branch:
git push -u origin new-category-api-injection`}
  language="bash"
/>

          <h3 id="pull-request">4. Open a Pull Request</h3>
          <p>
 On GitHub, open a PR from your fork to the upstream repository&apos;s{" "}
  <code>main</code> branch with:
</p>
          <ul>
            <li>A clear, descriptive title</li>
            <li>Description of what you&rsquo;re adding and why it&rsquo;s valuable</li>
            <li>Note if you&rsquo;ve tested the payloads</li>
            <li>References to any relevant sources or documentation</li>
          </ul>

          <h2 id="quality-standards">Payload Quality Standards</h2>
          <p>Before submitting, verify:</p>
          <ul>
            <li>Payloads are properly formatted</li>
            <li>No duplicates exist</li>
            <li>Documentation is clear and accurate</li>
            <li>Follows existing structure and conventions</li>
            <li>No personal or sensitive information included</li>
            <li>Content is legal, ethical, and educational</li>
          </ul>

          <h2 id="code-of-conduct">Code of Conduct</h2>
          <ul>
            <li><strong>Be ethical</strong> — All contributions must be for legitimate purposes</li>
            <li><strong>Be respectful</strong> — Treat all contributors professionally</li>
            <li><strong>Be accurate</strong> — Verify payloads and techniques where possible</li>
          </ul>

          <Callout type="warning">
            Do not contribute illegal content, personal credentials from unauthorized sources,
            0-day exploits before responsible disclosure, or content that encourages unauthorized access.
          </Callout>
        </div>
      </main>
      <Footer />
    </div>
  );
}

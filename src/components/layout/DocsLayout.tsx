import { Sidebar, MobileSidebar } from "./Sidebar";
import { NavSection } from "@/lib/navigation";

interface DocsLayoutProps {
  children: React.ReactNode;
  toc?: React.ReactNode;
  navSections: NavSection[];
  wide?: boolean;
}

export function DocsLayout({ children, toc, navSections, wide }: DocsLayoutProps) {
  return (
    <div
      className="reference-layout"
      style={{
        display: "flex",
        minHeight: "calc(100vh - 52px)",
        width: "var(--site-width)",
        maxWidth: "var(--site-max-width)",
        margin: "0 auto",
      }}
    >
      {/* Left sidebar, desktop only */}
      <aside className="docs-sidebar" aria-label="Documentation sidebar">
        <Sidebar sections={navSections} />
      </aside>

      {/* Main content */}
      <main
        id="main-content"
        className={wide ? "reference-content reference-content-wide" : "reference-content"}
        style={{
          flex: 1,
          minWidth: 0,

        }}
      >
        {/* Mobile nav toggle */}
        <div className="mobile-nav-trigger" style={{ marginBottom: "1.5rem" }}>
          <MobileSidebar sections={navSections} />
        </div>

        {children}
      </main>

      {/* Right TOC, desktop only, only when provided */}
      {toc && (
        <aside className="docs-toc" aria-label="Page contents">
          {toc}
        </aside>
      )}
    </div>
  );
}

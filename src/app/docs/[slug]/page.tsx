import { notFound } from "next/navigation";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TableOfContents } from "@/components/layout/TableOfContents";
import { PageNavigation } from "@/components/ui/PageNavigation";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";
import { DOCS_NAV, SITE_CONFIG } from "@/lib/navigation";
import { getDocPage, getAllDocSlugs, DOC_PAGES } from "@/lib/docs-data";
import { extractHeadings, renderMarkdown } from "@/lib/docs-markdown";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) notFound();

  const allPages = DOC_PAGES.sort((a, b) => a.order - b.order);
  const currentIndex = allPages.findIndex((p) => p.slug === slug);
  const prev = currentIndex > 0 ? allPages[currentIndex - 1] : undefined;
  const next = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : undefined;

  const tocItems = extractHeadings(page.content);

  return (
    <DocsLayout
      navSections={DOCS_NAV}
      toc={<TableOfContents items={tocItems} />}
    >
      <article>
        <Breadcrumbs
          items={[
            { label: "Docs", href: "/docs" },
            { label: page.title },
          ]}
        />
        <div className="prose">
          <h1>{page.title}</h1>
          <p style={{ fontSize: "1.0625rem", color: "var(--color-ink-secondary)", margin: "0 0 2rem" }}>
            {page.description}
          </p>
          {/* The page title above is the only h1, so drop the content's own title line. */}
          <DocContent content={page.content.replace(/^# .+\n+/, "")} />
        </div>
        <PageNavigation
          prev={prev ? { title: prev.title, href: `/docs/${prev.slug}` } : undefined}
          next={next ? { title: next.title, href: `/docs/${next.slug}` } : undefined}
        />
      </article>
    </DocsLayout>
  );
}

function DocContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "code") {
          return (
            <CodeBlock
              key={i}
              code={block.content}
              language={block.lang || "bash"}
            />
          );
        }
        if (block.type === "callout") {
          return (
            <Callout key={i} type={block.calloutType as "info" | "warning" | "success" | "danger"}>
              {block.content}
            </Callout>
          );
        }
        // Render markdown-like text as HTML
        return (
          <div
            key={i}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content, SITE_CONFIG.basePath) }}
          />
        );
      })}
    </>
  );
}

interface Block {
  type: "text" | "code" | "callout";
  content: string;
  lang?: string;
  calloutType?: string;
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fenceMatch = line.match(/^```(\w*)$/);
    if (fenceMatch) {
      const lang = fenceMatch[1];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", content: codeLines.join("\n"), lang });
      i++;
      continue;
    }

    // Collect text until next code block
    const textLines: string[] = [];
    while (i < lines.length && !lines[i].match(/^```/)) {
      textLines.push(lines[i]);
      i++;
    }
    if (textLines.some((l) => l.trim())) {
      blocks.push({ type: "text", content: textLines.join("\n") });
    }
  }

  return blocks;
}

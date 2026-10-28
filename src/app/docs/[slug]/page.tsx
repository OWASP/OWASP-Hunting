import { notFound } from "next/navigation";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TableOfContents } from "@/components/layout/TableOfContents";
import { PageNavigation } from "@/components/ui/PageNavigation";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";
import { DOCS_NAV, SITE_CONFIG } from "@/lib/navigation";
import { getDocPage, getAllDocSlugs, DOC_PAGES } from "@/lib/docs-data";
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
          <DocContent content={page.content} />
        </div>
        <PageNavigation
          prev={prev ? { title: prev.title, href: `/docs/${prev.slug}` } : undefined}
          next={next ? { title: next.title, href: `/docs/${next.slug}` } : undefined}
        />
      </article>
    </DocsLayout>
  );
}

function extractHeadings(content: string) {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const m2 = line.match(/^##\s+(.+)$/);
    const m3 = line.match(/^###\s+(.+)$/);
    if (m2) {
      const text = m2[1].trim();
      headings.push({ id: slugify(text), text, level: 2 });
    } else if (m3) {
      const text = m3[1].trim();
      headings.push({ id: slugify(text), text, level: 3 });
    }
  }
  return headings;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
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
            dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }}
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

function renderMarkdown(md: string): string {
  const html = md
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings
    .replace(/^#### (.+)$/gm, (_, t) => `<h4 id="${slugify(t)}">${t}</h4>`)
    .replace(/^### (.+)$/gm, (_, t) => `<h3 id="${slugify(t)}">${t}</h3>`)
    .replace(/^## (.+)$/gm, (_, t) => `<h2 id="${slugify(t)}">${t}</h2>`)
    .replace(/^# (.+)$/gm, (_, t) => `<h1 id="${slugify(t)}">${t}</h1>`)
    // Bold / italic / code
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
      `<a href="${href.startsWith("/") ? SITE_CONFIG.basePath + href : href}">${label}</a>`
    )
    // Unordered lists
    .replace(
      /(^|\n)((?:- .+(?:\n|$))+)/g,
      (_, prefix, list) => {
        const items = list
          .trim()
          .split("\n")
          .map((line: string) => `<li>${line.slice(2)}</li>`)
          .join("");
        return `${prefix}<ul>${items}</ul>\n`;
      }
    )
    // Ordered lists
    .replace(
      /(^|\n)((?:\d+\. .+(?:\n|$))+)/g,
      (_, prefix, list) => {
        const items = list
          .trim()
          .split("\n")
          .map((line: string) =>
            `<li>${line.replace(/^\d+\. /, "")}</li>`
          )
          .join("");
        return `${prefix}<ol>${items}</ol>\n`;
      }
    );

  // Render plain text separately from block-level elements.
  const renderText = (text: string): string =>
    text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");

  // Keep headings and lists outside paragraph formatting.
  const blockPattern =
    /<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>|<ul\b[^>]*>[\s\S]*?<\/ul>|<ol\b[^>]*>[\s\S]*?<\/ol>/g;

  const output: string[] = [];
  let lastIndex = 0;

  for (const match of html.matchAll(blockPattern)) {
    const matchIndex = match.index ?? 0;

    output.push(renderText(html.slice(lastIndex, matchIndex)));
    output.push(match[0]);

    lastIndex = matchIndex + match[0].length;
  }

  output.push(renderText(html.slice(lastIndex)));

  const renderedHtml = output.filter(Boolean).join("\n");

  // Preserve the existing Markdown blockquote fix.
  return renderedHtml.replace(
    /<p>(?:<br\/>)*&gt; ?([\s\S]*?)<\/p>/g,
    (_, quote: string) =>
      `<blockquote>${quote.replace(/<br\/>&gt; ?/g, "<br/>")}</blockquote>`
  );
}
export function extractHeadings(content: string) {
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

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}

export function renderMarkdown(md: string, basePath = ""): string {
  let html = md
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings
    .replace(/^#### (.+)$/gm, (_, t) => `<h4 id="${slugify(t)}">${t}</h4>`)
    .replace(
      /^### (.+)$/gm,
      (_, t) =>
        `<h3 id="${slugify(t)}">${t}<a href="#${slugify(t)}" class="heading-anchor" aria-label="Link to section: ${escapeAttr(t)}">#</a></h3>`
    )
    .replace(
      /^## (.+)$/gm,
      (_, t) =>
        `<h2 id="${slugify(t)}">${t}<a href="#${slugify(t)}" class="heading-anchor" aria-label="Link to section: ${escapeAttr(t)}">#</a></h2>`
    )
    .replace(/^# (.+)$/gm, (_, t) => `<h1 id="${slugify(t)}">${t}</h1>`)
    // Bold / italic / code
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
      `<a href="${href.startsWith("/") ? basePath + href : href}">${label}</a>`
    )
    // Lists
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
    )
    // Paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<ol")) {
    html = `<p>${html}</p>`;
  }
  // Convert Markdown blockquote paragraphs into semantic blockquotes.
  html = html.replace(
    /<p>(?:<br\/>)*&gt; ?([\s\S]*?)<\/p>/g,
    (_, quote: string) =>
      `<blockquote>${quote.replace(/<br\/>&gt; ?/g, "<br/>")}</blockquote>`
  );
  return html;
}

import type { ReactNode } from "react";
import { Inline } from "./Inline";
import type { ReadmeBlock } from "@/lib/payload-types";
import styles from "./payloads.module.css";

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Headings shown in the page contents list for a README-driven category page. */
export function readmeHeadings(blocks: ReadmeBlock[]): { id: string; text: string; level: number }[] {
  const out: { id: string; text: string; level: number }[] = [];
  let skipping = false;
  for (const block of blocks) {
    if (block.t !== "h") continue;
    if (block.level === 2) skipping = /^(additional )?payloads$/i.test(block.text) || /^description$/i.test(block.text);
    if (!skipping && block.level === 2) out.push({ id: slugifyHeading(block.text), text: block.text, level: 2 });
  }
  return out;
}

/**
 * Render a category README. The Description paragraph is already shown in the
 * page header, and the Payloads sections only point at the files the explorer
 * shows, so both are left out.
 */
export function ReadmeBlocks({ blocks }: { blocks: ReadmeBlock[] }) {
  const nodes: ReactNode[] = [];
  let skipSection = false;
  let skipFirstParagraph = false;

  blocks.forEach((block, i) => {
    if (block.t === "h") {
      if (block.level === 2) {
        const isDescription = /^description$/i.test(block.text);
        skipSection = /^(additional )?payloads$/i.test(block.text);
        skipFirstParagraph = isDescription;
        if (isDescription) return;
      }
      if (skipSection) return;
      const id = slugifyHeading(block.text);
      if (block.level === 2) nodes.push(<h2 key={i} id={id}>{block.text}</h2>);
      else if (block.level === 3) nodes.push(<h3 key={i} id={id}>{block.text}</h3>);
      else nodes.push(<h4 key={i} id={id}>{block.text}</h4>);
      return;
    }
    if (skipSection) return;
    if (block.t === "p") {
      if (skipFirstParagraph) {
        skipFirstParagraph = false;
        return;
      }
      nodes.push(<p key={i}><Inline text={block.text} /></p>);
    } else if (block.t === "ul") {
      nodes.push(<ul key={i}>{block.items.map((item, j) => <li key={j}><Inline text={item} /></li>)}</ul>);
    } else if (block.t === "ol") {
      nodes.push(<ol key={i}>{block.items.map((item, j) => <li key={j}><Inline text={item} /></li>)}</ol>);
    } else if (block.t === "code") {
      nodes.push(<pre key={i} tabIndex={0} aria-label="Code sample"><code>{block.text}</code></pre>);
    }
  });

  return <div className={`prose ${styles.readme}`} style={{ maxWidth: "none" }}>{nodes}</div>;
}

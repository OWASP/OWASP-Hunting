import type { ReactNode } from "react";

// Renders the small subset of inline Markdown used in category READMEs:
// `code`, **bold** and [text](https://link). Everything is returned as React
// text nodes, so nothing in the source can become markup. Links must be
// http(s); anything else is shown as plain text.

const TOKEN = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[([^\]]+)\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\))/g;

export function Inline({ text }: { text: string }): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(TOKEN)) {
    const index = m.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    if (m[1]) out.push(<code key={key++}>{m[1].slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={key++}>{m[2].slice(2, -2)}</strong>);
    else if (m[3]) {
      out.push(
        <a key={key++} href={m[5]} target="_blank" rel="noopener noreferrer" className="link-external">
          {m[4]}
        </a>,
      );
    }
    last = index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

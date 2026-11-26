import { CopyButton } from "./CopyButton";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = "text", filename, showLineNumbers }: CodeBlockProps) {
  const lines = code.trim().split("\n");

  return (
    <div
      className="code-block"
      style={{
        backgroundColor: "var(--color-code-bg)",
        border: "1px solid var(--color-code-border)",
        borderRadius: "6px",
        overflow: "hidden",
        margin: "1rem 0",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.375rem 0.75rem",
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-code-border)",
        }}
      >
        <span
          style={{
            fontSize: "0.6875rem",
            fontFamily: "var(--font-mono)",
            color: "var(--color-ink-muted)",
            letterSpacing: "0.04em",
          }}
        >
          {filename || language}
        </span>
        <CopyButton text={code.trim()} />
      </div>

      {/* Content */}
      <div
        style={{
          overflowX: "auto",
          padding: "1rem",
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            lineHeight: 1.7,
            color: "var(--color-ink)",
          }}
        >
          {showLineNumbers ? (
            <code>
              {lines.map((line, i) => (
                <span
                  key={i}
                  style={{ display: "table-row" }}
                >
                  <span
                    style={{
                      display: "table-cell",
                      paddingRight: "1.5rem",
                      color: "var(--color-ink-muted)",
                      userSelect: "none",
                      textAlign: "right",
                      fontSize: "0.75rem",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ display: "table-cell" }}>{line}</span>
                </span>
              ))}
            </code>
          ) : (
            <code>{code.trim()}</code>
          )}
        </pre>
      </div>
    </div>
  );
}

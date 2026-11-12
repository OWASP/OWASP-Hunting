import { Shield } from "lucide-react";

interface DisclaimerProps {
  compact?: boolean;
}

export function Disclaimer({ compact }: DisclaimerProps) {
  if (compact) {
    return (
      <div
        role="note"
        aria-label="Responsible use notice"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          padding: "0.625rem 0.875rem",
          backgroundColor: "var(--color-surface-raised)",
          border: "1px solid var(--color-line)",
          borderLeft: "3px solid var(--color-accent-dim)",
          borderRadius: "0 5px 5px 0",
          margin: "1rem 0",
        }}
      >
        <Shield
          size={14}
          style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: "1px" }}
          aria-hidden
        />
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-ink-muted)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          These payloads are for{" "}
          <strong style={{ color: "var(--color-ink-secondary)" }}>authorized testing only</strong>
: systems you own, authorized bug bounty programs, or controlled lab environments.
          Unauthorized testing is illegal.
        </p>
      </div>
    );
  }

  return (
    <section
      role="note"
      aria-labelledby="disclaimer-heading"
      style={{
        padding: "1.25rem 1.5rem",
        backgroundColor: "var(--color-surface-raised)",
        border: "1px solid var(--color-line)",
        borderTop: "3px solid var(--color-accent)",
        borderRadius: "0 0 6px 6px",
        marginTop: "2.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <Shield size={16} style={{ color: "var(--color-accent)" }} aria-hidden />
        <h3
          id="disclaimer-heading"
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--color-ink)",
            margin: 0,
          }}
        >
          Responsible Use
        </h3>
      </div>
      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-ink-secondary)",
          lineHeight: 1.6,
          margin: "0 0 0.75rem",
        }}
      >
        All content in this reference is for <strong>authorized security testing only</strong>.
        Use only on systems you own or have explicit written permission to test.
      </p>
      <ul
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-ink-secondary)",
          margin: 0,
          paddingLeft: "1.25rem",
          lineHeight: 1.7,
          listStyleType: "disc",
        }}
      >
        <li>Systems and applications you own</li>
        <li>Authorized penetration testing engagements</li>
        <li>Bug bounty programs with defined scope</li>
        <li>Educational lab environments (DVWA, WebGoat, HackTheBox)</li>
      </ul>
    </section>
  );
}

import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

type CalloutType = "warning" | "info" | "success" | "danger";

const CALLOUT_STYLES: Record<CalloutType, {
  bg: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}> = {
  warning: {
    bg: "var(--color-warning-subtle)",
    border: "var(--color-warning)",
    icon: <AlertTriangle size={15} aria-hidden />,
    label: "Warning",
  },
  info: {
    bg: "var(--color-info-subtle)",
    border: "var(--color-info)",
    icon: <Info size={15} aria-hidden />,
    label: "Note",
  },
  success: {
    bg: "var(--color-success-subtle)",
    border: "var(--color-success)",
    icon: <CheckCircle size={15} aria-hidden />,
    label: "Tip",
  },
  danger: {
    bg: "var(--color-danger-subtle)",
    border: "var(--color-danger)",
    icon: <XCircle size={15} aria-hidden />,
    label: "Important",
  },
};

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type = "info", title, children }: CalloutProps) {
  const style = CALLOUT_STYLES[type];

  return (
    <div
      role="note"
      style={{
        backgroundColor: style.bg,
        borderLeft: `3px solid ${style.border}`,
        borderRadius: "0 5px 5px 0",
        padding: "0.875rem 1.125rem",
        margin: "1.25rem 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          marginBottom: title || children ? "0.375rem" : 0,
          color: style.border,
          fontSize: "0.8125rem",
          fontWeight: 600,
        }}
      >
        {style.icon}
        {title || style.label}
      </div>
      <div style={{ fontSize: "0.875rem", color: "var(--color-ink-secondary)", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

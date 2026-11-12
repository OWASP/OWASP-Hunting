"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import styles from "./CopyButton.module.css";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleCopy = async () => {
    let success = false;
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch {
      const previousFocus = document.activeElement as HTMLElement | null;
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("aria-label", "Text to copy");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      try {
        field.select();
        success = document.execCommand("copy");
      } catch { success = false; }
      finally { field.remove(); previousFocus?.focus(); }
    }
    setStatus(success ? "copied" : "error");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  };

  const feedback = status === "copied" ? "Copied" : status === "error" ? "Copy failed" : "Copy";
  const Icon = status === "copied" ? Check : status === "error" ? TriangleAlert : Copy;
  return (
    <>
      <button type="button" onClick={handleCopy} className={styles.button} data-status={status}
        aria-label={status === "idle" ? label : feedback} title={status === "error" ? "Select the text and copy it manually" : feedback}>
        <Icon key={status} size={13} aria-hidden />{feedback}
      </button>
      <span className={styles.status} role="status">{status === "copied" ? "Copied to clipboard" : status === "error" ? "Copy failed. Select the text and copy it manually." : ""}</span>
    </>
  );
}

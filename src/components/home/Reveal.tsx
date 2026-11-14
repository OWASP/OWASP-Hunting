"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import styles from "./Reveal.module.css";

/**
 * Scroll reveal. Content is fully visible in the server HTML. After hydration,
 * only elements that start below the fold are hidden, then revealed when they
 * enter the viewport, so nothing flashes and nothing is lost without JS.
 * Only opacity and transform change: no layout shift.
 */
export function Reveal({ children, className, index = 0, as: Tag = "div" }: {
  children: ReactNode;
  className?: string;
  /** Stagger position within a group. */
  index?: number;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen
    el.dataset.reveal = "pending";
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      el.dataset.reveal = "in";
      observer.disconnect();
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Component = Tag as "div";
  return (
    <Component ref={ref as React.RefObject<HTMLDivElement>} className={`${styles.reveal} ${className ?? ""}`} style={{ "--i": index } as CSSProperties}>
      {children}
    </Component>
  );
}

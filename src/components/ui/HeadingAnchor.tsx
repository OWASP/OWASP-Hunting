"use client";

import { useEffect } from "react";
import { copyText } from "@/lib/copy-text";

interface HeadingAnchorProps {
  id: string;
  text: string;
}

/**
 * Delegated click listener for all `.heading-anchor` links across React-rendered
 * headings and HTML-injected docs content, ensuring each click copies once.
 */
export function HeadingAnchorListener() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      const anchor =
        target instanceof Element
          ? target.closest<HTMLAnchorElement>("a.heading-anchor")
          : null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      const url = new URL(href, window.location.href).href;
      void copyText(url);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}

export function HeadingAnchor({ id, text }: HeadingAnchorProps) {
  return (
    <a
      href={`#${id}`}
      className="heading-anchor"
      aria-label={`Link to section: ${text}`}
    >
      #
    </a>
  );
}

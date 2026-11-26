"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { shouldShowBackToTop } from "@/lib/back-to-top";

/** A "Back to top" button for long pages. It only exists in the page (and the tab order) once the reader has scrolled well down. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(shouldShowBackToTop(window.scrollY, window.innerHeight));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!visible) return null;

  const goTop = () => {
    // Move keyboard and screen-reader position to the top of the page content first:
    // focusing an element cancels a smooth scroll that is already running.
    const main = document.getElementById("main-content");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  };

  return (
    <button type="button" className="back-to-top" onClick={goTop} aria-label="Back to top" title="Back to top">
      <ArrowUp size={18} aria-hidden />
    </button>
  );
}

"use client";

import { useEffect, useRef } from "react";
import styles from "./HomeEffects.module.css";

/**
 * Scroll-progress bar plus the hero's pointer and scroll depth, driven by CSS
 * variables on the hero element. One passive listener each, batched per frame.
 */
export function HomeEffects({ heroId }: { heroId: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hero = document.getElementById(heroId);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      if (hero && !still.matches) hero.style.setProperty("--scroll", String(Math.min(window.scrollY, 600)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onPointer = (event: PointerEvent) => {
      if (!hero || still.matches || event.pointerType !== "mouse") return;
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", String(((event.clientX - r.left) / r.width - 0.5) * 2));
      hero.style.setProperty("--my", String(((event.clientY - r.top) / r.height - 0.5) * 2));
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    hero?.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      hero?.removeEventListener("pointermove", onPointer);
    };
  }, [heroId]);
  return <div className={styles.progress} aria-hidden="true"><div ref={bar} className={styles.bar} /></div>;
}

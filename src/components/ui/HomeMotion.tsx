"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Animate only after hydration; server content and unsupported browsers stay visible. */
export function HomeMotion({ children, className, viewport = false, delay = 0, duration = 500, replayable = false }: {
  children: ReactNode;
  className?: string;
  viewport?: boolean;
  delay?: number;
  duration?: number;
  replayable?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    const root = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || preference.matches || !root.animate) return;
    const animations: Animation[] = [];
    let frame = 0;
    let played = false;
    const play = () => {
      if (played || preference.matches) return;
      played = true;
      frame = requestAnimationFrame(() => {
        const elements = root.querySelectorAll<HTMLElement>("[data-enter]");
        (elements.length ? Array.from(elements) : [root]).forEach((element, index) => {
          const itemDelay = Number(element.dataset.enter ?? delay + index * 70);
          animations.push(element.animate([
            { opacity: 0, transform: "translateY(18px)" },
            { opacity: 1, transform: "translateY(0)" },
          ], { duration, delay: itemDelay, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" }));
        });
        root.dataset.motionPlayed = "true";
      });
    };
    const observer = viewport && "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) { play(); observer?.disconnect(); }
        }, { threshold: 0.15 }) : null;
    if (observer) observer.observe(root); else play();
    const cancel = () => animations.forEach(animation => animation.cancel());
    preference.addEventListener("change", cancel);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      preference.removeEventListener("change", cancel);
      cancel();
    };
  }, [viewport, delay, duration, replay]);
  return <div ref={ref} className={className}>
    {children}
    {replayable && <button type="button" className="motion-replay" onClick={() => setReplay(value => value + 1)}>Replay animation</button>}
  </div>;
}

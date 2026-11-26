"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HeroScan.module.css";

export function HeroScan() {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.dataset.ready = "true";
    const observer = new IntersectionObserver(([entry]) => {
      root.dataset.visible = String(entry.isIntersecting);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={styles.scan} data-paused={paused} data-visible="true">
    <svg className={styles.diagram} viewBox="0 0 1400 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g className={styles.routes} fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 110H125L195 180H300M0 350H170L245 275H320M1400 110H1275L1205 180H1100M1400 350H1230L1155 275H1080" />
        <path d="M20 220H145L210 285M1380 220H1255L1190 285" />
      </g>
      <g className={styles.trace} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M0 110H125L195 180H300M1400 350H1230L1155 275H1080" />
      </g>
      <g fill="currentColor" className={styles.nodes}>
        <rect x="121" y="106" width="8" height="8" rx="1" /><rect x="241" y="271" width="8" height="8" rx="1" />
        <rect x="1271" y="106" width="8" height="8" rx="1" /><rect x="1151" y="271" width="8" height="8" rx="1" />
      </g>
    </svg>
    <button type="button" className={styles.control} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "Resume background motion" : "Pause background motion"}</button>
  </div>;
}

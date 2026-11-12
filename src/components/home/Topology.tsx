"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./Topology.module.css";

export interface TopologyNode { slug: string; name: string; count: number }

const W = 600, H = 560, CX = 300, CY = 280, RX = 214, RY = 200;

/** Six nodes on a ring around the hub, starting at the top. */
function place(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2;
  const r = (n: number) => Math.round(n * 10) / 10;
  return { x: r(CX + RX * Math.sin(angle)), y: r(CY - RY * Math.cos(angle)) };
}

/**
 * The page's one visual idea: the attack surface as a topology. The hub is the
 * reference, each node is a real category, and every node links to it. When
 * `active` is passed, hovering a category elsewhere on the page lights its node.
 */
export function Topology({ nodes, active, onActive, variant = "hero" }: {
  nodes: TopologyNode[];
  active?: string | null;
  onActive?: (slug: string | null) => void;
  variant?: "hero" | "panel";
}) {
  const [local, setLocal] = useState<string | null>(null);
  const current = active !== undefined ? active : local;
  const setActive = (slug: string | null) => { setLocal(slug); onActive?.(slug); };
  const points = nodes.map((_, i) => place(i, nodes.length));

  return (
    <div className={`${styles.topology} ${styles[variant]}`} data-active={current ? "true" : "false"}>
      <div className={styles.depth}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden="true">
          <circle cx={CX} cy={CY} r="258" className={styles.ring} />
          <circle cx={CX} cy={CY} r="122" className={styles.ring} />
          <path className={styles.rim} pathLength={1} d={points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("") + "Z"} />
          {points.map((p, i) => {
            const mx = (CX + p.x) / 2, my = (CY + p.y) / 2;
            const nx = -(p.y - CY), ny = p.x - CX, len = Math.hypot(nx, ny);
            const bend = 18 * (i % 2 ? 1 : -1);
            const d = `M${CX} ${CY}Q${(mx + (nx / len) * bend).toFixed(1)} ${(my + (ny / len) * bend).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
            const on = current === nodes[i].slug;
            return <g key={nodes[i].slug} data-on={on} style={{ "--n": String(i) } as React.CSSProperties}>
              <path d={d} pathLength={1} className={styles.link} />
              {on && <path d={d} pathLength={1} className={styles.pulse} />}
            </g>;
          })}
        </svg>
        <div className={styles.hub}><span>OWASP</span><b>Hunting</b></div>
        {nodes.map((node, i) => {
          const p = points[i];
          return <Link
            key={node.slug}
            href={`/payloads#${node.slug}`}
            className={styles.node}
            data-on={current === node.slug}
            style={{ left: `${Math.round((p.x / W) * 1e4) / 100}%`, top: `${Math.round((p.y / H) * 1e4) / 100}%`, "--n": String(i) } as React.CSSProperties}
            onPointerEnter={() => setActive(node.slug)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(node.slug)}
            onBlur={() => setActive(null)}
          >
            <i className={styles.dot} aria-hidden="true" />
            <span className={styles.label}><span>{node.name}</span><small>{node.count} {node.count === 1 ? "class" : "classes"}</small></span>
          </Link>;
        })}
      </div>
    </div>
  );
}

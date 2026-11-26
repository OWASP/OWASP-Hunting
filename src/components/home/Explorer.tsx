"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Code2, KeyRound, LockKeyhole, Network, Server, Settings2 } from "lucide-react";
import { Reveal } from "./Reveal";
import { Topology, type TopologyNode } from "./Topology";
import styles from "./Explorer.module.css";

export interface ExplorerCategory extends TopologyNode {
  description: string;
  items: { title: string; slug: string }[];
}

const ICONS = [Code2, LockKeyhole, KeyRound, Server, Settings2, Network];

/** Cards and topology share one active category, so either can drive the other. */
export function Explorer({ categories }: { categories: ExplorerCategory[] }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className={styles.explorer}>
      <Reveal className={styles.map}>
        <div className={styles.sticky}>
          <Topology nodes={categories} active={active} onActive={setActive} variant="panel" />
        </div>
      </Reveal>
      <ul className={styles.cards}>
        {categories.map((category, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <Reveal as="li" key={category.slug} index={index % 2} className={styles.item}>
              <Link
                href={`/payloads#${category.slug}`}
                className={styles.card}
                data-on={active === category.slug}
                onPointerEnter={() => setActive(category.slug)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(category.slug)}
                onBlur={() => setActive(null)}
              >
                <span className={styles.head}>
                  <Icon size={18} aria-hidden />
                  <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                </span>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span className={styles.chips} aria-label="Included classes">
                  {category.items.slice(0, 3).map(item => <span key={item.slug}>{item.title.replace(/ \(.*\)/, "")}</span>)}
                  {category.items.length > 3 && <span>+{category.items.length - 3}</span>}
                </span>
                <span className={styles.more}>{category.count} {category.count === 1 ? "class" : "classes"}<ArrowRight size={15} aria-hidden /></span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}

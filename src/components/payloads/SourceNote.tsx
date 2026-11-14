import { formatDate } from "@/lib/payload-catalog";
import type { CatalogIndex } from "@/lib/payload-types";
import styles from "./payloads.module.css";

/** Where the payloads on this page come from: the exact main revision. Server component. */
export function SourceNote({ index }: { index: CatalogIndex }) {
  const { source, project } = index;
  return (
    <p className={styles.sourceLine}>
      Payloads are read from <code>{source.branch}</code> at{" "}
      <a href={source.commitUrl} target="_blank" rel="noopener noreferrer">
        <span className={styles.mono}>{source.revision.slice(0, 7)}</span>
      </a>{" "}
      (committed {formatDate(source.committedAt)}). Project version {project.version}.
    </p>
  );
}

import { highlight } from "@/lib/payload-search";
import styles from "./payloads.module.css";

/** Payload text with search terms marked. Segments are rendered as text nodes only. */
export function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  return (
    <>
      {highlight(text, terms).map((segment, i) =>
        segment.hit ? <mark key={i} className={styles.mark}>{segment.text}</mark> : <span key={i}>{segment.text}</span>,
      )}
    </>
  );
}

import { DocsLayout } from "@/components/layout/DocsLayout";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { PayloadLibrary } from "@/components/payloads/PayloadLibrary";
import type { LibraryCategory } from "@/components/payloads/PayloadLibrary";
import { SourceNote } from "@/components/payloads/SourceNote";
import { formatCount, getCatalogIndex, getOrderedCategories, getPayloadNav } from "@/lib/payload-catalog";
import styles from "@/components/payloads/payloads.module.css";

export const metadata = {
  title: "Payload library",
  description:
    "Search and browse every payload in the OWASP Hunting collection. Copy a single payload, copy or download a file, with the source revision shown.",
};

export default function PayloadsIndexPage() {
  const index = getCatalogIndex();
  const categories: LibraryCategory[] = getOrderedCategories().map((c) => ({
    slug: c.slug,
    dir: c.dir,
    name: c.name,
    group: c.group,
    description: c.description,
    files: c.stats.files,
    entries: c.stats.entries,
    chunk: c.chunk,
    chunkSha256: c.chunkSha256,
    fileNames: c.files.map((f) => f.name),
  }));

  return (
    <DocsLayout navSections={getPayloadNav()} wide filterable>
      <div>
        <h1>Payload library</h1>
        <p className={styles.lede}>
          {formatCount(index.stats.entries)} payloads in {formatCount(index.stats.files)} files across {formatCount(index.stats.categories)} categories. Search every line, copy one payload, or
          download a file exactly as it is on main.
        </p>
        <SourceNote index={index} />
        <PayloadLibrary categories={categories} groups={index.groups} />
        <div style={{ marginTop: "2.5rem" }}>
          <Disclaimer compact />
        </div>
      </div>
    </DocsLayout>
  );
}

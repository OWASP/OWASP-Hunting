import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TableOfContents } from "@/components/layout/TableOfContents";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { PageNavigation } from "@/components/ui/PageNavigation";
import { CategoryExplorer } from "@/components/payloads/CategoryExplorer";
import { EDUCATION_TOC, EducationalSections } from "@/components/payloads/EducationalSections";
import { ReadmeBlocks, readmeHeadings } from "@/components/payloads/ReadmeBlocks";
import { SourceNote } from "@/components/payloads/SourceNote";
import { getPayloadPage } from "@/lib/payload-data";
import { formatCount, getAllCategorySlugs, getCatalogIndex, getCategory, getNeighbours, getPayloadNav, getReadme } from "@/lib/payload-catalog";
import styles from "@/components/payloads/payloads.module.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCategorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const guide = getPayloadPage(slug);
  const description = (guide?.description ?? category.description).slice(0, 200);
  return { title: `${guide?.title ?? category.name}: payloads`, description };
}

export default async function PayloadCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const index = getCatalogIndex();
  const guide = getPayloadPage(slug);
  const readme = guide ? undefined : getReadme(slug);
  const { prev, next } = getNeighbours(slug);
  const repo = `https://github.com/${index.source.repository}`;

  const toc = [
    { id: "payloads", text: "Payloads", level: 2 },
    ...(guide ? EDUCATION_TOC : readme ? readmeHeadings(readme.blocks) : []),
  ];

  return (
    <DocsLayout navSections={getPayloadNav()} toc={<TableOfContents items={toc} />} filterable>
      <article>
        <Breadcrumbs
          items={[
            { label: "Payloads", href: "/payloads" },
            { label: category.group, href: `/payloads#${category.group.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` },
            { label: guide?.shortTitle ?? category.name },
          ]}
        />

        <header className={styles.catHeader}>
          <p className={styles.kicker}>{category.group}</p>
          <h1>{guide?.title ?? category.name}</h1>
          <p className={styles.lede}>{guide?.description ?? category.description}</p>
          <ul className={styles.facts}>
            <li>
              <strong>{formatCount(category.stats.entries)}</strong> payloads
            </li>
            <li>
              <strong>{formatCount(category.stats.files)}</strong> {category.stats.files === 1 ? "file" : "files"}
            </li>
            <li>
              <a href={`${repo}/blob/${index.source.revision}/${category.dir}/README.md`} target="_blank" rel="noopener noreferrer" className={styles.factLink}>
                <GithubIcon size={13} aria-hidden />
                README on GitHub
                <ExternalLink size={11} aria-hidden />
              </a>
            </li>
          </ul>
          <SourceNote index={index} />
        </header>

        <Disclaimer compact />

        <div id="payloads" style={{ scrollMarginTop: "4.5rem" }}>
          <CategoryExplorer category={category} source={index.source} />
        </div>

        {guide ? <EducationalSections page={guide} dir={category.dir} /> : readme ? <ReadmeBlocks blocks={readme.blocks} /> : null}

        <Disclaimer />

        <PageNavigation
          prev={prev ? { title: prev.name, href: `/payloads/${prev.slug}` } : undefined}
          next={next ? { title: next.name, href: `/payloads/${next.slug}` } : undefined}
        />
      </article>
    </DocsLayout>
  );
}

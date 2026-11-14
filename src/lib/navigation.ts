import { SITE_VARIANT } from "@/lib/site-variant";

export const SITE_CONFIG = {
  name: "Hunting",
  fullName: "OWASP Hunting",
  description: "Security Testing Resources & Payload Reference",
  url: SITE_VARIANT.url,
  basePath: SITE_VARIANT.basePath,
  upstreamRepo: "https://github.com/owasp/owasp-hunting",
  license: "MIT",
};

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  external?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const DOCS_NAV: NavSection[] = [
  {
    title: "Introduction",
    items: [
      { title: "Getting Started", href: "/docs/getting-started" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Usage", href: "/docs/usage" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Methodology", href: "/docs/methodology" },
      { title: "Repository Structure", href: "/docs/repository-structure" },
    ],
  },
];

export const HEADER_NAV: NavItem[] = [
  { title: "Docs", href: "/docs" },
  { title: "Payloads", href: "/payloads" },
  { title: "Contributing", href: "/contributing" },
  { title: "About", href: "/about" },
];

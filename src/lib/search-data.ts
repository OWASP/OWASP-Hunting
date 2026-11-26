import type { CatalogCategory } from "./payload-types";

export interface SearchItem {
  id: string;
  title: string;
  category: string;
  href: string;
  excerpt: string;
  tags: string[];
  type: "payload" | "doc" | "page";
}

export const CATEGORY_ALIASES: Record<string, string[]> = {
  "sql-injection": ["sqli", "sql"],
  "nosql-injection": ["nosqli", "nosql"],
  "command-injection": ["rce", "cmd", "command-exec"],
  "path-traversal": ["lfi", "rfi", "directory-traversal", "dot-dot-slash"],
  xss: ["cross-site-scripting"],
  csrf: ["xsrf", "cross-site-request-forgery"],
  ssrf: ["server-side-request-forgery"],
  ssti: ["server-side-template-injection"],
  ssji: ["server-side-javascript-injection"],
  xxe: ["xml-external-entity", "xxe-injection"],
  "open-redirect": ["redirect"],
  idor: ["insecure-direct-object-references", "bola"],
  "api-authorization": ["bola", "bfla"],
  "timing-attacks": ["side-channel", "cwe-208"],
};

export function categorySearchItems(categories: CatalogCategory[]): SearchItem[] {
  return categories.map((c) => ({
    id: `payload-${c.slug}`,
    title: c.name,
    category: c.group,
    href: `/payloads/${c.slug}`,
    excerpt: c.description,
    tags: [
      c.dir,
      c.slug,
      ...(CATEGORY_ALIASES[c.slug] ?? []),
      ...c.files.map((f) => f.name),
    ],
    type: "payload" as const,
  }));
}

export const SEARCH_INDEX: SearchItem[] = [
  // Payload categories are not listed here: the search dialog loads them from the
  // generated catalog (public/payload-catalog/index.json) so new categories appear on their own.
  {
    id: "page-payloads",
    title: "Payload library",
    category: "Payloads",
    href: "/payloads",
    excerpt: "Search and browse every payload in the collection. Copy a payload, copy or download a file.",
    tags: ["payloads", "library", "search", "copy", "download", "wordlist"],
    type: "page",
  },
  // Documentation pages
  {
    id: "doc-getting-started",
    title: "Getting Started",
    category: "Documentation",
    href: "/docs/getting-started",
    excerpt: "Introduction to OWASP Hunting: what it is, who it's for, and how to navigate the security testing resources.",
    tags: ["getting started", "introduction", "overview", "owasp hunting", "security testing"],
    type: "doc",
  },
  {
    id: "doc-installation",
    title: "Installation",
    category: "Documentation",
    href: "/docs/installation",
    excerpt: "How to clone and use the OWASP Hunting repository locally.",
    tags: ["installation", "setup", "git clone", "repository", "local setup"],
    type: "doc",
  },
  {
    id: "doc-usage",
    title: "Usage",
    category: "Documentation",
    href: "/docs/usage",
    excerpt: "How to navigate and use the payload files with Burp Suite, ffuf, and manual testing workflows.",
    tags: ["usage", "burp suite", "ffuf", "payload files", "testing workflow", "wordlist"],
    type: "doc",
  },
  {
    id: "doc-methodology",
    title: "Methodology",
    category: "Documentation",
    href: "/docs/methodology",
    excerpt: "Security testing methodology for using OWASP Hunting payloads: reconnaissance, vulnerability identification, and reporting.",
    tags: ["methodology", "security testing", "penetration testing", "bug bounty", "reconnaissance", "reporting", "owasp testing guide"],
    type: "doc",
  },
  {
    id: "doc-repository-structure",
    title: "Repository Structure",
    category: "Documentation",
    href: "/docs/repository-structure",
    excerpt: "Detailed explanation of the OWASP Hunting repository directory layout and file conventions.",
    tags: ["repository structure", "directory layout", "file structure", "payload files", "readme"],
    type: "doc",
  },
  // Static pages
  {
    id: "page-about",
    title: "About OWASP Hunting",
    category: "Project",
    href: "/about",
    excerpt: "About the OWASP Hunting project: its purpose, attribution, and responsible use guidelines.",
    tags: ["about", "owasp hunting", "project", "attribution", "responsible use", "disclaimer"],
    type: "page",
  },
  {
    id: "page-contributing",
    title: "Contributing",
    category: "Project",
    href: "/contributing",
    excerpt: "Contribution guidelines for OWASP Hunting: how to add payloads, create categories, and submit pull requests.",
    tags: ["contributing", "contribution", "pull request", "payloads", "open source", "guidelines"],
    type: "page",
  },
  {
    id: "page-changelog",
    title: "Changelog",
    category: "Project",
    href: "/changelog",
    excerpt: "OWASP Hunting project changelog and version history.",
    tags: ["changelog", "updates", "version history", "releases"],
    type: "page",
  },
  {
    id: "page-community",
    title: "Community",
    category: "Project",
    href: "/community",
    excerpt: "Community resources for OWASP Hunting: GitHub, contributors, and security research communities.",
    tags: ["community", "contributors", "github", "security research", "open source"],
    type: "page",
  },
];

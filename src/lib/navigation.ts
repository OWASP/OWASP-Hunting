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

export const PAYLOAD_NAV: NavSection[] = [
  {
    title: "Injection",
    items: [
      { title: "SQL Injection", href: "/payloads/sql-injection" },
      { title: "NoSQL Injection", href: "/payloads/nosql-injection" },
      { title: "Cross-Site Scripting", href: "/payloads/xss" },
      { title: "Command Injection", href: "/payloads/command-injection" },
      { title: "SSTI", href: "/payloads/ssti" },
      { title: "SSJI", href: "/payloads/ssji" },
      { title: "CSV Injection", href: "/payloads/csv-injection" },
      { title: "LDAP Injection", href: "/payloads/ldap-injection" },
      { title: "Log Injection", href: "/payloads/log-injection" },
      { title: "XML Injection", href: "/payloads/xml-injection" },
      { title: "XXE", href: "/payloads/xxe" },
      { title: "Prompt Injection", href: "/payloads/prompt-injection" },
      { title: "Prototype Pollution", href: "/payloads/prototype-pollution" },
    ],
  },
  {
    title: "Access Control",
    items: [
      { title: "Path Traversal", href: "/payloads/path-traversal" },
      { title: "IDOR", href: "/payloads/idor" },
      { title: "Open Redirect", href: "/payloads/open-redirect" },
    ],
  },
  {
    title: "Authentication & Authorization",
    items: [
      { title: "Authentication Bypass", href: "/payloads/authentication-bypass" },
      { title: "Password Reset", href: "/payloads/password-reset" },
      { title: "Weak Passwords", href: "/payloads/weak-passwords" },
    ],
  },
  {
    title: "Server-Side",
    items: [
      { title: "SSRF", href: "/payloads/ssrf" },
      { title: "Deserialization", href: "/payloads/deserialization" },
      { title: "File Upload", href: "/payloads/file-upload" },
      { title: "Symbolic Link Attacks", href: "/payloads/symbolic-link-attacks" },
      { title: "Timing Attacks", href: "/payloads/timing-attacks" },
    ],
  },
  {
    title: "Configuration & Design",
    items: [
      { title: "Security Misconfiguration", href: "/payloads/security-misconfiguration" },
      { title: "CORS Misconfiguration", href: "/payloads/cors-misconfiguration" },
      { title: "HTTP Request Smuggling", href: "/payloads/http-request-smuggling" },
      { title: "JWT Vulnerabilities", href: "/payloads/jwt-vulnerabilities" },
      { title: "Business Logic", href: "/payloads/business-logic" },
      { title: "Weak Cryptography", href: "/payloads/weak-cryptography" },
      { title: "Vulnerable Components", href: "/payloads/vulnerable-components" },
    ],
  },
  {
    title: "Network & Anonymity",
    items: [{ title: "Tor-Based Attacks", href: "/payloads/tor-based-attacks" }],
  },
];

export const HEADER_NAV: NavItem[] = [
  { title: "Docs", href: "/docs" },
  { title: "Payloads", href: "/payloads" },
  { title: "Contributing", href: "/contributing" },
  { title: "About", href: "/about" },
];

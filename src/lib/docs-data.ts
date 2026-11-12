export interface DocPage {
  slug: string;
  title: string;
  description: string;
  order: number;
  content: string;
}

export const DOC_PAGES: DocPage[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Introduction to OWASP Hunting: what it is, who it's for, and how to navigate the project.",
    order: 1,
    content: `# Getting Started

OWASP Hunting is a curated collection of security testing resources and payloads maintained as an open-source project under the OWASP umbrella. It provides organized, categorized payload files and documentation designed for security professionals conducting authorized testing.

## What Is OWASP Hunting?

OWASP Hunting is a payload reference repository. Each vulnerability category contains:

- A \`README.md\` explaining the vulnerability, common attack vectors, and testing methodology
- A \`payloads.txt\` file containing real-world payloads organized by technique

The project covers over 30 vulnerability classes across injection, access control, authentication, server-side vulnerabilities, configuration issues, and network-layer attacks.

## Who Is This For?

This documentation is intended for:

- **Penetration testers** conducting authorized assessments
- **Bug bounty hunters** working within program scope
- **Security engineers** building defensive controls and test suites
- **Students and researchers** learning web application security in controlled environments
- **Open-source contributors** improving the payload database

## How to Navigate This Site

- **[Documentation](/docs)**: Setup guides, methodology, and repository reference
- **[Payload Reference](/payloads)**: Browse all vulnerability categories and their payloads
- **[Contributing](/contributing)**: How to add payloads, create categories, and open pull requests
- **[About](/about)**: Project background and attribution

## Quick Links

| Resource | Description |
|---|---|
| [Upstream Repository](https://github.com/owasp/owasp-hunting) | The canonical OWASP project source |
| [Payload Index](/payloads) | All 30+ vulnerability categories |
| [Methodology](/docs/methodology) | Recommended testing workflow |
| [Repository Structure](/docs/repository-structure) | File layout explanation |

## Prerequisites

No special tooling is required to use the payload files. For hands-on testing you will need:

- An authorized target (a system you own, a bug bounty program target, or a lab environment such as DVWA or WebGoat)
- A proxy tool such as Burp Suite or OWASP ZAP
- Basic understanding of HTTP and web application architecture

## Responsible Use

All payloads and techniques in this repository are for **authorized testing only**. Review the [responsible use notice](/about#responsible-use) before proceeding.`,
  },
  {
    slug: "installation",
    title: "Installation",
    description: "How to clone and use the OWASP Hunting repository locally.",
    order: 2,
    content: `# Installation

OWASP Hunting is a flat-file repository. There is no installation process in the traditional sense: you clone the repository and navigate its directory structure directly.

## Cloning the Upstream Repository

The canonical source is the OWASP upstream repository:

\`\`\`bash
git clone https://github.com/owasp/owasp-hunting.git
cd owasp-hunting
\`\`\`

## Directory Layout

After cloning, the repository root contains one directory per vulnerability category:

\`\`\`
hunting/
├── SQL-Injection/
│   ├── README.md
│   └── sql-injection-payloads.txt
├── XSS/
│   ├── README.md
│   └── xss-payloads.txt
├── Command-Injection/
│   ├── README.md
│   └── command-injection-payloads.txt
├── SSRF/
│   ├── README.md
│   └── ssrf-payloads.txt
...
├── CONTRIBUTING.md
├── DISCLAIMER.md
├── LICENSE
└── README.md
\`\`\`

Each category directory follows the same convention:

| File | Purpose |
|---|---|
| \`README.md\` | Description, attack vectors, testing methodology |
| \`*-payloads.txt\` | The payload list, organized by technique |

## Keeping Up to Date

To pull the latest upstream changes:

\`\`\`bash
git pull origin main
\`\`\`

## No Build Step Required

Payload files are plain text. You can use them directly with:

- **Burp Suite Intruder**: load a payload file as a wordlist
- **ffuf / wfuzz**: reference the payload file with \`-w\`
- **Manual testing**: copy individual payloads from this documentation site`,
  },
  {
    slug: "usage",
    title: "Usage",
    description: "How to navigate and use the payload files in authorized security testing.",
    order: 3,
    content: `# Usage

## Navigating the Repository

Each vulnerability category is a self-contained directory. Start with the \`README.md\` for context, then use the payload file for testing.

\`\`\`bash
# Read the vulnerability overview
cat SQL-Injection/README.md

# View the payloads
cat SQL-Injection/sql-injection-payloads.txt

# Search for a specific technique
grep -i "union" SQL-Injection/sql-injection-payloads.txt
grep -i "time" SQL-Injection/sql-injection-payloads.txt
\`\`\`

## Payload File Format

Payload files are plain text with comment lines prefixed by \`#\`:

\`\`\`
# Basic SQL injection
'
''
' OR '1'='1
' OR 1=1--

# Union-based SQL injection
' UNION SELECT NULL--
' UNION SELECT NULL,NULL--
\`\`\`

Comment lines describe the technique for the block of payloads that follows.

## Using Payloads with Burp Suite

1. Open **Burp Suite** → **Intruder**
2. Mark the injection point with \`§ §\` delimiters
3. Go to **Payloads** → **Payload type: Simple list**
4. Click **Load** and select the \`.txt\` file from the repository
5. Start the attack and review responses for anomalies

## Using Payloads with ffuf

\`\`\`bash
# Fuzz a parameter with SQL injection payloads
ffuf -u "https://target.example.com/search?q=FUZZ" \\
     -w SQL-Injection/sql-injection-payloads.txt \\
     -mc 200,500 \\
     -fs 1234

# POST body fuzzing
ffuf -u "https://target.example.com/login" \\
     -X POST \\
     -d "username=FUZZ&password=test" \\
     -w SQL-Injection/sql-injection-payloads.txt \\
     -H "Content-Type: application/x-www-form-urlencoded"
\`\`\`

## Filtering Payloads

Strip comment lines for tools that expect clean wordlists:

\`\`\`bash
grep -v '^#' SQL-Injection/sql-injection-payloads.txt > sqli-clean.txt
grep -v '^#' SQL-Injection/sql-injection-payloads.txt | grep -v '^$' > sqli-clean.txt
\`\`\`

## Combining Categories

For comprehensive testing, you can concatenate relevant payload files:

\`\`\`bash
cat SQL-Injection/sql-injection-payloads.txt \\
    NoSQL-Injection/nosql-injection-payloads.txt \\
    > all-injection-payloads.txt
\`\`\`

## Working with This Documentation Site

This site provides a rendered view of the repository content. Each payload page includes:

- Structured sections with copyable payload blocks
- Testing methodology and context
- Detection and mitigation guidance
- Links back to the upstream repository files`,
  },
  {
    slug: "methodology",
    title: "Methodology",
    description: "Security testing methodology for using OWASP Hunting payloads effectively.",
    order: 4,
    content: `# Methodology

OWASP Hunting payloads are reference material for structured security assessments. This page describes a recommended workflow for integrating them into authorized testing.

## Overview

Effective security testing follows a defined process:

1. **Scope definition**: Confirm authorization and enumerate in-scope targets
2. **Reconnaissance**: Map the attack surface
3. **Vulnerability identification**: Identify injection points and potential weaknesses
4. **Payload testing**: Apply targeted payloads from the reference
5. **Validation**: Confirm exploitability with a minimal proof of concept
6. **Reporting**: Document findings with impact and remediation guidance

## 1. Scope Definition

Before any testing:

- Obtain explicit written authorization
- Review program rules or engagement scope documents
- Confirm which domains, endpoints, and functionality are in scope
- Understand out-of-scope assets and prohibited techniques

## 2. Reconnaissance

Map the application surface before testing payloads:

- Enumerate endpoints and parameters (manually and with tools like ffuf, Burp Crawler)
- Identify technology stack (web framework, database, language)
- Note input fields, file upload features, and API endpoints
- Check for JavaScript files exposing hidden endpoints

## 3. Vulnerability Identification

Match application features to vulnerability classes:

| Feature | Relevant Categories |
|---|---|
| Login forms | SQL Injection, Authentication Bypass, NoSQL Injection |
| Search / filters | SQL Injection, XSS, SSTI |
| File upload | File Upload, XXE, XSS |
| URL parameters | Path Traversal, Open Redirect, IDOR |
| Webhook / URL fetch | SSRF |
| JSON APIs | NoSQL Injection, Prototype Pollution, Deserialization |
| Auth tokens | JWT Vulnerabilities, Authentication Bypass |

## 4. Payload Testing

Select the appropriate payload category from this reference. Start with detection payloads (the simplest inputs that reveal whether the vulnerability class exists) before escalating.

Follow this order:

1. **Detection**: Submit minimal probes (e.g., a single quote for SQLi, \`{{7*7}}\` for SSTI)
2. **Confirmation**: Observe response differences, timing changes, or error messages
3. **Exploitation**: Apply targeted payloads that demonstrate real impact
4. **Escalation**: Determine the maximum impact in context

## 5. Validation

A finding is valid when you can demonstrate actual impact:

- Show data extraction (not just an error message)
- Demonstrate code execution with a safe, benign payload (e.g., \`id\`, \`whoami\`)
- Capture the full request/response chain as evidence
- Test reproducibility

## 6. Reporting

Document findings with:

- **Title**: Concise, accurate description
- **Severity**: Based on actual impact (CVSS or program severity rubric)
- **Steps to reproduce**: Exact request/response
- **Impact**: What an attacker could achieve
- **Remediation**: Specific fix recommendations

## References

- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Checklist](https://github.com/OWASP/wstg/tree/master/checklists)`,
  },
  {
    slug: "repository-structure",
    title: "Repository Structure",
    description: "Detailed explanation of the OWASP Hunting repository directory layout.",
    order: 5,
    content: `# Repository Structure

The OWASP Hunting repository uses a flat directory structure. Each vulnerability category is a top-level directory containing a README and a payload file.

## Root Level

\`\`\`
owasp-hunting/
├── Authentication-Bypass/
├── Business-Logic/
├── Command-Injection/
├── CONTRIBUTING.md
├── CONTRIBUTORS.md
├── CORS-Misconfiguration/
├── CSV-Injection/
├── Deserialization/
├── DISCLAIMER.md
├── File-Upload/
├── HTTP-Request-Smuggling/
├── IDOR/
├── JWT-Vulnerabilities/
├── LDAP-Injection/
├── LICENSE
├── Log-Injection/
├── NoSQL-Injection/
├── Open-Redirect/
├── Password-Reset/
├── Path-Traversal/
├── Prompt-Injection/
├── Prototype-Pollution/
├── README.md
├── SECURITY.md
├── SQL-Injection/
├── SSJI/
├── SSRF/
├── SSTI/
├── Security-Misconfiguration/
├── Symbolic-Link-Attacks/
├── Timing-Attacks/
├── Tor-Based-Attacks/
├── Vulnerable-Components/
├── Weak-Cryptography/
├── Weak-Passwords/
├── XML-Injection/
├── XSS/
└── scripts/
\`\`\`

## Category Directory Structure

Every vulnerability category follows the same pattern:

\`\`\`
Category-Name/
├── README.md           # Overview, vectors, testing approach
└── category-payloads.txt  # Payload list
\`\`\`

Some categories have multiple payload files:

\`\`\`
Security-Misconfiguration/
├── README.md
├── default-credentials-payloads.txt
└── misconfiguration-paths-payloads.txt
\`\`\`

## Root Files

| File | Purpose |
|---|---|
| \`README.md\` | Project overview and category index |
| \`CONTRIBUTING.md\` | Contribution guidelines |
| \`CONTRIBUTORS.md\` | Automatically maintained contributors list |
| \`DISCLAIMER.md\` | Legal disclaimer for responsible use |
| \`SECURITY.md\` | Security policy for the project itself |
| \`LICENSE\` | MIT License |

## Automation

The \`scripts/\` directory contains:

| Script | Purpose |
|---|---|
| \`check_duplicates.py\` | Validates that no duplicate payloads exist across files |

GitHub Actions workflows in \`.github/workflows/\` handle:

- Contributor recognition (auto-updating CONTRIBUTORS.md)
- Duplicate payload detection on pull requests
- Advisory and Discord notifications

## Payload File Conventions

Payload files follow these conventions:

- Plain UTF-8 text, one payload per line
- Comment blocks prefixed with \`#\` describe the technique
- Blank lines separate logical sections
- No trailing whitespace on payload lines
- Payloads are not URL-encoded unless encoding is the point of the test`,
  },
];

export function getDocPage(slug: string): DocPage | undefined {
  return DOC_PAGES.find((p) => p.slug === slug);
}

export function getAllDocSlugs(): string[] {
  return DOC_PAGES.map((p) => p.slug);
}

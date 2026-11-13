# OWASP Hunting

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Version: **1.0.1** | [Changelog](./CHANGELOG.md)

An open-source security testing and vulnerability research reference for security researchers, penetration testers, bug bounty hunters, and developers. [OWASP repository](https://github.com/OWASP/OWASP-Hunting).

![OWASP Hunting banner](.github/assets/banner.png)

> A curated reference of testing payloads, attack vectors, and methodology notes — **not** an automated scanner or exploit framework. Nothing here runs against a target on its own.

## What's inside

59 vulnerability categories, each a directory with a `README.md` (description, attack vectors, testing approach) and one or more payload or testing-reference text files.

<details>
<summary><strong>Browse all categories</strong></summary>
<br>

| Category | Group |
|---|---|
| [SQL Injection](./SQL-Injection/) | Injection |
| [NoSQL Injection](./NoSQL-Injection/) | Injection |
| [XSS](./XSS/) | Injection |
| [Command Injection](./Command-Injection/) | Injection |
| [SSTI](./SSTI/) | Injection |
| [SSJI](./SSJI/) | Injection |
| [CSV Injection](./CSV-Injection/) | Injection |
| [LDAP Injection](./LDAP-Injection/) | Injection |
| [Log Injection](./Log-Injection/) | Injection |
| [XML Injection](./XML-Injection/) | Injection |
| [Prompt Injection](./Prompt-Injection/) | Injection |
| [Prototype Pollution](./Prototype-Pollution/) | Injection |
| [CSS Injection](./CSS-Injection/) | Injection |
| [XXE](./XXE/) | Injection |
| [CRLF Injection](./CRLF-Injection/) | Injection |
| [XPath and XSLT Injection](./XPath-XSLT-Injection/) | Injection |
| [SSI and ESI Injection](./SSI-ESI-Injection/) | Injection |
| [Expression Language Injection](./Expression-Language-Injection/) | Injection |
| [Email Injection](./Email-Injection/) | Injection |
| [Path Traversal](./Path-Traversal/) | Access control |
| [IDOR](./IDOR/) | Access control |
| [Open Redirect](./Open-Redirect/) | Access control |
| [API Authorization](./API-Authorization/) | Access control |
| [Authentication Bypass](./Authentication-Bypass/) | Auth |
| [Password Reset](./Password-Reset/) | Auth |
| [Weak Passwords](./Weak-Passwords/) | Auth |
| [OAuth and OIDC](./OAuth-OIDC/) | Auth |
| [SAML Vulnerabilities](./SAML-Vulnerabilities/) | Auth |
| [Session Management](./Session-Management/) | Auth |
| [SSRF](./SSRF/) | Server-side |
| [Deserialization](./Deserialization/) | Server-side |
| [File Upload](./File-Upload/) | Server-side |
| [Symbolic Link Attacks](./Symbolic-Link-Attacks/) | Server-side |
| [Timing Attacks](./Timing-Attacks/) | Server-side |
| [Security Misconfiguration](./Security-Misconfiguration/) | Config & design |
| [CORS Misconfiguration](./CORS-Misconfiguration/) | Config & design |
| [HTTP Request Smuggling](./HTTP-Request-Smuggling/) | Config & design |
| [JWT Vulnerabilities](./JWT-Vulnerabilities/) | Config & design |
| [Business Logic](./Business-Logic/) | Config & design |
| [Weak Cryptography](./Weak-Cryptography/) | Config & design |
| [Vulnerable Components](./Vulnerable-Components/) | Config & design |
| [Cache Poisoning](./Cache-Poisoning/) | Config & design |
| [HTTP Parameter Pollution](./HTTP-Parameter-Pollution/) | Config & design |
| [Host Header Attacks](./Host-Header-Attacks/) | Config & design |
| [Subdomain Takeover](./Subdomain-Takeover/) | Config & design |
| [Information Disclosure](./Information-Disclosure/) | Config & design |
| [Type Juggling](./Type-Juggling/) | Config & design |
| [ReDoS](./ReDoS/) | Config & design |
| [Supply Chain and CI/CD](./Supply-Chain-CI-CD/) | Config & design |
| [Cloud and Container Security](./Cloud-Container-Security/) | Config & design |
| [CSRF](./CSRF/) | Browser & protocol |
| [GraphQL Security](./GraphQL-Security/) | Browser & protocol |
| [WebSocket Security](./WebSocket-Security/) | Browser & protocol |
| [XS-Leaks](./XS-Leaks/) | Browser & protocol |
| [DOM-Based Attacks](./DOM-Based-Attacks/) | Browser & protocol |
| [Clickjacking](./Clickjacking/) | Browser & protocol |
| [SOAP and gRPC Security](./SOAP-gRPC-Security/) | Browser & protocol |
| [Mobile Deep Links](./Mobile-Deeplinks/) | Browser & protocol |
| [Tor-Based Attacks](./Tor-Based-Attacks/) | Network |

</details>

## Getting started

```bash
git clone https://github.com/OWASP/OWASP-Hunting.git
cd OWASP-Hunting
cat SQL-Injection/README.md
grep -r "onerror=" XSS/xss-payloads.txt
```

No build or install step — it's plain Markdown and text files. Read a category's `README.md` first; it gives the context the payload list assumes.

Text files retain the existing comment-and-payload format. Some entries are single inputs; others are protocol fragments, escaped HTTP bytes, browser fixtures or commented multi-request sequences. Use each section in its stated context rather than loading every file as a one-line wordlist. Replace lab placeholders with values from systems you control, preserve byte-sensitive framing, and verify the stated expected result. Reference examples are not claims that every target, browser or library is vulnerable.

## Contributing

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** — workflow, payload standards, PR requirements, and the [AI-assisted contribution policy](./CONTRIBUTING.md#ai-assisted-contributions). This project does not run any AI provider internally; the policy covers contributor AI use only.

## Responsible use

For **authorized testing only** — systems you own, systems with explicit written permission, in-scope bug bounty programs, or controlled educational labs. Never against systems you're not authorized to test. See [DISCLAIMER.md](./DISCLAIMER.md) for full terms, and [SECURITY.md](./SECURITY.md) to report a security issue in this repo.

## License

MIT — see [LICENSE](./LICENSE). Copyright OWASP.

## Resources

[Project repository](https://github.com/OWASP/OWASP-Hunting) · [OWASP Top 10](https://owasp.org/www-project-top-ten/) · [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x00-header/) · [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

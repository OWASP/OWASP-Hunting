# Information Disclosure

## Description
Information disclosure is the unintended exposure of source code, credentials, internal paths, configuration, version data, personal data or debugging output. By itself it is often low severity, but exposed secrets, source maps, VCS metadata and backups frequently lead directly to account or infrastructure compromise. This category collects the paths, headers and errors worth probing. For default paths and credentials also see `Security-Misconfiguration/`.

## Common Attack Vectors
- Exposed version-control metadata: `.git`, `.svn`, `.hg`
- Backup, temporary and editor files; archived source (`.zip`, `.tar.gz`, `.bak`, `~`, `.swp`)
- Environment and configuration files: `.env`, `config.php.bak`, `appsettings.json`, `web.config`
- JavaScript source maps and bundled secrets
- Debug endpoints, framework actuators, profilers and status pages
- API documentation, GraphQL introspection and schema files
- Verbose errors and stack traces; directory listing; user enumeration through messages and timing
- Response headers and HTML comments revealing versions and internal hosts
- Cloud storage and CI artifacts left public

## Testing Approach
Probe from a small, polite wordlist and read the status, size and content type of every hit. A real finding contains sensitive data, not just a 200 for a path that returns the home page (soft-404). Verify by checking that the content is what the path suggests: a `.git/HEAD` containing `ref:`, a `.env` with `KEY=value` lines. Report credentials as exposed without using them. Rate-limit your requests and stay within scope.

## Payloads
See `information-disclosure-payloads.txt`. Paths are relative to the application root and common sub-paths.

## References
- [OWASP WSTG: Information Gathering](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP A05:2021 Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [CWE-200: Exposure of Sensitive Information](https://cwe.mitre.org/data/definitions/200.html)

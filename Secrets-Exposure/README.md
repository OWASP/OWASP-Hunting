# Secrets and API-Key Exposure

## Description
Credentials, tokens and keys leak through client-side JavaScript and source maps, public repositories and their history, build artifacts, container layers, mobile app packages, logs and error pages. A leaked secret often gives direct access to a cloud account, a database, a payment or messaging provider, or an internal API, so exposure is high impact even when the bug itself is simple. This category lists detection patterns and search commands, not credentials.

## Common Attack Vectors
- Secrets embedded in bundled JavaScript, source maps and HTML comments
- Configuration and environment files, backups and VCS history exposed on the web
- Committed keys in repositories, forks, gists, issues and CI logs
- Keys in mobile apps, desktop installers and container image layers
- Verbose errors and debug pages that print connection strings and tokens
- Pre-signed URLs and tokens with excessive lifetime or scope
- Third-party secrets in public API documentation and Postman collections

## Testing Approach
Collect JavaScript, source maps and public repository content within your scope, then search with the patterns here. Treat every match as a lead and confirm the format and context by reading the code around it. Do not use a discovered credential beyond the minimum your program allows to show that it is live (many programs prohibit any use); never access customer data, never copy secrets into reports in full, and redact all but the first few characters. Report the location, the type, the exposure period if known, and the rotation advice. Rotate a secret as soon as it has been found.

## Payloads
See `secrets-exposure-patterns.txt` for regular expressions, search commands and exposure locations. The file contains patterns and formats only; it must not contain real or realistic-looking credentials.

## References
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [OWASP A07:2021 Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- [CWE-798: Use of Hard-coded Credentials](https://cwe.mitre.org/data/definitions/798.html)

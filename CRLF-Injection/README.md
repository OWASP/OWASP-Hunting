# CRLF Injection and HTTP Header Injection

## Description
CRLF injection happens when untrusted input containing carriage-return and line-feed characters (`\r\n`, `%0d%0a`) is written into an HTTP response header, a redirect `Location`, a log line, an email header or a raw protocol stream. The attacker can add headers, set cookies, split a response, or inject a body. Many frameworks now reject bare CR/LF in header values, but custom proxies, older stacks, URL parsers and non-HTTP protocols still fail.

## Common Attack Vectors
- Reflected parameters in `Location`, `Set-Cookie`, `Content-Disposition` and custom response headers
- Redirect and language/locale parameters (`?lang=`, `?next=`, `?return=`)
- Header-to-header propagation through proxies and `X-Forwarded-*` handling
- Request splitting against HTTP/1.1 clients in SSRF paths (URL host, path or user-info containing CRLF)
- Unicode characters that normalise or truncate to CR/LF (`%E5%98%8A%E5%98%8D`)
- Email, SMTP, IMAP, Redis and Memcached text protocols reached through SSRF or injection (see `Email-Injection/` and `SSRF/`)
- Log forging (see `Log-Injection/`)

## Testing Approach
Inject a harmless marker header (`X-Injected: crlf-marker`) and check whether it appears in the response headers or on a downstream hop, not just reflected in the body. Test every encoding the stack might decode once: raw, single URL-encoded, double URL-encoded, and Unicode forms. Inspect the raw response in a proxy; browsers hide split headers. Confirm that a cookie set through injection actually reaches the browser jar before reporting session fixation. For response splitting, verify against a fixture because modern servers normally block it.

## Payloads
See `crlf-injection-payloads.txt`. Each line is an independent value to place in a parameter, path segment or header. Replace `app.example.test` with a controlled host.

## References
- [OWASP: CRLF Injection](https://owasp.org/www-community/vulnerabilities/CRLF_Injection)
- [CWE-93: Improper Neutralization of CRLF Sequences](https://cwe.mitre.org/data/definitions/93.html)
- [CWE-113: HTTP Response Splitting](https://cwe.mitre.org/data/definitions/113.html)

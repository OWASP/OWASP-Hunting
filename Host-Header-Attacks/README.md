# Host Header Attacks

## Description
Applications and intermediaries often trust the `Host` header, or related headers such as `X-Forwarded-Host`, to build absolute URLs, route requests, select virtual hosts and make cache keys. When the value is attacker-controlled, the result can be password-reset poisoning, web cache poisoning, routing to internal virtual hosts, SSRF through reverse proxies, and authentication or access-control bypass.

## Common Attack Vectors
- Password reset and email-verification links built from the request host
- Absolute URLs in redirects, canonical tags, `<base>` elements and generated scripts
- Duplicate or overridden host headers (`Host`, `X-Forwarded-Host`, `X-Host`, `Forwarded`)
- Absolute-form request lines that disagree with the `Host` header
- Virtual-host routing to admin, staging or internal applications
- Reverse proxies that forward the request line to an upstream chosen from the host
- Host-based cache keys and CORS or CSRF origin checks

## Testing Approach
Use a host you control (an OAST domain) so any outbound link or DNS/HTTP interaction is attributable. Change one header at a time and diff the response and any email sent to a test account. For reset poisoning, trigger the reset for your own account and inspect the link in the delivered email, not just the HTTP response. Test duplicate headers, absolute-URL request lines and port or path suffixes on the host. For routing issues, enumerate virtual hosts with candidates from certificates and DNS. Keep cache tests on a unique cache key or a fixture you own.

## Payloads
See `host-header-payloads.txt`. Lines are header fragments or raw request-line fragments for a proxy, not complete requests. Replace `app.example.test` and `oast.example.test` with controlled hosts.

## References
- [PortSwigger: HTTP Host header attacks](https://portswigger.net/web-security/host-header)
- [OWASP WSTG: Testing for Host Header Injection](https://owasp.org/www-project-web-security-testing-guide/)
- [RFC 9110: HTTP Semantics, Host and :authority](https://www.rfc-editor.org/rfc/rfc9110.html)

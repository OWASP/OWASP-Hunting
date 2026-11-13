# WAF and Filter Bypass

## Description
Web application firewalls and input filters inspect requests with rules and parsers that often differ from the application's own parsing. Bypasses exploit the mismatch: a different view of encoding, body structure, HTTP framing or path normalisation, or a body too large to inspect. This category collects cross-cutting evasion techniques and fingerprinting. For class-specific bypass strings also see the SQL-Injection, XSS, Command-Injection and Path-Traversal categories.

## Common Attack Vectors
- Encoding differences: double URL encoding, Unicode, overlong UTF-8, HTML entities, mixed case
- Body and framing differences: chunked transfer encoding, multipart boundaries, content-type and charset tricks, oversized bodies
- Parameter handling: duplicate parameters, JSON/XML switching, parameter splitting (see `HTTP-Parameter-Pollution/`)
- Path normalisation: dot segments, semicolons, double slashes and encoded separators
- Origin access that skips the WAF (direct IP, alternative hostnames, internal services)
- Rule gaps: missing methods, headers, cookies and JSON keys that are not inspected
- HTTP/2 and HTTP/3 handling and protocol-level desynchronisation (see `HTTP-Request-Smuggling/`)

## Testing Approach
Fingerprint the product first (response headers, block pages, cookies, timing). Then send a minimal blocked probe and change one property at a time to find which element the rule depends on: encoding, position (parameter, header, cookie, JSON key), body size and content type. Test only systems you are authorised to test, and report the rule gap and its fix (virtual patch and application-level validation) instead of relying on the WAF as the control. Bypassing a WAF is not a vulnerability by itself; show the underlying flaw it was hiding.

## Payloads
See `waf-bypass-payloads.txt` for fingerprints, transformation fragments and per-class examples. Replace `example.test` hosts and parameters with the target's.

## References
- [OWASP: Web Application Firewall](https://owasp.org/www-community/Web_Application_Firewall)
- [OWASP ModSecurity Core Rule Set](https://coreruleset.org/)
- [OWASP Virtual Patching Best Practices](https://owasp.org/www-community/Virtual_Patching_Best_Practices)

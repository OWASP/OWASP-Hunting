# Server-Side Includes (SSI) and Edge Side Includes (ESI) Injection

## Description
SSI directives are evaluated by web servers such as Apache and nginx (with SSI enabled) when a response contains `<!--#...-->` tags. ESI tags (`<esi:...>`) are evaluated by caches and CDNs such as Varnish, Akamai, Fastly and Squid. If user input reaches a response that is later processed by one of these engines, the attacker may read files, run commands (SSI `exec`), make server-side requests (ESI `include`), steal HttpOnly cookies or bypass XSS filters.

## Common Attack Vectors
- Reflected or stored input in `.shtml`, `.stm` and `.shtm` pages, or SSI-enabled directories
- Input reflected into cached responses processed by an ESI-capable proxy or CDN
- Error pages and 404 pages that echo the path
- File upload that allows `.shtml` extensions
- Hybrid chains: XSS that is blocked by the browser filter but accepted as ESI, and SSRF through `esi:include`

## Testing Approach
Inject a harmless directive such as `<!--#echo var="DATE_LOCAL" -->` and `<esi:include src="http://oast.example.test/esi" />`. Evidence of SSI is an expanded date or variable; evidence of ESI is an out-of-band request from the cache or CDN, or an error mentioning ESI. Identify the ESI implementation (response headers like `Surrogate-Control` and `Surrogate-Capability`) before testing function sets. Do not use `exec` on systems you do not own.

## Payloads
See `ssi-esi-payloads.txt`. Replace `oast.example.test` with a controlled host.

## References
- [OWASP: Server-Side Includes (SSI) Injection](https://owasp.org/www-community/attacks/Server-Side_Includes_(SSI)_Injection)
- [Apache mod_include](https://httpd.apache.org/docs/current/mod/mod_include.html)
- [W3C ESI Language Specification 1.0](https://www.w3.org/TR/esi-lang/)

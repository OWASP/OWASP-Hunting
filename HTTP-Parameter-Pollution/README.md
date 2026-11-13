# HTTP Parameter Pollution (HPP)

## Description
HTTP Parameter Pollution sends the same parameter more than once, or in several locations, and exploits disagreement about which value wins. A WAF, a front-end validation layer and a back-end framework often pick different values (first, last, array, concatenated). The mismatch can bypass validation, change authorisation decisions, override signed values, alter downstream requests, or poison server-side API calls.

## Common Attack Vectors
- Query string, form body and JSON key duplication
- Parameters supplied in both the URL and the body
- Array-style notation (`a[]=1&a[]=2`) and framework coercion
- Delimiter differences (`&`, `;`, `,`) and encoded separators
- Server-side parameter pollution: user input embedded into an internal API call or query string
- Signature or HMAC validation bypass through parameter order
- Mass assignment and parameter-name case differences
- OAuth `redirect_uri`, `scope` and `state` duplication

## Testing Approach
Find the framework and its duplicate-parameter rule (PHP takes the last, ASP.NET joins with commas, JSP/Servlet takes the first, Node/Express may produce arrays). Add a second copy of an accepted parameter and observe which value is used. Then probe the WAF-versus-application difference: put the benign value first and the test value last, and the reverse. For server-side pollution, inject encoded `&`, `#`, `=` and `../` characters into a value that is passed to an internal request and watch for behavioural changes. Use harmless markers and a test account.

## Payloads
See `http-parameter-pollution-payloads.txt`. Lines are query, body or URL fragments; apply them to a parameter that your target accepts.

## References
- [OWASP WSTG: Testing for HTTP Parameter Pollution](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger: Server-side parameter pollution](https://portswigger.net/web-security/api-testing/server-side-parameter-pollution)
- [CWE-235: Improper Handling of Extra Parameters](https://cwe.mitre.org/data/definitions/235.html)

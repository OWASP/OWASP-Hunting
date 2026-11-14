# Regular Expression Denial of Service (ReDoS)

## Description
ReDoS exploits regular expressions that backtrack exponentially or polynomially on crafted input. A single request can pin a CPU core for seconds or minutes and, on single-threaded runtimes such as Node.js, block every other request. Typical causes are nested quantifiers, overlapping alternation and unbounded repetition followed by a failing suffix.

## Common Attack Vectors
- Validation patterns for email, URL, username, date and password fields
- WAF and routing rules, input sanitisers and Markdown/HTML parsers
- Server-side search, filtering and log-processing patterns
- User-supplied regular expressions (search, rule and filter features)
- Client-side validation in the browser (impacts only the user, but can be chained)
- Regexes inside dependencies (look at CVEs in npm, PyPI and RubyGems libraries)

## Testing Approach
Find the regex or the feature that uses one. Send increasing input lengths (for example 10, 20, 30, 40 repetitions) and measure response time; exponential growth is the signature. Always use a small cap and a unique request marker, and test only against systems you own because this class degrades availability. Use static analysers (`safe-regex`, `rxxr2`, `recheck`) on a regex in source you are allowed to read. Report the pattern, the input family and the measured time curve.

## Payloads
See `redos-payloads.txt` for input families that trigger classic vulnerable patterns, and generation commands. Use short lengths and stop at the first clear slowdown.

## References
- [OWASP: Regular expression Denial of Service - ReDoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
- [OWASP Cheat Sheet: Denial of Service](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [CWE-1333: Inefficient Regular Expression Complexity](https://cwe.mitre.org/data/definitions/1333.html)

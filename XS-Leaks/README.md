# Cross-Site Leaks (XS-Leaks)

## Description
XS-Leaks infer otherwise unreadable cross-origin state through observable browser behavior such as load events, timing, framing and window relationships. The leak must distinguish a protected state, not merely identify that a URL exists.

## Common Attack Vectors
- Resource load/error differences
- Cache and response timing differences
- Frame counts and window references
- Cross-origin framing and navigation behavior
- Redirect-dependent state differences
- Origin isolation and resource embedding policy gaps

## Testing Approach
Build a controlled target with two known states containing synthetic data and a separate probe origin. Use the same browser/version, network conditions and cookie policy for both controls. Repeat small, bounded samples, randomize state order and compare distributions before attributing a timing difference to secret state. Most snippets below are independent fixtures, not universally working leaks.

Browser restrictions may suppress events, timing details, cookies or frame access. That is a valid negative result. Resource Timing fields require the relevant Timing-Allow-Origin permissions; missing detail is not evidence of secret data. Do not use CORS access to read a response and call that an XS-Leak. Demonstrate the protected inference without reading the response body.

## Payloads
See `xs-leaks-payloads.txt` for browser snippets and test sequences. Replace the local fixture routes and select one probe at a time. Window creation may require a user gesture. Console output uses synthetic markers only.

## References
- [XS-Leaks Wiki](https://xsleaks.dev/)
- [OWASP XS Leaks Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XS_Leaks_Cheat_Sheet.html)

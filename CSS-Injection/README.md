# CSS Injection

## Description
CSS injection occurs when untrusted input becomes stylesheet syntax, a declaration, selector or style attribute. Impact depends on the sink, browser, CSP and accessible DOM data; stylesheet control does not automatically execute JavaScript.

## Common Attack Vectors
- Inline style attributes and declaration values
- Stylesheet rule and selector construction
- External imports and URL-bearing properties
- Attribute-selector conditional resource loads
- Custom properties used in security-sensitive styling
- CSS sanitization and HTML style-element boundaries

## Testing Approach
Identify the exact sink first. Use a visible outline/color marker and inspect the computed style. For conditional loads, build a local page with a synthetic `data-css-lab` attribute and a controlled same-lab collector. Test only one known marker, not real passwords, tokens or hidden account data. A selector can only match attributes actually present in the DOM; it does not generally read live input properties or arbitrary application memory.

Use browser network logs to verify requests. CSP style-src and img-src, rendering conditions, blocked mixed content and unsupported CSS affect whether examples work. Imports must appear in a valid stylesheet position. An HTML breakout belongs to XSS only when the actual HTML sink permits it and execution is demonstrated.

## Payloads
See `css-injection-payloads.txt` for independent stylesheet, declaration and HTML-boundary fixtures. Select the section matching the insertion context. The `.example.test` URLs require locally configured DNS and a collector under the tester's control.

## References
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CSS Syntax Specification](https://www.w3.org/TR/css-syntax-3/)
- [Content Security Policy Specification](https://www.w3.org/TR/CSP3/)

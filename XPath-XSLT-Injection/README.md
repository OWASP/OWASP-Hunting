# XPath and XSLT Injection

## Description
XPath injection occurs when user input is concatenated into an XPath query against an XML data store, allowing authentication bypass and data extraction. XSLT injection occurs when input reaches a stylesheet or a transformation engine, which can lead to file read, SSRF and, with extension functions enabled, code execution. XQuery injection is closely related. These are distinct from XML injection in `XML-Injection/` and XXE in `XXE/`.

## Common Attack Vectors
- Login forms and search fields backed by XML documents
- SOAP and legacy enterprise services that query XML stores
- Report, invoice and document generators that apply XSLT stylesheets
- Applications that accept a user-supplied stylesheet or `<?xml-stylesheet?>` reference
- XQuery, XSLT 2.0/3.0 and `eval` or extension functions (Saxon, Xalan, libxslt)

## Testing Approach
For XPath, send a single quote or double quote and look for parser errors. Then use boolean differences (`' or '1'='1` vs `' and '1'='2`) to confirm injection. Use `substring`, `string-length` and `count` for blind extraction one character at a time. For XSLT, identify the processor with `system-property('xsl:vendor')` and `system-property('xsl:version')` and test `document()` and `unparsed-text()` for file read. Keep tests read-only and stop once the vendor or a harmless file is read.

## Payloads
See `xpath-xslt-payloads.txt`. Replace `oast.example.test` with a controlled host.

## References
- [OWASP: XPath Injection](https://owasp.org/www-community/attacks/XPATH_Injection)
- [OWASP WSTG: Testing for XPath Injection](https://owasp.org/www-project-web-security-testing-guide/)
- [W3C XPath 3.1](https://www.w3.org/TR/xpath-31/)

# XML External Entity (XXE) Injection

## Description
XXE occurs when an XML parser resolves attacker-controlled DTDs, entities or external resources. Impact ranges from local file disclosure and SSRF to denial of service and, in some parser/language combinations, code execution. XXE is distinct from general XML injection (see `XML-Injection/`) because the bug lives in parser configuration, not in how a document is built.

## Common Attack Vectors
- XML request bodies (SOAP, XML-RPC, REST endpoints that accept `application/xml` or `text/xml`)
- Content-type switching: JSON endpoints that also parse XML when the header is changed
- File formats that are XML inside a ZIP: DOCX, XLSX, PPTX, ODT, EPUB
- SVG, RSS/Atom, SAML, SOAP, XMP metadata and sitemap uploads or imports
- XInclude and XSLT features when the application cannot control the whole document
- Parameter entities for blind, out-of-band and error-based exfiltration

## Testing Approach
Start with a benign internal entity (`<!ENTITY t "xxe-marker">`) and confirm that the response reflects it. If entities expand, move to an out-of-band callback on infrastructure you control before attempting any file read. For blind cases use a hosted DTD and parameter entities. Read only harmless, well-known files (`/etc/hostname`, `win.ini`) and stop once resolution is proven. Test the same body with a changed `Content-Type`, and unpack Office/SVG fixtures to edit the XML parts. Parsers differ: Java, PHP (libxml), .NET, Python (lxml) and Ruby (Nokogiri) have different defaults, so record the parser if known.

## Payloads
See `xxe-payloads.txt` for entity detection, file read, SSRF, blind and out-of-band, XInclude, file-format and denial-of-service fixtures. Payloads are independent cases. Replace `oast.example.test` and `app.example.test` with systems you control.

## References
- [OWASP XXE Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html)
- [OWASP Web Security Testing Guide: XML Injection](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger Web Security Academy: XXE](https://portswigger.net/web-security/xxe)

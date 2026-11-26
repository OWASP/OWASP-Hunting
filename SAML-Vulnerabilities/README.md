# SAML Vulnerabilities

## Description
SAML implementation flaws arise when a service provider consumes an assertion that was not correctly signed, bound to its request, intended for its audience, or still valid. XML structure and signature verification must refer to the same assertion.

## Common Attack Vectors
- Response and assertion signature enforcement
- XML signature wrapping and duplicate ID handling
- Issuer, audience, destination and recipient validation
- InResponseTo binding and unsolicited responses
- Assertion replay, expiry and authentication context
- Untrusted certificates and metadata
- RelayState validation

## Testing Approach
Use a local identity provider, a service provider and two test identities. Capture a valid response as the positive control. Change one field at a time. Structural or signature mutations should fail verification; use the trusted lab identity provider to re-sign claim mutations when testing downstream claim validation. XML fragments in the payload file replace matching elements in that captured response; they are not complete signed assertions. Base64-encode the complete XML for HTTP-POST binding and URL-encode form values. Redirect binding additionally requires the correct binding-specific compression and signature handling.

For wrapping tests, verify that the application consumes the same assertion that the signature verified. A parse error, a login page or an HTTP 200 alone proves no bypass. Record the resulting test identity and rejection reason. Replay a captured test assertion twice within its validity window and verify single-use enforcement where required. Never reuse real users' assertions.

## Payloads
See `saml-vulnerabilities-payloads.txt` for element replacements and bounded request sequences. Replace lab URLs, timestamps and IDs with values from the fixture. Unsigned examples are negative controls, not signature bypasses.

## References
- [OWASP SAML Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html)
- [OASIS SAML 2.0 Specifications](https://docs.oasis-open.org/security/saml/v2.0/)

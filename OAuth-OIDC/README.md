# OAuth and OpenID Connect (OIDC)

## Description
OAuth/OIDC vulnerabilities arise when authorization responses, tokens or linked identities are not bound to the correct client, issuer, user session and redirect destination. OAuth authorization and OIDC authentication have different token and validation requirements.

## Common Attack Vectors
- State and nonce binding
- PKCE enforcement and downgrade behavior
- Authorization-code reuse and client binding
- Redirect URI validation
- Issuer mix-up and ID-token audience validation
- Account linking and identity collisions
- Refresh-token rotation and revocation

## Testing Approach
Provision two test users, two clients and a controlled authorization server. Capture a working authorization-code flow and mutate one parameter at a time. Query strings below are fragments for the authorization endpoint; token bodies are form-encoded replacements. Substitute registered lab identifiers and freshly issued test values. Omission of state is not itself proof of a flaw when another correct CSRF defense binds the flow.

Verify the logged-in subject, issuer, client and granted scope after each operation. Reusing an authorization code should fail. A verifier mismatch must fail for a PKCE-bound code. Account-link tests require explicit confirmation and a recent session according to application policy. Use JWT-Vulnerabilities for claim-level token fixtures and Session-Management for lifecycle sequences.

## Payloads
See `oauth-oidc-payloads.txt` for parameter variants and two-session sequences. Placeholder codes and tokens must be replaced only with locally issued lab values.

## References
- [OWASP OAuth2 Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
- [OAuth 2.0 Security Best Current Practice, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)

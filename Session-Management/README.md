# Session Management

## Description
Session management binds browser state and tokens to an authenticated identity over time. Testing must cover rotation, expiry, logout, recovery, privilege changes and refresh-token reuse rather than only token shape.

## Common Attack Vectors
- Session fixation across authentication and step-up
- Logout and global revocation
- Idle versus absolute expiry
- Refresh-token rotation and reuse
- Concurrent sessions and device removal
- Cookie scope, duplicate names and transport precedence
- Recovery, password change and privilege transitions

## Testing Approach
Use two browser profiles and locally issued test sessions. Capture token identifiers privately and compare rotation without committing real values. The payload file contains placeholders, endpoint templates and sequences; it is not a password list. Use the fixture clock to test expiry instead of waiting or generating traffic.

Verify authorization through a fresh server request after every lifecycle event. Browser back navigation and cached content do not prove a revoked server session still works. Immediate access-token invalidation is deployment-dependent: document the promised revocation policy and distinguish short-lived stateless access tokens from server sessions and refresh tokens. Treat cookie flags as controls whose actual consequences need browser validation.

## Payloads
See `session-management-payloads.txt` for lifecycle sequences, token-placement controls and harmless preference requests. Use OAuth-OIDC for flow binding and JWT-Vulnerabilities for signed claim validation.

## References
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP OAuth2 Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)

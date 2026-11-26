# JWT (JSON Web Token) Vulnerabilities

## Description
JWT vulnerabilities occur when JSON Web Tokens are improperly implemented or validated, allowing attackers to forge tokens, escalate privileges, or bypass authentication mechanisms. JWTs are widely used for authentication and authorization in modern web applications.

## Common Vulnerabilities
- **None Algorithm** - Setting `alg` to `none` to bypass signature verification
- **Algorithm Confusion** - Switching from RS256 to HS256
- **Weak Secret Key** - Using weak or default secrets for HMAC
- **Key Injection** - Injecting public key in JWK header
- **Token Expiration** - Missing or improper `exp` validation
- **SQL Injection in Claims** - Injecting SQL in JWT claims
- **XSS in Claims** - Storing and reflecting XSS payloads in JWT

## JWT Structure
```
header.payload.signature
```
- **Header**: Contains algorithm and token type
- **Payload**: Contains claims (user data)
- **Signature**: Cryptographic signature

## Common Attack Vectors
- Authentication endpoints
- Authorization headers
- Cookie-based JWT storage
- URL parameters with JWT
- Local/Session storage

## Impact
- Authentication bypass
- Privilege escalation
- Account takeover
- Access to unauthorized resources
- Identity spoofing

## Testing Approach
1. Decode the JWT to examine header and payload
2. Test with `alg: none` in header
3. Test algorithm confusion (RS256 → HS256)
4. Brute force weak secrets
5. Modify claims (user ID, role, permissions)
6. Test token expiration validation
7. Check for sensitive data exposure in payload

## Payloads
See `jwt-vulnerabilities-payloads.txt` for a comprehensive list of JWT attack payloads.

## Additional Payloads
See `claim-lifecycle-payloads.txt` for issuer/audience/type claim replacements, key-selection headers and replay/revocation request variants. Select the section matching the target input context. Claim replacements require a token signed by the lab issuer; compare acceptance against the documented issuer, audience and lifecycle policy.

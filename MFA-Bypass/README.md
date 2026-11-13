# Multi-Factor Authentication (2FA/MFA) Bypass

## Description
Multi-factor authentication fails when the second factor is not enforced consistently, can be guessed or reused, or can be skipped by changing state, endpoints or client-side values. Most real bypasses are logic flaws around the verification step (the code check itself is usually sound): the session is already usable before the code is checked, the verification endpoint is not rate limited, or a recovery or alternate login path skips the factor entirely.

## Common Attack Vectors
- Direct navigation to post-login pages or API endpoints with a half-authenticated (password-only) session
- Response manipulation: the client trusts a `success`, `mfa_required` or status value
- Missing or weak rate limiting on the code verification and resend endpoints
- Predictable, reusable, long-lived or non-session-bound codes; the code is returned in the response
- Alternate paths that skip the factor: OAuth/SSO login, API keys, legacy or mobile endpoints, password reset, account recovery and "remember this device"
- Race conditions on verification and on enrolment
- Backup and recovery codes without limits; factor enrolment or removal without re-authentication
- Downgrade between factors (WebAuthn to SMS, TOTP to email)

## Testing Approach
Use two accounts you own. Log in with the password only and record which endpoints already work before the second factor is accepted. Then test the verification endpoint: wrong, empty, repeated, previously used and expired codes; array and object values; and whether failures are counted per account, per session and per IP. Compare the web, mobile and API entry points, and any SSO or reset flow, for the same account. Do not brute-force codes against accounts you do not own, and stop as soon as a bypass is proven.

## Payloads
See `mfa-bypass-payloads.txt` for parameter variants, response edits, state and endpoint tests, race fixtures and recovery-flow checks. Replace endpoint names and parameter names with the target's.

## References
- [OWASP Multifactor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- [OWASP WSTG: Testing Multi-Factor Authentication](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE-308: Use of Single-factor Authentication](https://cwe.mitre.org/data/definitions/308.html)

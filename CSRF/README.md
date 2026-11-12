# Cross-Site Request Forgery (CSRF)

## Description
CSRF occurs when a browser sends ambient credentials with a cross-site request and the application accepts an unauthorized state change. CORS response readability is not required for a CSRF attack.

## Common Attack Vectors
- HTML forms and state-changing GET endpoints
- Missing, reused or incorrectly session-bound CSRF tokens
- Login CSRF and account-linking flows
- Simple content types accepted by JSON endpoints
- Origin/Referer validation and SameSite cookie behavior
- Method overrides and double-submit cookie implementations

## Testing Approach
Use two controlled accounts and a separate test origin. Start with a harmless profile-preference change and verify persisted state in a fresh authenticated read. Run browser fixtures from the separate origin; a proxy replay does not establish that a browser will send the same cookies or headers. Check SameSite and third-party cookie behavior in the browser under test. Origin and Referer header fragments are proxy controls; JavaScript cannot freely set these forbidden headers.

Capture a valid request first, then omit or mutate its CSRF defenses individually. A missing token is a finding only when an unauthorized browser-triggered action succeeds. For double-submit cookies, separately assess whether an attacker can set the cookie used in the comparison. Never change recovery addresses, passwords or real payment details.

## Payloads
See `csrf-payloads.txt` for browser HTML fixtures, token mutations, content-type variants and request sequences. Adapt endpoint names and test account values; these are independent cases, not one HTML document or a universal wordlist.

## References
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

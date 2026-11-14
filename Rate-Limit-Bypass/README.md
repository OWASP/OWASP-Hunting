# Rate-Limit, Brute-Force and CAPTCHA Bypass

## Description
Rate limiting, account lockout and CAPTCHA protect login, reset, verification, search and expensive API endpoints from brute force, enumeration and abuse. They are weak when the limit key is attacker-controlled (client IP headers, account identifier spelling), when the same action is reachable through several routes, or when the counter resets unexpectedly. This category lists the variations used to test whether the limit really holds.

## Common Attack Vectors
- Client-IP headers trusted for the limit key (`X-Forwarded-For` and similar)
- Endpoint aliases: path case, trailing characters, encodings and API versions that map to the same handler but a different counter
- Parameter noise and account-identifier variants: email case, plus-addressing, whitespace and Unicode forms
- Counter resets by a successful login, a password change or a new session
- Batching inside one request: GraphQL aliases, JSON arrays, multi-part bodies
- Concurrent requests that all pass the check before the counter increments
- CAPTCHA parameters that can be omitted, reused, replayed or set to a fixed value; a CAPTCHA enforced on the web form but not on the API
- Limits applied per node and not globally

## Testing Approach
Establish the baseline: how many failed attempts are accepted, what the block response looks like, and how long it lasts. Then change one variable at a time (header, path, case, method, content type) and see whether the counter restarts. Use test accounts and a small cap; the goal is to show that the limit can be evaded, not to attack real accounts or exhaust a service. For CAPTCHA, test removal, reuse, empty and stale tokens, and whether an alternative client or endpoint skips it.

## Payloads
See `rate-limit-bypass-payloads.txt` for header, path, identifier, batching and CAPTCHA tests. Replace example hosts and parameter names with the target's.

## References
- [OWASP API Security Top 10: Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)
- [OWASP Blocking Brute Force Attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

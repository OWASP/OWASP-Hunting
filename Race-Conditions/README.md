# Race Conditions

## Description
A race condition occurs when the outcome of an operation depends on the timing of concurrent requests. In web applications the common form is limit overrun: a check ("has this coupon been used?") and the update that enforces it ("mark as used") are not atomic, so many parallel requests pass the check before any of them updates the state. Related flaws include time-of-check to time-of-use on files and tokens, multi-step state confusion, and partial construction of objects. See also `Business-Logic/workflow-race-payloads.txt`.

## Common Attack Vectors
- Redeeming a coupon, gift card or single-use token more than once
- Withdrawing, transferring or spending beyond a balance or limit
- Voting, liking, rating and invite acceptance beyond the intended count
- Bypassing rate limits, lockouts and MFA attempt counters
- Email-change and password-reset confirmation races (a token bound to the wrong account)
- Registration races that create duplicate accounts or claim the same username
- Race between an upload and its validation or deletion
- Session, cart and checkout state changes between price calculation and payment

## Testing Approach
Identify an operation that must happen at most once and has a visible counter or balance. Send a baseline request, then send many identical requests as simultaneously as possible and check the final state, not the individual responses. HTTP/2 single-packet delivery and HTTP/1.1 last-byte synchronisation remove network jitter. Warm up connections first and, where possible, use sessions that are cheap to create. Use test accounts, small values and reversible actions; stop once a duplicate effect is shown.

## Payloads
See `race-conditions-payloads.txt` for concurrent-request commands, tool scripts and scenario fixtures. Replace endpoints and parameters with the target's.

## References
- [PortSwigger: Race conditions](https://portswigger.net/web-security/race-conditions)
- [OWASP WSTG: Testing for Race Conditions](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization](https://cwe.mitre.org/data/definitions/362.html)

# Clickjacking (UI Redressing)

## Description
Clickjacking tricks a user into clicking a control in a framed, transparent or disguised page. The user believes they are interacting with the attacker's page, while the click lands on a state-changing action in an authenticated application. Variants include cursor, drag-and-drop, keystroke and likejacking techniques. Defences are `X-Frame-Options`, the CSP `frame-ancestors` directive, and SameSite cookies.

## Common Attack Vectors
- Missing or weak `X-Frame-Options` and `frame-ancestors`
- State-changing pages (delete account, change settings, approve, transfer) that can be framed
- Pages whose framing protection applies only to some routes or only to GET
- Frame-busting JavaScript that can be defeated with `sandbox`, `204` responses or double framing
- Drag-and-drop and text-injection (prefilled forms and URL-fragment prefilling)
- OAuth consent and authorisation screens
- Mobile, browser extension and desktop-embedded web views

## Testing Approach
First check the response headers on the framed page for both `X-Frame-Options` and `Content-Security-Policy: frame-ancestors`. A page is only a finding if it is both frameable and contains a harmful single-click action for an authenticated user. Build a local fixture that frames the target with reduced opacity, click a harmless action using a test account, and confirm the state change. Test authenticated and unauthenticated pages separately and check cookies for `SameSite`, because modern browsers default to `Lax`, which stops credentialed cross-site framing in many cases.

## Payloads
See `clickjacking-payloads.txt` for header checks, HTML fixtures, frame-busting bypasses and prefill patterns. Replace `app.example.test` with the controlled target.

## References
- [OWASP Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)
- [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [MDN: CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)

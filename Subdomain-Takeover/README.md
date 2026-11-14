# Subdomain Takeover

## Description
A subdomain takeover happens when a DNS record (usually a CNAME, but also A, NS or MX) points at a third-party service or resource that is no longer claimed, so an attacker can register the resource and serve content from the victim's subdomain. Impact includes phishing from a trusted domain, cookie theft for parent-domain cookies, CORS and CSP trust abuse, OAuth redirect abuse and email interception for dangling MX.

## Common Attack Vectors
- Dangling CNAME to a deprovisioned SaaS (object storage, static hosting, PaaS, help desks, CDNs)
- Dangling NS delegation to a zone that no longer exists at the provider (full-zone takeover)
- Dangling A/AAAA to released cloud IP addresses or elastic IPs
- Expired registrar domains used as a CNAME target
- MX records pointing at an unclaimed mail domain
- Wildcard DNS combined with a claimable service
- Dangling references in scripts, CSS and OAuth redirect allow-lists

## Testing Approach
Enumerate subdomains from certificate transparency, passive DNS and your own resolver. Resolve each name and record the CNAME chain. A takeover candidate has a CNAME to a provider and an HTTP response matching that provider's "unclaimed" fingerprint, or `NXDOMAIN` on the CNAME target. Verify that the provider allows claiming the resource and that the program's scope includes the host. Prove control only with a harmless, unlinked file (for example a text file with a unique marker at an unguessable path), never with defacement. Remove the claimed resource when finished and report promptly.

## Payloads
See `subdomain-takeover-payloads.txt` for fingerprints, DNS checks and proof-of-control markers. These are detection aids, not a guarantee of exploitability; always confirm the claim process at the provider.

## References
- [OWASP WSTG: Test for Subdomain Takeover](https://owasp.org/www-project-web-security-testing-guide/)
- [can-i-take-over-xyz (community fingerprint list)](https://github.com/EdOverflow/can-i-take-over-xyz)
- [MDN: CNAME and DNS](https://developer.mozilla.org/en-US/docs/Glossary/CNAME)

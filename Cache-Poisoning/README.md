# Web Cache Poisoning

## Description
Web cache poisoning exploits the gap between what a cache treats as part of the cache key and what the origin server actually uses to generate a response. By sending a request with an unkeyed input (e.g. a header the cache ignores but the backend reflects or acts on), an attacker can get a malicious response stored and served to every subsequent visitor who hits that same cached URL.

## Common Issues
- Caches keying only on scheme/host/path while ignoring headers the backend trusts
- Backend reflecting unkeyed headers into responses, redirects, or asset URLs
- Fat GET: query parameters not included in the cache key but still processed by the backend
- Inconsistent normalization between the cache and the origin (parameter/path handling differences)

## Common Attack Vectors
- `X-Forwarded-Host`, `X-Forwarded-Scheme`, `X-Original-URL`, `X-Rewrite-URL` reflected into links/redirects
- `Host` header manipulation when the cache keys on path only
- Unkeyed cookies or query parameters that toggle backend behavior
- Cache deception: tricking the cache into storing a dynamic/authenticated response under a static-looking URL

## Testing Approach
1. Identify caching behavior via response headers (`Cache-Control`, `Age`, `X-Cache`, `CF-Cache-Status`, `Vary`).
2. Find unkeyed inputs: add a header/parameter with a unique marker value and see if it's reflected in the response while the cache still serves a cached hit for the base URL.
3. Confirm actual poisoning by requesting the same URL from a second, unauthenticated client/session and checking whether the malicious value persists.
4. For cache deception, request a path that looks static (e.g. `/account/settings/nonexistent.css`) while authenticated, then check if an unauthenticated request to the same path returns cached private data.

## Payloads
See `cache-poisoning-payloads.txt` for header-based probes and example cache-busting/keying tests.

## Additional Payloads
See `cache-normalization-payloads.txt` for query/path normalization, header/cookie variants, cache-deception paths and escaped GET-body requests. Select the section matching the target input context. Use an isolated cache fixture, preserve request bytes and compare cache keys and responses with a clean control request.

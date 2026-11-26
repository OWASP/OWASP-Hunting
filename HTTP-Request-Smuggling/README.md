# HTTP Request Smuggling

## Description
HTTP Request Smuggling occurs when the front-end and back-end servers disagree about where one request ends and the next begins. This vulnerability allows attackers to bypass security controls, gain unauthorized access, and poison web caches.

## Vulnerability Types
- **CL.TE** - Content-Length vs Transfer-Encoding
- **TE.CL** - Transfer-Encoding vs Content-Length
- **TE.TE** - Transfer-Encoding obfuscation
- **CL.CL** - Duplicate Content-Length headers

## Common Attack Vectors
- Front-end/Back-end server desynchronization
- Load balancer misconfigurations
- Reverse proxy issues
- CDN edge servers
- WAF bypass

## Impact
- Bypass security controls
- Web cache poisoning
- Cross-site scripting
- Request hijacking
- Credential theft
- Access other users' requests

## Testing Approach
1. Send requests with conflicting Content-Length and Transfer-Encoding headers
2. Observe timing differences and response variations
3. Test with different header obfuscation techniques
4. Verify if smuggled requests affect subsequent requests

## Common Vulnerable Configurations
- HAProxy + Apache
- Nginx + Apache
- AWS ALB + various backends
- Akamai + various backends
- Cloudflare + various backends

## Payloads
See `http-request-smuggling-payloads.txt` for a comprehensive list of HTTP Request Smuggling payloads.

## Additional Payloads
See `modern-desync-payloads.txt` for HTTP/2 header/DATA descriptors, escaped HTTP/1 bytes, CL.0/TE.0 and local pause-based socket inputs. Select the section matching the target input context. Preserve the documented byte framing and use an isolated front-end/back-end lab to verify request boundaries.

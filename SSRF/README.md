# Server-Side Request Forgery (SSRF)

## Description
Server-Side Request Forgery (SSRF) is a web security vulnerability that allows an attacker to induce the server-side application to make HTTP requests to an arbitrary domain of the attacker's choosing. This can lead to unauthorized access to internal systems, cloud metadata endpoints, or other sensitive resources.

## Common Attack Vectors
- URL parameters
- File upload (via URL)
- Webhook endpoints
- PDF generators
- Image processing services
- API integrations

## Testing Approach
Submit URLs pointing to internal resources, cloud metadata endpoints, or localhost to test if the application makes requests to those resources.

## Payloads
See `ssrf-payloads.txt` for a comprehensive list of SSRF payloads.

## Additional Payloads
See `advanced-ssrf-payloads.txt` for URL parser variants, redirect/rebinding inputs and cloud metadata request headers/bodies. Select the section matching the target input context. Use controlled callback and redirect endpoints; verify outbound requests without retrieving real metadata credentials.

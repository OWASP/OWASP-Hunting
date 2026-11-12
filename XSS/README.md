# Cross-Site Scripting (XSS)

## Description
Cross-Site Scripting (XSS) attacks are a type of injection in which malicious scripts are injected into otherwise benign and trusted websites. XSS attacks occur when an attacker uses a web application to send malicious code, generally in the form of a browser side script, to a different end user.

## Types of XSS
- **Reflected XSS**: Script is reflected off the web server
- **Stored XSS**: Script is permanently stored on the target server
- **DOM-based XSS**: Vulnerability exists in client-side code

## Common Attack Vectors
- Input fields
- URL parameters
- HTTP headers
- File uploads
- Comment sections

## Testing Approach
Submit JavaScript code in various input points and observe if the code gets executed in the browser.

## Payloads
See `xss-payloads.txt` for a comprehensive list of XSS payloads.

## Additional Payloads
See `context-sanitizer-payloads.txt` for HTML, attribute, JavaScript and URL contexts; sanitizer, DOM clobbering, CSP and Trusted Types inputs. Select the section matching the target input context. Match the browser insertion context and sanitizer configuration, and verify script execution in an isolated browser fixture.

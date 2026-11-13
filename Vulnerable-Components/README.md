# Vulnerable Components

## Description
Using components with known vulnerabilities can lead to serious security breaches. This includes libraries, frameworks, and other software modules that run with the same privileges as the application. Vulnerable components can be exploited to achieve various attacks ranging from data theft to server takeover.

## Common Issues
- Outdated libraries
- Unpatched frameworks
- Deprecated components
- Components with known CVEs
- Unnecessary dependencies

## Common Attack Vectors
- Third-party libraries
- JavaScript frameworks
- Server-side frameworks
- CMS platforms
- Plugins and extensions
- Operating system packages

## Testing Approach
Identify the versions of components used by the application and check them against vulnerability databases for known security issues.

## Resources
See `vulnerable-components-list.txt` for a list of commonly vulnerable components and their indicators.

## Additional Payloads
See `cve-reference-list.txt` for A CVE-keyed list (about 100 entries) of widely exploited component flaws across Java, JavaScript, Python, PHP, servers, appliances and media libraries, with affected versions and a safe detection hint. Triage leads only; confirm against the vendor advisory.

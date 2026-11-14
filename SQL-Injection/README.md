# SQL Injection

## Description
SQL injection is a web security vulnerability that allows an attacker to interfere with the queries that an application makes to its database. This can allow an attacker to view, modify, or delete data that they are not normally able to retrieve.

## Common Attack Vectors
- Login forms
- Search fields
- URL parameters
- HTTP headers
- Cookie values

## Testing Approach
Submit malicious SQL syntax in input fields and observe application behavior, error messages, and response times to identify SQL injection vulnerabilities.

## Payloads
See `sql-injection-payloads.txt` for a comprehensive list of SQL injection payloads.

## Additional Payloads
See `orm-and-context-payloads.txt` for Injection in ORDER BY, LIMIT, INSERT and UPDATE contexts, engine fingerprinting, JSON and ORM/HQL contexts, headers and cookies, out-of-band exfiltration by engine and WAF evasion variants.

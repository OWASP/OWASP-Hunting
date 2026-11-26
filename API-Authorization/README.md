# API Authorization

## Description
API authorization must protect objects, individual properties and privileged functions. An authenticated client must not be able to assign protected fields, obtain another tenant's data, or invoke functions outside its role. This category complements IDOR with property-level and function-level cases.

## Common Attack Vectors
- Mass assignment and nested input binding
- Broken object property level authorization (BOPLA)
- Broken function level authorization (BFLA)
- Tenant context derived from client input
- Bulk operations with mixed ownership
- Inconsistent methods, versions and alternate routes
- Excessive protected-field exposure

## Testing Approach
Create users A and B in separate test tenants plus a separate administrator control. Establish allowed reads and reversible writes for A, then replay with B's fixture identifiers. Follow each mutation with an authenticated read to distinguish ignored fields from persisted changes. Compare response serializers for protected properties as well as writes. Field visibility must be judged against application policy, not field names alone.

Route examples require matching lab endpoints; a 404 or 200 does not establish authorization behavior. Use two-item bulk requests to check that every item is authorized and that rejection does not leave partial unauthorized effects. Use lab-only role or tenant changes and restore the fixtures after testing.

## Payloads
See `api-authorization-payloads.txt` for JSON bodies, request lines and query/header fragments. Preserve the original request's other headers and authenticated test session.

## References
- [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

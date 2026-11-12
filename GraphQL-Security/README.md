# GraphQL Security

## Description
GraphQL endpoints expose resolver, field and subscription boundaries that require authorization independently of schema discovery and HTTP routing. Query batching, aliases and nested relationships can exercise different authorization paths.

## Common Attack Vectors
- Root, nested and node resolver authorization
- Field-level reads and input-object mass assignment
- Aliases and JSON array batching
- Persisted-query enforcement
- Query depth and cost limits
- Subscription ownership and session invalidation
- GET versus POST transport handling

## Testing Approach
Use a small lab schema with User, Project and Document types and two owned accounts in separate tenants. Adapt field names to the actual schema; unknown-field errors are not vulnerabilities. Introspection may be intentionally enabled. Compare access to the same object through root, node and nested resolvers, including mixed authorized/unauthorized results in one query.

Keep batching to two operations and depth tests to the small examples provided. Cost tests should use configured lab limits rather than large resource-exhaustion queries. For subscriptions, verify actual messages and post-logout authorization, not just connection establishment. A persisted-query deployment may intentionally support arbitrary query registration; assess its documented mode.

## Payloads
See `graphql-security-payloads.txt` for JSON HTTP bodies and subscription messages. Examples use application-specific fields and require the matching lab schema. They are independent records, not a single JSON file.

## References
- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [GraphQL Specification](https://spec.graphql.org/)
- [GraphQL over HTTP](https://graphql.github.io/graphql-over-http/draft/)

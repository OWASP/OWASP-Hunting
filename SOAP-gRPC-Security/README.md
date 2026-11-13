# SOAP, WSDL and gRPC Security

## Description
SOAP/WS-* services and gRPC are RPC-style APIs with their own attack surface. SOAP exposes a machine-readable contract (WSDL) and XML processing (see `XXE/`, `XML-Injection/`), and gRPC exposes strongly typed protobuf services that are often reachable without a browser, with reflection enabled and authorisation left to each method. Typical issues are exposed contracts, injection into backend operations, authorisation gaps per operation, XML wrapping attacks and unauthenticated reflection.

## Common Attack Vectors
- Public WSDL or gRPC reflection revealing every operation and message
- Injection (SQL, command, XPath, LDAP) in operation parameters
- Missing per-operation authorisation (BOLA/BFLA) and role checks
- XML signature wrapping, SOAPAction spoofing and XML external entities
- WS-Security misconfiguration: replay, missing timestamps, weak tokens
- gRPC-Web proxies, HTTP/2 downgrade and metadata (header) spoofing
- Unbounded message size and recursion leading to denial of service
- Legacy SOAP 1.1 endpoints beside a modern API

## Testing Approach
Retrieve the contract first (`?wsdl`, reflection), then enumerate operations and test each with a low-privilege and an unauthenticated identity. For SOAP, send the same body with a changed SOAPAction and operation and check which one the server routes on. For gRPC, use `grpcurl` for reflection and invoke methods with a test token, then change object identifiers to test authorisation. Prove impact with benign reads on test data only.

## Payloads
See `soap-grpc-payloads.txt`. Replace hosts and message fields with those of your authorised target.

## References
- [OWASP WSTG: Testing Web Services](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Web Service Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Web_Service_Security_Cheat_Sheet.html)
- [gRPC Authentication Guide](https://grpc.io/docs/guides/auth/)

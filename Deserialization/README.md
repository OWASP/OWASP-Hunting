# Deserialization

## Description
Insecure deserialization vulnerabilities occur when untrusted data is used to abuse the logic of an application, inflict a denial of service attack, or execute arbitrary code upon deserialization. This is particularly dangerous in applications that serialize and deserialize objects.

## Common Attack Vectors
- Cookie values
- API requests (JSON, XML, YAML)
- Session data
- Cached data
- Message queues
- File uploads

## Testing Approach
Submit serialized objects with malicious payloads to test if the application deserializes untrusted data without proper validation.

## Payloads
See `deserialization-payloads.txt` for a comprehensive list of deserialization attack payloads.

## Additional Payloads
See `additional-library-payloads.txt` for Inert detection probes and library-specific forms for Java (URLDNS, XStream, SnakeYAML, Jackson, Fastjson, Hessian, XMLDecoder), .NET (Json.NET, ViewState), PHP (phpggc, Phar), Python, Ruby and Node.js, plus format signatures. Prefer the DNS-only probes first.

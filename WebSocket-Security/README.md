# WebSocket Security

## Description
WebSocket security depends on handshake authentication, browser Origin handling and authorization of individual messages. A successful protocol upgrade does not prove access to protected data or actions. WebSockets do not use the normal fetch CORS response-sharing protocol.

## Common Attack Vectors
- Cross-site WebSocket hijacking with ambient cookies
- Missing handshake and per-message authentication
- Room, channel and subscription authorization
- Session expiry and logout on long-lived connections
- Subprotocol negotiation and message schema validation
- Replay, ordering and binary/text frame differences

## Testing Approach
Use a local echo/chat fixture, a separate browser origin and two controlled users. Start with the read-only whoami or ping operation, then test private-channel boundaries. Verify cookie inclusion in the browser before claiming cross-site hijacking. Browser JavaScript cannot set an arbitrary Cookie, Authorization or Origin header for a WebSocket connection; proxy header mutations are separate controls.

Send only the small messages provided. For lifecycle tests, leave the socket open while expiring or revoking the session, then inspect protected messages. For binary validation, send a small UTF-8 encoded message as a binary frame; do not send oversized or malformed transport frames outside a dedicated protocol lab.

## Payloads
See `websocket-security-payloads.txt` for handshake fragments, JSON messages, browser snippets and lifecycle sequences. Adapt message types to the application's schema.

## References
- [OWASP WebSocket Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)
- [WebSocket Protocol, RFC 6455](https://www.rfc-editor.org/rfc/rfc6455)

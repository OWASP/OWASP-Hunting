# Email (SMTP, IMAP and MIME) Injection

## Description
Email injection occurs when user input is placed into a mail message or protocol command without stripping CR/LF or MIME structure. Typical sinks are contact and invite forms, password-reset mailers, "send to a friend" features and webmail clients (IMAP/SMTP command injection). Impact includes spamming, phishing from a trusted sender, reset-link redirection, header spoofing and data exfiltration via added recipients.

## Common Attack Vectors
- To, From, Subject, Reply-To and custom headers built from form input
- Additional `Cc:` and `Bcc:` recipients added with CR/LF
- Body injection through a header that ends the header block early
- MIME boundary and content-type manipulation, HTML injection in HTML email
- IMAP/SMTP command injection in webmail and mail-proxy features
- Email-address parsing differences (quoted local parts, comments, encoded words) that bypass validation or domain allow-lists
- Password-reset and invitation mailers where the recipient can be duplicated

## Testing Approach
Use mailboxes you own. Add a second recipient you control through a CRLF in the field and check which mailbox receives the message and with what headers. Compare how the validator and the mail library parse the same address; mismatches create allow-list bypasses. For webmail and mail proxies, inject protocol commands such as `NOOP` and observe protocol-level errors. Do not email third parties or send bulk messages.

## Payloads
See `email-injection-payloads.txt`. Replace the addresses with mailboxes you control.

## References
- [OWASP WSTG: Testing for IMAP/SMTP Injection](https://owasp.org/www-project-web-security-testing-guide/)
- [RFC 5322: Internet Message Format](https://www.rfc-editor.org/rfc/rfc5322.html)
- [RFC 3501: IMAP4rev1](https://www.rfc-editor.org/rfc/rfc3501.html)

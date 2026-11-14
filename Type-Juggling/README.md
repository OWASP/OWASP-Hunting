# Type Juggling and Type Confusion

## Description
Loosely typed languages convert values implicitly when comparing or processing them. PHP's `==`, JavaScript's `==` and `isNaN`, and permissive JSON/YAML parsing allow different values to compare as equal or select unexpected branches. Attackers abuse this to bypass authentication, compare token or hash values against a number, and trick signature or password checks. Magic hash strings (`0e...`) are the best-known example.

## Common Attack Vectors
- PHP loose comparison with `==`, `!=`, `in_array`, `switch`, `array_search` and `strcmp`
- Hash comparisons where the digest looks like scientific notation (`0e` followed by digits)
- JSON bodies with `true`, `0`, `null`, arrays or objects in place of a string
- Array parameters (`password[]=x`) that make string functions return `NULL`
- JavaScript loose equality, `parseInt`, truthiness and prototype-based coercion
- Numeric strings, whitespace, hex, octal and scientific notation in comparisons
- Type confusion in YAML, XML and query-string parsers

## Testing Approach
Identify the language and the comparison. In PHP, send integers, booleans, `null`, empty arrays and `0e...` strings in JSON in place of strings, and send array notation for form fields. Compare the response with the baseline (invalid password). For hash comparison, test known `0e` strings that hash to `0e...` values. Authentication bypass is confirmed only when you can log in as your own test account; do not use these techniques against other users.

## Payloads
See `type-juggling-payloads.txt` for PHP and JavaScript juggling inputs and magic hash reference strings.

## References
- [PHP manual: Type Comparison Tables](https://www.php.net/manual/en/types.comparisons.php)
- [OWASP WSTG: Testing for Weak Password Policy and Authentication](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE-1025: Comparison Using Wrong Factors](https://cwe.mitre.org/data/definitions/1025.html)

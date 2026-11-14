# Expression Language Injection (OGNL, SpEL, EL, MVEL)

## Description
Many Java frameworks evaluate expressions at runtime: OGNL (Struts, Confluence), Spring Expression Language (SpEL), Jakarta/Unified EL (JSP, JSF), MVEL and Groovy. When user input reaches an expression evaluator, the result is usually remote code execution. This category is for evaluator-level injection; for template engines such as Thymeleaf or Freemarker see `SSTI/`.

## Common Attack Vectors
- Struts parameter names, `Content-Type` headers and action URLs evaluated as OGNL
- Spring annotations, routing functions, `@Value`, `@PreAuthorize` and Spring Cloud Gateway or Function headers evaluated as SpEL
- JSP/JSF EL evaluated on error pages, message bundles and tag attributes
- Validation messages (`ConstraintViolation` interpolation) that evaluate `${...}`
- Error pages and log or message templates that echo input
- Configuration or workflow engines exposing expression fields to users

## Testing Approach
Send arithmetic probes first (`${7*7}`, `#{7*7}`, `%{7*7}`, `*{7*7}`) and look for `49` in the response, an error, or a timing difference. Try several delimiters because each framework uses different ones. Use a harmless side effect for confirmation: `${T(java.lang.System).getProperty('os.name')}` or a DNS callback to a host you control. Prefer reading a property over running commands. Check the framework version and map it to known advisories; many of these probes correspond to published CVEs that should already be patched.

## Payloads
See `expression-language-payloads.txt`. Replace `oast.example.test` with a controlled host.

## References
- [OWASP: Expression Language Injection](https://owasp.org/www-community/vulnerabilities/Expression_Language_Injection)
- [Spring Expression Language reference](https://docs.spring.io/spring-framework/reference/core/expressions.html)
- [Apache Struts security bulletins](https://cwiki.apache.org/confluence/display/WW/Security+Bulletins)

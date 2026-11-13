# Mobile Deep Links, App Links and WebView Bridges

## Description
Mobile apps expose entry points through custom URL schemes, Android intent filters, App Links and Universal Links, and they embed WebViews that can reach native code through JavaScript bridges. If these entry points trust their input, an attacker can open internal screens, bypass authentication, steal OAuth codes, load attacker content in a privileged WebView or trigger native actions. This category lists URL and intent patterns for authorised testing of apps you own or are in scope for.

## Common Attack Vectors
- Custom scheme handlers (`myapp://`) that accept unvalidated parameters and URLs
- Android exported activities, services and broadcast receivers
- Intent redirection and implicit intent hijacking
- Unverified App Links (`assetlinks.json`) and Universal Links (`apple-app-site-association`)
- OAuth redirect URIs that use a hijackable custom scheme
- WebViews with `setJavaScriptEnabled`, `addJavascriptInterface`, file access and loadable `javascript:` or `file:` URLs
- Deep links that load a URL into a WebView without allow-listing the host
- Push notification and QR code payloads handled as deep links

## Testing Approach
Extract manifests and URL-scheme registrations (`AndroidManifest.xml`, `Info.plist`), list exported components, then send each deep link with benign values from a test device or emulator. Look for screens that skip authentication, URL parameters loaded into a WebView, and tokens placed in URLs. Verify App Link association files on the web domain. Use `adb` and a proxy against your own build; do not test other users' devices.

## Payloads
See `mobile-deeplinks-payloads.txt` for `adb` and URL patterns. Replace package names, schemes and hosts with the target's.

## References
- [OWASP Mobile Application Security Testing Guide](https://mas.owasp.org/MASTG/)
- [OWASP MASVS](https://mas.owasp.org/MASVS/)
- [Android developers: App Links](https://developer.android.com/training/app-links)

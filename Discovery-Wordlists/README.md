# Discovery Wordlists: Parameters, Paths and Headers

## Description
Discovery is finding the inputs and endpoints that are not linked from the interface: hidden query parameters, API routes, admin and internal paths, debug headers and alternate file extensions. These lists are short, curated starting points for tools such as ffuf, Burp Intruder and Param Miner. They are different from the payload files in the other categories: the entries are names to probe, not attack strings.

## Common Attack Vectors
- Hidden or debug parameters that change behaviour (`debug`, `admin`, `test`)
- Undocumented API versions, internal routes and framework endpoints
- Parameters that carry URLs, file names, identifiers and redirect targets (SSRF, LFI, IDOR, open redirect candidates)
- Unlinked admin, backup and staging paths
- Request headers that influence routing, authentication and caching
- Alternate extensions and backup suffixes of known files

## Testing Approach
Establish a baseline response for a known-missing name, then fuzz with a list and filter by status, size, words or lines to remove the noise. Add a unique value to each request so you can recognise reflection. Start small and rate-limit; large wordlists and high thread counts can degrade a service and breach program rules. For parameters, compare the response with and without each name and look for reflection, error changes and timing. Stay inside the program scope and honour its rate limits.

## Payloads
See `discovery-wordlists.txt`. Parameters are written as `?name=1` fragments and paths as absolute paths, so the file can be used as a list for ffuf-style tools after removing the leading `?` where the tool adds its own separator.

## References
- [OWASP WSTG: Enumerate Applications on Webserver](https://owasp.org/www-project-web-security-testing-guide/)
- [ffuf](https://github.com/ffuf/ffuf)
- [PortSwigger Param Miner](https://portswigger.net/bappstore/17d2949a985c4b7ca092728dba871943)

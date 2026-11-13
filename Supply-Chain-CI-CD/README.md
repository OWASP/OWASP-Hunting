# Supply Chain and CI/CD Security

## Description
Software supply-chain and CI/CD weaknesses let an attacker run code in a build, publish or deploy pipeline without touching the production application. This category covers dependency confusion and typosquatting, malicious install scripts, GitHub Actions and other CI workflow injection, secrets in repositories and artifacts, over-permissive CI tokens and exposed build infrastructure. Pipelines often hold cloud and registry credentials, so one injection can reach production.

## Common Attack Vectors
- Internal package names that are unclaimed on public registries (npm, PyPI, RubyGems, Maven, NuGet)
- Typosquatted or lookalike package names, and install-time scripts (`preinstall`, `postinstall`, `setup.py`)
- GitHub Actions workflows that put untrusted input (issue titles, PR titles, branch names, comment bodies) into `run:` steps
- `pull_request_target` and `workflow_run` workflows that check out and execute untrusted code
- Self-hosted runners shared with public repositories
- Secrets in commit history, build logs, artifacts, container image layers and CI variables
- Unpinned third-party actions and base images; mutable tags; lockfile tampering
- Exposed CI servers (Jenkins, GitLab Runner, TeamCity), unauthenticated dashboards and script consoles

## Testing Approach
Test only repositories and registries you own or are explicitly authorised to test. For dependency confusion, list package names from manifests and lockfiles of an in-scope target, then check whether each name is claimed publicly. Prove it with an inert package that only makes a DNS callback, never with code that reads environment or files. For Actions injection, read workflows for `${{ github.event.* }}` used inside `run:` blocks and review trigger types and permissions. Report the vulnerable pattern and a minimal proof on a fork or test repository.

## Payloads
See `supply-chain-ci-payloads.txt` for detection commands, vulnerable workflow patterns and inert callback packages. Use unique tokens and your own callback host.

## References
- [OWASP Software Supply Chain Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html)
- [GitHub: Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
- [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/)

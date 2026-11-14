# Cloud and Container Security

## Description
Cloud and container weaknesses are mostly misconfiguration: public storage, over-privileged identities, exposed management interfaces, reachable metadata services, and containers or clusters with unsafe defaults. This category covers storage buckets, metadata services, IAM misconfiguration indicators, Kubernetes and Docker API exposure, container breakout preconditions and secrets in images and environment. For metadata access through SSRF see `SSRF/`.

## Common Attack Vectors
- Publicly listable or writable buckets and blob containers; exposed pre-signed URLs and SAS tokens
- Metadata services (169.254.169.254 and equivalents) reachable from application code
- Over-permissive IAM roles, wildcard policies and credentials in environment variables or images
- Exposed Docker daemon (2375/2376), Kubernetes API (6443/8080), kubelet (10250/10255), etcd (2379) and dashboards
- Privileged containers, mounted Docker socket, host namespaces and dangerous capabilities
- Serverless and CI roles with trust-policy gaps; cross-account `AssumeRole` misconfiguration
- Public container registries and images containing secrets

## Testing Approach
Test only accounts, clusters and buckets you own or are authorised to assess. Start unauthenticated and read-only: list a bucket, query an exposed API for its version, read the identity of the current credentials (`sts get-caller-identity`, `kubectl auth whoami`). Use `can-i` style checks to enumerate permissions instead of exercising them. Do not read, copy or delete data from storage you do not own. Stop at proof of access and document the least-privilege fix.

## Payloads
See `cloud-container-payloads.txt` for read-only enumeration commands, exposure checks, metadata endpoints and indicators of risky configuration.

## References
- [OWASP Cloud-Native Application Security Top 10](https://owasp.org/www-project-cloud-native-application-security-top-10/)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [OWASP Kubernetes Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Kubernetes_Security_Cheat_Sheet.html)

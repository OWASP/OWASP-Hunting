# Website deployment mirror

`OWASP/OWASP-Hunting:website` is the source of truth for website code and content. [`.github/workflows/sync-docs-hunting.yml`](./.github/workflows/sync-docs-hunting.yml) copies reviewed changes to `th30d4y/docs-hunting:main`, where a normal commit can trigger the destination's hosting integration.

```text
Contributor fork → PR into OWASP-Hunting:website → merge
  → OWASP GitHub Actions → docs-hunting:main commit → destination deployment
```

The workflow runs only for pushes to `website` or manual dispatch **from `website`** in `OWASP/OWASP-Hunting`. Pull request events cannot access the destination token or run the sync job. The destination is never force-pushed or rebased.

The OWASP GitHub Pages URL forwards browser visitors to `https://hunting.0d4y.dev/`, preserving the route, query, and fragment. The forwarding script runs only on `owasp.github.io` and is included only in the OWASP build; the deployment mirror does not redirect to itself. GitHub Pages serves this as a browser redirect, so it requires JavaScript.

## Current destination state

As checked on 2026-10-15, `docs-hunting` has only a `main` branch. Its repository also publishes `hunting.0d4y.dev` through **GitHub Pages** from `main`, and its tracked workflow is `.github/workflows/deploy.yml`. No `netlify.toml` was present. The destination owner reports that the repository is connected to Netlify, but the connected Netlify account available during setup could not verify that site's settings or deployments. The mirror is prepared for `main` and does not change Netlify settings or disable the existing GitHub Pages workflow.

If Netlify uses a different production branch, update the destination checkout `ref`, push ref, and concurrency group in the sync workflow before enabling it.

## Files owned by the source

The mirror copies `src/`, `public/`, `package.json`, `package-lock.json`, `eslint.config.mjs`, `postcss.config.mjs`, and `tsconfig.json`. A manifest (`.owasp-website-sync.json`) records copied files. Later runs remove only files listed in that manifest when they have been removed from the source. Unrelated destination files are never removed.

On the first run, pre-existing destination files that are absent from the source stay in place because they have no manifest history. Review those files separately if they appear to be obsolete website content; the sync will not guess which destination-only files are safe to remove.

These destination-specific files are preserved:

| Destination file or setting | Why it stays on the destination |
| --- | --- |
| `next.config.ts` | The destination has no `/OWASP-Hunting` base path and retains its own build settings. |
| `src/lib/site-variant.ts` | Defines the destination URL and empty base path. The first sync creates it from `public/CNAME` if it does not exist. Later syncs preserve it. |
| `CNAME`, `public/CNAME`, `public/robots.txt` | Keep the destination domain and indexing rules. |
| `.github/`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `netlify.toml` if present | Keep destination workflows, documentation, developer instructions, ignore rules, and hosting configuration. |

The source's `src/lib/site-variant.ts` selects the OWASP GitHub Pages URL and base path. Its navigation, metadata, and Markdown links use that module, so the same website code works with the destination's preserved variant. If the Netlify site's public URL differs from `public/CNAME`, set the destination variant's `url` to the intended production URL.

## Enable the sync

1. Create a **dedicated fine-grained personal access token** with resource owner `th30d4y`, selected repository `docs-hunting`, and repository permission **Contents: Read and write**. GitHub includes Metadata: Read automatically. Give it an expiration and rotate it before expiry.
2. In `OWASP/OWASP-Hunting`, open **Settings → Secrets and variables → Actions → New repository secret**. Name it `DOCS_SYNC_TOKEN` and paste the token there. Do not add the token to source files, PR text, or workflow logs. The source repository's `GITHUB_TOKEN` retains only `contents: read`.
3. Confirm that the existing Netlify connection for `th30d4y/docs-hunting` builds `main`, with its existing build command and publish directory. This workflow does not configure Netlify.
4. Review and merge the setup change into `website` only after the secret and destination branch are ready. That merge triggers the first sync. A manual run must select the `website` ref.

The sync uses the token for a destination checkout and for a single non-force `git push`. It stores no credential in Git configuration and uses a temporary askpass helper so the token is not included in a command line or printed in logs.

## Validate safely before enabling

The copy script can be run against a **disposable clone** of `docs-hunting`; it never pushes:

```bash
git clone https://github.com/th30d4y/docs-hunting.git /tmp/docs-hunting-sync-test
python3 scripts/sync_docs_hunting.py "$PWD" /tmp/docs-hunting-sync-test
git -C /tmp/docs-hunting-sync-test status --short
```

Inspect the diff and verify the destination's `CNAME`, `public/CNAME`, `public/robots.txt`, `next.config.ts`, workflows, and any Netlify configuration are unchanged. Run the script again to confirm it produces no further changes.

## Troubleshooting

- **Missing token:** Add `DOCS_SYNC_TOKEN` to the OWASP repository's Actions secrets before merging the workflow.
- **Checkout or push returns 403:** Check token expiration, selected repository, Contents write permission, and any token approval policy. Do not paste the token into logs or rerun with command tracing.
- **Non-fast-forward push rejected:** Someone updated `docs-hunting:main` during the job. Inspect that commit, then rerun the workflow from `website`; never force-push.
- **No destination commit:** The managed files already match the source. This is the expected result for an idempotent rerun.
- **Destination build has the wrong URL or paths:** Check its preserved `next.config.ts` and `src/lib/site-variant.ts`. The destination variant should use an empty `basePath` for a custom domain.
- **Netlify does not deploy:** Confirm that a Netlify site is connected to `th30d4y/docs-hunting` and builds `main`. A successful mirror commit alone does not create a Netlify integration; the existing GitHub Pages workflow may still deploy on that commit.

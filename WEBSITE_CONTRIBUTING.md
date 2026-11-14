# Contributing to the OWASP Hunting website

This guide is for the documentation website at https://hunting.0d4y.dev/. The OWASP GitHub Pages URL forwards visitors to that primary domain. Website changes are reviewed against the **`website` branch**. For new security payloads or changes to the canonical payload collection, use the [general contribution guide](./CONTRIBUTING.md) and target `main`.

## Find the right files

| What you want to change | Where to look |
| --- | --- |
| Pages and routes | `src/app/` |
| Shared layout, navigation, search, and UI | `src/components/` and `src/lib/navigation.ts` |
| Documentation text and website payload reference data | `src/lib/docs-data.ts` and `src/lib/payload-data.ts` |
| Search entries | `src/lib/search-data.ts` |
| Styles and static images | `src/app/globals.css` and `public/` |
| Static export and deployment | `next.config.ts` and `.github/workflows/deploy-website.yml` |

The website's reference data is maintained in its source files. If a change also adds or corrects a payload in the canonical collection, submit that payload change separately against `main` so it receives the project's payload review.

## Start a website change

1. Fork [OWASP/OWASP-Hunting](https://github.com/OWASP/OWASP-Hunting), then clone **your fork**.
2. Create your working branch from the latest official `website` branch:

   ```bash
   git clone https://github.com/YOUR_USERNAME/OWASP-Hunting.git
   cd OWASP-Hunting
   git remote add upstream https://github.com/OWASP/OWASP-Hunting.git
   git fetch upstream website
   git switch -c docs/improve-website upstream/website
   ```

3. Make a focused change. Keep the existing layout, accessible labels, keyboard behavior, and small-screen navigation working. Check factual content and credit any material or assets you did not create.
4. Preview locally with Node.js 22:

   ```bash
   npm ci
   npm run dev
   ```

   Open `http://localhost:3000/OWASP-Hunting/` and inspect the changed page and its navigation.

## Keep the GitHub Pages export working

This site uses the Next.js App Router with `output: 'export'`. GitHub Pages serves files generated at build time from `out/`; it does not run a Next.js server.

- Keep links and assets working under the `/OWASP-Hunting` base path. `next/link` applies it to internal routes; plain HTML links and references to files in `public/` need the prefix explicitly.
- Generate every dynamic route at build time with `generateStaticParams`. Avoid features that require request-time rendering, API routes, or Server Actions.
- Preserve `public/.nojekyll`, which allows Pages to serve `_next/` assets. Do not add a `CNAME`; the source site's former domain is archived in `website-source/` and is not the OWASP site domain.
- Keep payload examples within the project's [responsible-use policy](./DISCLAIMER.md). Never commit secrets or private data.

Before pushing, run the same checks as the deployment workflow:

```bash
npx tsc --noEmit
npm run lint
npm run build
python3 scripts/validate_website_export.py
```

The build must create `out/`, and the validator must pass. Review the changed page in a browser, including its links, images, and mobile layout. `out/` and `node_modules/` are generated files and should not be committed.

## Open a pull request

Push your branch to your fork and open a PR with **base repository `OWASP/OWASP-Hunting`, base branch `website`**, and your fork branch as the head. GitHub may suggest `main` by default, so check the base branch before submitting.

```bash
git push -u origin docs/improve-website
```

In the PR template, describe the website change, why it helps, the pages or files affected, and the checks and browser review you performed. Use `N/A — website-only change` for payload duplicate checking when no payload files changed. Include source attribution and the [AI assistance disclosure](./CONTRIBUTING.md#ai-assisted-contributions) when applicable. The website is deployed automatically after a change is merged into `website`; opening a PR does not publish it.

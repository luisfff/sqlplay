# SQLPlay — Deployment & Publishing

Every way to ship SQLPlay, plus what to check before each. See
[ARCHITECTURE.md](ARCHITECTURE.md) for how it's built.

---

## 0. Build outputs (know these first)

| Command | Produces | Used by |
|---|---|---|
| `npm run build` | `dist/` (static web app) | the CLI, static hosting |
| `npm run build:lib` | `dist-lib/` (`index`, `react`, `server` — ESM+CJS+d.ts) | the npm library |
| `npm run build:all` | both of the above | publishing |

`package.json` ships only what's needed via `"files": ["dist", "dist-lib", "bin"]`.

---

## 1. Publish to npm (the headline artifact)

This is what makes `npx sqlplay` and `npm install sqlplay` real for everyone.

### 1.1 One-time prep

```bash
npm login                      # create/login to an npm account
# pick a name that's free, or scope it: @yourname/sqlplay
npm view sqlplay               # if taken, rename in package.json ("name")
```

### 1.2 Guard: always publish a fresh build

Add a `prepublishOnly` script so a publish can never ship stale output:

```jsonc
"scripts": {
  "prepublishOnly": "npm run build:all"
}
```

Optionally verify the exact file list before publishing:

```bash
npm pack --dry-run   # lists every file that would be published
```

You should see `dist/`, `dist-lib/`, `bin/`, `README.md`, `package.json` — and
**not** `src/`, `node_modules/`, tests, or screenshots you don't want shipped.
Trim with `"files"` or a `.npmignore` if needed.

### 1.3 Publish

```bash
npm version patch          # 0.1.0 -> 0.1.1 (or minor/major); tags a commit
npm publish                # runs prepublishOnly -> build:all -> publishes
# scoped + public:
npm publish --access public
```

### 1.4 Verify from a clean project

```bash
mkdir /tmp/try && cd /tmp/try && npm init -y
npm install sqlplay
node -e "const {createDatabase}=require('sqlplay'); createDatabase().then(db=>{db.run('create table t(x); insert into t values(1)'); console.log(db.query('select * from t').rows)})"
npx sqlplay --no-open      # CLI works too
```

### 1.5 Checklist before `npm publish`

- [ ] `npm run build:all` is green
- [ ] `npm run test:e2e` passes (needs `npx playwright install chromium` once)
- [ ] version bumped (`npm version …`)
- [ ] `npm pack --dry-run` file list looks right
- [ ] README renders (screenshots resolve, links work)
- [ ] `LICENSE` present; `repository`/`homepage`/`bugs` fields set in package.json

---

## 2. Deploy the web app (static hosting)

The app is a pure static bundle — host `dist/` anywhere.

```bash
npm run build
# then deploy the dist/ folder
```

- **Vercel / Netlify:** framework preset = Vite; build `npm run build`; output
  `dist`. Nothing else required.
- **GitHub Pages:** use the automated workflow described below. Because
  `base: "./"`, assets work from the `/sqlplay/` subpath without changing Vite.
- **Any static server / S3 / Cloudflare Pages:** upload `dist/`.

**Headers (recommended):** serve `.wasm` as `application/wasm` (most hosts do
automatically). The app doesn't strictly require COOP/COEP for basic sql.js, but
setting them is harmless and future-proof.

There is **no backend to deploy** for the web app — that's the whole point.

### 2.1 GitHub Pages for this repository

**Prerequisites for the private `luisfff/sqlplay` repository:**

- GitHub Free only supports Pages from public repositories. Private repositories
  require GitHub Pro (personal accounts), GitHub Team, or GitHub Enterprise Cloud
  (organizations). For this personal repository, the owner must have an eligible
  plan such as Pro. If Pages settings show an upgrade requirement, the owner
  must upgrade or use another static host. Do not change visibility just to run CI.
- A private repository does **not** automatically provide a private website.
  Pages sites are normally public, including those built from private sources.
  Restricted access is available for eligible organization project sites with
  GitHub Enterprise Cloud, not a personal Pro repository. Review the published
  app and bundled datasets before enabling public hosting.
- An administrator must enable Actions and allow the official actions used by
  `.github/workflows/pages.yml`. Private-repository Actions usage is subject to
  the account's included minutes/billing and organization policies.

Official references:
[creating a Pages site and private-repository eligibility](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site),
[GitHub's plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans),
and [Pages access control](https://docs.github.com/en/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

**One-time setup and first deployment:**

1. In this repository, open **Settings → Pages → Build and deployment** and set
   **Source: GitHub Actions**. This workflow does not enable Pages or upgrade the
   account automatically.
2. Merge this PR into `main`. Open **Actions → Website** to watch validation and
   deployment. If needed, select **Run workflow** with branch **main** after
   enabling Pages. Manual runs on other branches validate only.
3. If the `github-pages` environment requires approval, approve the deployment.
   Restrict that environment's deployment branches to `main` for defense in depth.
4. After the deployment succeeds, use the URL in the `github-pages` environment.
   The expected URL is **https://luisfff.github.io/sqlplay/**, unless account Pages
   or custom-domain configuration dictates otherwise. The site is not live merely
   because the workflow exists.

The **Website** workflow uses Node.js 22 LTS and `npm ci`, builds the website and
library, and runs browser tests, including a production `/sqlplay/` smoke test
that checks the emitted SQLite WASM and executes `SELECT 1`. PR validation needs
no Pages settings or deployment credentials. Only pushes to `main` or manual runs
on `main` upload `dist/` as the Pages artifact and deploy it with the official
configure/upload/deploy actions. Other events never publish PR artifacts.

Builds have only `contents: read`; only the deployment job receives
`pages: write` and `id-token: write`, using the built-in `GITHUB_TOKEN` and OIDC.
No PAT or npm publishing secret is required. Deployments are serialized without
canceling an in-progress production deployment. The relative Vite base and
`?url` SQLite WASM import remain unchanged; only `dist/` is published, not the
library, CLI, repository documentation, or source archive.

---

## 3. Distribute the CLI

Nothing to deploy — it rides along with the npm package:

```bash
npx sqlplay            # end users run it directly
```

If you want a globally installed binary:

```bash
npm install -g sqlplay && sqlplay
```

---

## 4. Use as a dependency (what consumers do)

```bash
npm install sqlplay
```

- **Headless:** `import { createDatabase } from "sqlplay"` — Node or browser.
- **React:** `import { SqlConsole } from "sqlplay/react"` — needs `react` +
  `react-dom` (peer deps). CSS auto-injected.

No build/deploy step for you beyond publishing; their bundler handles the rest
because the WASM is embedded.

---

## 5. Deploy the backend console (`sqlplay/server`)

```js
import express from "express";
import { sqlplay } from "sqlplay/server";

const app = express();
app.use("/db-console", sqlplay({
  database: process.env.DB_FILE || ":memory:",
  init: "./db",              // schema/seed folder
  readOnly: process.env.NODE_ENV === "production",
}));
app.listen(3000);
```

### Security (do not skip)

A console that runs arbitrary SQL is dangerous. Before deploying anywhere
reachable:

- **Gate the route** behind authentication / an admin check.
- **Never mount it on a public path in production.** Prefer dev-only:
  ```js
  if (process.env.NODE_ENV !== "production") {
    app.use("/db-console", sqlplay({ database: ":memory:", init: "./db" }));
  }
  ```
- Use `readOnly: true` for anything beyond local development.
- Put it behind your reverse proxy's auth (basic auth / SSO) if you truly need it
  in a shared environment.

### Persistence notes

- `:memory:` resets when the process restarts (and does not survive horizontal
  scaling — each instance has its own DB).
- A file database (`database: "./dev.sqlite"`) persists across restarts but is
  **single-process**; it is not a substitute for a real shared database.

---

## 6. Continuous integration

The checked-in [Website workflow](../.github/workflows/pages.yml) is the source
of truth for CI and Pages deployment; see [section 2.1](#21-github-pages-for-this-repository).
To run the same validation locally from the repository root:

```bash
npm ci
npm run build:all
npx playwright install --with-deps chromium
npm run test:e2e
npm run test:e2e:pages
```

Publishing on tag (optional): add a `release` job that runs on `v*` tags,
`npm ci`, then `npm publish` with an `NPM_TOKEN` secret.

---

## 7. Versioning

Follow **semver**:

- **patch** — bug fixes, doc changes.
- **minor** — new backward-compatible features (e.g. a new server option).
- **major** — breaking API changes (renaming an export, changing `createDatabase`
  return shape, changing an `exports` path).

Keep a short `CHANGELOG.md` once you have users.

---

## 8. Rollback

- **npm:** you can `npm deprecate sqlplay@x.y.z "reason"` and publish a fixed
  version. Avoid `npm unpublish` (restricted, and breaks anyone depending on it).
- **Static app:** redeploy the previous `dist/` (or previous commit) — it's
  stateless, so rollback is instant.

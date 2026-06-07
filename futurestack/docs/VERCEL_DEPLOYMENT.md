# DISCOVA Vercel Deployment Setup

This is the exact Vercel setup required for reliable deployments.

## Production project

**Canonical Vercel project:** `futurestack-news-52`

- **Domain:** `getdiscova.com`
- **Repo:** `demmyscoalexport-cell/futurestack-news-52`
- **Env vars:** configured on `futurestack-news-52` (Supabase, Contentful, etc.)

A second Vercel project (`discova-ai-platform`) also connects to this repo but is skipped on every push via `ignoreCommand`.

If `getdiscova.com` returns Vercel `NOT_FOUND`, `futurestack-news-52` has no successful production deployment yet — redeploy from the Vercel dashboard or push to `main`.

## 1. Import settings

In Vercel, import the GitHub repository and set:

- Framework Preset: `Next.js`
- Root Directory: `futurestack`
- Install Command: `npm ci`
- Build Command: `npm run vercel:build`
- Output Directory: leave empty / Vercel default
- Node.js Version: `22.x`

Do not set the root directory to the repository root. The repository root is a pnpm workspace and intentionally blocks npm installs. The app that deploys is inside `futurestack`.

## 2. Required environment variables

Set these in Vercel for Production, Preview, and Development:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://YOUR-VERCEL-DOMAIN.com
```

Recommended for database performance:

```text
SUPABASE_DB_URL=
```

If `SUPABASE_DB_URL` is not set, the app falls back to Supabase REST when Supabase public URL and service role key are present.

## 3. Contentful variables

Required when CMS content is ready:

```text
CONTENTFUL_SPACE_ID=
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_ENVIRONMENT_ID=master
CONTENTFUL_DELIVERY_TOKEN=
CONTENTFUL_PREVIEW_TOKEN=
CONTENTFUL_MANAGEMENT_TOKEN=
CONTENTFUL_USE_PREVIEW_API=false
CONTENTFUL_WEBHOOK_SECRET=
CONTENTFUL_DEFAULT_LOCALE=en-US
```

Contentful is not required for the app to build because the app has fallbacks, but it is required for enterprise editorial workflows.

## 4. Optional production services

Add as features are activated:

```text
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## 5. Custom domain (getdiscova.com)

If `https://getdiscova.com` returns Vercel `NOT_FOUND`, the `discova-ai-platform` project has no successful production deployment (domain is attached but nothing is serving).

Fix in Vercel:

1. Open the **`discova-ai-platform`** project in Vercel
2. Go to **Settings → Domains**
3. Add `getdiscova.com` and `www.getdiscova.com`
4. Confirm DNS still points to Vercel (apex A records + `www` CNAME)

If GitHub Actions Vercel secrets are configured, the deploy workflow also attempts to attach these domains automatically after each production deploy.

## 6. GitHub Actions deployment secrets

The workflow always runs lint, typecheck, and build on `main`. Optional Vercel CLI deploy steps run only when these repository secrets exist:

If using the included GitHub Actions workflow to deploy to Vercel, add these repository secrets in GitHub:

```text
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
NEXT_PUBLIC_SITE_URL=
```

`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` allow `vercel pull`, `vercel build`, and `vercel deploy` to run non-interactively in CI.

## 7. Why deployments were failing

The likely deployment blockers were:

1. Vercel project root not set to `futurestack`.
2. Missing `SUPABASE_SERVICE_ROLE_KEY` during build.
3. Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Previous lockfile mismatch causing `npm ci` to fail.
5. GitHub workflow used Node 20 while dependencies now require a newer Node 22 version.
6. GitHub Actions Vercel CLI may not have had `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`, causing non-interactive deploy commands to fail.
7. The deploy workflow used `secrets.*` inside step `if` conditions, which GitHub Actions rejects at parse time. Use repository variables such as `ENABLE_DEPLOY_NOTIFICATIONS=true` for optional notification steps instead.
8. `getdiscova.com` can return Vercel `NOT_FOUND` when DNS still points to Vercel but the domain is not attached to the active project. The deploy workflow now attempts to attach `getdiscova.com` and `www.getdiscova.com` after each production deploy.

## 8. What now protects deployments

- `npm ci` is used for deterministic installs.
- `npm run vercel:build` runs `scripts/vercel-preflight.mjs` before `next build`.
- Preflight checks:
  - Vercel root directory is correct.
  - `package-lock.json` exists.
  - `next.config.mjs` exists.
  - required Supabase env vars exist.
  - `SUPABASE_DB_URL`, if provided, is a valid PostgreSQL URL.
- GitHub pull requests run lint, typecheck, and build but do not deploy.
- Production deploy runs only after checks pass.
- GitHub Actions deploy job passes `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` to the Vercel CLI.

## 9. Local verification command

From `futurestack`:

```bash
npm ci
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key \
SUPABASE_SERVICE_ROLE_KEY=dummy-service-key \
npm run vercel:build
```

For a real production confidence check, replace dummy values with real Vercel/Supabase values.

## 10. After deploy

Open:

- `/`
- `/tools`
- `/news`
- `/api/health`
- `/api/contentful/pull`

If `/api/health` reports database degraded, fix Supabase env vars or run the Supabase SQL setup files.

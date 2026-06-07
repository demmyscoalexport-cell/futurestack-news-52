# DISCOVA — Deploy Checklist

Deploy the Next.js app from the **`futurestack/`** directory (root of the Vercel project).

## Platform

**Vercel** (recommended) — `vercel.json` is already configured.

1. Import repo: `demmyscoalexport-cell/futurestack-news-52`
2. Set **Root Directory** → `futurestack`
3. Install command: `npm ci`
4. Build command: `npm run vercel:build`

See `docs/VERCEL_DEPLOYMENT.md` for the full deployment setup and troubleshooting guide.

## Required environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side writes |
| `SUPABASE_DB_URL` | Recommended | Supabase transaction pooler connection string |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://getdiscova.com` |
| `CONTENTFUL_SPACE_ID` | Optional | CMS content |
| `CONTENTFUL_DELIVERY_TOKEN` | Optional | Read published entries |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Optional | Publish/write to CMS |
| `CONTENTFUL_WEBHOOK_SECRET` | Optional | Sync webhook auth |
| `PRODUCTHUNT_ACCESS_TOKEN` | Optional | PH import cron |
| `RESEND_API_KEY` | Optional | Email digests |
| `INNGEST_EVENT_KEY` | Optional | Background jobs (Inngest Cloud) |
| `INNGEST_SIGNING_KEY` | Optional | Inngest webhook verification |

If `SUPABASE_DB_URL` is not configured, the app falls back to Supabase REST when the public Supabase URL, anon key, and service-role key are present.

## Pre-deploy commands (local)

```bash
cd futurestack
npm ci
npm run health:check
npm run vercel:build
```

## Post-deploy sync

```bash
# Add 150 Product Hunt tools + launch news
npm run import:ph

# Sync Contentful editorial content
npm run sync:contentful
```

## Contentful webhook (production)

- **URL:** `https://getdiscova.com/api/contentful/sync`
- **Secret:** same as `CONTENTFUL_WEBHOOK_SECRET`
- **Events:** Entry publish, unpublish, delete

## Health check

`GET https://getdiscova.com/api/health`

## Production project (Discova)

| Setting | Value |
|---|---|
| Vercel project | **`futurestack-news-52`** |
| Domain | `getdiscova.com` |
| Root directory | `futurestack` |
| Production branch | `main` |
| Env vars | On `futurestack-news-52` |

The duplicate **`discova-ai-platform`** project is skipped on every push via `ignoreCommand`.

After deploy, verify public routes:

```bash
cd futurestack
SITE_URL=https://getdiscova.com npm run smoke:routes
```

### If getdiscova.com shows Vercel NOT_FOUND (urgent)

See **`docs/VERCEL_FIX_NOW.md`** — 2-minute dashboard checklist. No new Vercel account required; builds already succeed on `discova-ai-platform`.

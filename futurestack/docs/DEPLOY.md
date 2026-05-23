# DISCOVA — Deploy Checklist

Deploy the Next.js app from the **`futurestack/`** directory (root of the Vercel project).

## Platform

**Vercel** (recommended) — `vercel.json` is already configured.

1. Import repo: `demmyscoalexport-cell/futurestack-news-52`
2. Set **Root Directory** → `futurestack`
3. Install command: `npm install --legacy-peer-deps`
4. Build command: `npm run build`

## Required environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side writes |
| `SUPABASE_USE_REST` | Yes | Set `true` until Postgres pooler is fixed |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://getdiscova.com` |
| `CONTENTFUL_SPACE_ID` | Optional | CMS content |
| `CONTENTFUL_DELIVERY_TOKEN` | Optional | Read published entries |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Optional | Publish/write to CMS |
| `CONTENTFUL_WEBHOOK_SECRET` | Optional | Sync webhook auth |
| `PRODUCTHUNT_ACCESS_TOKEN` | Optional | PH import cron |
| `RESEND_API_KEY` | Optional | Email digests |
| `INNGEST_EVENT_KEY` | Optional | Background jobs (Inngest Cloud) |
| `INNGEST_SIGNING_KEY` | Optional | Inngest webhook verification |

## Do NOT set on Vercel (until pooler works)

- `SUPABASE_DB_URL` — currently returns "Tenant or user not found"
- `DATABASE_URL` — same issue

The app reads/writes via **Supabase REST** when `SUPABASE_USE_REST=true`.

## Pre-deploy commands (local)

```bash
cd futurestack
npm install --legacy-peer-deps
npm run health:check
npm run build
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

# DISCOVA — Africa's Digital Discovery Operating System

AI-powered SaaS & AI tool discovery platform — find, compare, and build stacks of the best tools for your role.

## Quick Start

```bash
cd futurestack && npm run dev              # Start the app (port 3000 + Inngest dev server)
cd futurestack && npm run health           # ✅ Verify everything is working
cd futurestack && npm run restore          # 🔧 Fix any broken state (logos, DB, etc.)
cd futurestack && npm run migrate:supabase # 📦 Export Replit PG data → Supabase SQL
```

## Maintenance Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Health check | `npm run health` | Verify all pages, APIs, DB, and logos |
| Restore | `npm run restore` | Re-seed missing data + restore logos |
| Quick seed | `node scripts/seed-pg.mjs --quick` | Seed DB (fast, Clearbit logos) |
| Full seed | `node scripts/seed-pg.mjs` | Full seed with WaveSpeed AI logos |
| Regen logos | `POST /api/generate-logos` | Bulk AI logo generation for all tools |
| Migrate to Supabase | `npm run migrate:supabase` | Export data as SQL for Supabase import |

---

## ✅ Switching to Supabase (Backend Migration)

The app is already wired to auto-detect Supabase. Adding one secret is all that's needed.

### Step 1 — Resume your Supabase project
Go to [supabase.com/dashboard](https://supabase.com/dashboard) → find project `mjqkptowvgzmrojlgcms` → click **Restore project** (takes ~2 min).

### Step 2 — Apply the schema
In Supabase → **SQL Editor → New Query**, paste and run:
```
futurestack/supabase/deploy_schema.sql
```

### Step 3 — Export and import your data
```bash
cd futurestack && npm run migrate:supabase
```
This generates `futurestack/supabase/data_migration.sql`. Paste and run it in Supabase SQL Editor.

### Step 4 — Get the connection string
Supabase Dashboard → **Settings → Database → Connection string**
Copy the **Transaction pooler** URI (port 6543):
```
postgresql://postgres.xxxx:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Step 5 — Add the secret
In Replit → Secrets, add:
```
SUPABASE_DB_URL = postgresql://postgres.xxxx:[PASSWORD]@...
```

### Step 6 — Restart
Restart the "FutureStack Dev" workflow. The admin panel header will show **"Supabase ✓"** in green when active.

> The `lib/db.ts` pool automatically picks up `SUPABASE_DB_URL` over `DATABASE_URL`. All 24 API routes and inngest functions keep working unchanged — Supabase is 100% PostgreSQL-compatible.

---

## ✅ Connecting Contentful (CMS for Articles & Tools)

Contentful is already fully wired — the client, mappers, webhook handler, and sync API all exist. You just need to add 3 secrets.

### Step 1 — Create a Contentful account
Go to [contentful.com](https://contentful.com) → create a free account → create a **Space** named "DISCOVA".

### Step 2 — Create your Content Models
In your Space → **Content Model**, create two types:

**`newsArticle`** with fields:
- `title` (Short text, required)
- `slug` (Short text, required, unique)
- `excerpt` (Short text)
- `body` (Long text / Rich text)
- `tags` (Short text, list)
- `heroImageUrl` (Short text)
- `publishedAt` (Date & time)
- `readingTime` (Integer)
- `status` (Short text: published/draft/archived)

**`tool`** with fields:
- `name` (Short text, required)
- `slug` (Short text, required, unique)
- `tagline` (Short text)
- `description` (Long text)
- `logoUrl` (Short text)
- `websiteUrl` (Short text)
- `categorySlug` (Short text)
- `tags` (Short text, list)
- `pricingModel` (Short text)
- `freeTier` (Boolean)
- `verified` (Boolean)
- `status` (Short text: published/draft/archived)

### Step 3 — Get your API keys
Contentful → **Settings → API Keys → Add API Key**. Note:
- Space ID
- Content Delivery API access token
- Content Management API token (Settings → CMA tokens)

### Step 4 — Add secrets to Replit
```
CONTENTFUL_SPACE_ID          = your-space-id
CONTENTFUL_DELIVERY_TOKEN    = your-delivery-token
CONTENTFUL_MANAGEMENT_TOKEN  = your-management-token
CONTENTFUL_ENVIRONMENT       = master
CONTENTFUL_WEBHOOK_SECRET    = any-random-secret-string
```

### Step 5 — Set up the webhook in Contentful
Contentful → **Settings → Webhooks → Add Webhook**:
- URL: `https://your-domain.replit.app/api/contentful/sync`
- Triggers: **Publish**, **Unpublish**, **Delete** for Entry
- Header: `x-discova-webhook-secret: your-secret`

### Step 6 — Manual bulk sync
To pull all existing Contentful articles into your DB at once:
```bash
curl -X POST https://your-app.replit.app/api/contentful/pull \
  -H "x-discova-sync-secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"syncNews": true, "syncTools": true}'
```

After this, every time you **Publish** an article in Contentful it automatically appears on DISCOVA.

---

## Stack

- **Next.js 16** + React 19 + TypeScript
- **PostgreSQL** — Replit heliumdb (default) OR Supabase (set `SUPABASE_DB_URL`)
- **Supabase** — auth (login/signup/dashboard) + typed JS client (`lib/supabase/db.ts`)
- **Contentful** — headless CMS for editorial articles and curated tools
- Inngest — background job orchestration
- Tailwind CSS + Framer Motion
- Cloudinary — image hosting
- WaveSpeed AI — AI logo generation

## Where Things Live

- `futurestack/` — main Next.js application
- `futurestack/app/` — Next.js App Router pages and API routes
- `futurestack/lib/db.ts` — PostgreSQL pool (auto-detects Supabase vs Replit PG)
- `futurestack/lib/supabase/db.ts` — Typed Supabase admin client for JS-style queries
- `futurestack/lib/supabase/` — Auth clients (client.ts, server.ts, admin.ts)
- `futurestack/lib/contentful/` — Contentful service, client, mappers, types, pipeline
- `futurestack/lib/queries/` — SQL query files (tools.ts, articles.ts, stacks.ts, radar.ts)
- `futurestack/lib/image-gen.ts` — WaveSpeed + Cloudinary pipeline
- `futurestack/lib/logo-resolver.ts` — logo priority: local SVG → stored URL → Google favicon
- `futurestack/inngest/` — background job functions (daily articles, PH sync, scores, etc.)
- `futurestack/scripts/healthcheck.mjs` — full health check
- `futurestack/scripts/restore.mjs` — auto-restore broken state
- `futurestack/scripts/seed-pg.mjs` — PostgreSQL seed script
- `futurestack/scripts/migrate-to-supabase.mjs` — export data for Supabase migration
- `futurestack/supabase/deploy_schema.sql` — schema (run this in Supabase SQL Editor first)
- `futurestack/public/tools/` — local SVG brand logos

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/search` | GET | Keyword search across tools |
| `/api/generate-image` | GET/POST | Single AI image (WaveSpeed → Cloudinary) |
| `/api/generate-logos` | GET/POST | Bulk logo generation for all tools |
| `/api/newsletter` | POST | Newsletter subscribe |
| `/api/submit-tool` | POST | Tool submission form |
| `/api/ask-ai` | POST | AI Q&A about tools (Replit Anthropic) |
| `/api/stack-builder/recommend` | POST | AI stack recommendations |
| `/api/stack-builder/save` | POST | Save a stack |
| `/api/contentful/pull` | GET | Preview Contentful content |
| `/api/contentful/pull` | POST | Sync Contentful → Database |
| `/api/contentful/sync` | POST | Contentful webhook handler (auto-sync on publish) |
| `/api/stripe/checkout` | POST | Stripe checkout (returns 503 if unconfigured) |
| `/api/stripe/portal` | POST | Stripe billing portal |
| `/api/inngest` | GET/POST/PUT | Inngest event handler |

## Database Schema

Key tables (schema in `supabase/deploy_schema.sql`):
- `tools` — `tagline`, `website_url`, `is_featured`, `status`, `pricing_model`, `logo`
- `articles` — `hero_image`, `cover_image_url`, `category_id` (FK), `reading_time`, `is_featured`
- `categories` — article categories
- `tool_categories` — tool categories
- `tool_scores` — computed `futurestack_score` from 6 sub-scores
- `tool_pricing` — pricing tiers per tool
- `stacks` + `stack_tools` — curated tool stacks
- `authors` — article authors

## Architecture Decisions

- **`lib/db.ts`**: Singleton pg.Pool. Checks `SUPABASE_DB_URL` first, falls back to `DATABASE_URL`. All raw SQL queries work with both — zero rewrites needed for migration.
- **`lib/supabase/db.ts`**: Typed admin client for JS-style queries (`.from().select()`). Use for new code that doesn't need complex joins.
- **Contentful**: News page tries Contentful first (if configured), merges with DB articles (deduplicated by slug), falls back to DB only.
- **Image generation**: all WaveSpeed + Cloudinary logic lives in `lib/image-gen.ts` — never call `/api/generate-image` via HTTP from server code.
- Inngest runs locally alongside Next.js via `concurrently`.
- Stripe routes return clean 503 when keys not configured.
- `ask-ai` uses Replit AI Anthropic integration (no separate API key needed).

## User Preferences

- Build for freelancers, agencies, and SaaS founders in Africa and globally
- Africa-friendly tools prominently featured
- Clean, dark-themed UI with Tailwind + Framer Motion animations
- Real brand logos (not AI-generated art) — use Clearbit/Google favicon/local SVGs

## Gotchas

- **DB auto-switch**: add `SUPABASE_DB_URL` secret → restart → done. Admin panel shows current DB source.
- **Contentful webhook header**: `x-discova-webhook-secret` (legacy `x-futurestack-webhook-secret` still accepted).
- **Never call `/api/generate-image` via HTTP from server code** — import `lib/image-gen.ts` directly.
- **Never use `NEXT_PUBLIC_SITE_URL`** for internal server-to-server calls.
- Run seed from `futurestack/` directory: `node scripts/seed-pg.mjs --quick`
- Google favicon URLs use root domain (strip subdomains): `chat.openai.com` → `openai.com`
- Local SVG logos live in `futurestack/public/tools/` and are served at `/tools/name.svg`
- Auth pages (`/login`, `/signup`, `/account`, `/dashboard`) need a live Supabase project

# DISCOVA — Africa's Digital Discovery Operating System

AI-powered SaaS & AI tool discovery platform. Find, compare, and build stacks of the best tools for your role — built Africa-first, used globally.

**Live:** https://getdiscova.com &nbsp;|&nbsp; **Stack:** Next.js 16 · Supabase · Tailwind · Framer Motion · Inngest

---

## Run locally in VS Code (5 minutes)

### 1 — Clone & install

```bash
git clone https://github.com/demmyscoalexport-cell/futurestack-news-52.git
cd futurestack-news-52/futurestack
npm install
```

### 2 — Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values. The minimum required to run the app:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `SUPABASE_DB_URL` | Supabase → Settings → Database → Transaction pooler URI (port 6543) |
| `SUPABASE_DB_PASSWORD` | Your Supabase DB password |

Everything else (Contentful, Paystack, GNews, etc.) is optional — the app works without them, those features just won't activate.

### 3 — Set up the database

Run this once in your **Supabase SQL Editor** (supabase.com → your project → SQL Editor):

```sql
-- Paste the entire contents of:  supabase/deploy_schema.sql
```

Then seed initial data:

```bash
node scripts/seed-pg.mjs --quick
```

### 4 — Start the app

```bash
npm run dev
```

Visit **http://localhost:3000** — the app is live.

> **Tip:** Install the [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) and [Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma) VS Code extensions for the best experience.

---

## Deploy to Vercel

### Step 1 — Push to GitHub (already done if you cloned this repo)

### Step 2 — Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and click **Import Git Repository**
2. Select **futurestack-news-52** from your GitHub list
3. In the **Configure Project** screen:
   - Set **Root Directory** → `futurestack`
   - Framework will auto-detect as **Next.js**
   - Build command: `npm run build` (auto-filled)
   - Output directory: `.next` (auto-filled)
4. Click **Environment Variables** and add every variable from `.env.example`
   - For production, change `NEXT_PUBLIC_SITE_URL` to your Vercel URL (e.g. `https://discova.vercel.app`)
   - Remove `INNGEST_DEV=1` (not needed in production)
   - Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` from [inngest.com](https://www.inngest.com) for background jobs
5. Click **Deploy**

### Step 3 — Post-deploy (one time)

After your first successful deploy, run the DB seed against your production database:

```bash
# From your local machine, with SUPABASE_DB_URL pointing to production:
node scripts/seed-pg.mjs --quick
```

That's it — your app is live on Vercel.

---

## All environment variables

See [`.env.example`](.env.example) for the full list with descriptions and links. Quick reference:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase admin key (server only) |
| `SUPABASE_DB_URL` | ✅ | PostgreSQL connection string |
| `SUPABASE_DB_PASSWORD` | ✅ | DB password |
| `CONTENTFUL_*` | optional | Headless CMS for editorial content |
| `GNEWS_API_KEY` | optional | Live news articles |
| `PRODUCTHUNT_API_TOKEN` | optional | ProductHunt tool sync |
| `SCRAPINGBEE_API_KEY` | optional | Web scraping |
| `WAVESPEED_API_KEY` | optional | AI logo generation |
| `CLOUDINARY_*` | optional | Image hosting + CDN |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | optional | Paystack payments (Africa) |
| `PAYSTACK_SECRET_KEY` | optional | Paystack server-side |
| `VAPID_*` | optional | Web push notifications |
| `SESSION_SECRET` | optional | Session signing |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | Error tracking (Sentry) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | Google Analytics |
| `INNGEST_EVENT_KEY` | production | Inngest background jobs |
| `INNGEST_SIGNING_KEY` | production | Inngest webhook verification |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google, Magic Link, Password) |
| Background jobs | Inngest |
| Payments | Paystack (Africa) + Stripe |
| CMS | Contentful (optional) |
| Image hosting | Cloudinary |
| AI logos | WaveSpeed |
| Push notifications | Web Push (VAPID) |
| Styling | Tailwind CSS + Framer Motion |
| Error monitoring | Built-in (`/admin/errors`) + Sentry-ready |

---

## Key scripts

```bash
npm run dev          # Start app + Inngest dev server
npm run build        # Production build
npm run start        # Start production server
npm run health       # Full health check (pages, APIs, DB, logos)
npm run restore      # Re-seed missing data + restore logos
node scripts/seed-pg.mjs --quick          # Quick seed with Clearbit logos
node scripts/seed-pg.mjs                  # Full seed with AI logos
node scripts/run-schema.mjs               # Apply DB schema additions
node scripts/migrate-affiliates.mjs       # Migrate affiliate links
```

---

## Admin panel

Available at `/admin` — requires `role = 'admin'` on your Supabase profile row.

| Page | Purpose |
|------|---------|
| `/admin` | Dashboard overview + affiliate stats |
| `/admin/tools` | Add, edit, delete, feature tools |
| `/admin/content` | Manage articles (publish/draft/archive) |
| `/admin/errors` | Live error monitoring dashboard |
| `/admin/analytics` | Platform stats + click charts |
| `/admin/reviews` | Moderate user reviews |
| `/admin/users` | Manage user roles |
| `/admin/affiliates` | Affiliate links + UTM tracking |
| `/admin/newsletter` | Newsletter subscribers |
| `/admin/deals` | Deals & discounts |

To give yourself admin access, run in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Automated daily jobs (Inngest)

| Job | Schedule | What it does |
|-----|----------|-------------|
| `sync-gnews` | Every 6h | Fetches AI/tech news, expands with Claude |
| `sync-producthunt` | 8am daily | Pulls top PH launches → saves as tools |
| `generate-daily-articles` | 8am daily | AI-written articles on trending topics |
| `watchdog` | Every hour | Health monitoring |

In development these run on demand via the Inngest Dev UI at **http://localhost:8288**.

---

## Project structure

```
futurestack/
├── app/
│   ├── admin/            # Admin pages (errors, tools, content, analytics…)
│   └── api/              # API routes (tools, articles, paystack, log-error…)
├── components/
│   ├── providers/        # ErrorBoundary, AuthProvider, ThemeProvider
│   └── cards/            # ToolCard, ArticleCard, etc.
├── inngest/              # Background job functions
├── lib/
│   ├── supabase/         # Supabase clients (client, server, admin, guard)
│   ├── contentful/       # Contentful CMS integration
│   ├── error-logger.ts   # Server-side error logging
│   ├── db.ts             # Raw pg pool (auto-switches Supabase ↔ Replit PG)
│   └── queries/          # SQL query files
├── public/
│   ├── tools/            # Local SVG brand logos
│   └── sw.js             # Web push service worker
├── scripts/              # Maintenance, migration, and seed scripts
├── supabase/
│   └── deploy_schema.sql # Full DB schema — run this first in SQL Editor
├── .env.example          # Template for all environment variables
└── vercel.json           # Vercel deployment config
```

---

## Database

All data lives in Supabase. Key tables:

| Table | Purpose |
|-------|---------|
| `tools` | All discovered tools |
| `articles` | News & editorial content |
| `categories` / `tool_categories` | Taxonomy |
| `profiles` | User profiles + roles |
| `reviews` | User tool reviews |
| `stacks` + `stack_tools` | Curated tool stacks |
| `affiliate_links` + `affiliate_clicks` | Affiliate tracking |
| `error_logs` | App error monitoring |

Schema: [`supabase/deploy_schema.sql`](supabase/deploy_schema.sql)

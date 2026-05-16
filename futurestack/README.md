# DISCOVA — Africa's Digital Discovery Operating System

AI-powered SaaS & AI tool discovery platform. Find, compare, and build stacks of the best tools for your role — built Africa-first, used globally.

---

## Quick Start (after cloning)

```bash
# 1. Install dependencies
cd futurestack && npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in every value in .env.local (see below)

# 3. Set up Supabase database
#    — Run supabase/deploy_schema.sql in Supabase SQL Editor first
#    — Then run:
node scripts/run-schema.mjs        # applies schema additions + RPC functions
node scripts/migrate-affiliates.mjs # migrates affiliate data

# 4. Start the app
npm run dev
```

---

## Required Secrets

Copy `.env.example` → `.env.local` and fill in these values:

| Secret | Where to get it |
|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `SUPABASE_MANAGEMENT_TOKEN` | https://app.supabase.com/account/tokens |
| `VAPID_PUBLIC_KEY` + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Run: `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Same command above |
| `GNEWS_API_KEY` | https://gnews.io/dashboard |
| `PRODUCTHUNT_API_TOKEN` | https://api.producthunt.com/v2/oauth/applications |
| `SCRAPINGBEE_API_KEY` | https://app.scrapingbee.com/account |
| `WAVESPEED_API_KEY` | WaveSpeed dashboard |
| `CLOUDINARY_*` | https://console.cloudinary.com |
| `RESEND_API_KEY` | https://resend.com/api-keys |
| `SESSION_SECRET` | Any random 64-character string |

Optional:

| Secret | Purpose |
|--------|---------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 |
| `CONTENTFUL_*` | Headless CMS for editorial content |
| `STRIPE_*` | Payment processing |

---

## Database Setup (Supabase)

All data lives in Supabase. No other database needed.

```bash
# Step 1 — Run base schema in Supabase SQL Editor:
#   Open: supabase/deploy_schema.sql → paste → Run

# Step 2 — Apply additions (affiliate tables, push subscriptions, RPCs):
node scripts/run-schema.mjs

# Step 3 — Seed initial tool data:
node scripts/seed-pg.mjs --quick

# Step 4 — (optional) Migrate affiliate links:
node scripts/migrate-affiliates.mjs
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Background jobs | Inngest |
| Email | Resend |
| Image hosting | Cloudinary |
| AI logos | WaveSpeed |
| Push notifications | Web Push (VAPID) |
| Styling | Tailwind CSS + Framer Motion |

---

## Key Scripts

```bash
npm run dev          # Start app + Inngest dev server
npm run health       # Full health check (pages, APIs, DB, logos)
npm run restore      # Re-seed missing data + restore logos
node scripts/run-schema.mjs            # Apply DB schema changes
node scripts/migrate-affiliates.mjs    # Migrate affiliate links → Supabase
node scripts/seed-pg.mjs --quick       # Quick seed with Clearbit logos
```

---

## Admin Panel

Available at `/admin` (requires admin role on your Supabase profile):

- `/admin/tools` — Add, edit, delete tools; toggle featured/Africa-ready
- `/admin/content` — Manage articles, publish/draft/archive
- `/admin/analytics` — Platform stats + affiliate click charts
- `/admin/reviews` — Moderate user reviews
- `/admin/users` — Manage user roles

---

## Automated Daily Jobs (Inngest)

| Job | Schedule | What it does |
|-----|----------|-------------|
| `sync-gnews` | Every 6h | Fetches AI/tech news, expands with Claude, saves to Supabase |
| `sync-producthunt` | 8am daily | Pulls top PH launches, saves tools to Supabase |
| `generate-daily-articles` | 8am daily | AI-written articles on trending topics |
| `watchdog` | Every hour | Health monitoring |

---

## Project Structure

```
futurestack/
├── app/                  # Next.js App Router pages + API routes
│   ├── admin/            # Admin management pages
│   └── api/              # API routes
├── components/           # Reusable React components
├── inngest/              # Background job functions
├── lib/
│   ├── supabase/         # Supabase clients (client, server, admin)
│   ├── supabase-writer.ts # Supabase write helpers for Inngest
│   ├── db.ts             # Raw pg pool (Supabase via pooler)
│   └── queries/          # SQL query files
├── public/
│   └── sw.js             # Web push service worker
├── scripts/              # Maintenance and migration scripts
└── supabase/
    ├── deploy_schema.sql      # Base schema (run first in SQL Editor)
    └── schema-additions.sql   # Extensions: affiliates, push, RPCs
```

# FutureStack News

AI-powered SaaS & AI tool discovery platform — find, compare, and build stacks of the best tools for your role.

## Run & Operate

- `cd futurestack && npm run dev` — start the app (port 3000, with Inngest dev server)
- `cd futurestack && node scripts/seed-pg.mjs --quick` — seed Replit PostgreSQL (fast, clearbit logos)
- `cd futurestack && node scripts/seed-pg.mjs` — full seed with WaveSpeed AI logos → Cloudinary

## Stack

- Next.js 15 + React 19 + TypeScript
- **Replit PostgreSQL** (heliumdb) — primary database via `pg` driver
- Inngest (background job orchestration — INNGEST_DEV=1 for local)
- Tailwind CSS + Framer Motion
- Cloudinary (image hosting)
- WaveSpeed AI flux-schnell (AI logo generation)
- Supabase credentials kept (for auth pages, but core content runs on Replit PG)

## Where things live

- `futurestack/` — main Next.js application
- `futurestack/app/` — Next.js App Router pages and API routes
- `futurestack/lib/db.ts` — PostgreSQL pool (connects to Replit heliumdb)
- `futurestack/lib/queries/tools.ts` — pg-backed tool queries
- `futurestack/lib/queries/articles.ts` — pg-backed article queries
- `futurestack/lib/queries/stacks.ts` — pg-backed stack queries
- `futurestack/lib/supabase/` — Supabase clients (still used for auth routes)
- `futurestack/inngest/` — background job functions
- `futurestack/scripts/seed-pg.mjs` — PostgreSQL seed script (54 tools, 8 articles, 8 stacks)
- `futurestack/supabase/deploy_schema.sql` — schema reference (applied to Replit PG already)
- `futurestack/.env.local` — all credentials

## Database Schema (Replit PostgreSQL)

Schema applied to Replit PostgreSQL (`heliumdb`). Key tables:
- `tools` — `tagline`, `website_url`, `is_featured`, `status`, `pricing_model`, `logo`
- `articles` — `hero_image`, `cover_image_url`, `category_id` (FK to `categories`), `reading_time`, `is_featured`
- `categories` — article categories (separate from `tool_categories`)
- `tool_scores` — computed `futurestack_score` from 6 sub-scores
- `tool_pricing` — pricing tiers per tool (104 tiers seeded)
- `stacks` + `stack_tools` — curated tool stacks
- `authors` — article authors

## Database Status

**Replit PostgreSQL:** ACTIVE (helium:5432, heliumdb) — always-on, no pausing.
**Data:** 54 tools, 104 pricing tiers, 8 articles, 8 stacks, 5 authors, 28 alternative pairs.

To re-seed: `cd futurestack && node scripts/seed-pg.mjs --quick`

## Credentials (stored as Replit secrets)

- `DATABASE_URL` + `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — Replit PG
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` — kept for auth routes
- `WAVESPEED_API_KEY` — for AI logo generation
- `CLOUDINARY_CLOUD_NAME=dxizihlmo` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`
- `INNGEST_DEV=1` — enables Inngest local dev mode

## Architecture decisions

- **Data layer migrated from Supabase JS client to direct PostgreSQL** (`pg` pool)
- `lib/db.ts` exports a singleton `Pool` connecting to Replit heliumdb
- Core query files (`lib/queries/*.ts`) use SQL directly — same return shapes as before
- Auth pages (`/login`, `/signup`, `/account`, `/dashboard`) still use Supabase client and may fail until Supabase project is restored
- `ToolCard` component is a Client Component (has `onError` handler on img)
- Search API (`/api/search`) now uses pg directly — no OpenAI embedding, keyword search only
- Schema uses `categories` table for articles (not `tool_categories`)
- Articles use `hero_image` as canonical image field (also has `cover_image_url` alias)
- Inngest runs locally alongside Next.js via `concurrently`

## User preferences

- Build for freelancers, agencies, and SaaS founders in Africa and globally
- Africa-friendly tools prominently featured
- Clean, dark-themed UI with Tailwind + Framer Motion animations

## Gotchas

- Replit PostgreSQL never pauses — always available in the workspace
- Run seed from `futurestack/` directory: `node scripts/seed-pg.mjs --quick`
- `next.config.mjs` must have `allowedDevOrigins` for Replit preview to work
- Supabase credentials are kept in `.env.local` but Supabase project `mjqkptowvgzmrojlgcms` may be paused
- Auth/admin features require a live Supabase project — restore from dashboard if needed

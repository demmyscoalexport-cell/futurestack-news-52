# FutureStack News

AI-powered SaaS & AI tool discovery platform — find, compare, and build stacks of the best tools for your role.

## Run & Operate

- `cd futurestack && npm run dev` — start the app (port 3000, with Inngest dev server)
- `node scripts/seed-with-images.mjs --quick` — seed DB with logos (fast, no AI images)
- `node scripts/seed-with-images.mjs` — full seed with WaveSpeed AI logos → Cloudinary

## Stack

- Next.js 15 + React 19 + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- Inngest (background job orchestration — INNGEST_DEV=1 for local)
- Tailwind CSS + Framer Motion
- Cloudinary (image hosting)
- WaveSpeed AI flux-schnell (AI logo generation)

## Where things live

- `futurestack/` — main Next.js application
- `futurestack/app/` — Next.js App Router pages and API routes
- `futurestack/lib/` — shared libraries (Supabase clients, queries, types)
- `futurestack/inngest/` — background job functions
- `futurestack/scripts/seed-with-images.mjs` — full DB seeder (100+ tools, 8 articles, 8 stacks)
- `futurestack/supabase/deploy_schema.sql` — DEFINITIVE schema (matches actual column names)
- `futurestack/.env.local` — all credentials

## Database Schema

Source of truth: `futurestack/supabase/deploy_schema.sql`
Apply by pasting into Supabase SQL Editor → Run.

Key column names (DO NOT use the old schema files):
- `tools`: `tagline`, `website_url`, `is_featured`, `status`, `pricing_model`, `logo`
- `articles`: `hero_image`, `cover_image_url`, `category_id` (FK to `categories`), `reading_time`, `is_featured`
- `categories` (article categories) — separate from `tool_categories`

## Supabase Status

**Project ref:** `mjqkptowvgzmrojlgcms`
**URL:** `https://mjqkptowvgzmrojlgcms.supabase.co`
**Status:** PAUSED (free tier — needs manual restore)

To restore: https://supabase.com/dashboard → find project → click "Restore"
After restore: paste `deploy_schema.sql` into SQL Editor → Run → then run seed script.

## Credentials (stored as Replit env vars AND in .env.local)

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `WAVESPEED_API_KEY` — for AI logo generation
- `CLOUDINARY_CLOUD_NAME=dxizihlmo` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`
- `INNGEST_DEV=1` — enables Inngest local dev mode

## Architecture decisions

- Schema uses `categories` table for articles (not `tool_categories`)
- Tools use text `category` column pointing to `tool_categories.id`
- Articles use `hero_image` as canonical image field (also has `cover_image_url` alias)
- Inngest runs locally alongside Next.js via `concurrently`
- All Supabase queries return empty arrays on error (graceful degradation)

## User preferences

- Build for freelancers, agencies, and SaaS founders in Africa and globally
- Africa-friendly tools prominently featured
- Clean, dark-themed UI with Tailwind + Framer Motion animations

## Gotchas

- Supabase free tier pauses after 1 week of inactivity — restore from dashboard
- Run seed from `futurestack/` directory: `node scripts/seed-with-images.mjs --quick`
- `next.config.js` must have `allowedDevOrigins` for Replit preview to work
- Do NOT use old schema files (schema.sql, complete_schema.sql, migration_002) — use deploy_schema.sql

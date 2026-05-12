# FutureStack News

AI-powered SaaS & AI tool discovery platform — find, compare, and build stacks of the best tools for your role.

## Quick Start

```bash
cd futurestack && npm run dev        # Start the app (port 3000 + Inngest dev server)
cd futurestack && npm run health     # ✅ Verify everything is working
cd futurestack && npm run restore    # 🔧 Fix any broken state (logos, DB, etc.)
```

## Maintenance Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Health check | `npm run health` | Verify all pages, APIs, DB, and logos |
| Restore | `npm run restore` | Re-seed missing data + restore logos |
| Quick seed | `node scripts/seed-pg.mjs --quick` | Seed Replit PG (fast, Clearbit logos) |
| Full seed | `node scripts/seed-pg.mjs` | Full seed with WaveSpeed AI logos |
| Regen logos | `POST /api/generate-logos` | Bulk AI logo generation for all tools |

## Stack

- Next.js 15 + React 19 + TypeScript
- **Replit PostgreSQL** (heliumdb) — primary database via `pg` driver
- Inngest (background job orchestration — INNGEST_DEV=1 for local)
- Tailwind CSS + Framer Motion
- Cloudinary (image hosting)
- WaveSpeed AI flux-schnell (AI logo generation)
- Supabase credentials kept (for auth pages, but core content runs on Replit PG)

## Where Things Live

- `futurestack/` — main Next.js application
- `futurestack/app/` — Next.js App Router pages and API routes
- `futurestack/app/home-client.tsx` — homepage with role selector (Freelancer/Agency/Founder persona cards with Unsplash images)
- `futurestack/app/tools/tools-content.tsx` — Futurepedia-style tools directory
- `futurestack/components/cards/tool-profile-card.tsx` — tool card with real logos, pricing, tags, ratings
- `futurestack/components/ui/role-selector.tsx` — persona selector with Unsplash photo cards
- `futurestack/lib/db.ts` — PostgreSQL pool (connects to Replit heliumdb)
- `futurestack/lib/image-gen.ts` — shared WaveSpeed + Cloudinary pipeline (use this, NOT HTTP self-calls)
- `futurestack/lib/logo-resolver.ts` — logo priority: local SVG → stored URL → Google favicon
- `futurestack/lib/queries/tools.ts` — pg-backed tool queries
- `futurestack/lib/queries/articles.ts` — pg-backed article queries
- `futurestack/lib/queries/stacks.ts` — pg-backed stack queries
- `futurestack/lib/supabase/` — Supabase clients (still used for auth routes)
- `futurestack/inngest/` — background job functions
- `futurestack/scripts/healthcheck.mjs` — full health check (pages, APIs, DB, logos)
- `futurestack/scripts/restore.mjs` — auto-restore broken state
- `futurestack/scripts/seed-pg.mjs` — PostgreSQL seed script (54 tools, 8 articles, 9 stacks)
- `futurestack/supabase/deploy_schema.sql` — schema reference (applied to Replit PG already)
- `futurestack/public/tools/` — local SVG brand logos (ChatGPT, Claude, Canva, Figma, Zapier, etc.)

## Database Schema (Replit PostgreSQL)

Schema applied to Replit PostgreSQL (`heliumdb`). Key tables:
- `tools` — `tagline`, `website_url`, `is_featured`, `status`, `pricing_model`, `logo`
- `articles` — `hero_image`, `cover_image_url`, `category_id` (FK to `categories`), `reading_time`, `is_featured`
- `categories` — article categories (separate from `tool_categories`)
- `tool_scores` — computed `futurestack_score` from 6 sub-scores
- `tool_pricing` — pricing tiers per tool (104 tiers seeded)
- `stacks` + `stack_tools` — curated tool stacks
- `authors` — article authors

## Database Status (Last Verified)

**Replit PostgreSQL:** ACTIVE (helium:5432, heliumdb) — always-on, no pausing.

| Table | Count |
|-------|-------|
| tools (active) | 54 |
| tools with logos | 54 |
| tool_pricing tiers | 104 |
| tool_scores | 54 |
| articles | 8 |
| stacks | 9 |
| authors | 5 |
| tool_alternatives | 28 |
| categories | 10 |

Re-seed if needed: `cd futurestack && node scripts/seed-pg.mjs --quick`

## Logo System (Three-Tier Priority)

1. **Local SVG** (`/public/tools/*.svg`) — exact brand logos for 20+ major tools (ChatGPT, Claude, Canva, Figma, Zapier, GitHub, Midjourney, etc.)
2. **Clearbit** (`logo.clearbit.com/{domain}`) — stored in DB for all standard `.com/.io/.ai` domains
3. **Google Favicon** (`google.com/s2/favicons?domain=X&sz=128`) — stored in DB for unusual TLDs (`.dev`, `.new`, `.art`, `.pro`)

The `resolveToolLogo()` in `lib/logo-resolver.ts` handles the priority chain. The `ToolProfileCard` component falls back to a letter avatar on image error.

## Credentials (Stored as Replit Secrets + .env.local)

### Replit Secrets (always available in process.env)
- `DATABASE_URL` + `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — Replit PG
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` — kept for auth routes

### .env.local (Next.js only — not available in bare node scripts)
- `WAVESPEED_API_KEY` — WaveSpeed AI image generation
- `CLOUDINARY_CLOUD_NAME=dxizihlmo` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`
- `INNGEST_DEV=1` — enables Inngest local dev mode

The `scripts/healthcheck.mjs` loads `.env.local` automatically so it can verify these too.

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
| `/api/stripe/checkout` | POST | Stripe checkout (returns 503 if unconfigured) |
| `/api/stripe/portal` | POST | Stripe billing portal |
| `/api/stripe/webhook` | POST | Stripe webhook handler |
| `/api/inngest` | GET/POST/PUT | Inngest event handler |

## Architecture Decisions

- **Data layer migrated from Supabase JS client to direct PostgreSQL** (`pg` pool)
- `lib/db.ts` exports a singleton `Pool` connecting to Replit heliumdb
- Core query files (`lib/queries/*.ts`) use SQL directly
- **Image generation**: all WaveSpeed + Cloudinary logic lives in `lib/image-gen.ts` — never call `/api/generate-image` via HTTP from server code
- Auth pages (`/login`, `/signup`, `/account`, `/dashboard`) still use Supabase client and may fail until Supabase project is restored
- `ToolProfileCard` is a Client Component (uses useState for image error handling)
- Search API (`/api/search`) uses pg directly — keyword search, no embeddings
- Schema uses `categories` table for articles (not `tool_categories`)
- Articles use `hero_image` as canonical image field (also has `cover_image_url` alias)
- Inngest runs locally alongside Next.js via `concurrently`
- Stripe routes return clean 503 when keys not configured (no crashes)
- `ask-ai` uses Replit AI Anthropic integration (no separate API key needed)

## User Preferences

- Build for freelancers, agencies, and SaaS founders in Africa and globally
- Africa-friendly tools prominently featured
- Clean, dark-themed UI with Tailwind + Framer Motion animations
- Real brand logos (not AI-generated art) — use Clearbit/Google favicon/local SVGs

## Gotchas

- Replit PostgreSQL never pauses — always available in the workspace
- Run seed from `futurestack/` directory: `node scripts/seed-pg.mjs --quick`
- `next.config.mjs` must have `allowedDevOrigins` for Replit preview to work
- Supabase credentials kept in `.env.local` but project `mjqkptowvgzmrojlgcms` may be paused — auth pages need a live Supabase project
- **Never call `/api/generate-image` via HTTP from server code** — import `lib/image-gen.ts` directly
- **Never use `NEXT_PUBLIC_SITE_URL`** for internal server-to-server API calls (it resolves to production URL)
- `logo-resolver.ts` step 3 passes through stored logo URLs as-is (do not add `!includes("clearbit")` check — that was the bug)
- `ToolProfileCard` uses `useState(false)` for `errored` — always shows letter fallback when image fails
- Google favicon URLs use root domain (strip subdomains): `chat.openai.com` → `openai.com`
- Local SVG logos live in `futurestack/public/tools/` and are served at `/tools/name.svg`

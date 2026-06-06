# DISCOVA Project State

Last updated: 2026-06-06

## What we are building

DISCOVA is a premium software and AI discovery ecosystem. It should feel closer to a mix of Futurepedia, Product Hunt, G2, Capterra, YouTube, Notion, Apple product pages, and Wikipedia than a simple directory.

The product goal is for users to discover, research, compare, learn, save, share, review, and evaluate tools without leaving DISCOVA.

The most important product rule:

> The tool card is the product.

Tool cards should be large, visual, trustworthy, and interactive. Tool pages should feel like mini product websites with screenshots, tutorials, pricing, AI summaries, FAQs, pros/cons, alternatives, and SEO schema.

## Current stage

The project is in pre-deploy readiness.

The frontend now builds successfully with the required Supabase environment variables present. Deployment should not be attempted until Supabase and Contentful setup steps are completed or deliberately deferred with known fallbacks.

## What has been built

### Discovery and tools

- `/tools` directory page.
- Premium media-led tool cards.
- Tool card actions:
  - Visit Tool
  - Watch Tutorial
  - Save
  - Compare
  - Share
  - Quick View
- Quick View drawer with:
  - visual preview
  - overview
  - pros
  - cons
  - pricing CTA
  - video preview
  - gallery preview
- Canonical fallback tool categories so category filters do not disappear if Supabase is incomplete.
- Static tool fallback if Supabase has no tools yet.

### Tool detail pages

- `/tools/[slug]` software intelligence pages.
- Large hero with logo, badges, category, subcategory, pricing, CTAs, and visual preview.
- AI summaries:
  - 30-second summary
  - 2-minute summary
  - deep analysis
- Long-form product profile sections.
- Audience chips.
- Feature cards.
- Pros and cons.
- Embedded video learning center.
- Screenshot gallery support.
- Use cases.
- Related tools.
- FAQs.
- Reviews.
- Pricing panel.
- Verification panel.
- JSON-LD:
  - SoftwareApplication
  - BreadcrumbList
  - FAQPage
  - VideoObject

### News

- `/news` page.
- News source order:
  1. Contentful published news
  2. Supabase articles
  3. static fallback articles
- `/news/[slug]` article page.
- Article rendering supports markdown-like content.
- Query fallback added for older/newer Supabase article schemas.

### Contentful

- Rich Contentful tool fields documented.
- Local TypeScript Contentful types expanded.
- Import/publish pipeline can preserve rich tool fields:
  - longDescription
  - companyName
  - heroImage
  - galleryImages
  - audience
  - useCases
  - pros
  - cons
  - features
  - videos
  - faqs
  - alternatives
  - AI summaries
  - featured/trending/editorPick

### Supabase

- Additive migration added:
  - `supabase/20260606_discova_tool_intelligence.sql`
- It adds rich tool intelligence columns/tables, including:
  - tool features
  - gallery
  - FAQs
  - use cases
  - tags
  - pricing details
  - comparisons
  - collections
  - awards
  - news
  - verification status
  - user tool events
  - newsletter fields

### Navigation and frontend click readiness

- Header search submits to `/tools?search=...`.
- Mobile header search submits to `/tools?search=...`.
- Footer newsletter form submits to `/api/newsletter`.
- Footer links now route to real pages.
- Added real pages:
  - `/about`
  - `/contact`
  - `/careers`
  - `/press`
  - `/docs`
  - `/affiliate`
  - `/advertise`
  - `/privacy`
  - `/terms`
  - `/cookies`
  - `/account/saved`
- Pricing checkout errors now show inline instead of using browser alerts.
- Category expand control is a real button.
- Share action catches browser share/clipboard failures.

### Stability guardrails

- Root GitHub deploy workflow now uses Node 22.
- Pull requests run lint/type/build checks without deploying.
- Deployment job is skipped for pull requests.
- Build job includes Supabase placeholders when GitHub secrets are unavailable.
- Production deploy still requires real Supabase and Vercel secrets.

## Why Vercel deployment was failing

Most likely causes:

1. Missing Supabase environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Previous GitHub deploy workflow did not pass `SUPABASE_SERVICE_ROLE_KEY` into the build job.
3. `npm ci` was previously blocked by a package-lock mismatch; that has been reconciled.
4. Supabase and Contentful setup is not complete yet, so some runtime features will show fallbacks until configured.

The build passes with required Supabase env values present.

## What must be done before deploying to Vercel

Follow:

- `docs/pre-deploy-platform-setup.md`
- `docs/contentful-setup-guide.md`

Minimum:

1. Create Supabase project.
2. Run Supabase SQL scripts in order.
3. Add Supabase env vars to Vercel.
4. Create Contentful models.
5. Add Contentful env vars to Vercel.
6. Create Contentful webhook.
7. Add at least one complete test tool in Contentful.
8. Run local build with real env vars.

## Remaining work to reach enterprise standard

### Data and CMS

- Complete Contentful model creation in production space.
- Create editorial workflow for tool verification.
- Sync rich Contentful references into Supabase normalized tables.
- Add admin UI for editing rich tool intelligence sections.
- Add comparison generation and storage.

### Recommendations

- Persist user behavior events.
- Build related tools engine using:
  - category
  - subcategory
  - tags
  - features
  - pricing
  - popularity
  - saved tools
  - recent views
- Add personalized home/discovery feed.

### Reviews and trust

- Add verified reviewer workflows.
- Add spam moderation.
- Add review reporting.
- Add vendor response support.

### News

- Finalize automated news ingestion.
- Add editorial approval queue.
- Generate article images.
- Add article-topic pages.
- Add source attribution QA.

### Frontend

- Add full empty/error/loading states across every server-fed route.
- Replace remaining placeholder/static pages with complete content.
- Add automated E2E click tests for core flows.
- Add voice feature only if product scope requires it:
  - microphone permission UX
  - recording state
  - transcription/storage
  - fallback text input

### Platform and deployment

- Add real Vercel env vars.
- Add Sentry project and production DSN.
- Add PostHog analytics.
- Add uptime checks for `/api/health`.
- Add database backups and RLS audit.
- Add seed/test data for production launch QA.

## Daily rule for future work

Before merging or deploying:

```bash
npm ci
npm run check
npm run lint
npm run build
```

Use real Supabase env vars for the final build.

Do not deploy until Supabase and Contentful setup is complete unless intentionally launching with fallback content only.

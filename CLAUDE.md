# CLAUDE.md — Discova Project Memory

> This file is the single source of truth for Claude Code sessions working on this codebase.
> Read this file at the start of every session before making any changes.

---

## 🚨 CRITICAL: TWO SEPARATE PROJECTS IN THIS REPO

This repository (`futurestack-news-52`) contains **two completely separate projects**:

| Project | Location | Status | Repo |
|---------|----------|--------|------|
| **Discova** | `/futurestack/` | ✅ LIVE at getdiscova.com | This repo |
| **Ampliforge** | Separate repo | 🔨 In development | `demmyscoalexport-cell/AMPLIFORGE` |

**NEVER mix up these two projects. Never build Ampliforge features inside `/futurestack/`.**

---

## Project 1: Discova

### What is Discova?
An AI Tools Discovery Platform at **GetDiscova.com**. Helps users discover, compare, evaluate, save, and use the best AI tools in the world.

### Location
```
/home/user/futurestack-news-52/futurestack/
```

### Tech Stack
- **Framework**: Next.js 16.2 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI, Framer Motion
- **Backend**: Supabase (PostgreSQL), Supabase SSR
- **Auth**: Clerk
- **CMS**: Contentful
- **Search**: Fuse.js (client-side), planned Algolia
- **Payments**: Stripe + Paystack
- **Analytics**: PostHog, Vercel Analytics
- **Error Tracking**: Sentry
- **AI**: Anthropic Claude, OpenAI, Google Gemini (via Vercel AI SDK)
- **Background Jobs**: Inngest
- **Images**: Next/Image, fal.ai
- **Email**: Resend
- **Hosting**: Vercel

### Design System
```
Brand Colors:
  brand-primary:  #7c66ff  (Iris Purple)
  brand-lilac:    #c0b3ff  (Soft Lilac)
  brand-gold:     #f3c344  (Gold Accent)

Neutrals:
  neutral-deep:    #06030e  (Background)
  neutral-surface: #12111a  (Card backgrounds)
  neutral-stroke:  #23212d  (Borders)
  neutral-white:   #ffffff
  neutral-dim:     #8b8a91  (Muted text)

Border Radius:
  discova-lg: 16px
  input:      12px
  pill:       999px

Fonts:
  font-heading: Plus Jakarta Sans
  font-sans:    Geist / Inter (body)
  font-mono:    Geist Mono

CSS Utilities:
  glass-panel  — frosted glass card
  card-lift    — hover elevation effect
  gradient-text — purple gradient text
  shimmer      — skeleton loading
```

### App Structure (Key Routes)
```
app/
├── (auth)/          — Auth group layout
├── page.tsx         — Homepage
├── blog/            — ✨ NEW Blog system (built June 2026)
│   ├── page.tsx                  — Blog homepage
│   ├── layout.tsx                — Blog layout (SEO schema)
│   ├── [slug]/page.tsx           — Article detail
│   ├── category/[slug]/page.tsx  — Category listing
│   ├── author/[slug]/page.tsx    — Author page
│   └── tag/[slug]/page.tsx       — Tag page
├── news/            — AI-generated news (Supabase + GNews)
├── tools/           — Tool catalog
├── stacks/          — Curated stacks
├── discover/        — Discovery engine
├── compare/         — Tool comparison
├── deals/           — Deals
├── learn/           — Learning guides
├── community/       — Community
├── workflows/       — Workflow templates
├── africa/          — Africa hub
├── dashboard/       — User dashboard
├── admin/           — Admin panel
└── api/             — 40+ API routes
```

### Key Libraries / Files
```
lib/
├── blog/
│   ├── types.ts          — Blog TypeScript interfaces
│   ├── contentful.ts     — Content service (Contentful → Supabase fallback)
│   ├── seo.ts            — generateMetadata helpers
│   ├── structured-data.ts — JSON-LD schema builders
│   └── utils.ts          — Blog utilities, category list, formatters
├── contentful/           — Contentful CMS integration
├── supabase/             — Supabase clients (client, server, admin)
├── queries/              — Data queries (articles, tools, stacks, etc.)
├── db.ts                 — PostgreSQL direct connection
├── types.ts              — Global types
└── utils.ts              — Shared utilities
```

### Blog System (Built June 2026)
The blog lives at `/blog` and is an enterprise-grade editorial platform:

**Components** (`components/blog/`):
- `article-card.tsx` — Multi-variant cards (default, featured, horizontal, compact, minimal)
- `blog-hero.tsx` — Homepage hero with search
- `table-of-contents.tsx` — Sticky ToC with scroll tracking
- `reading-progress.tsx` — Top progress bar
- `share-buttons.tsx` — Social share + copy link
- `newsletter-signup.tsx` — Email capture (inline, card, minimal variants)
- `related-articles.tsx` — Related posts section
- `tool-recommendations.tsx` — Inline AI tool cards
- `author-card.tsx` — Author profiles (mini, inline, full)
- `category-pills.tsx` — Category filter chips
- `article-content.tsx` — Markdown → HTML renderer with syntax highlighting
- `featured-collection.tsx` — Collection grid

**Content Sources** (priority order):
1. Contentful CMS (env: `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`)
2. Supabase `articles` table
3. Static fallback data (in `lib/blog/contentful.ts`)

**SEO Features**:
- `generateMetadata()` on every page
- JSON-LD: Article, BlogPosting, FAQPage, BreadcrumbList, WebSite, Blog
- OG images via `/api/og/article`
- Canonical URLs
- `revalidate = 300` (5 min ISR)

### Database Schema (Key Tables)
```sql
articles      — Blog/news articles (slug, title, content, category, status, featured)
tools         — AI tools catalog (30+ fields)
stacks        — Curated tool stacks
authors       — Author profiles
reviews       — User reviews
saved_tools   — User bookmarks
profiles      — User profiles
newsletter_subscribers — Email list
```

### Environment Variables Needed
```
CONTENTFUL_SPACE_ID
CONTENTFUL_DELIVERY_TOKEN
CONTENTFUL_MANAGEMENT_TOKEN
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
GOOGLE_AI_API_KEY
POSTHOG_KEY
SENTRY_DSN
INNGEST_EVENT_KEY
```

---

## Project 2: Ampliforge

### What is Ampliforge?
An enterprise-grade AI Content Intelligence & Content Repurposing Platform.

**Transforms**: YouTube videos, podcasts, articles → email sequences, LinkedIn carousels, X threads, blog posts, SEO metadata, lead magnets.

**Target users**: Creators, coaches, podcasters, agencies, educators, consultants, founders, SaaS companies, YouTubers, media businesses.

### Repo
`https://github.com/demmyscoalexport-cell/AMPLIFORGE`

### Design System
```
Background: #09090B (primary), #111113 (secondary), #18181B (tertiary)
Text:        #FAFAFA (primary), #A1A1AA (secondary)
Border:      #27272A
Accent:      #6366F1 (Indigo)
Success:     #22C55E
Warning:     #F59E0B
Danger:      #EF4444
Font:        Inter
Radius:      sm 8px, md 12px, lg 16px, xl 24px
```

### Planned Tech Stack
- Next.js 15 App Router, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
- Supabase, Clerk, Stripe, OpenAI + Anthropic + Gemini
- Deepgram (transcription), Mux (video), Inngest (jobs), Resend (email)
- PostHog, Sentry, Vercel

### Key Features
```
Inputs:  YouTube URL, Podcast URL, RSS Feed, Video upload, Audio upload, Text
Outputs: Email sequences, LinkedIn carousels, X threads, Blog articles,
         SEO metadata, Lead magnets, Video summaries, Sales copy

Navigation:
  /dashboard   — Command center with stats
  /create      — Main content generation (heart of the app)
  /library     — Content archive
  /automations — RSS/channel monitoring, recurring workflows
  /analytics   — Performance reporting
  /studio      — Custom prompts, AI templates, brand voice training
  /integrations — Third-party connections
  /billing     — Subscriptions, usage
  /settings    — Account management
```

### Status
**NOT YET BUILT in code.** Architecture and specifications defined. Needs a dedicated Claude Code session connected to the AMPLIFORGE repository.

---

## Git Workflow

**Active branch for Discova work**: `claude/ampliforge-master-build-KEKaR`
(Yes, confusingly named — this is still the Discova repo branch)

**Always**:
1. Work in `/futurestack/` for Discova changes
2. Commit descriptively: `feat(blog): add article card component`
3. Push: `git push -u origin claude/ampliforge-master-build-KEKaR`

**Never**:
- Commit to `main` directly
- Mix Discova and Ampliforge code
- Delete or modify files outside `/futurestack/` without confirmation

---

## Build & Dev

```bash
cd /home/user/futurestack-news-52/futurestack

# Dev server
pnpm dev

# Type check
pnpm check

# Lint
pnpm lint

# Build
pnpm build
```

---

## Session Continuation Checklist

When starting a new session on this codebase:

1. ✅ Read this CLAUDE.md
2. ✅ Confirm which project is being worked on (Discova vs Ampliforge)
3. ✅ Check `git status` and `git log --oneline -5`
4. ✅ Never modify `/futurestack/` when working on Ampliforge
5. ✅ Ask user to clarify if the task is ambiguous

---

*Last updated: June 2026 — Blog system built and integrated into Discova*

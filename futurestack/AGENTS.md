# FUTURESTACK NEWS — AGENTS.MD

> **This file is the permanent architecture contract for all AI coding assistants working inside this repository.**
> Every rule is mandatory. No exceptions. No overrides unless explicitly instructed by the project owner.

---

## WHAT I AM CURRENTLY BUILDING

I am building **FutureStack News**, an AI-powered discovery and intelligence platform for the global AI and SaaS tools ecosystem.

**Project directory:**

```
futurestack-news-52-main
```

---

## PROJECT OVERVIEW

### WHAT IT IS

FutureStack News is an AI-powered news and tool discovery platform focused on the SaaS and AI tools ecosystem.

**The platform lives at:**

```
futurestack.live
```

**It is built using:**

- Next.js
- Supabase
- Inngest

**The platform is structured around three core pillars:**

1. **AI News**
   An automated article generation pipeline where AI collects industry signals, processes them, scores them, and publishes articles with minimal human intervention.

2. **Tool Directory**
   A curated, categorized, and ranked directory of AI tools across:
   - writing
   - design
   - coding
   - video
   - audio
   - analytics
   - automation
   - productivity
   - marketing
   - data workflows

3. **Stack Builder**
   Allows users to combine multiple AI tools into workflow-optimized stacks designed for specific roles and business use cases.

---

## TARGET USERS

FutureStack News serves three primary personas:

**Freelancers**
Discover tools that improve productivity and output quality.

**Agencies**
Build efficient operations and deliver better client outcomes.

**SaaS Founders**
Access tools and strategies to build, launch, and scale products.

---

## AFRICA-FRIENDLY POSITIONING

The platform includes an **Africa-Friendly badge system** identifying tools that:

- work reliably in African regions
- support local payment methods
- perform well on lower bandwidth
- have regional accessibility compatibility

---

## CORE FEATURES

**Automated AI content pipeline using Inngest:**

- signal collection
- processing
- article generation
- tool scoring
- weekly radar reporting
- email notifications

**FutureStack Score™**

A proprietary ranking methodology evaluating:

- usability
- performance
- pricing accessibility
- workflow impact
- adoption signals

**Tool comparison engine**

Route: `/compare`

**AI Radar trend intelligence**

Route: `/radar`

**Newsletter delivery modes:**

- daily
- weekly
- breaking-only

**Authentication system:**

- user onboarding
- admin dashboard
- saved stacks
- personalized discovery

**Analytics:** PostHog

**Error monitoring:** Sentry

**Payments ready:** Stripe support exists for future premium tiers

---

## TECHNOLOGY STACK

**Core technologies:**

- Next.js 15 (App Router only)
- React 19
- Supabase
- Inngest
- Tailwind CSS
- Framer Motion
- OpenAI
- Anthropic
- Google AI
- Resend
- Loops
- OneSignal
- Flutterwave
- Paystack
- PostHog
- Sentry
- Vercel deployment

---

## DEVELOPMENT STATUS

**Frontend completion:** 80 percent complete

**Currently building:**

- backend infrastructure
- automation pipelines
- AI orchestration system

---

## SECOND PROJECT SEPARATION RULE

**Second project:** Discova (Africa App Discovery Platform)

**Rule:** Discova and FutureStack must remain completely separate.

**Never mix:**

- code
- datasets
- pipelines
- schemas
- architecture
- logic

between them.

---

## OFFICIAL STACK — NEVER SUBSTITUTE

**Framework:**

- Next.js 15
- App Router ONLY
- Never Pages Router

**Language:**

- TypeScript strict mode ON

**Database:**

- Supabase

**Styling:**

- Tailwind CSS

**Animations:**

- Framer Motion

**Background jobs:**

- Inngest

**Transactional email:**

- Resend

**Email marketing:**

- Loops

**Push notifications:**

- OneSignal

**Payments:**

- Flutterwave (primary)
- Paystack (secondary)

**Deployment:**

- Vercel

**Monitoring:**

- Sentry

---

## AI CONTENT PIPELINE

| Role                     | Provider                |
| ------------------------ | ----------------------- |
| Content generation       | OpenAI GPT-4o           |
| Editorial refinement     | Anthropic Claude Sonnet |
| Thumbnail generation     | FAL.ai                  |
| Model inference          | Replicate               |
| Search intelligence      | Tavily                  |
| Extended pipeline access | Tavily Remote           |
| Discovery indexing       | Google API              |
| Programmable search      | Google Search Engine ID |
| Headline ingestion       | News API                |
| Extraction pipeline      | Sampling API            |
| Social automation        | Postdog                 |

---

## PROJECT FOLDER STRUCTURE (DO NOT CHANGE)

```
src/
├── app/                        → App Router pages and layouts
│                                 Server Components by default
│
├── components/
│   ├── ui/                     → Button, Input, Card, Badge, Modal
│   └── features/               → ArticleCard, ToolGrid, PricingTable
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts           → Server-side Supabase client ONLY
│   │   └── client.ts           → Browser-side Supabase client ONLY
│   ├── utils.ts                → Pure utility functions only
│   └── types/                  → Shared TypeScript interfaces
│
├── hooks/                      → Custom hooks (always "use client")
│
├── actions/                    → Server Actions (never "use client")
│
└── inngest/                    → Background job definitions
```

---

## FOLDER RULES

**`hooks/`**

- Always include: `"use client"`

**`actions/`**

- Never include: `"use client"`

**`lib/supabase/server.ts`**

- Never import inside client components

**`lib/supabase/client.ts`**

- Only import inside client components

---

## ENVIRONMENT VARIABLES

### Supabase

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Flutterwave

```
FLUTTERWAVE_SECRET_KEY
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY
FLUTTERWAVE_WEBHOOK_HASH
```

### Paystack

```
PAYSTACK_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
```

### Email

```
RESEND_API_KEY
LOOPS_API_KEY
```

### Push Notifications

```
NEXT_PUBLIC_ONESIGNAL_APP_ID
ONESIGNAL_API_KEY
```

### Background Jobs

```
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
```

### Monitoring

```
NEXT_PUBLIC_SENTRY_DSN
```

### AI Pipeline

```
OPENAI_API_KEY
ANTHROPIC_API_KEY
FAL_KEY
REPLICATE_API_TOKEN
TAVILY_API_KEY
TAVILY_REMOTE_KEY
GOOGLE_API_KEY
GOOGLE_SEARCH_ENGINE_ID
NEWS_API_KEY
POSTDOG_API_KEY
SAMPLING_API_KEY
```

### Rule

- `NEXT_PUBLIC_` variables are browser safe.
- All others must remain **server-only**.

---

## ABSOLUTE CODING RULES

### RULE 1 — SERVER VS CLIENT COMPONENTS

Server Components are default.

Only add `"use client"` when required for:

- `useState`
- `useEffect`
- `useRef`
- event handlers
- browser APIs
- Framer Motion

**Never access** outside `useEffect`:

- `window`
- `document`
- `localStorage`

**Never place** inside JSX returns:

- `Math.random()`
- `new Date()`

Client-only libraries must use:

```typescript
dynamic(() => import("..."), { ssr: false });
```

Framer Motion must use `LazyMotion`.

---

### RULE 2 — TYPESCRIPT

**Never use:**

```typescript
any;
```

**Use instead:**

```typescript
unknown; // plus type guards
```

**Never use:**

```typescript
// @ts-ignore
```

- All async functions require explicit return types.
- All Supabase queries must use generated DB types.
- Shared types go in `src/types`.
- Component-local types stay inside component files.

---

### RULE 3 — HYDRATION SAFETY

- Server output must equal client output.
- Dates format inside `useEffect`.
- User-specific data fetch client-side or use `Suspense`.
- Random values compute inside `useEffect`.
- Conditional CSS must not depend on browser state during SSR.

---

### RULE 4 — SUPABASE

Always:

```typescript
const { data, error } = await supabase.from("table").select("*");
```

Always guard:

```typescript
if (!data) return;
```

- Server Components: `createServerClient`
- Client Components: `createBrowserClient`
- Never expose `service_role` key to browser.

---

### RULE 5 — API ROUTES

Return format:

```typescript
{
  success: (true, data);
}
// or
{
  success: (false, error);
}
```

- Validate inputs with Zod.
- Wrap logic in `try/catch`.
- Never expose stack traces.

---

### RULE 6 — INNGEST JOBS

- All side effects inside `step.run()`.
- Every step returns typed output.
- No business logic outside `step.run()`.

---

### RULE 7 — ENV VARIABLES

Always check existence:

```typescript
if (!process.env.X) throw new Error("Missing env variable");
```

Update `.env.example` when variables change.

---

### RULE 8 — CODE QUALITY

- No `console.log` in production paths.
- No dead code.
- Maximum 80 lines per component.
- Use meaningful variable names.
- Always return complete files.
- Never partial snippets.

---

## COMMON ERRORS AND FIXES

| Error                                      | Fix                                    |
| ------------------------------------------ | -------------------------------------- |
| White screen / unhandled promise rejection | Wrap async logic with `try/catch`      |
| Hydration mismatch                         | Move dynamic logic into `useEffect`    |
| `window` undefined                         | Wrap browser access inside `useEffect` |
| Supabase type error                        | Guard nullable results                 |
| API route 500                              | Wrap logic inside `try/catch`          |
| Framer Motion crash                        | Use `LazyMotion`                       |
| CI build fails                             | Update `env.example`                   |
| TypeScript build fails                     | Resolve types properly                 |
| `node_modules` drift                       | Run `npm ci`                           |

---

## PRE-CODE CHECKLIST

Before writing any code, confirm:

- [ ] Server vs client component correct
- [ ] Browser APIs inside `useEffect`
- [ ] Supabase results guarded
- [ ] Async return types declared
- [ ] No `any` types used
- [ ] No random or date inside JSX
- [ ] Env vars validated
- [ ] TypeScript passes
- [ ] Hydration safe output

---

## CODE DELIVERY RULES

**Always:**

- Show full file
- Include file path
- One file at a time
- Never partial snippets

**After code delivery, explain:**

- What changed
- Why it changed
- How to test

**Then confirm:**

- No hydration risk
- Types clean
- Preview safe

---

## TASK INSTRUCTION FORMAT

Future instructions follow this format:

```
Add [feature]
to [file]
triggered by [action]
data source [defined]
modify no other files
```

**If unclear:**
Ask exactly **ONE** question before starting.

**Never assume schema.**

---

## FORBIDDEN ACTIONS

**Never:**

- Switch frameworks
- Modify unrelated files
- Add packages without approval
- Remove existing features
- Use Pages Router
- Mix Discova with FutureStack

---

## DAILY WORKFLOW

**Start development with:**

```bash
npm ci
npm run health
npm run dev
```

**If health fails:**

- Paste error
- Fix without touching unrelated files

**GitHub Actions runs health check daily:**

- 06:00 UTC

**Monitoring:**

- Sentry sends production alerts automatically

**Commits blocked if:**

```bash
tsc --noEmit  # fails
```

---

## FINAL DIRECTIVE

> **Always read `AGENTS.md` before generating code.**

This document is the law of this repository. Follow it completely.

---

## Cursor Cloud specific instructions

### Monorepo layout

| Path | Package manager | Purpose |
|------|-----------------|---------|
| `futurestack/` | **npm** (`package-lock.json`) | Main DISCOVA Next.js app — primary dev entry |
| repo root + `artifacts/`, `lib/` | **pnpm** (`pnpm-workspace.yaml`) | Replit workspace packages (api-server, mockup-sandbox, shared libs) |

For product work, always `cd futurestack` first. Use pnpm at the repo root only when editing `artifacts/*` or `lib/*`.

### Dependencies

- **`npm ci` in `futurestack/` may fail** if `package-lock.json` is out of sync with `package.json`. Use `npm install` instead (the VM update script does this).
- Root `pnpm install` is required for workspace packages; the root `preinstall` hook rejects npm/yarn at the workspace root.

### Required secrets (blocking for full local app)

The homepage and tool catalog need Supabase. Without these in Cursor Cloud secrets (or `futurestack/.env.local`), `/` returns 500 but auth routes still work:

- `NEXT_PUBLIC_SUPABASE_URL` — project `nuyigpwhmyiogfzsdvzw` per `replit.md`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_USE_REST=true` (recommended per `futurestack/docs/DEPLOY.md`)

Optional for DB scripts: `SUPABASE_DB_URL`, `SUPABASE_DB_PASSWORD`.

One-time DB setup after secrets are set:

```bash
cd futurestack
cp .env.example .env.local   # fill Supabase vars
node scripts/setup.mjs       # schema + quick seed
```

### Start services

```bash
cd futurestack && npm run dev
```

This starts **Next.js on port 3000** and **Inngest dev UI on port 8288** via `concurrently`. Inngest registers 18 functions and `/api/inngest` responds without cloud keys when `INNGEST_DEV=1`.

`/login` loads without seeded DB data. `/` requires Supabase credentials.

### Lint / typecheck / build

See `futurestack/package.json` and root `package.json` scripts. Standard commands:

```bash
cd futurestack && npm run check    # tsc --noEmit (passes)
cd futurestack && npm run lint     # pre-existing eslint errors in lib/queries/*
cd futurestack && npm run build    # needs Supabase env vars
cd /workspace && pnpm run typecheck
```

Pre-commit hook (husky in `futurestack/.husky/pre-commit`): `lint-staged` + `tsc --noEmit`.

### Gotchas

- No Docker in Cloud Agent VMs — local Supabase via `supabase start` is not available; use cloud Supabase project secrets.
- `artifacts/mockup-sandbox` Vite dev server may fail without Replit-specific Vite plugins; it is optional for product work.
- Replit Express gateway (`artifacts/api-server` on 8080) is only needed for Replit deployment topology, not standard local dev.

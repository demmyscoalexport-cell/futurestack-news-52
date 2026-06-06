# DISCOVA Pre-Deploy Platform Setup

Use this checklist before deploying to Vercel.

## 1. Supabase

### Create project

1. Go to Supabase.
2. Create a project named `discova-production`.
3. Copy these values:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key -> `SUPABASE_SERVICE_ROLE_KEY`
   - Transaction pooler connection string -> `SUPABASE_DB_URL`

### Run SQL

Open Supabase SQL Editor and run these files in order:

1. `supabase/schema.sql`
2. `supabase/migration_002_extended_schema.sql`
3. `supabase/missing_tables.sql`
4. `supabase/20260606_discova_tool_intelligence.sql`

If a table already exists, these scripts are written to be safe and additive.

### Auth settings

In Authentication -> URL Configuration:

- Site URL: `https://YOUR-VERCEL-DOMAIN.com`
- Redirect URLs:
  - `https://YOUR-VERCEL-DOMAIN.com/auth/callback`
  - `http://localhost:3000/auth/callback`

### Required Vercel env vars

Set these in Vercel Project Settings -> Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
NEXT_PUBLIC_SITE_URL=https://YOUR-VERCEL-DOMAIN.com
```

## 2. Contentful

### Create space and environment

1. Create a Contentful space named `Discova`.
2. Use environment `master`.
3. Create API keys:
   - Content Delivery API token
   - Content Preview API token
   - Content Management API token

### Create content models

Create the content models in `docs/contentful-setup-guide.md`.

Minimum launch models:

1. `category`
2. `subcategory`
3. `tool`
4. `toolFeature`
5. `toolVideo`
6. `toolFAQ`
7. `toolGallery`
8. `toolUseCase`
9. `toolPricing`
10. `verificationStatus`

### Add Vercel env vars

```text
CONTENTFUL_SPACE_ID=
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_ENVIRONMENT_ID=master
CONTENTFUL_DELIVERY_TOKEN=
CONTENTFUL_PREVIEW_TOKEN=
CONTENTFUL_MANAGEMENT_TOKEN=
CONTENTFUL_USE_PREVIEW_API=false
CONTENTFUL_WEBHOOK_SECRET=
CONTENTFUL_DEFAULT_LOCALE=en-US
```

### Configure webhooks

Create one Contentful webhook:

- URL: `https://YOUR-VERCEL-DOMAIN.com/api/contentful/sync`
- Triggers:
  - Entry publish
  - Entry unpublish
  - Entry delete
- Header:
  - `x-futurestack-webhook-secret: SAME_VALUE_AS_CONTENTFUL_WEBHOOK_SECRET`

## 3. Optional but recommended env vars

Set these before public launch if you want every feature active:

```text
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@yourdomain.com
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## 4. Smoke tests before deploy

Run locally with production-like env vars:

```bash
npm ci
npm run check
npm run lint
npm run build
```

Then test these URLs:

- `/`
- `/tools`
- `/tools/<tool-slug>`
- `/compare`
- `/collections`
- `/submit-tool`
- `/api/health`
- `/api/contentful/pull`

## 5. Manual frontend click QA

Check these before production:

- Header logo goes home.
- Header desktop and mobile nav links open real pages.
- Header search redirects to `/tools?search=...`.
- Tool cards: Visit Tool, Watch Tutorial, Save, Compare, Share, Quick View.
- Quick View drawer opens and closes.
- Tool detail page hero buttons work.
- Footer newsletter subscribes or shows a clear error.
- Footer company/legal links open pages.
- Auth buttons route to login/signup.
- Submit Tool form submits and shows a status page.

## 6. Voice recording

There is no voice-recording product feature in the current frontend. If you want voice search or voice notes, add it as a separate feature after deploy readiness, because it requires browser microphone permission UX, recording state, upload/storage rules, and fallback text input.

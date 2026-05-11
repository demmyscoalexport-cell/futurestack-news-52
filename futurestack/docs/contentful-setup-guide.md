# FutureStack Contentful Setup Guide

This guide defines exactly what to create in Contentful and which APIs to connect for daily automated publishing of tools, SaaS news, comparisons, and stacks.

## 1) Create Space and Environment

- Space name: `FutureStack`
- Environments:
  - `master` (production)
  - `staging` (pre-release checks)

## 2) Create Content Models

Create the following content types in Contentful. Use `slug` as unique where applicable.

### `tool`

- `name` (Short text, required)
- `slug` (Short text, required, unique)
- `tagline` (Short text)
- `description` (Long text, required)
- `logoUrl` (Short text URL)
- `websiteUrl` (Short text URL, required)
- `categorySlug` (Short text, required)
- `subcategorySlugs` (Short text list)
- `tags` (Short text list)
- `pricingModel` (Short text)
- `startingPrice` (Number)
- `freeTier` (Boolean)
- `verified` (Boolean)
- `futurestackScore` (Number)
- `status` (Short text with validation: `draft`, `published`, `archived`)

### `newsArticle`

- `title` (Short text, required)
- `slug` (Short text, required, unique)
- `excerpt` (Long text)
- `body` (Long text, required)
- `heroImageUrl` (Short text URL)
- `tags` (Short text list)
- `readingTime` (Number)
- `mentionedTools` (References, many -> `tool`)
- `recommendedTools` (References, many -> `tool`)
- `status` (Short text with validation: `draft`, `published`, `archived`)
- `publishedAt` (Date/time)

### `comparison`

- `title` (Short text, required)
- `slug` (Short text, required, unique)
- `toolA` (Reference, required -> `tool`)
- `toolB` (Reference, required -> `tool`)
- `summary` (Long text)
- `verdict` (Long text)
- `winner` (Reference -> `tool`)
- `status` (Short text with validation: `draft`, `published`, `archived`)
- `publishedAt` (Date/time)

### `stack`

- `title` (Short text, required)
- `slug` (Short text, required, unique)
- `description` (Long text)
- `useCase` (Short text)
- `targetUser` (Short text)
- `tools` (References, many -> `tool`)
- `estimatedMonthlyCost` (Number)
- `status` (Short text with validation: `draft`, `published`, `archived`)
- `publishedAt` (Date/time)

### `sourceSignal` (optional but recommended for pipeline auditing)

- `title` (Short text)
- `sourceName` (Short text)
- `sourceUrl` (Short text URL)
- `signalType` (Short text; example `tool_launch`, `funding`, `feature_update`)
- `confidenceScore` (Number)
- `rawPayload` (Long text/JSON as text)
- `processed` (Boolean)
- `processedAt` (Date/time)

## 3) Contentful APIs to Create and Use

Create these API keys in Contentful:

- **Content Delivery API (CDA)** token  
  Use for public/published content reads.
- **Content Preview API (CPA)** token  
  Use for draft preview and editorial QA.
- **Content Management API (CMA)** token  
  Use for server-side create/update/publish automation jobs only.

Set the values in `.env.local`:

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ENVIRONMENT`
- `CONTENTFUL_ENVIRONMENT_ID` (optional alias if you prefer the "Environment ID" naming from Contentful UI)
- `CONTENTFUL_DELIVERY_TOKEN`
- `CONTENTFUL_PREVIEW_TOKEN`
- `CONTENTFUL_MANAGEMENT_TOKEN`
- `CONTENTFUL_USE_PREVIEW_API`

Current project setup values:

- `CONTENTFUL_SPACE_ID=felx5bqzmcvs`
- `CONTENTFUL_ENVIRONMENT=master`
- `CONTENTFUL_ENVIRONMENT_ID=master`
- `CONTENTFUL_DELIVERY_TOKEN=<set in .env.local>`
- `CONTENTFUL_PREVIEW_TOKEN=<set in .env.local>`

## 4) Webhooks to Configure

Create outbound webhooks from Contentful to FutureStack endpoints:

- `Entry publish` -> `/api/contentful/sync` (to upsert into Supabase)
- `Entry unpublish` -> `/api/contentful/sync` (to archive locally)
- `Entry delete` -> `/api/contentful/sync` (to remove/soft-delete locally)

Recommended headers:

- `x-futurestack-webhook-secret: <your-secret>`

## 5) FutureStack Endpoints (current + next)

Already added in codebase:

- `GET /api/contentful/pull`  
  Pulls published `tool` and `newsArticle` entries for integration smoke test.
- `POST /api/contentful/sync`  
  Receives Contentful webhook payloads and validates `x-futurestack-webhook-secret` when configured.
- `POST /api/contentful/publish/tools`  
  Pipeline endpoint (`normalize -> validate -> upsert -> publish`) for `tool` entries. Defaults to `dryRun: true`.
- `POST /api/contentful/publish/news`  
  Pipeline endpoint (`normalize -> validate -> upsert -> publish`) for `newsArticle` entries. Defaults to `dryRun: true`.

Next endpoints to add:

- `POST /api/contentful/generate/comparisons` (AI-assisted compare generation)
- `POST /api/contentful/generate/stacks` (AI-assisted stack generation)

### Pipeline request format

Use this request body shape for `/api/contentful/publish/tools` and `/api/contentful/publish/news`:

```json
{
  "source": "manual",
  "dryRun": true,
  "publish": false,
  "items": []
}
```

- `source` supports:
  - `manual` (default): use `items` from request body
  - `newsapi`: fetch records directly from NewsAPI (`NEWS_API_KEY`)
  - `tavily`: fetch records directly from Tavily (`TAVILY_API_KEY`)
- `dryRun: true` validates and simulates create/update actions (safe test mode)
- `dryRun: false` executes real Contentful upserts using `CONTENTFUL_MANAGEMENT_TOKEN`
- `publish` defaults to `true` when `dryRun` is `false`
- optional `query` and `limit` are used when `source` is `newsapi` or `tavily`

## 6) Daily Automation Blueprint

- Every 4 hours:
  - Pull external signals
  - Generate or update `newsArticle`
  - Link to related `tool` entries
  - Publish article
- Daily:
  - Refresh tool details and scores
  - Generate missing comparisons for trending tools
  - Generate stack pages for top use-cases

## 7) Publishing Status Rules

Use only these statuses:

- `draft` => not visible publicly
- `published` => visible in app and sitemap
- `archived` => hidden but retained

## 8) Minimum QA Before Launch

- `slug` uniqueness enforced in every content type
- no tool without `websiteUrl`, `categorySlug`, and `status`
- no article without `title`, `slug`, `body`, and `publishedAt`
- all published entries return from `/api/contentful/pull`

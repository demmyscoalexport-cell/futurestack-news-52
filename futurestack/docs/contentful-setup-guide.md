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
- `longDescription` (Long text, target 1500-3000 words)
- `logoUrl` (Short text URL)
- `websiteUrl` (Short text URL, required)
- `companyName` (Short text)
- `heroImage` (Short text URL or Media)
- `galleryImages` (Short text list of Cloudinary/Contentful media URLs)
- `categorySlug` (Short text, required)
- `subcategorySlugs` (Short text list)
- `tags` (Short text list)
- `audience` (Short text list)
- `useCases` (Short text list)
- `pros` (Short text list)
- `cons` (Short text list)
- `features` (JSON object list or references to `toolFeature`)
- `videos` (JSON object list or references to `toolVideo`)
- `faqs` (JSON object list or references to `toolFAQ`)
- `alternatives` (References, many -> `tool`)
- `aiSummary30` (Long text)
- `aiSummary120` (Long text)
- `aiDeepAnalysis` (Long text)
- `pricingModel` (Short text)
- `startingPrice` (Number)
- `freeTier` (Boolean)
- `verified` (Boolean)
- `featured` (Boolean)
- `trending` (Boolean)
- `editorPick` (Boolean)
- `futurestackScore` (Number)
- `status` (Short text with validation: `draft`, `published`, `archived`)

### `category`

- `name` (Short text, required)
- `slug` (Short text, required, unique)
- `description` (Long text)
- `icon` (Short text)
- `heroImage` (Media or URL)
- `sortOrder` (Number)

### `subcategory`

- `name` (Short text, required)
- `slug` (Short text, required, unique)
- `category` (Reference -> `category`)
- `description` (Long text)
- `icon` (Short text)
- `sortOrder` (Number)

### `toolFeature`

- `tool` (Reference -> `tool`)
- `title` (Short text, required)
- `description` (Long text, required)
- `icon` (Short text)
- `priority` (Number)

### `toolVideo`

- `tool` (Reference -> `tool`)
- `title` (Short text, required)
- `youtubeUrl` (Short text URL, required)
- `thumbnail` (Media or URL)
- `duration` (Short text)
- `creator` (Short text)
- `featured` (Boolean)
- `position` (Number)

### `toolFAQ`

- `tool` (Reference -> `tool`)
- `question` (Short text, required)
- `answer` (Long text, required)
- `order` (Number)

### `toolGallery`

- `tool` (Reference -> `tool`)
- `image` (Media, required)
- `imageUrl` (Short text URL, optional Cloudinary URL)
- `title` (Short text)
- `alt` (Short text)
- `mediaType` (Short text: `screenshot`, `mobile`, `dashboard`, `feature`, `before_after`, `gif`, `video_preview`)
- `position` (Number)

### `toolUseCase`

- `tool` (Reference -> `tool`)
- `title` (Short text, required)
- `description` (Long text)
- `icon` (Short text)
- `priority` (Number)

### `toolPricing`

- `tool` (Reference -> `tool`)
- `tierName` (Short text, required)
- `priceMonthly` (Number)
- `priceAnnual` (Number)
- `currency` (Short text, default `USD`)
- `features` (Short text list)
- `isPopular` (Boolean)
- `isFreeTier` (Boolean)

### `toolCompany`

- `name` (Short text, required)
- `slug` (Short text, required, unique)
- `websiteUrl` (Short text URL)
- `logoUrl` (Short text URL)
- `description` (Long text)

### `verificationStatus`

- `tool` (Reference -> `tool`)
- `officialWebsiteVerified` (Boolean)
- `workingProduct` (Boolean)
- `reviewedByDiscova` (Boolean)
- `noMalware` (Boolean)
- `noSpam` (Boolean)
- `recentlyUpdated` (Boolean)
- `trustedSource` (Boolean)
- `notes` (Long text)
- `verifiedAt` (Date/time)

### Optional launch models

Create these next if you want the full editorial/discovery ecosystem from day one:

- `toolTag`: `name`, `slug`
- `toolAlternative`: `tool`, `alternativeTool`, `similarityScore`, `reason`
- `toolComparison`: `title`, `slug`, `toolA`, `toolB`, `summary`, `verdict`, `winner`, `status`, `publishedAt`
- `toolReview`: `tool`, `userName`, `rating`, `content`, `verified`, `location`
- `toolCollections`: `title`, `slug`, `description`, `tools`, `featured`, `status`
- `toolAwards`: `tool`, `title`, `description`, `awardedAt`
- `toolNews`: `tool`, `title`, `url`, `source`, `summary`, `publishedAt`

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

For Vercel, use the full production URL:

```text
https://YOUR-VERCEL-DOMAIN.com/api/contentful/sync
```

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

## 9) Immediate Contentful Checklist

Before deploy, create at least:

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

Then create one complete test tool with:

- logo
- hero screenshot
- 3 screenshots
- 3 features
- 2 FAQs
- 1 YouTube tutorial
- pros and cons
- audience chips
- 30-second, 2-minute, and deep AI summaries

Finally test:

- `/api/contentful/pull`
- `/api/contentful/publish/tools` with `dryRun: true`
- `/tools/<your-test-tool-slug>`

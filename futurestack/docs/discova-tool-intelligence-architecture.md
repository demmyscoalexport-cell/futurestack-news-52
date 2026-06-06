# DISCOVA Tool Intelligence Architecture

DISCOVA treats the tool card as the primary product surface and each tool page as a mini software intelligence site.

## Contentful content types

- `tool`
- `category`
- `subcategory`
- `toolFeature`
- `toolVideo`
- `toolFAQ`
- `toolGallery`
- `toolUseCase`
- `toolPros`
- `toolCons`
- `toolTag`
- `toolAlternative`
- `toolComparison`
- `toolReview`
- `toolPricing`
- `toolCompany`
- `verificationStatus`
- `toolCollections`
- `toolAwards`
- `toolNews`

## Tool relationships

`tool` belongs to one category, one subcategory, and one company. It has many videos, features, FAQs, screenshots, reviews, alternatives, comparisons, use cases, tags, news items, and collections. It has one pricing model and one verification status.

## Required tool-page content

- Hero: logo, verified badge, category, subcategory, pricing, website, tutorial, bookmark, share, compare, and a large visual.
- Long-form summary: `longDescription`, targeting 1500 to 3000 words when editorial content is available.
- Audience chips: developers, students, marketers, designers, founders, businesses, creators, researchers, agencies, and enterprise teams.
- Feature cards: `toolFeature.title`, `description`, `icon`, and `priority`.
- Pros and cons: structured arrays, never star-score substitutes.
- Video learning center: embedded `toolVideo.youtubeUrl` with thumbnail, duration, creator, and featured state.
- Screenshot gallery: Cloudinary or Contentful media references, unlimited.
- AI summaries: `aiSummary30`, `aiSummary120`, and `aiDeepAnalysis`.
- FAQs: structured and orderable for FAQ schema.

## Recommendation signals

Related tools should combine category, subcategory, tags, features, pricing model, popularity, saved items, and recent views. Current UI seeds recommendations from category and explicit alternatives; behavior signals can be layered into the query once events are persisted.

## SEO output

Tool pages emit SoftwareApplication, BreadcrumbList, FAQPage, and VideoObject JSON-LD. Comparison pages should emit comparison-focused metadata and link both tools canonically once the comparison route stores generated copy.

## Verification status

A verified tool should satisfy: official website verified, working product, reviewed by DISCOVA, no malware indicators, no spam indicators, recently updated, and trusted source.

# FutureStack Setup Checklist — Contentful + Inngest + Supabase

This document outlines **exactly what you need** to provide to each service for the full pipeline to work.

---

## 1️⃣ CONTENTFUL — Content Models & Data

### ✅ Already Completed
- [x] Space created: `FutureStack`
- [x] Environments: `master` and `staging`
- [x] API tokens generated (CDA, CPA, CMA)
- [x] Environment variables in `.env.local`
- [x] Webhooks configured

### 🔴 Still Needed — Seed Data

Before you can generate comparisons and stacks, you need **at least 10 published tools** in Contentful:

#### How to Add Tools to Contentful:

**Option A: Manual Entry (Quick Test)**
1. Go to Contentful → Content → Tools
2. Click "+ Add Tool"
3. Fill in these **required fields**:
   - `name` (e.g., "Cursor")
   - `slug` (e.g., "cursor") — must be unique
   - `description` (e.g., "AI-powered code editor")
   - `websiteUrl` (e.g., "https://cursor.sh")
   - `categorySlug` (e.g., "code")
   - `status` → set to **"published"**

4. Optional but recommended:
   - `tagline` — short description
   - `logoUrl` — image URL
   - `tags` — e.g., ["AI", "Code Editor", "LSP"]
   - `pricingModel` — e.g., "Freemium"
   - `freeTier` — boolean
   - `verified` — boolean

5. Click **Publish**

**Option B: API Upload (Bulk)**

Use the existing endpoint to publish tools:

```bash
curl -X POST http://localhost:3000/api/contentful/publish/tools \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual",
    "dryRun": false,
    "publish": true,
    "items": [
      {
        "name": "Cursor",
        "slug": "cursor",
        "description": "AI-powered code editor built on VS Code",
        "websiteUrl": "https://cursor.sh",
        "categorySlug": "code",
        "tags": ["AI", "IDE", "VSCode"],
        "pricingModel": "Freemium",
        "freeTier": true,
        "verified": true
      },
      {
        "name": "Claude",
        "slug": "claude",
        "description": "Large language model by Anthropic",
        "websiteUrl": "https://claude.ai",
        "categorySlug": "ai-assistant",
        "tags": ["AI", "LLM", "Chat"],
        "pricingModel": "Freemium",
        "freeTier": true,
        "verified": true
      }
      // ... add more tools
    ]
  }'
```

### 📋 Minimum Tools Needed

Create **at least these 10 tools** in Contentful:

| Tool | Slug | Category | Pricing |
|------|------|----------|---------|
| Cursor | cursor | code | Freemium |
| Claude | claude | ai-assistant | Freemium |
| GitHub Copilot | github-copilot | code | Paid |
| ChatGPT | chatgpt | ai-assistant | Freemium |
| Replit | replit | code | Freemium |
| Midjourney | midjourney | design | Paid |
| Figma | figma | design | Freemium |
| Notion | notion | productivity | Freemium |
| Zapier | zapier | automation | Freemium |
| Webflow | webflow | design | Paid |

### 📰 Minimum News Articles Needed

Create **at least 5 published articles**:

```bash
curl -X POST http://localhost:3000/api/contentful/publish/news \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual",
    "dryRun": false,
    "publish": true,
    "items": [
      {
        "title": "Cursor Raises $60M Series A for AI Code Editor",
        "slug": "cursor-series-a-60m",
        "excerpt": "The AI code editor reaches unicorn status",
        "body": "Cursor, the AI-powered code editor, has raised $60M in Series A funding...",
        "tags": ["funding", "AI", "code"],
        "publishedAt": "2025-01-15T10:00:00Z",
        "status": "published"
      },
      {
        "title": "Top 5 AI Tools for Developers in 2025",
        "slug": "top-5-ai-tools-developers-2025",
        "excerpt": "Essential AI tools every developer needs",
        "body": "In 2025, AI has become essential for developers...",
        "tags": ["AI", "tools", "dev"],
        "publishedAt": "2025-01-14T10:00:00Z",
        "status": "published"
      }
      // ... add more articles
    ]
  }'
```

---

## 2️⃣ INNGEST — Event Keys & Configuration

### ✅ Already Completed
- [x] Inngest functions defined
- [x] Cron triggers configured

### 🔴 Still Needed — API Keys & Setup

#### Step 1: Create Inngest Account & App

1. Go to https://app.inngest.com
2. Sign up or log in
3. Create a new app: `futurestack-news`
4. You'll see a dashboard with your credentials

#### Step 2: Generate API Keys

1. In Inngest dashboard → **Settings** → **API Keys**
2. Create two keys:
   - **Event Key** (for sending events from your app)
   - **Signing Key** (for webhook verification)

Copy these and add to `.env.local`:

```bash
INNGEST_EVENT_KEY=evt_xxx...
INNGEST_SIGNING_KEY=sgn_xxx...
INNGEST_DEV=1
```

#### Step 3: Optional — Perplexity API (for AI signals)

The `fetchAISignals` function uses Perplexity for real-time news. To enable it:

1. Go to https://perplexity.ai
2. Get API key from your account
3. Add to `.env.local`:

```bash
PERPLEXITY_API_KEY=pplx_xxx...
```

(If you skip this, the function falls back to RSS feeds only)

#### Step 4: Verify Inngest is Running Locally

Run your dev server with Inngest:

```bash
npm run dev
```

You should see:
```
✓ Inngest dev server running at http://localhost:8288
✓ Functions served at http://localhost:3000/api/inngest
```

Then visit http://localhost:8288 to see the Inngest dev dashboard.

---

## 3️⃣ SUPABASE — Database Schema

### ✅ Already Completed (from sync endpoint)
- [x] `tools` table (created by webhook sync)
- [x] `articles` table (created by webhook sync)

### 🔴 Still Needed — Supporting Tables

These tables are **referenced in Inngest functions** but may not exist yet:

#### Create These Tables in Supabase:

**1. `categories` (for article filtering)**
```sql
CREATE TABLE categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Seed data:
INSERT INTO categories (slug, name) VALUES
('ai-tools', 'AI Tools'),
('saas-news', 'SaaS News'),
('tutorials', 'Tutorials'),
('case-studies', 'Case Studies'),
('comparisons', 'Comparisons'),
('industry-trends', 'Industry Trends');
```

**2. `newsletter_subscribers` (for notify-on-publish)**
```sql
CREATE TABLE newsletter_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  confirmed boolean DEFAULT false,
  unsubscribed boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
```

**3. `tool_scores` (for calculate-scores)**
```sql
CREATE TABLE tool_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE,
  futurestack_score numeric(3,1) DEFAULT 0,
  updated_at timestamp DEFAULT now()
);
```

**4. `radar_items` (for generate-weekly-radar)**
```sql
CREATE TABLE radar_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_slug text NOT NULL,
  category text NOT NULL, -- 'rising_star', 'watch_out', etc
  summary text,
  signal_strength numeric(2,1),
  week_of date DEFAULT CURRENT_DATE,
  created_at timestamp DEFAULT now()
);
```

**5. `article_tool_mentions` (for linking articles ↔ tools)**
```sql
CREATE TABLE article_tool_mentions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE,
  mention_type text, -- 'mentioned', 'recommended', 'compared'
  created_at timestamp DEFAULT now(),
  UNIQUE(article_id, tool_id)
);
```

#### Run These in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Click **+ New Query**
3. Copy-paste each CREATE TABLE block
4. Click **Run**

---

## 4️⃣ ENVIRONMENT VARIABLES — Complete Checklist

Copy this to `.env.local` and fill in your actual values:

```bash
# ========================================
# CONTENTFUL
# ========================================
CONTENTFUL_SPACE_ID=felx5bqzmcvs
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_DELIVERY_TOKEN=<from Contentful>
CONTENTFUL_PREVIEW_TOKEN=<from Contentful>
CONTENTFUL_MANAGEMENT_TOKEN=<from Contentful>
CONTENTFUL_USE_PREVIEW_API=false
CONTENTFUL_WEBHOOK_SECRET=<generate: openssl rand -hex 32>
CONTENTFUL_DEFAULT_LOCALE=en-US

# ========================================
# INNGEST
# ========================================
INNGEST_EVENT_KEY=<from Inngest dashboard>
INNGEST_SIGNING_KEY=<from Inngest dashboard>
INNGEST_DEV=1

# ========================================
# SUPABASE
# ========================================
NEXT_PUBLIC_SUPABASE_URL=<from Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase>

# ========================================
# AI PROVIDERS (for content generation)
# ========================================
OPENAI_API_KEY=<from OpenAI>
ANTHROPIC_API_KEY=<from Anthropic>
FAL_KEY=<from FAL.ai>

# ========================================
# NEWS SOURCES (optional but recommended)
# ========================================
NEWS_API_KEY=<from NewsAPI.org>
TAVILY_API_KEY=<from Tavily>
PERPLEXITY_API_KEY=<from Perplexity>

# ========================================
# OPTIONAL — Email & Push
# ========================================
RESEND_API_KEY=<from Resend>
RESEND_FROM_EMAIL=news@futurestack.live

# ========================================
# SITE CONFIG
# ========================================
NEXT_PUBLIC_SITE_URL=https://v0-ai-tools-blog-one.vercel.app
NODE_ENV=development
```

---

## 5️⃣ Testing the Full Pipeline

### Test 1: Verify Contentful Connection

```bash
curl http://localhost:3000/api/contentful/pull
```

Expected: `{ "ok": true, "toolsCount": X, "newsCount": Y }`

### Test 2: Publish Sample Tools via API

```bash
curl -X POST http://localhost:3000/api/contentful/publish/tools \
  -H "Content-Type: application/json" \
  -d '{"source":"manual","dryRun":false,"publish":true,"items":[{"name":"Test Tool","slug":"test-tool","description":"A test","websiteUrl":"https://test.com","categorySlug":"code","status":"published"}]}'
```

### Test 3: View Inngest Dashboard (Local)

```bash
# Your dev server logs should show:
# ✓ Inngest dev server running at http://localhost:8288

# Visit: http://localhost:8288
# You should see your functions listed
```

### Test 4: Trigger a Manual Job

In your code, send an event:

```typescript
import { inngest } from "@/inngest/client";

await inngest.send({
  name: "news/fetch.signals",
  data: { triggeredBy: "manual" },
});
```

Then check http://localhost:8288 to see the job execute.

---

## 🎯 Next Steps After Setup

Once all of the above is complete:

1. **Test the webhook** — Publish a tool in Contentful, it should sync to Supabase
2. **Run the fetcher** — Trigger `fetchAISignals` manually to pull RSS + Perplexity news
3. **Run the processor** — Watch signals get scored and approved articles generated
4. **Build comparisons** — Implement `/api/contentful/generate/comparisons`
5. **Build stacks** — Implement `/api/contentful/generate/stacks`

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `Missing CONTENTFUL_SPACE_ID` | Check `.env.local` has correct Contentful credentials |
| `Missing INNGEST_EVENT_KEY` | Generate in Inngest dashboard, add to `.env.local` |
| `Webhook not syncing` | Verify Contentful webhook URL is correct and `x-futurestack-webhook-secret` header matches |
| `Functions not showing in Inngest UI` | Make sure `npm run dev` is running on localhost:3000 |
| `Database error on webhook` | Check Supabase tables exist; run the SQL migrations above |
| `RSS feeds failing` | Try adding `NEWS_API_KEY` as fallback; RSS feeds sometimes have CORS issues |

---

## 📞 Support

If you get stuck:
1. Check the logs: `npm run dev` output
2. Check Inngest dashboard: http://localhost:8288 (shows job errors)
3. Check Supabase dashboard: SQL editor for table/data issues
4. Check Contentful dashboard: Verify content models and published entries

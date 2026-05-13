/**
 * Inngest function: sync-alternativeto
 *
 * Runs daily at 6 AM UTC. Scrapes AlternativeTo.net for 5 tools per
 * category across 6 categories, rewrites each tool description in
 * DISCOVA brand voice using Claude, then publishes to:
 *   - tools table (new tools)
 *   - articles table (news items & tool spotlights)
 *   - affiliate_links table (auto-generated redirect links)
 *
 * Also runs every 30 minutes for the Tech News category only.
 *
 * Deduplication: slug-based — never double-publishes the same tool or article.
 */

import { inngest } from "../client";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import {
  AT_CATEGORIES,
  scrapeATCategory,
  scrapeATNews,
  buildAffiliateLink,
  type ATTool,
  type ATNewsItem,
} from "@/lib/alternativeto";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAnthropic(): Anthropic | null {
  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function estimateReadTime(text: string): number {
  return Math.max(2, Math.ceil(text.split(/\s+/).length / 200));
}

// ── DISCOVA brand voice rewriter prompts ─────────────────────────────────────

const TOOL_REWRITE_SYSTEM = `You are DISCOVA's editorial voice — Africa's Digital Discovery Operating System.
Your job: rewrite SaaS tool descriptions in DISCOVA's brand voice.

Brand voice:
- Concise, confident, discovery-focused
- Professional but warm — like a knowledgeable friend making a recommendation
- Always highlights the core VALUE, not just features
- Africa-aware when relevant (pricing, mobile-first, bandwidth)
- No buzzwords, no fluff, no hype

Return ONLY valid JSON:
{
  "title": "Tool name (unchanged)",
  "shortDescription": "2-3 punchy sentences. What it does, who it's for, why it matters. Max 180 chars per sentence.",
  "categoryTag": "The category label",
  "highlights": ["key benefit 1", "key benefit 2", "key benefit 3"],
  "africanContext": "One sentence on Africa-relevance (affordability, availability, mobile). Omit if not applicable.",
  "tags": ["tag1", "tag2", "tag3"]
}`;

const NEWS_REWRITE_SYSTEM = `You are DISCOVA's editorial voice — Africa's Digital Discovery Operating System.
Rewrite tech news items in 2-3 sentences for DISCOVA's audience of African founders, freelancers, and global SaaS builders.

Focus on: innovation angle, relevance to tool discovery, practical impact.
Tone: insightful, direct, zero fluff.

Return ONLY valid JSON:
{
  "title": "Rewritten headline — specific, punchy, max 90 chars",
  "summary": "2-3 sentences. Innovation angle + relevance + practical takeaway. Max 400 chars total.",
  "tags": ["tag1", "tag2", "tag3"]
}`;

// ── Rewrite a single tool with Claude ────────────────────────────────────────

interface RewrittenTool {
  title: string;
  shortDescription: string;
  categoryTag: string;
  highlights: string[];
  africanContext: string;
  tags: string[];
}

async function rewriteTool(
  tool: ATTool,
  anthropic: Anthropic,
): Promise<RewrittenTool | null> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      system: TOOL_REWRITE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Rewrite this tool for DISCOVA:

TOOL NAME: ${tool.name}
CATEGORY: ${tool.category.name}
ORIGINAL DESCRIPTION: ${tool.description || "No description available"}
WEBSITE: ${tool.websiteUrl}
CATEGORY TAG: ${tool.category.tag}

Return ONLY valid JSON.`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as RewrittenTool;
  } catch {
    return null;
  }
}

// ── Rewrite a news item with Claude ──────────────────────────────────────────

interface RewrittenNews {
  title: string;
  summary: string;
  tags: string[];
}

async function rewriteNews(
  item: ATNewsItem,
  anthropic: Anthropic,
): Promise<RewrittenNews | null> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: NEWS_REWRITE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Rewrite this tech news for DISCOVA:

HEADLINE: ${item.title}
ORIGINAL EXCERPT: ${item.excerpt || "No excerpt available"}
SOURCE URL: ${item.url}

Return ONLY valid JSON.`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as RewrittenNews;
  } catch {
    return null;
  }
}

// ── Resolve or create AI author ───────────────────────────────────────────────

async function resolveAuthor(): Promise<string> {
  const { rows } = await db.query(
    `SELECT id FROM authors WHERE slug = 'discova-ai' LIMIT 1`,
  );
  if (rows[0]) return rows[0].id as string;

  const { rows: ins } = await db.query(
    `INSERT INTO authors (name, slug, bio, avatar)
     VALUES ('DISCOVA AI', 'discova-ai',
       'AI-powered editorial intelligence monitoring the digital ecosystem across Africa 24/7.',
       '/avatars/ai-author.png')
     ON CONFLICT (slug) DO UPDATE SET bio = EXCLUDED.bio
     RETURNING id`,
  );
  return ins[0]?.id as string;
}

// ── Save a tool to DB ─────────────────────────────────────────────────────────

async function saveTool(
  tool: ATTool,
  rewritten: RewrittenTool | null,
): Promise<{ id: string; slug: string; isNew: boolean } | null> {
  const name = rewritten?.title || tool.name;
  const slug = slugify(name);
  const description = rewritten?.shortDescription || tool.description;
  const tagline = description.slice(0, 120);
  const tags = rewritten?.tags || [];

  // Resolve tool category
  const categorySlug = tool.category.slug;
  const { rows: catRows } = await db.query(
    `SELECT id FROM tool_categories WHERE slug = $1 LIMIT 1`,
    [categorySlug],
  );
  const { rows: catFallback } = await db.query(
    `SELECT id FROM tool_categories LIMIT 1`,
  );
  const categoryId = catRows[0]?.id ?? catFallback[0]?.id ?? null;

  // Check if tool already exists
  const { rows: existing } = await db.query(
    `SELECT id, slug FROM tools WHERE slug = $1 OR name ILIKE $2 LIMIT 1`,
    [slug, name],
  );
  if (existing[0]) return { id: existing[0].id as string, slug: existing[0].slug as string, isNew: false };

  // Insert new tool
  const { rows } = await db.query(
    `INSERT INTO tools (
       name, slug, tagline, description,
       website_url, logo, category_id,
       pricing_model, is_featured, status,
       tags, created_at, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,
       'freemium',false,'active',
       $8,NOW(),NOW()
     )
     ON CONFLICT (slug) DO NOTHING
     RETURNING id, slug`,
    [
      name,
      slug,
      tagline,
      description,
      tool.websiteUrl,
      tool.logoUrl || `https://logo.clearbit.com/${new URL(tool.websiteUrl).hostname.replace(/^www\./, "")}`,
      categoryId,
      tags,
    ],
  );

  if (!rows[0]) return null;

  // Save affiliate link
  const affiliateUrl = buildAffiliateLink(name);
  await db.query(
    `INSERT INTO affiliate_links (tool_id, affiliate_url, partner_name, commission_rate, is_active)
     VALUES ($1, $2, 'AlternativeTo', 0, true)
     ON CONFLICT DO NOTHING`,
    [rows[0].id, affiliateUrl],
  ).catch(() => null); // non-fatal if affiliate_links table doesn't exist yet

  return { id: rows[0].id as string, slug: rows[0].slug as string, isNew: true };
}

// ── Save a tool spotlight article ─────────────────────────────────────────────

async function saveToolArticle(
  tool: ATTool,
  rewritten: RewrittenTool | null,
  authorId: string,
): Promise<string | null> {
  const toolName = rewritten?.title || tool.name;
  const slug = `discover-${slugify(toolName)}-${Date.now()}`;
  const title = `Discover ${toolName}: ${rewritten?.shortDescription?.split(".")[0] || tool.description.split(".")[0]}`.slice(0, 90);
  const excerpt = rewritten?.shortDescription || tool.description.slice(0, 200);

  // Build full article content in Markdown
  const highlights = rewritten?.highlights ?? [];
  const africanContext = rewritten?.africanContext || "";

  const content = `## What is ${toolName}?

${rewritten?.shortDescription || tool.description}

${highlights.length > 0 ? `## Why It Stands Out\n\n${highlights.map((h) => `- **${h}**`).join("\n")}` : ""}

## Category

**${tool.category.name}** — found on [AlternativeTo.net](${tool.sourceUrl})

${africanContext ? `## For African Builders\n\n${africanContext}` : ""}

## Get Started

${toolName} is available at [${tool.websiteUrl}](${tool.affiliateLink}).

*Discovered by DISCOVA — Africa's Digital Discovery Operating System.*`;

  const tags = [...(rewritten?.tags || []), "tool-discovery", "alternativeto"];

  // Resolve category
  const { rows: catRows } = await db.query(
    `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
    [tool.category.slug],
  );
  const { rows: catFallback } = await db.query(`SELECT id FROM categories LIMIT 1`);
  const categoryId = catRows[0]?.id ?? catFallback[0]?.id ?? null;

  const { rows } = await db.query(
    `INSERT INTO articles (
       title, slug, excerpt, content,
       hero_image, cover_image_url,
       source_url, source_name,
       author_id, category_id, tags,
       status, is_featured, is_ai_generated,
       reading_time, word_count,
       seo_title, seo_description,
       published_at, created_at, updated_at
     ) VALUES (
       $1,$2,$3,$4,
       $5,$5,
       $6,'AlternativeTo via DISCOVA',
       $7,$8,$9,
       'published',false,true,
       $10,$11,
       $1,$3,
       NOW(),NOW(),NOW()
     )
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`,
    [
      title,
      slug,
      excerpt,
      content,
      tool.logoUrl ?? null,
      tool.sourceUrl,
      authorId,
      categoryId,
      tags,
      estimateReadTime(content),
      content.split(/\s+/).length,
    ],
  );

  return rows[0]?.id ?? null;
}

// ── Save a news article ───────────────────────────────────────────────────────

async function saveNewsArticle(
  item: ATNewsItem,
  rewritten: RewrittenNews | null,
  authorId: string,
): Promise<string | null> {
  const title = rewritten?.title || item.title;
  const slug = slugify(title);
  const excerpt = rewritten?.summary || item.excerpt.slice(0, 200);
  const tags = [...(rewritten?.tags || []), "tech-news", "alternativeto"];

  const content = `## ${title}

${rewritten?.summary || item.excerpt}

---

*Source: [AlternativeTo News](${item.url})*

*Curated by DISCOVA — Africa's Digital Discovery Operating System.*`;

  const { rows: catRows } = await db.query(
    `SELECT id FROM categories WHERE slug = 'saas-news' LIMIT 1`,
  );
  const { rows: catFallback } = await db.query(`SELECT id FROM categories LIMIT 1`);
  const categoryId = catRows[0]?.id ?? catFallback[0]?.id ?? null;

  const { rows } = await db.query(
    `INSERT INTO articles (
       title, slug, excerpt, content,
       hero_image, cover_image_url,
       source_url, source_name,
       author_id, category_id, tags,
       status, is_featured, is_ai_generated,
       reading_time, word_count,
       seo_title, seo_description,
       published_at, created_at, updated_at
     ) VALUES (
       $1,$2,$3,$4,
       $5,$5,
       $6,'AlternativeTo News',
       $7,$8,$9,
       'published',false,true,
       $10,$11,
       $1,$3,
       $12,NOW(),NOW()
     )
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`,
    [
      title,
      slug,
      excerpt,
      content,
      item.imageUrl ?? null,
      item.url,
      authorId,
      categoryId,
      tags,
      estimateReadTime(content),
      content.split(/\s+/).length,
      item.publishedAt ? new Date(item.publishedAt) : new Date(),
    ],
  );

  return rows[0]?.id ?? null;
}

// ── Inngest function: daily tools sync ────────────────────────────────────────

export const syncAlternativeToTools = inngest.createFunction(
  {
    id: "sync-alternativeto-tools",
    name: "Sync AlternativeTo Tools (Daily)",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 6 * * *" },                      // Daily at 6 AM UTC
      { event: "alternativeto/tools.sync.requested" },
    ],
  },
  async ({ step, logger, event }) => {
    const apiKey = process.env.SCRAPINGBEE_API_KEY;
    if (!apiKey) return { skipped: true, reason: "no_scrapingbee_key" };

    const anthropic = makeAnthropic();

    const toolsPerCategory: number =
      (event.data as { toolsPerCategory?: number } | undefined)?.toolsPerCategory ?? 5;

    const categoryIds: string[] | undefined =
      (event.data as { categories?: string[] } | undefined)?.categories;

    const targetCategories = AT_CATEGORIES.filter(
      (c) => c.id !== "tech-news" && (!categoryIds || categoryIds.includes(c.id)),
    );

    logger.info(
      `AlternativeTo daily sync: ${targetCategories.length} categories × ${toolsPerCategory} tools`,
    );

    // Resolve author once
    const authorId = await step.run("resolve-author", resolveAuthor);

    const results: {
      category: string;
      toolsSaved: number;
      articlesSaved: number;
      errors: string[];
    }[] = [];

    // Process each category sequentially to avoid hammering ScrapingBee
    for (const cat of targetCategories) {
      const catResult = await step.run(`scrape-${cat.id}`, async () => {
        const catErrors: string[] = [];
        let toolsSaved = 0;
        let articlesSaved = 0;

        logger.info(`Scraping ${cat.name}...`);

        let tools: ATTool[] = [];
        try {
          tools = await scrapeATCategory(cat, toolsPerCategory);
          logger.info(`  → ${tools.length} tools scraped`);
        } catch (err) {
          catErrors.push(`Scrape failed: ${err}`);
          return { category: cat.name, toolsSaved: 0, articlesSaved: 0, errors: catErrors };
        }

        for (const tool of tools) {
          try {
            // Rewrite with Claude
            const rewritten = anthropic ? await rewriteTool(tool, anthropic) : null;

            // Save tool to tools table
            const saved = await saveTool(tool, rewritten);
            if (saved?.isNew) {
              toolsSaved++;

              // Save a spotlight article for new tools
              const articleId = await saveToolArticle(tool, rewritten, authorId);
              if (articleId) articlesSaved++;
            }
          } catch (err) {
            catErrors.push(`Tool "${tool.name}" failed: ${err}`);
          }
        }

        return { category: cat.name, toolsSaved, articlesSaved, errors: catErrors };
      });

      results.push(catResult);

      // Pause between categories to stay within ScrapingBee rate limits
      if (cat !== targetCategories.at(-1)) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    const totalTools = results.reduce((s, r) => s + r.toolsSaved, 0);
    const totalArticles = results.reduce((s, r) => s + r.articlesSaved, 0);

    logger.info(
      `AlternativeTo sync done: ${totalTools} new tools, ${totalArticles} articles published`,
    );

    return { success: true, results, totalTools, totalArticles };
  },
);

// ── Inngest function: news sync (every 30 min) ────────────────────────────────

export const syncAlternativeToNews = inngest.createFunction(
  {
    id: "sync-alternativeto-news",
    name: "Sync AlternativeTo News (Frequent)",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "*/30 * * * *" },                   // Every 30 minutes
      { event: "alternativeto/news.sync.requested" },
    ],
  },
  async ({ step, logger }) => {
    const apiKey = process.env.SCRAPINGBEE_API_KEY;
    if (!apiKey) return { skipped: true, reason: "no_scrapingbee_key" };

    const anthropic = makeAnthropic();

    const authorId = await step.run("resolve-author", resolveAuthor);

    const newsItems = await step.run("scrape-news", async () => {
      logger.info("Scraping AlternativeTo news...");
      try {
        const items = await scrapeATNews(10);
        logger.info(`  → ${items.length} news items`);
        return items;
      } catch (err) {
        logger.warn(`News scrape failed: ${err}`);
        return [];
      }
    });

    if (!newsItems.length) return { success: true, saved: 0, reason: "no_items" };

    // Dedup: check which URLs are already in DB
    const urlArr = newsItems.map((n: ATNewsItem) => n.url);
    const existingUrlsArr = await step.run("check-duplicates", async () => {
      const { rows } = await db.query(
        `SELECT source_url FROM articles WHERE source_url = ANY($1)`,
        [urlArr],
      );
      return rows.map((r: { source_url: string }) => r.source_url) as string[];
    });
    const existingUrls = new Set<string>(existingUrlsArr);

    const newItems = newsItems.filter((n: ATNewsItem) => !existingUrls.has(n.url));
    logger.info(`${newItems.length} new news items after dedup`);

    let saved = 0;
    for (let i = 0; i < newItems.length; i++) {
      const item: ATNewsItem = newItems[i];
      const articleId = await step.run(`save-news-${i + 1}`, async () => {
        const rewritten = anthropic ? await rewriteNews(item, anthropic) : null;
        return saveNewsArticle(item, rewritten, authorId);
      });
      if (articleId) saved++;
    }

    logger.info(`AlternativeTo news sync done: ${saved} articles saved`);
    return { success: true, saved };
  },
);

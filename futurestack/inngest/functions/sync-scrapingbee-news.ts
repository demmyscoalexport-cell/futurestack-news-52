/**
 * Inngest function: sync-scrapingbee-news
 *
 * Runs every 8 hours. Uses ScrapingBee to pull full article content from
 * premium tech news sources (TechCrunch, VentureBeat, Rest of World, MIT
 * Tech Review, SaaStr, etc.) that block simple HTTP requests.
 *
 * Each article is:
 *   1. Scraped via ScrapingBee (RSS feed → full article page)
 *   2. Deduplicated against existing DB articles
 *   3. Expanded with Claude Haiku into a DISCOVA-style editorial piece
 *   4. Saved to the articles table as status='published'
 *
 * ScrapingBee credits used: ~1 credit per RSS feed + 5 credits per full-
 * article scrape (JS rendering costs more). Budget: ~100 credits per run.
 */

import { inngest } from "../client";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import {
  SCRAPINGBEE_SOURCES,
  scrapeNewsSource,
  categoriseScrapedArticle,
  type ScrapedArticle,
} from "@/lib/scrapingbee";
import { estimateReadTime } from "@/lib/gnews";

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
    .slice(0, 90);
}

interface ExpandedArticle {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

// ── Claude expansion prompt ──────────────────────────────────────────────────

const EXPAND_SYSTEM = `You are a senior tech editor at DISCOVA — Africa's digital discovery operating system for creators, founders, freelancers, and businesses across Africa and emerging markets.

Given a news story scraped from a premium tech publication, write an expanded DISCOVA-style article that adds:
- Practical context for our African and global audience (how does this affect their work?)
- Tool recommendations relevant to African realities (affordability, mobile-first, bandwidth)
- Africa / emerging market angle where applicable — Naira pricing, MTN data costs, Android-first tools
- Clear, opinionated take — no fluff, no filler
- Concrete next steps or "what to do now" advice

Return ONLY valid JSON with keys:
{
  "title": "Engaging headline max 90 chars — specific, punchy, not clickbait",
  "excerpt": "Punchy 160-char summary that makes someone want to click",
  "content": "Full article in Markdown, 600-900 words. ## headings, bullet lists, **bold** key terms. Hook opener. Clear takeaway section at end.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

// ── Main Inngest function ─────────────────────────────────────────────────────

export const syncScrapingBeeNews = inngest.createFunction(
  {
    id: "sync-scrapingbee-news",
    name: "Sync ScrapingBee News",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 */8 * * *" },             // Every 8 hours
      { event: "scrapingbee/sync.requested" },
    ],
  },
  async ({ step, logger, event }) => {
    const apiKey = process.env.SCRAPINGBEE_API_KEY;
    if (!apiKey) {
      logger.error("SCRAPINGBEE_API_KEY not configured");
      return { skipped: true, reason: "no_scrapingbee_key" };
    }

    const anthropic = makeAnthropic();

    // How many items to pull per source (configurable via event)
    const maxPerSource: number =
      (event.data as { maxPerSource?: number } | undefined)?.maxPerSource ?? 5;

    // Which sources to scrape (default: all, or subset via event)
    const sourceNames: string[] | undefined =
      (event.data as { sources?: string[] } | undefined)?.sources;

    const activeSources = sourceNames
      ? SCRAPINGBEE_SOURCES.filter((s) => sourceNames.includes(s.name))
      : SCRAPINGBEE_SOURCES;

    logger.info(
      `Starting ScrapingBee sync: ${activeSources.length} sources, ${maxPerSource} items each`,
    );

    // ── Step 1: Resolve / create AI author ───────────────────────────────────
    const authorId = await step.run("resolve-author", async () => {
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
    });

    // ── Step 2: Fetch existing article URLs to deduplicate ───────────────────
    // Note: step.run serialises via JSON, so we return plain arrays and
    // convert to Set outside the step boundary.
    const existingUrlsArr = await step.run("fetch-existing-urls", async () => {
      const { rows } = await db.query(
        `SELECT source_url FROM articles WHERE source_url IS NOT NULL AND created_at > NOW() - INTERVAL '30 days'`,
      );
      return rows.map((r: { source_url: string }) => r.source_url) as string[];
    });
    const existingUrls = new Set<string>(existingUrlsArr);

    // Also load recent title bigrams for topic-level deduplication
    const existingBigramArr = await step.run("fetch-title-bigrams", async () => {
      const { rows } = await db.query(
        `SELECT title FROM articles WHERE created_at > NOW() - INTERVAL '7 days'`,
      );
      const bigrams: string[] = [];
      for (const { title } of rows) {
        const words = (title as string)
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, " ")
          .split(/\s+/)
          .filter((w: string) => w.length > 3);
        for (let i = 0; i < words.length - 1; i++) {
          bigrams.push(`${words[i]} ${words[i + 1]}`);
        }
      }
      return bigrams;
    });
    const existingTitleBigrams = new Set<string>(existingBigramArr);

    // ── Step 3: Scrape each source ────────────────────────────────────────────
    const allArticles: (ScrapedArticle & { sourceCategory: string })[] = [];

    for (const source of activeSources) {
      const scraped = await step.run(`scrape-${slugify(source.name)}`, async () => {
        logger.info(`Scraping ${source.name} (${source.feedUrl})`);
        try {
          const items = await scrapeNewsSource(source, {
            maxItems: maxPerSource,
            scrapeFullArticles: false, // Keep credits low — RSS content is enough
          });
          logger.info(`  → ${items.length} items from ${source.name}`);
          return items.map((a) => ({ ...a, sourceCategory: source.category }));
        } catch (err) {
          logger.warn(`  ⚠ ${source.name} scrape failed: ${err}`);
          return [];
        }
      });

      allArticles.push(...scraped);
    }

    logger.info(`Total scraped: ${allArticles.length} articles across all sources`);

    if (allArticles.length === 0) {
      return { skipped: true, reason: "no_articles_scraped" };
    }

    // ── Step 4: Filter to genuinely new articles ──────────────────────────────
    const newArticles = allArticles.filter((a) => {
      // URL dedup
      if (existingUrls.has(a.url)) return false;

      // Title bigram dedup (same story from different outlet)
      const titleWords = a.title
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3);
      let matches = 0;
      for (let i = 0; i < titleWords.length - 1; i++) {
        if (existingTitleBigrams.has(`${titleWords[i]} ${titleWords[i + 1]}`)) matches++;
      }
      return matches < 3;
    });

    logger.info(`New articles after deduplication: ${newArticles.length}`);

    if (newArticles.length === 0) {
      return { success: true, newArticles: 0, reason: "all_duplicates" };
    }

    // ── Step 5: Expand each article with Claude + save to DB ──────────────────
    const saved: { title: string; slug: string; source: string }[] = [];

    for (let i = 0; i < newArticles.length; i++) {
      const raw = newArticles[i];

      const result = await step.run(`process-article-${i + 1}`, async () => {
        // Derive category
        const category = categoriseScrapedArticle(raw, raw.sourceCategory);

        // Attempt Claude expansion
        let expanded: ExpandedArticle | null = null;

        if (anthropic) {
          try {
            const response = await anthropic.messages.create({
              model: "claude-haiku-4-5",
              max_tokens: 2000,
              system: EXPAND_SYSTEM,
              messages: [
                {
                  role: "user",
                  content: `Expand this news story for DISCOVA readers:

HEADLINE: ${raw.title}
SOURCE: ${raw.sourceName} (${raw.sourceDomain})
SUMMARY: ${raw.excerpt}
BODY CONTENT: ${raw.content.slice(0, 2000)}
${raw.author ? `AUTHOR: ${raw.author}` : ""}
${raw.publishedAt ? `PUBLISHED: ${raw.publishedAt}` : ""}

Write the full DISCOVA article now. Return ONLY valid JSON.`,
                },
              ],
            });

            const text =
              response.content[0].type === "text" ? response.content[0].text : "{}";
            const clean = text
              .replace(/^```json\s*/i, "")
              .replace(/```\s*$/i, "")
              .trim();
            const match = clean.match(/\{[\s\S]*\}/);
            if (match) expanded = JSON.parse(match[0]) as ExpandedArticle;
          } catch (err) {
            logger.warn(`Claude expansion failed for "${raw.title}": ${err}`);
          }
        }

        // Fall back to raw scraped content
        const title = expanded?.title || raw.title;
        const excerpt = expanded?.excerpt || raw.excerpt || "";
        const content =
          expanded?.content ||
          `## ${raw.title}\n\n${raw.excerpt}\n\n${raw.content || ""}\n\n*Source: [${raw.sourceName}](${raw.url})*`;
        const tags = expanded?.tags || [];
        const slug = slugify(title) || `news-${Date.now()}`;
        const readingTime = estimateReadTime(content);

        // Resolve category FK
        const { rows: catRows } = await db.query(
          `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
          [category],
        );
        const { rows: catFallback } = await db.query(`SELECT id FROM categories LIMIT 1`);
        const categoryId = catRows[0]?.id ?? catFallback[0]?.id ?? null;

        // Insert article
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
             $6,$7,
             $8,$9,$10,
             'published',false,true,
             $11,$12,
             $1,$3,
             $13,NOW(),NOW()
           )
           ON CONFLICT (slug) DO NOTHING
           RETURNING id, slug`,
          [
            title,
            slug,
            excerpt,
            content,
            raw.imageUrl ?? null,
            raw.url,
            raw.sourceName,
            authorId,
            categoryId,
            tags,
            readingTime,
            content.split(/\s+/).length,
            raw.publishedAt ? new Date(raw.publishedAt) : new Date(),
          ],
        );

        return rows[0] as { id: string; slug: string } | undefined;
      });

      if (result) {
        saved.push({ title: raw.title, slug: result.slug, source: raw.sourceName });
        logger.info(`Saved: ${result.slug} (from ${raw.sourceName})`);
      }
    }

    logger.info(
      `ScrapingBee sync complete: ${saved.length}/${newArticles.length} articles saved`,
    );

    return {
      success: true,
      newArticles: saved.length,
      total: allArticles.length,
      deduplicated: allArticles.length - newArticles.length,
      articles: saved,
    };
  },
);

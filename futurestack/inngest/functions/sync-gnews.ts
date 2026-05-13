/**
 * Inngest function: sync-gnews
 *
 * Runs every 6 hours. Fetches real AI/tech news from GNews API,
 * then uses Claude to expand each article into a full DISCOVA-style
 * piece before saving to the DB. Articles from external sources are
 * stored with source attribution.
 */
import { inngest } from "../client";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import {
  fetchMultipleTopics,
  categoriseArticle,
  estimateReadTime,
  type GNewsArticle,
} from "@/lib/gnews";

function makeAnthropic(): Anthropic | null {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
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

const EXPAND_SYSTEM = `You are a senior tech editor at DISCOVA — Africa's digital discovery operating system for creators, founders, freelancers, and businesses across Africa and emerging markets.

Given a news story, write an expanded DISCOVA-style article that adds:
- Practical context for our African and global audience (how does this affect their work?)
- Tool recommendations relevant to African realities (affordability, mobile, bandwidth)
- Africa/emerging market angle where applicable — Naira pricing, MTN data, Android-first
- Clear, opinionated take — no fluff

Return ONLY valid JSON with keys:
{
  "title": "Engaging headline max 90 chars",
  "excerpt": "Punchy 160-char summary that makes someone want to read",
  "content": "Full article in Markdown, 500-800 words. ## headings, bullet lists, bold key terms. Hook opener. Clear takeaway at end.",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

export const syncGNewsArticles = inngest.createFunction(
  {
    id: "sync-gnews-articles",
    name: "Sync GNews Articles",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 */6 * * *" }, // Every 6 hours
      { event: "gnews/sync.requested" },
    ],
  },
  async ({ step, logger, event }) => {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      logger.error("GNEWS_API_KEY not configured");
      return { skipped: true, reason: "no_gnews_key" };
    }

    const anthropic = makeAnthropic();
    const maxArticles: number = (event.data as { max?: number } | undefined)?.max ?? 6;

    logger.info("Fetching articles from GNews API...");

    // Step 1: Fetch fresh articles from GNews
    const rawArticles = await step.run("fetch-gnews", async () => {
      const articles = await fetchMultipleTopics(4);
      // Filter out articles without images or very short content
      return articles
        .filter((a) => a.title && a.description && a.title.length > 20)
        .slice(0, maxArticles);
    });

    if (!rawArticles.length) {
      logger.warn("No articles fetched from GNews");
      return { skipped: true, reason: "no_articles" };
    }

    logger.info(`Fetched ${rawArticles.length} raw articles from GNews`);

    // Step 2: Check which ones are already in the DB (by source URL or similar title)
    const newArticles = await step.run("filter-existing", async () => {
      const urls = rawArticles.map((a: GNewsArticle) => a.url);
      const { rows } = await db.query(
        `SELECT source_url FROM articles WHERE source_url = ANY($1)`,
        [urls],
      );
      const existingUrls = new Set(rows.map((r: { source_url: string }) => r.source_url));

      // Also fetch existing article titles to deduplicate by topic
      const { rows: titleRows } = await db.query(
        `SELECT title FROM articles WHERE created_at > NOW() - INTERVAL '7 days'`,
      );

      // Build a set of "core topic keywords" from existing recent titles
      const existingTopics = new Set<string>();
      for (const { title } of titleRows) {
        // Extract 3+ consecutive words as a fingerprint
        const words = (title as string).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3);
        for (let i = 0; i < words.length - 1; i++) {
          existingTopics.add(`${words[i]} ${words[i + 1]}`);
        }
      }

      return rawArticles.filter((a: GNewsArticle) => {
        if (existingUrls.has(a.url)) return false;
        // Check if this article is about an already-covered topic (same story from different outlet)
        const titleWords = a.title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3);
        let topicMatchCount = 0;
        for (let i = 0; i < titleWords.length - 1; i++) {
          const bigram = `${titleWords[i]} ${titleWords[i + 1]}`;
          if (existingTopics.has(bigram)) topicMatchCount++;
        }
        // If more than 2 bigrams match, likely the same story
        return topicMatchCount < 3;
      });
    });

    if (!newArticles.length) {
      logger.info("All fetched articles already exist in DB");
      return { success: true, newArticles: 0 };
    }

    logger.info(`${newArticles.length} new articles to process`);

    // Step 3: Resolve or create the AI author
    const authorId = await step.run("resolve-author", async () => {
      const { rows } = await db.query(
        `SELECT id FROM authors WHERE slug = 'futurestack-ai' LIMIT 1`,
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

    // Step 4: Process each article — expand with Claude + save
    const results: { title: string; slug: string; status: string }[] = [];

    for (let i = 0; i < newArticles.length; i++) {
      const raw: GNewsArticle = newArticles[i];

      const result = await step.run(`process-article-${i + 1}`, async () => {
        let expanded: ExpandedArticle | null = null;

        // Try to expand with Claude if available
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
SUMMARY: ${raw.description}
SOURCE CONTENT: ${raw.content?.slice(0, 1500) || raw.description}
SOURCE: ${raw.source.name}
PUBLISHED: ${raw.publishedAt}

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
            if (match) {
              expanded = JSON.parse(match[0]) as ExpandedArticle;
            }
          } catch (err) {
            logger.warn(`Claude expansion failed for "${raw.title}": ${err}`);
          }
        }

        // Fall back to raw article data if Claude unavailable/failed
        const title = expanded?.title || raw.title;
        const excerpt = expanded?.excerpt || raw.description?.slice(0, 200) || "";
        const content =
          expanded?.content ||
          `## ${raw.title}\n\n${raw.description}\n\n${raw.content || ""}\n\n*Source: [${raw.source.name}](${raw.url})*`;
        const tags = expanded?.tags || [];
        const category = categoriseArticle(raw);
        const slug = slugify(title) || `news-${Date.now()}`;
        const readingTime = estimateReadTime(content);

        // Resolve category ID
        const { rows: catRows } = await db.query(
          `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
          [category],
        );
        const catFallback = await db.query(`SELECT id FROM categories LIMIT 1`);
        const categoryId = catRows[0]?.id || catFallback.rows[0]?.id || null;

        // Save to DB
        const { rows } = await db.query(
          `INSERT INTO articles (
             title, slug, excerpt, content, hero_image, cover_image_url,
             source_url, source_name,
             author_id, category_id, tags, status,
             is_featured, is_ai_generated,
             reading_time, word_count,
             seo_title, seo_description,
             published_at, created_at, updated_at
           ) VALUES (
             $1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,
             'published',false,true,
             $11,$12,$1,$3,
             $13,NOW(),NOW()
           )
           ON CONFLICT (slug) DO NOTHING
           RETURNING id, slug, status`,
          [
            title,
            slug,
            excerpt,
            content,
            raw.image || null,
            raw.url,
            raw.source.name,
            authorId,
            categoryId,
            tags,
            readingTime,
            content.split(/\s+/).length,
            new Date(raw.publishedAt),
          ],
        );

        return rows[0] as { id: string; slug: string; status: string } | undefined;
      });

      if (result) {
        results.push({ title: raw.title, slug: result.slug, status: result.status });
        logger.info(`Saved: ${result.slug}`);
      }
    }

    const saved = results.length;
    logger.info(`GNews sync complete: ${saved} articles saved`);

    return { success: true, newArticles: saved, articles: results };
  },
);

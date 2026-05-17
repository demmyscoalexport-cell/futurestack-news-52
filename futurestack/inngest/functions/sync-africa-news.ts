/**
 * Inngest function: sync-africa-news
 *
 * Runs every 4 hours. Pulls from 5 African tech RSS feeds:
 *   Techpoint.africa, TechCabal, Disrupt Africa, Ventures Africa, Wee Tracker
 *
 * Each article is expanded with Claude into a full DISCOVA editorial piece
 * with Africa context, then saved to the DB as a published article.
 */
import { inngest } from "../client";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { AFRICA_RSS_FEEDS, type AfricaRssFeed } from "@/lib/africa-sources";

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

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  content?: string;
}

interface ParsedFeed {
  items: RssItem[];
}

/** Lightweight RSS parser using fetch + regex (no heavy dependency in edge) */
async function fetchRss(feedUrl: string): Promise<RssItem[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "DISCOVA/1.0 RSS Reader" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`RSS fetch failed ${res.status}: ${feedUrl}`);
  const xml = await res.text();

  const items: RssItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];

  for (const block of itemBlocks) {
    const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ??
      block.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() ?? "";
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) ??
      block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/))?.[1]?.trim() ?? "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const description = (
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ??
      block.match(/<description>([\s\S]*?)<\/description>/)
    )?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";

    if (title && link) {
      items.push({ title, link, pubDate, contentSnippet: description.slice(0, 400) });
    }
  }

  return items.slice(0, 15);
}

const EXPAND_SYSTEM = `You are DISCOVA's Africa editorial AI — a senior editor covering tech, startups, and digital tools across Nigeria, Ghana, Kenya, and the broader African continent.

Given a news headline + summary from an African tech publication, write a full expanded DISCOVA article that:
- Opens with a sharp hook that speaks to African builders, founders, or freelancers
- Adds real context: how does this affect their day-to-day work?
- Names relevant tools, apps, or platforms (especially Africa-friendly ones)
- Mentions Nigeria, Kenya, or other relevant countries where applicable
- Ends with a clear "What this means for you" takeaway

Return ONLY valid JSON:
{
  "title": "Compelling headline max 90 chars (can rephrase original)",
  "excerpt": "160-char punchy summary for social sharing",
  "content": "Full article in Markdown. 500-800 words. ## headings, bold key terms. Start with a hook. Include practical tips. End with a takeaway.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "africa"]
}`;

interface ExpandedArticle {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export const syncAfricaNews = inngest.createFunction(
  {
    id: "sync-africa-news",
    name: "Sync Africa News (RSS)",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 */4 * * *" },          // Every 4 hours
      { event: "africa/news.sync.requested" },
    ],
  },
  async ({ step, logger, event }) => {
    const maxPerFeed: number = (event.data as { maxPerFeed?: number } | undefined)?.maxPerFeed ?? 3;
    const anthropic = makeAnthropic();

    logger.info(`Starting Africa RSS sync — ${AFRICA_RSS_FEEDS.length} feeds, ${maxPerFeed}/feed`);

    // Step 1: Fetch all RSS feeds in parallel
    const rawByFeed = await step.run("fetch-rss-feeds", async () => {
      const results = await Promise.allSettled(
        AFRICA_RSS_FEEDS.map(async (feed: AfricaRssFeed) => {
          const items = await fetchRss(feed.url);
          return { feed, items: items.slice(0, maxPerFeed) };
        }),
      );

      const all: Array<{ feed: AfricaRssFeed; item: RssItem }> = [];
      for (const r of results) {
        if (r.status === "fulfilled") {
          for (const item of r.value.items) {
            all.push({ feed: r.value.feed, item });
          }
        } else {
          logger.warn(`RSS fetch failed: ${r.reason}`);
        }
      }
      logger.info(`Fetched ${all.length} total RSS items`);
      return all;
    });

    if (!rawByFeed.length) {
      logger.warn("No RSS items fetched");
      return { skipped: true, reason: "no_items" };
    }

    // Step 2: Filter already-published articles (by source URL or title bigram)
    const newItems = await step.run("filter-existing", async () => {
      const links = rawByFeed.map((r) => r.item.link).filter(Boolean);

      const { rows: existing } = await db.query(
        `SELECT source_url, title FROM articles
         WHERE source_url = ANY($1) OR created_at > NOW() - INTERVAL '3 days'`,
        [links],
      );

      const existingUrls = new Set(existing.map((r: { source_url: string }) => r.source_url));
      const existingTitles = existing.map((r: { title: string }) =>
        r.title?.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w: string) => w.length > 4),
      );

      return rawByFeed.filter(({ item }) => {
        if (existingUrls.has(item.link)) return false;
        const titleWords = item.title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 4);
        // Duplicate detection: if 3+ title words match an existing recent title
        for (const existWords of existingTitles) {
          const shared = titleWords.filter((w: string) => existWords.includes(w)).length;
          if (shared >= 3) return false;
        }
        return true;
      });
    });

    if (!newItems.length) {
      logger.info("All Africa RSS articles already in DB");
      return { success: true, newArticles: 0 };
    }

    logger.info(`${newItems.length} new Africa articles to process`);

    // Step 3: Resolve DISCOVA AI author
    const authorId = await step.run("resolve-author", async () => {
      const { rows } = await db.query(
        `SELECT id FROM authors WHERE slug = 'discova-ai' LIMIT 1`,
      );
      if (rows[0]) return rows[0].id as string;
      const { rows: ins } = await db.query(
        `INSERT INTO authors (name, slug, bio, avatar)
         VALUES ('DISCOVA AI', 'discova-ai',
           'AI-powered editorial intelligence monitoring Africa''s digital ecosystem 24/7.',
           '/avatars/ai-author.png')
         ON CONFLICT (slug) DO UPDATE SET bio = EXCLUDED.bio
         RETURNING id`,
      );
      return ins[0]?.id as string;
    });

    // Step 4: Resolve or create the africa-tech category
    const categoryId = await step.run("resolve-category", async () => {
      const { rows } = await db.query(
        `SELECT id FROM categories WHERE slug = 'africa-tech' LIMIT 1`,
      );
      if (rows[0]) return rows[0].id as string;
      const { rows: ins } = await db.query(
        `INSERT INTO categories (name, slug)
         VALUES ('Africa Tech', 'africa-tech')
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
      );
      return ins[0]?.id as string ?? null;
    });

    // Step 5: Process each article
    let published = 0;
    let failed = 0;

    for (let i = 0; i < newItems.length; i++) {
      const { feed, item } = newItems[i];

      const result = await step.run(`process-africa-article-${i + 1}`, async () => {
        const rawText = `${item.title}\n\n${item.contentSnippet ?? ""}`;
        let expanded: ExpandedArticle | null = null;

        if (anthropic) {
          try {
            const msg = await anthropic.messages.create({
              model: "claude-haiku-4-5",
              max_tokens: 2000,
              system: EXPAND_SYSTEM,
              messages: [
                {
                  role: "user",
                  content: `Source: ${feed.name} (${feed.country})\n\nHeadline: ${item.title}\n\nSummary: ${item.contentSnippet ?? "(no summary)"}\n\nURL: ${item.link}`,
                },
              ],
            });
            const raw = (msg.content[0] as { text?: string }).text ?? "";
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) expanded = JSON.parse(jsonMatch[0]) as ExpandedArticle;
          } catch (e) {
            logger.warn(`Claude expansion failed for "${item.title}": ${(e as Error).message}`);
          }
        }

        // Fallback if Claude unavailable or failed
        if (!expanded) {
          expanded = {
            title: item.title,
            excerpt: item.contentSnippet?.slice(0, 160) ?? item.title,
            content: `## ${item.title}\n\n${item.contentSnippet ?? ""}\n\n*Source: [${feed.name}](${item.link})*`,
            tags: feed.tags,
          };
        }

        const slug = slugify(expanded.title);
        const wordCount = expanded.content.split(/\s+/).length;
        const readingTime = Math.max(2, Math.ceil(wordCount / 200));
        const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

        await db.query(
          `INSERT INTO articles
             (slug, title, excerpt, content, tags, status,
              author_id, category_id,
              is_featured, is_ai_generated,
              reading_time, word_count,
              published_at, source_name, source_url,
              seo_title, seo_description)
           VALUES ($1,$2,$3,$4,$5,'published',
                   $6,$7,
                   false, true,
                   $8,$9,
                   $10,$11,$12,
                   $13,$14)
           ON CONFLICT (slug) DO UPDATE SET
             title        = EXCLUDED.title,
             excerpt      = EXCLUDED.excerpt,
             source_name  = EXCLUDED.source_name,
             source_url   = EXCLUDED.source_url,
             updated_at   = NOW()`,
          [
            slug,
            expanded.title,
            expanded.excerpt,
            expanded.content,
            [...(expanded.tags ?? []), ...feed.tags],
            authorId,
            categoryId,
            readingTime,
            wordCount,
            publishedAt,
            feed.name,
            item.link,
            expanded.title,
            expanded.excerpt,
          ],
        );

        return { slug, title: expanded.title, source: feed.name };
      });

      if (result) {
        published++;
        logger.info(`Published: ${result.slug} (from ${result.source})`);
      } else {
        failed++;
      }
    }

    logger.info(`Africa RSS sync done: ${published} published, ${failed} failed`);
    return { published, failed, total: newItems.length };
  },
);

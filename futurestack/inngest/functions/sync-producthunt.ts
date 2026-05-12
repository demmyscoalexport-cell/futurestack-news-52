/**
 * Inngest function: sync-producthunt-tools
 *
 * Runs daily (or on-demand) to pull the latest Product Hunt launches
 * and upsert them into the tools table.
 */
import { inngest } from "../client";
import { db as pool } from "@/lib/db";
import {
  fetchAllPHPosts,
  mapPHTopicsToCategory,
  mapPHPricingModel,
  votesToRating,
  phNameToSlug,
  resolvePHLogo,
  type PHPost,
} from "@/lib/producthunt";

// PH topic slugs we care about — covers AI, SaaS, dev tools, productivity
const SYNC_TOPICS = [
  "artificial-intelligence",
  "developer-tools",
  "design-tools",
  "productivity",
  "no-code",
  "marketing",
  "video",
  "audio",
];

export const syncProductHuntTools = inngest.createFunction(
  {
    id: "sync-producthunt-tools",
    name: "Sync Product Hunt Tools",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 6 * * *" }, // Every day at 6am UTC
    ],
  },
  async ({ step, logger, event }) => {
    const limitPerTopic: number = (event.data as any)?.limitPerTopic ?? 50;
    const topics: string[] = (event.data as any)?.topics ?? SYNC_TOPICS;
    const order: "VOTES" | "NEWEST" | "FEATURED" =
      (event.data as any)?.order ?? "NEWEST";

    logger.info(`Starting PH sync: ${topics.length} topics, ${limitPerTopic}/topic, order=${order}`);

    // Step 1: Fetch posts from all topics in parallel
    const postsByTopic = await step.run("fetch-ph-posts", async () => {
      const results = await Promise.allSettled(
        topics.map((topic) => fetchAllPHPosts(limitPerTopic, topic, order)),
      );

      const allPosts: PHPost[] = [];
      const seen = new Set<string>();

      for (const result of results) {
        if (result.status === "fulfilled") {
          for (const post of result.value) {
            if (!seen.has(post.id)) {
              seen.add(post.id);
              allPosts.push(post);
            }
          }
        }
      }

      logger.info(`Fetched ${allPosts.length} unique posts from PH`);
      return allPosts;
    });

    // Step 2: Filter out posts already in DB by website URL
    const newPosts = await step.run("filter-existing-tools", async () => {
      if (postsByTopic.length === 0) return [];

      // Get all existing website_urls
      const { rows } = await pool.query<{ website_url: string; slug: string }>(
        "SELECT website_url, slug FROM tools WHERE status = 'active'",
      );
      const existingUrls = new Set(rows.map((r) => r.website_url?.toLowerCase()));
      const existingSlugs = new Set(rows.map((r) => r.slug));

      const filtered = postsByTopic.filter((post) => {
        if (!post.website && !post.url) return false;
        const url = (post.website || post.url).toLowerCase();
        if (existingUrls.has(url)) return false;
        // Also skip if slug already exists
        const slug = phNameToSlug(post.name);
        if (existingSlugs.has(slug)) return false;
        return true;
      });

      logger.info(`${filtered.length} new tools to insert (${postsByTopic.length - filtered.length} already exist)`);
      return filtered;
    });

    if (newPosts.length === 0) {
      logger.info("No new tools to add");
      return { inserted: 0, skipped: postsByTopic.length };
    }

    // Step 3: Insert new tools into DB
    const result = await step.run("insert-tools", async () => {
      let inserted = 0;
      let failed = 0;

      for (const post of newPosts) {
        try {
          const slug = phNameToSlug(post.name);
          const topicNodes = post.topics.edges.map((e) => e.node);
          const category = mapPHTopicsToCategory(topicNodes);
          const { pricing_model, has_free } = mapPHPricingModel(post.pricingType);
          const rating = votesToRating(post.votesCount);
          const logo = resolvePHLogo(post);
          const website = post.website || post.url;
          const description =
            post.description ||
            post.tagline ||
            `${post.name} — discovered on Product Hunt`;

          // Tags: always include "new", add "free" if free, "trending" if high votes
          const tags: string[] = ["new", "product-hunt"];
          if (has_free) tags.push("free");
          if (post.votesCount >= 500) tags.push("trending");
          if (post.pricingType === "FREE") tags.push("africa-friendly");

          const africa_friendly =
            post.pricingType === "FREE" ||
            post.pricingType === "FREE_PLAN_AVAILABLE";

          await pool.query(
            `INSERT INTO tools (
               name, slug, tagline, description, logo,
               website, website_url, category,
               pricing_model, pricing_details, has_free,
               africa_friendly, rating, review_count,
               tags, is_featured, is_verified, is_new,
               status, upvote_count, save_count, view_count
             ) VALUES (
               $1,$2,$3,$4,$5,$6,$6,$7,
               $8,$9,$10,$11,$12,$13,
               $14,false,false,true,
               'active',$15,$16,$17
             )
             ON CONFLICT (slug) DO UPDATE SET
               tagline      = EXCLUDED.tagline,
               description  = EXCLUDED.description,
               logo         = EXCLUDED.logo,
               upvote_count = EXCLUDED.upvote_count,
               rating       = EXCLUDED.rating`,
            [
              post.name,
              slug,
              post.tagline,
              description,
              logo,
              website,
              category,
              pricing_model,
              JSON.stringify([]),
              has_free,
              africa_friendly,
              parseFloat(rating.toFixed(1)),
              Math.floor(post.votesCount / 10), // rough review count
              tags,
              post.votesCount,
              Math.floor(post.votesCount * 0.1),
              Math.floor(post.votesCount * 0.5),
            ],
          );

          // Insert default tool scores based on rating
          const baseScore = rating;
          await pool.query(
            `INSERT INTO tool_scores (tool_id, ease_of_use, value_for_money, feature_depth, support_quality, integration_richness, ai_capability)
             SELECT id, $1, $2, $3, $4, $5, $6 FROM tools WHERE slug = $7
             ON CONFLICT (tool_id) DO NOTHING`,
            [
              baseScore,
              has_free ? baseScore + 0.5 : baseScore - 0.5,
              baseScore,
              7.0,
              7.0,
              baseScore,
              category === "writing" || category === "code"
                ? baseScore + 0.3
                : baseScore,
              slug,
            ],
          );

          inserted++;
        } catch (err) {
          logger.error(`Failed to insert ${post.name}: ${(err as Error).message}`);
          failed++;
        }
      }

      return { inserted, failed };
    });

    logger.info(`PH sync complete: ${result.inserted} inserted, ${result.failed} failed`);
    return {
      inserted: result.inserted,
      failed: result.failed,
      skipped: postsByTopic.length - newPosts.length,
      total_fetched: postsByTopic.length,
    };
  },
);

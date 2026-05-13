/**
 * Inngest function: sync-producthunt-tools
 *
 * Runs daily at 8 AM UTC. Pulls exactly 10 brand-new Product Hunt launches,
 * inserts them as active tools, then fires downstream events for:
 *   • AI-generated tool-spotlight article   (discova/tool.added)
 *   • Automatic affiliate link assignment   (discova/tool.added)
 *   • Score calculation                     (already runs nightly)
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

// PH topic slugs we sample from daily (rotated so we get variety)
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

const DAILY_TARGET = 10; // exactly 10 new tools per day

export const syncProductHuntTools = inngest.createFunction(
  {
    id: "sync-producthunt-tools",
    name: "Sync Product Hunt Tools",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 8 * * *" }, // Every day at 8 AM UTC
      { event: "producthunt/sync.requested" },
    ],
  },
  async ({ step, logger, event }) => {
    const limitPerTopic: number = (event.data as any)?.limitPerTopic ?? 20;
    const topics: string[] = (event.data as any)?.topics ?? SYNC_TOPICS;
    const dailyTarget: number = (event.data as any)?.dailyTarget ?? DAILY_TARGET;

    logger.info(`Starting PH sync: targeting ${dailyTarget} new tools from ${topics.length} topics`);

    // Step 1: Fetch recent posts from all topics
    const allPosts = await step.run("fetch-ph-posts", async () => {
      const results = await Promise.allSettled(
        topics.map((topic) => fetchAllPHPosts(limitPerTopic, topic, "NEWEST")),
      );

      const seen = new Set<string>();
      const posts: PHPost[] = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          for (const post of result.value) {
            if (!seen.has(post.id)) {
              seen.add(post.id);
              posts.push(post);
            }
          }
        }
      }

      // Sort by newest first
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      logger.info(`Fetched ${posts.length} unique posts from PH`);
      return posts;
    });

    // Step 2: Filter out tools already in DB, cap at dailyTarget
    const newPosts = await step.run("filter-existing-tools", async () => {
      if (allPosts.length === 0) return [];

      const { rows } = await pool.query<{ website_url: string; slug: string }>(
        "SELECT website_url, slug FROM tools WHERE status IN ('active','pending_review')",
      );
      const existingUrls = new Set(rows.map((r) => r.website_url?.toLowerCase()));
      const existingSlugs = new Set(rows.map((r) => r.slug));

      const filtered = allPosts
        .filter((post) => {
          if (!post.website && !post.url) return false;
          const url = (post.website || post.url).toLowerCase();
          if (existingUrls.has(url)) return false;
          const slug = phNameToSlug(post.name);
          if (existingSlugs.has(slug)) return false;
          return true;
        })
        .slice(0, dailyTarget); // hard cap

      logger.info(
        `${filtered.length} new tools selected (${allPosts.length - filtered.length} already exist or skipped)`,
      );
      return filtered;
    });

    if (newPosts.length === 0) {
      logger.info("No new tools to add today");
      return { inserted: 0, skipped: allPosts.length };
    }

    // Step 3: Insert tools as ACTIVE and collect inserted IDs
    const insertedTools = await step.run("insert-tools", async () => {
      const results: { slug: string; name: string; website: string; tagline: string; description: string }[] = [];
      let failed = 0;

      for (const post of newPosts) {
        try {
          const slug = phNameToSlug(post.name);
          const topicNodes = post.topics.edges.map((e) => e.node);
          const category = mapPHTopicsToCategory(topicNodes);
          const { pricing_model, has_free } = mapPHPricingModel(post.tagline, post.description);
          const rating = votesToRating(post.votesCount);
          const logo = resolvePHLogo(post);
          const website = post.website || post.url;
          const description =
            post.description ||
            post.tagline ||
            `${post.name} — discovered on Product Hunt`;

          const tags: string[] = ["new", "product-hunt"];
          if (has_free) tags.push("free");
          if (post.votesCount >= 500) tags.push("trending");
          if (has_free) tags.push("africa-friendly");
          const africa_friendly = has_free;
          const phUrl = `https://www.producthunt.com/posts/${post.slug}`;

          await pool.query(
            `INSERT INTO tools (
               name, slug, tagline, description, logo,
               website, website_url, category,
               pricing_model, pricing_details, has_free,
               africa_friendly, rating, review_count,
               tags, is_featured, is_verified, is_new,
               status, upvote_count, save_count, view_count,
               source, producthunt_url
             ) VALUES (
               $1,$2,$3,$4,$5,$6,$6,$7,
               $8,$9,$10,$11,$12,$13,
               $14,false,false,true,
               'active',$15,$16,$17,
               'producthunt',$18
             )
             ON CONFLICT (slug) DO UPDATE SET
               tagline         = EXCLUDED.tagline,
               description     = EXCLUDED.description,
               logo            = EXCLUDED.logo,
               upvote_count    = EXCLUDED.upvote_count,
               rating          = EXCLUDED.rating,
               producthunt_url = EXCLUDED.producthunt_url,
               status          = 'active'`,
            [
              post.name, slug, post.tagline, description, logo,
              website, category,
              pricing_model, JSON.stringify([]), has_free,
              africa_friendly, parseFloat(rating.toFixed(1)),
              Math.floor(post.votesCount / 10),
              tags,
              post.votesCount,
              Math.floor(post.votesCount * 0.1),
              Math.floor(post.votesCount * 0.5),
              phUrl,
            ],
          );

          // Insert default tool scores
          const baseScore = rating;
          await pool.query(
            `INSERT INTO tool_scores (
               tool_id, ease_of_use, value_for_money, feature_depth,
               support_quality, integration_richness, ai_capability
             )
             SELECT id, $1, $2, $3, $4, $5, $6 FROM tools WHERE slug = $7
             ON CONFLICT (tool_id) DO NOTHING`,
            [
              baseScore,
              has_free ? Math.min(10, baseScore + 0.5) : Math.max(0, baseScore - 0.5),
              baseScore,
              7.0, 7.0,
              baseScore,
              category === "writing" || category === "code" ? Math.min(10, baseScore + 0.3) : baseScore,
              slug,
            ],
          );

          results.push({ slug, name: post.name, website, tagline: post.tagline, description });
        } catch (err) {
          logger.error(`Failed to insert ${post.name}: ${(err as Error).message}`);
          failed++;
        }
      }

      logger.info(`Inserted ${results.length} tools, ${failed} failed`);
      return { tools: results, failed };
    });

    // Step 4: Fire downstream events for each inserted tool
    // (auto-affiliate + article generation both listen to discova/tool.added)
    if (insertedTools.tools.length > 0) {
      await step.run("fire-downstream-events", async () => {
        for (const tool of insertedTools.tools) {
          await inngest.send({
            name: "discova/tool.added",
            data: {
              slug: tool.slug,
              name: tool.name,
              website: tool.website,
              tagline: tool.tagline,
              description: tool.description,
              source: "producthunt",
            },
          });
        }
        logger.info(`Fired discova/tool.added for ${insertedTools.tools.length} tools`);
      });
    }

    return {
      inserted: insertedTools.tools.length,
      failed: insertedTools.failed,
      skipped: allPosts.length - newPosts.length,
      total_fetched: allPosts.length,
    };
  },
);

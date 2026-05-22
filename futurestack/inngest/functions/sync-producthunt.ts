/**
 * Inngest function: sync-producthunt-tools
 *
 * Runs daily at 8 AM UTC. Pulls brand-new Product Hunt launches,
 * inserts them as active tools via Supabase REST, then fires downstream events.
 */
import { inngest } from "../client";
import {
  fetchAllPHPosts,
  type PHPost,
} from "@/lib/producthunt";
import {
  filterNewPHPosts,
  getExistingPHKeys,
  upsertPHPost,
} from "@/lib/ph-sync";

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

const DAILY_TARGET = 10;

export const syncProductHuntTools = inngest.createFunction(
  {
    id: "sync-producthunt-tools",
    name: "Sync Product Hunt Tools",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 8 * * *" },
      { event: "producthunt/sync.requested" },
    ],
  },
  async ({ step, logger, event }) => {
    const limitPerTopic: number = (event.data as { limitPerTopic?: number })?.limitPerTopic ?? 20;
    const topics: string[] = (event.data as { topics?: string[] })?.topics ?? SYNC_TOPICS;
    const dailyTarget: number = (event.data as { dailyTarget?: number })?.dailyTarget ?? DAILY_TARGET;

    logger.info(`Starting PH sync: targeting ${dailyTarget} new tools from ${topics.length} topics`);

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

      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      logger.info(`Fetched ${posts.length} unique posts from PH`);
      return posts;
    });

    const newPosts = await step.run("filter-existing-tools", async () => {
      if (allPosts.length === 0) return [] as PHPost[];
      const existing = await getExistingPHKeys();
      const filtered = filterNewPHPosts(allPosts, existing, dailyTarget);
      logger.info(
        `${filtered.length} new tools selected (${allPosts.length - filtered.length} already exist or skipped)`,
      );
      return filtered;
    });

    if (newPosts.length === 0) {
      logger.info("No new tools to add today");
      return { inserted: 0, skipped: allPosts.length };
    }

    const insertedTools = await step.run("insert-tools", async () => {
      const results: {
        slug: string;
        name: string;
        website: string;
        tagline: string;
        description: string;
      }[] = [];
      let failed = 0;

      for (const post of newPosts) {
        try {
          const row = await upsertPHPost(post);
          results.push({
            slug: row.slug,
            name: row.name,
            website: row.website,
            tagline: row.tagline,
            description: row.description,
          });
        } catch (err) {
          logger.error(`Failed to insert ${post.name}: ${(err as Error).message}`);
          failed++;
        }
      }

      logger.info(`Inserted ${results.length} tools, ${failed} failed`);
      return { tools: results, failed };
    });

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

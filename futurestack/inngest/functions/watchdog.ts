/**
 * Inngest function: discova-watchdog
 *
 * Runs every hour. Monitors platform health and auto-triggers recovery when:
 *   - Articles drop below threshold (triggers gnews + africa-news sync)
 *   - Tools drop below threshold (triggers africa + producthunt sync)
 *   - DB is unreachable (logs critical alert)
 *
 * Reads metrics from Supabase (the live database).
 */
import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";

interface HealthMetrics {
  tools: number;
  activeTools: number;
  articles: number;
  publishedArticles: number;
  stacks: number;
  dbReachable: boolean;
  checkedAt: string;
}

async function getMetrics(): Promise<HealthMetrics> {
  try {
    const supabase = createAdminClient();

    const [toolsTotal, toolsAll, articlesPublished, articlesTotal, stacks] = await Promise.all([
      supabase.from("tools").select("*", { count: "exact", head: true }).eq("featured", true),
      supabase.from("tools").select("*", { count: "exact", head: true }),
      supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "PUBLISHED"),
      supabase.from("articles").select("*", { count: "exact", head: true }),
      supabase.from("stacks").select("*", { count: "exact", head: true }),
    ]);

    return {
      tools:            toolsAll.count ?? 0,
      activeTools:      toolsAll.count ?? 0,
      articles:         articlesTotal.count ?? 0,
      publishedArticles: articlesPublished.count ?? 0,
      stacks:           stacks.count ?? 0,
      dbReachable:      true,
      checkedAt:        new Date().toISOString(),
    };
  } catch {
    return {
      tools: 0, activeTools: 0, articles: 0,
      publishedArticles: 0, stacks: 0,
      dbReachable: false, checkedAt: new Date().toISOString(),
    };
  }
}

// Thresholds — if counts drop below these, watchdog triggers recovery
const THRESHOLDS = {
  activeTools:      30,
  publishedArticles: 5,
};

export const discoverWatchdog = inngest.createFunction(
  {
    id: "discova-watchdog",
    name: "DISCOVA Platform Watchdog",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 * * * *" },
      { event: "watchdog/check.requested" },
    ],
  },
  async ({ step, logger }) => {
    logger.info("Watchdog: starting health check");

    const metrics = await step.run("get-metrics", getMetrics);

    if (!metrics.dbReachable) {
      logger.error("CRITICAL: Database is unreachable");
      return { status: "critical", error: "DB unreachable", metrics };
    }

    logger.info(
      `Metrics — Tools: ${metrics.activeTools}, Published articles: ${metrics.publishedArticles}, Stacks: ${metrics.stacks}`,
    );

    const actions: string[] = [];

    if (metrics.activeTools < THRESHOLDS.activeTools) {
      await step.run("trigger-tool-sync", async () => {
        logger.warn(`Tools low (${metrics.activeTools} < ${THRESHOLDS.activeTools}) — triggering recovery`);
        await Promise.all([
          inngest.send({ name: "africa/tools.sync.requested" as string, data: { mode: "both", triggeredBy: "watchdog" } }),
          inngest.send({ name: "producthunt/sync.requested" as string, data: { limitPerTopic: 20, triggeredBy: "watchdog" } }),
        ]);
      });
      actions.push(`tool-recovery (${metrics.activeTools} active)`);
    }

    if (metrics.publishedArticles < THRESHOLDS.publishedArticles) {
      await step.run("trigger-news-sync", async () => {
        logger.warn(`Articles low (${metrics.publishedArticles} < ${THRESHOLDS.publishedArticles}) — triggering recovery`);
        await Promise.all([
          inngest.send({ name: "gnews/sync.requested" as string, data: { max: 10, triggeredBy: "watchdog" } }),
          inngest.send({ name: "africa/news.sync.requested" as string, data: { maxPerFeed: 5, triggeredBy: "watchdog" } }),
        ]);
      });
      actions.push(`news-recovery (${metrics.publishedArticles} published)`);
    }

    const hour = new Date().getUTCHours();
    if (hour === 0) {
      await step.run("daily-summary", async () => {
        logger.info(
          `Daily Summary — Tools: ${metrics.activeTools} total | Articles: ${metrics.publishedArticles} published / ${metrics.articles} total | Stacks: ${metrics.stacks}`,
        );
      });
    }

    const status = actions.length > 0 ? "recovery-triggered" : "healthy";
    logger.info(`Watchdog done: ${status}${actions.length ? " | " + actions.join(", ") : ""}`);

    return { status, metrics, actionsTriggered: actions };
  },
);

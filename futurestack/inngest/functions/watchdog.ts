/**
 * Inngest function: discova-watchdog
 *
 * Runs every hour. Monitors platform health and auto-triggers recovery when:
 *   - Articles drop below threshold (triggers gnews + africa-news sync)
 *   - Tools drop below threshold (triggers africa + producthunt sync)
 *   - DB is unreachable (logs critical alert)
 *
 * Also logs a daily health summary with full DB counts.
 */
import { inngest } from "../client";
import { db } from "@/lib/db";

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
    const [toolsResult, articlesResult, stacksResult] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE true)::int AS total,
          COUNT(*) FILTER (WHERE status = 'active')::int AS active
        FROM tools
      `),
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE true)::int AS total,
          COUNT(*) FILTER (WHERE status = 'published')::int AS published
        FROM articles
      `),
      db.query(`SELECT COUNT(*)::int AS total FROM stacks`),
    ]);

    return {
      tools: toolsResult.rows[0]?.total ?? 0,
      activeTools: toolsResult.rows[0]?.active ?? 0,
      articles: articlesResult.rows[0]?.total ?? 0,
      publishedArticles: articlesResult.rows[0]?.published ?? 0,
      stacks: stacksResult.rows[0]?.total ?? 0,
      dbReachable: true,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      tools: 0,
      activeTools: 0,
      articles: 0,
      publishedArticles: 0,
      stacks: 0,
      dbReachable: false,
      checkedAt: new Date().toISOString(),
    };
  }
}

// Thresholds — if counts drop below these, watchdog triggers recovery
const THRESHOLDS = {
  activeTools: 30,        // trigger PH + Africa tool sync
  publishedArticles: 5,   // trigger GNews + Africa news sync
};

export const discoverWatchdog = inngest.createFunction(
  {
    id: "discova-watchdog",
    name: "DISCOVA Platform Watchdog",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 * * * *" },               // Every hour
      { event: "watchdog/check.requested" },
    ],
  },
  async ({ step, logger }) => {
    logger.info("Watchdog: starting health check");

    // Step 1: Get current DB metrics
    const metrics = await step.run("get-metrics", getMetrics);

    if (!metrics.dbReachable) {
      logger.error("CRITICAL: Database is unreachable");
      return {
        status: "critical",
        error: "DB unreachable",
        metrics,
      };
    }

    logger.info(
      `Metrics — Active tools: ${metrics.activeTools}, Published articles: ${metrics.publishedArticles}, Stacks: ${metrics.stacks}`,
    );

    const actions: string[] = [];

    // Step 2: Recovery — tools below threshold
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

    // Step 3: Recovery — articles below threshold
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

    // Step 4: Daily summary — log full metrics once per day (at midnight run)
    const hour = new Date().getUTCHours();
    if (hour === 0) {
      await step.run("daily-summary", async () => {
        logger.info(`Daily Summary — Tools: ${metrics.activeTools} active / ${metrics.tools} total | Articles: ${metrics.publishedArticles} published / ${metrics.articles} total | Stacks: ${metrics.stacks}`);
      });
    }

    const status = actions.length > 0 ? "recovery-triggered" : "healthy";
    logger.info(`Watchdog done: ${status}${actions.length ? " | " + actions.join(", ") : ""}`);

    return {
      status,
      metrics,
      actionsTriggered: actions,
    };
  },
);

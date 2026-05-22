/**
 * Inngest function: sync-africa-tools
 *
 * Runs every 12 hours. Two phases:
 *   1. Seed curated Africa-built + Africa-essential tools from lib/africa-sources.ts
 *      → High-confidence tools go directly to status='active'
 *   2. Use GNews Africa queries + Claude to discover NEW Africa-relevant tools
 *      from tech news, extract their info, score them, and insert to DB
 */
import { inngest } from "../client";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import {
  AFRICA_CURATED_TOOLS,
  AFRICA_GNEWS_QUERIES,
  scoreAfricaFriendly,
  type AfricaTool,
} from "@/lib/africa-sources";
import { fetchGNewsArticles } from "@/lib/gnews";

function makeAnthropic(): Anthropic | null {
  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

interface DiscoveredTool {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  category: string;
  pricingModel: string;
  hasFree: boolean;
  tags: string[];
  africaContext: string;
}

const EXTRACT_TOOL_PROMPT = `You are an AI that extracts Africa-relevant tool/product information from tech news articles.

Given a news article, identify any software tools, platforms, or apps mentioned that would be useful for African founders, freelancers, or businesses.

Return a JSON array of tools found (can be empty if no clear tools):
[
  {
    "name": "Tool Name",
    "slug": "tool-slug",
    "tagline": "One-line description max 120 chars",
    "description": "2-3 sentence description. Mention if it works in Africa, pricing, and mobile support.",
    "websiteUrl": "https://tool-website.com",
    "category": "productivity|design|marketing|code|writing|video|audio|automation|data",
    "pricingModel": "free|freemium|paid|enterprise",
    "hasFree": true,
    "tags": ["tag1", "tag2", "africa"],
    "africaContext": "Why is this specifically useful for African users? 1-2 sentences."
  }
]

Rules:
- Only include tools that actually exist (you know them)
- Only include tools that could benefit African users
- Set hasFree=true if there's any free tier
- Return [] if no clear tool is mentioned`;

interface InsertableTool {
  name: string;
  slug?: string;
  tagline: string;
  description: string;
  websiteUrl?: string;
  logoUrl?: string;
  category: string;
  pricingModel?: string;
  hasFree?: boolean;
  tags?: string[];
  africaFriendly?: boolean;
}

async function insertTool(
  tool: InsertableTool,
  status: "active" | "pending_review",
  logger: { info: (m: string) => void; error: (m: string) => void },
): Promise<boolean> {
  try {
    const slug = tool.slug || toSlug(tool.name);
    const website = tool.websiteUrl ?? "";
    const logo = tool.logoUrl
      ? tool.logoUrl
      : `https://logo.clearbit.com/${website.replace(/https?:\/\//, "").split("/")[0]}`;

    await db.query(
      `INSERT INTO tools (
         name, slug, tagline, description,
         logo, website, website_url, category,
         pricing_model, has_free,
         africa_friendly, rating, review_count,
         tags, is_featured, is_verified, is_new,
         status, source
       ) VALUES (
         $1,$2,$3,$4,
         $5,$6,$6,$7,
         $8,$9,
         $10, 7.5, 0,
         $11, false, false, false,
         $12, 'africa-curated'
       )
       ON CONFLICT (slug) DO UPDATE SET
         africa_friendly = true,
         tags = EXCLUDED.tags,
         status = CASE WHEN tools.status = 'active' THEN 'active' ELSE EXCLUDED.status END`,
      [
        tool.name,
        slug,
        tool.tagline,
        tool.description,
        logo,
        website,
        tool.category || "productivity",
        tool.pricingModel || "freemium",
        tool.hasFree,
        true,
        tool.tags ?? [],
        status,
      ],
    );

    // Insert default scores for auto-approved tools
    if (status === "active") {
      await db.query(
        `INSERT INTO tool_scores (tool_id, ease_of_use, value_for_money, feature_depth, support_quality, integration_richness, ai_capability)
         SELECT id, 7.5, ${tool.hasFree ? "9.0" : "7.0"}, 7.5, 7.0, 7.0, 6.5 FROM tools WHERE slug = $1
         ON CONFLICT (tool_id) DO NOTHING`,
        [slug],
      );
    }

    return true;
  } catch (e) {
    logger.error(`Failed to insert tool "${tool.name}": ${(e as Error).message}`);
    return false;
  }
}

export const syncAfricaTools = inngest.createFunction(
  {
    id: "sync-africa-tools",
    name: "Sync Africa-Curated Tools",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 6 * * *" },                    // Daily at 6am UTC (offset from PH at 8am)
      { event: "africa/tools.sync.requested" },
    ],
  },
  async ({ step, logger, event }) => {
    const anthropic = makeAnthropic();
    const mode: string = (event.data as { mode?: string } | undefined)?.mode ?? "both";

    logger.info(`Starting Africa tools sync — mode: ${mode}`);

    // ── Phase 1: Seed curated Africa tools ──────────────────────────────────

    const curatedResult = await step.run("seed-curated-tools", async () => {
      // Find which slugs already exist
      const slugs = AFRICA_CURATED_TOOLS.map((t) => t.slug);
      const { rows } = await db.query(
        `SELECT slug FROM tools WHERE slug = ANY($1)`,
        [slugs],
      );
      const existingSlugs = new Set(rows.map((r: { slug: string }) => r.slug));

      const toInsert = AFRICA_CURATED_TOOLS.filter((t) => !existingSlugs.has(t.slug));
      const toUpdate = AFRICA_CURATED_TOOLS.filter((t) => existingSlugs.has(t.slug));

      logger.info(`Curated: ${toInsert.length} new, ${toUpdate.length} to update`);

      let inserted = 0;
      let updated = 0;

      for (const tool of toInsert) {
        const ok = await insertTool(tool, "active", logger);
        if (ok) inserted++;
      }

      // Update existing tools to ensure africa_friendly = true
      if (toUpdate.length > 0) {
        await db.query(
          `UPDATE tools SET africa_friendly = true WHERE slug = ANY($1)`,
          [toUpdate.map((t) => t.slug)],
        );
        updated = toUpdate.length;
      }

      return { inserted, updated };
    });

    logger.info(`Curated phase: ${curatedResult.inserted} inserted, ${curatedResult.updated} updated`);

    if (mode === "curated") {
      return { phase: "curated", ...curatedResult };
    }

    // ── Phase 2: AI-powered discovery from Africa GNews ─────────────────────

    if (!process.env.GNEWS_API_KEY) {
      logger.warn("GNEWS_API_KEY not set — skipping discovery phase");
      return { phase: "curated-only", ...curatedResult };
    }

    const discoveredTools = await step.run("discover-from-gnews", async () => {
      const allArticles: Array<{ title: string; description: string; url: string }> = [];

      // Fetch from Africa-specific GNews queries
      const fetchResults = await Promise.allSettled(
        AFRICA_GNEWS_QUERIES.map(({ q }) =>
          fetchGNewsArticles({ query: q, max: 5 }),
        ),
      );

      for (const r of fetchResults) {
        if (r.status === "fulfilled") {
          for (const a of r.value) {
            allArticles.push({
              title: a.title,
              description: a.description,
              url: a.url,
            });
          }
        }
      }

      logger.info(`Africa GNews: fetched ${allArticles.length} articles for tool discovery`);

      if (!anthropic || !allArticles.length) return [];

      // Use Claude to extract tool mentions from each article
      const discovered: DiscoveredTool[] = [];
      const seenNames = new Set<string>();

      for (const article of allArticles.slice(0, 10)) {
        try {
          const msg = await anthropic.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 800,
            system: EXTRACT_TOOL_PROMPT,
            messages: [
              {
                role: "user",
                content: `Title: ${article.title}\n\nDescription: ${article.description}`,
              },
            ],
          });
          const raw = (msg.content[0] as { text?: string }).text ?? "";
          const jsonMatch = raw.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const tools = JSON.parse(jsonMatch[0]) as DiscoveredTool[];
            for (const tool of tools) {
              if (tool.name && !seenNames.has(tool.name.toLowerCase())) {
                seenNames.add(tool.name.toLowerCase());
                tool.slug = toSlug(tool.name);
                discovered.push(tool);
              }
            }
          }
        } catch {
          // Skip on parse error
        }
      }

      return discovered;
    });

    logger.info(`Discovered ${discoveredTools.length} tools from Africa news`);

    const discoveryResult = await step.run("insert-discovered-tools", async () => {
      if (!discoveredTools.length) return { inserted: 0, skipped: 0 };

      // Check which discovered slugs already exist
      const discoveredSlugs = discoveredTools.map((t) => t.slug);
      const { rows } = await db.query(
        `SELECT slug FROM tools WHERE slug = ANY($1)`,
        [discoveredSlugs],
      );
      const existingSlugs = new Set(rows.map((r: { slug: string }) => r.slug));

      const newTools = discoveredTools.filter((t) => !existingSlugs.has(t.slug));
      logger.info(`${newTools.length} new discovered tools to evaluate`);

      let inserted = 0;
      let skipped = 0;

      for (const tool of newTools) {
        const score = scoreAfricaFriendly({
          hasFree: tool.hasFree,
          pricingModel: tool.pricingModel,
          tags: tool.tags,
          name: tool.name,
          description: tool.description,
          tagline: tool.tagline,
          websiteUrl: tool.websiteUrl,
        });

        if (score.africaFriendly) {
          const status = score.autoApprove ? "active" : "pending_review";
          const ok = await insertTool(tool, status, logger);
          if (ok) {
            inserted++;
            logger.info(`Inserted "${tool.name}" — score: ${score.score}, status: ${status}`);
          }
        } else {
          skipped++;
          logger.info(`Skipped "${tool.name}" — Africa score too low (${score.score})`);
        }
      }

      return { inserted, skipped };
    });

    logger.info(`Discovery phase: ${discoveryResult.inserted} inserted, ${discoveryResult.skipped} skipped`);

    return {
      curated: curatedResult,
      discovery: discoveryResult,
      total_discovered: discoveredTools.length,
    };
  },
);

import { inngest } from "../client";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

function makeClient() {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

export const generateWeeklyRadar = inngest.createFunction(
  {
    id: "generate-weekly-radar",
    name: "Generate Weekly AI Radar",
    triggers: [{ cron: "0 6 * * 1" }],
  },
  async ({ step }) => {
    const anthropic = makeClient();
    if (!anthropic) {
      return { skipped: true, reason: "AI service not configured" };
    }

    // Step 1: Collect signals from last 7 days
    const signals = await step.run("collect-weekly-signals", async () => {
      const { rows } = await db.query(
        `SELECT t.name, t.review_count, t.rating, t.updated_at,
                ts.futurestack_score
         FROM tools t
         LEFT JOIN tool_scores ts ON ts.tool_id = t.id
         WHERE t.status = 'active'
           AND t.updated_at > NOW() - INTERVAL '7 days'
         ORDER BY t.review_count DESC LIMIT 20`,
      );
      return rows;
    });

    // Step 2: Generate radar with Claude
    const radar = await step.run("generate-radar-content", async () => {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1000,
        system: `You evaluate AI tool signals and assign them categories: rising_star, watch_out, underrated_gem, price_drop, new_feature.
For each tool, generate a 2-sentence AI summary explaining WHY it's in this category and a signal strength out of 5.
Return valid JSON array: [{"tool": "...", "category": "...", "summary": "...", "signal_strength": 4}]`,
        messages: [
          {
            role: "user",
            content: `Analyze these tool signals from the past week: ${JSON.stringify(signals.slice(0, 10))}`,
          },
        ],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "[]";
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        return [];
      }
    });

    // Step 3: Log result (radar_items table can be added later)
    await step.run("log-radar", async () => {
      console.log(`[weekly-radar] Generated ${Array.isArray(radar) ? radar.length : 0} radar items`);
      return { count: Array.isArray(radar) ? radar.length : 0 };
    });

    return { processed: true, radarItems: Array.isArray(radar) ? radar.length : 0 };
  },
);

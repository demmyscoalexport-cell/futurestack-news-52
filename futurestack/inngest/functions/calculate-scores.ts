import { inngest } from "../client";
import { db } from "@/lib/db";

export const calculateFutureStackScores = inngest.createFunction(
  {
    id: "calculate-scores",
    name: "Recalculate DISCOVA Scores",
    triggers: [{ cron: "0 2 * * *" }],
  },
  async ({ step }) => {
    const tools = await step.run("fetch-tools", async () => {
      const { rows } = await db.query(`SELECT id FROM tools WHERE status = 'active'`);
      return rows as { id: string }[];
    });

    const results = await step.run("recalculate-scores", async () => {
      let updated = 0;
      for (const tool of tools) {
        // Weighted score: rating * 0.30 + reviews * 0.15 + pricing * 0.15 + ai cap * 0.10 + etc.
        const { rows } = await db.query(
          `SELECT rating, review_count, has_free FROM tools WHERE id = $1`,
          [tool.id],
        );
        const t = rows[0];
        if (!t) continue;

        const rating = parseFloat(t.rating) || 4.0;
        const base = Math.min(10, rating * 2);
        const reviewBoost = Math.min(0.5, (t.review_count || 0) / 10000);
        const ease_of_use = parseFloat(Math.min(10, base + reviewBoost * 0.2).toFixed(1));
        const value_for_money = parseFloat(
          (t.has_free ? Math.min(10, base + 0.5) : Math.max(0, base - 0.5)).toFixed(1),
        );
        const feature_depth = parseFloat(Math.min(10, base + reviewBoost).toFixed(1));
        const support_quality = 7.0;
        const integration_richness = 7.0;
        const ai_capability = parseFloat(Math.min(10, base + 0.3).toFixed(1));

        await db.query(
          `INSERT INTO tool_scores (
             tool_id, ease_of_use, value_for_money, feature_depth,
             support_quality, integration_richness, ai_capability, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (tool_id) DO UPDATE SET
             ease_of_use = EXCLUDED.ease_of_use,
             value_for_money = EXCLUDED.value_for_money,
             feature_depth = EXCLUDED.feature_depth,
             support_quality = EXCLUDED.support_quality,
             integration_richness = EXCLUDED.integration_richness,
             ai_capability = EXCLUDED.ai_capability,
             updated_at = NOW()`,
          [
            tool.id,
            ease_of_use,
            value_for_money,
            feature_depth,
            support_quality,
            integration_richness,
            ai_capability,
          ],
        );
        updated++;
      }
      return { updated };
    });

    return { success: true, updated: results.updated };
  },
);

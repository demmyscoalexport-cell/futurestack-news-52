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

        const ratingScore = (parseFloat(t.rating) || 4.0) * 20; // 0-100
        const reviewScore = Math.min(100, (t.review_count || 0) * 2);
        const pricingScore = t.has_free ? 70 : 50;
        const futurestack_score = parseFloat(
          (ratingScore * 0.4 + reviewScore * 0.3 + pricingScore * 0.3).toFixed(1),
        );

        await db.query(
          `INSERT INTO tool_scores (tool_id, futurestack_score, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (tool_id) DO UPDATE SET futurestack_score = $2, updated_at = NOW()`,
          [tool.id, futurestack_score],
        );
        updated++;
      }
      return { updated };
    });

    return { success: true, updated: results.updated };
  },
);

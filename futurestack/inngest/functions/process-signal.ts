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

export const processSignal = inngest.createFunction(
  {
    id: "process-signal",
    name: "Process News Signal",
    concurrency: { limit: 5 },
    triggers: [{ event: "news/signal.received" }],
  },
  async ({ event, step }) => {
    const signal = event.data;

    // Step 1: Duplicate check via pg ILIKE
    const isDuplicate = await step.run("check-duplicate", async () => {
      const words = signal.title.split(" ").slice(0, 5).join("%");
      const { rows } = await db.query(
        `SELECT id FROM articles WHERE title ILIKE $1 LIMIT 1`,
        [`%${words}%`],
      );
      return rows.length > 0;
    });

    if (isDuplicate) return { skipped: true, reason: "duplicate" };

    const anthropic = makeClient();
    if (!anthropic) {
      return { skipped: true, reason: "no_ai_key" };
    }

    // Step 2: Score relevance
    const relevanceScore = await step.run("score-relevance", async () => {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Score this AI tool/news signal for relevance to a platform for freelancers and SaaS founders.
Title: ${signal.title}
Summary: ${signal.summary}
Return ONLY a JSON object: {"score": 8, "reason": "brief reason", "article_angle": "the specific angle to take"}`,
          },
        ],
      });

      try {
        const text =
          response.content[0].type === "text" ? response.content[0].text : "{}";
        return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
      } catch {
        return { score: 0 };
      }
    });

    if ((relevanceScore.score ?? 0) < 7) {
      return { skipped: true, reason: "low_relevance", score: relevanceScore.score };
    }

    await step.sendEvent("emit-for-generation", {
      name: "article/approved.for.generation",
      data: { signal, relevanceScore },
    });

    return { approved: true, score: relevanceScore.score };
  },
);

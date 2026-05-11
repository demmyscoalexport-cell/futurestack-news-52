import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const processSignal = inngest.createFunction(
  {
    id: "process-signal",
    name: "Process News Signal",
    concurrency: { limit: 5 },
    triggers: [{ event: "news/signal.received" }],
  },
  async ({ event, step }) => {
    const signal = event.data;

    // Step 1: Check for duplicates in DB
    const isDuplicate = await step.run("check-duplicate", async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("articles")
        .select("id")
        .textSearch("title", signal.title.split(" ").slice(0, 5).join(" | "))
        .limit(1);

      return (data?.length ?? 0) > 0;
    });

    if (isDuplicate) return { skipped: true, reason: "duplicate" };

    // Step 2: Score relevance with Claude Haiku (fast + cheap)
    const relevanceScore = await step.run("score-relevance", async () => {
      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 100,
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

    if (relevanceScore.score < 7) {
      return {
        skipped: true,
        reason: "low_relevance",
        score: relevanceScore.score,
      };
    }

    // Step 3: Approved — emit for article generation
    await step.sendEvent("emit-for-generation", {
      name: "article/approved.for.generation",
      data: { signal, relevanceScore },
    });

    return { approved: true, score: relevanceScore.score };
  },
);

import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export const generateWeeklyRadar = inngest.createFunction(
  {
    id: "generate-weekly-radar",
    name: "Generate Weekly AI Radar",
    triggers: [{ cron: "0 6 * * 1" }],
  },
  async ({ step }) => {
    // Step 1: Collect signals from last 7 days from tools, changelogs, user_activity tables
    const signals = await step.run("collect-weekly-signals", async () => {
      // Return dummy collection representing DB queries
      return [
        {
          tool: "Cursor",
          newReviews: 45,
          newFeatures: 2,
          sentiment_spike: true,
        },
        { tool: "Devin", saveSpike: "200%", mentions: 1402 },
      ];
    });

    // Step 2: Generate radar with Claude
    const radar = await step.run("generate-radar-content", async () => {
      const { text } = await generateText({
        model: anthropic("claude-3-5-sonnet-20241022"), // Or Sonnet 3.5 corresponding to Claude Sonnet-4-6 abstract notion
        system: `You evaluate AI tool signals and assign them categories: rising_star, watch_out, underrated_gem, price_drop, new_feature. For each tool, generate a 2-sentence AI summary explaining WHY it's in this category and a signal strength out of 5. Return valid JSON representing the radar array.`,
        prompt: `Analyze these signals: ${JSON.stringify(signals)}`,
      });
      // Extract JS object from text
      return text;
    });

    // Step 3: Publish to radar_items table
    await step.run("publish-radar", async () => {
      // Mock db insertion mapping to radar_items table
      return { success: true };
    });

    return { processed: true, radar };
  },
);

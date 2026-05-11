import { inngest } from "../client";
import Anthropic from "@anthropic-ai/sdk";

const RSS_FEEDS = [
  "https://www.therundown.ai/rss",
  "https://bensbites.beehiiv.com/feed",
  "https://tldr.tech/ai/rss",
  "https://www.aiweekly.co/rss",
];

export const fetchAISignals = inngest.createFunction(
  {
    id: "fetch-ai-signals",
    name: "Fetch AI News Signals",
    concurrency: { limit: 1 },
    triggers: [{ cron: "0 */6 * * *" }],
  },
  async ({ step, logger }) => {
    // Step 1: Fetch RSS feeds in parallel
    const rssItems = await step.run("fetch-rss-feeds", async () => {
      const parser = new (await import("rss-parser")).default();
      const results = await Promise.allSettled(
        RSS_FEEDS.map((url) => parser.parseURL(url)),
      );
      return results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => (r as any).value.items)
        .map((item) => ({
          title: item.title,
          link: item.link,
          summary: item.contentSnippet || item.summary,
          publishedAt: item.pubDate || item.isoDate,
          source: item.creator || "RSS",
        }))
        .slice(0, 30); // Take top 30
    });

    // Step 2: Fetch from Perplexity for real-time signals
    const perplexitySignals = await step.run(
      "fetch-perplexity-signals",
      async () => {
        const response = await fetch(
          "https://api.perplexity.ai/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "sonar-pro",
              messages: [
                {
                  role: "user",
                  content:
                    "What are the 10 most significant AI tool launches, updates, or news stories this week? Respond ONLY as a JSON array of objects with keys: title, link, summary, publishedAt, source.",
                },
              ],
              return_citations: true,
            }),
          },
        );
        const data = await response.json();
        try {
          const content = data.choices[0].message.content;
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch {
          return [];
        }
      },
    );

    // Step 3: Merge and deduplicate all signals
    const allSignals = [...rssItems, ...perplexitySignals];

    // Step 4: Send each signal for processing
    await step.sendEvent(
      "send-signals-for-processing",
      allSignals.map((signal) => ({
        name: "news/signal.received" as const,
        data: signal,
      })),
    );

    logger.info(`Dispatched ${allSignals.length} signals for processing`);
    return { signalsDispatched: allSignals.length };
  },
);

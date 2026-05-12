import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { fetchAISignals } from "@/inngest/functions/fetch-ai-signals";
import { processSignal } from "@/inngest/functions/process-signal";
import { generateArticle } from "@/inngest/functions/generate-article";
import { generateDailyArticles } from "@/inngest/functions/generate-daily-articles";
import { notifyOnPublish } from "@/inngest/functions/notify-on-publish";
import { generateWeeklyRadar } from "@/inngest/functions/generate-weekly-radar";
import { calculateFutureStackScores } from "@/inngest/functions/calculate-scores";
import { generateEmbeddings } from "@/inngest/functions/generate-embeddings";
import { syncProductHuntTools } from "@/inngest/functions/sync-producthunt";
import { syncGNewsArticles } from "@/inngest/functions/sync-gnews";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    fetchAISignals,
    processSignal,
    generateArticle,
    generateDailyArticles,
    notifyOnPublish,
    generateWeeklyRadar,
    calculateFutureStackScores,
    generateEmbeddings,
    syncProductHuntTools,
    syncGNewsArticles,
  ],
});

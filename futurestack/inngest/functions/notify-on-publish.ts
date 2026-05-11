import { inngest } from "../client";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export const notifyOnPublish = inngest.createFunction(
  {
    id: "notify-on-publish",
    name: "Notify Subscribers on Article Publish",
    triggers: [{ event: "article/published" }],
  },
  async ({ event, step }) => {
    const { article } = event.data;

    // Only send email for featured/high-score articles to avoid spam
    if (!article.featured && article.status !== "published")
      return { skipped: true };

    // Get active newsletter subscribers
    const subscribers = await step.run("get-subscribers", async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .eq("confirmed", true)
        .eq("unsubscribed", false)
        .limit(5000);

      return data || [];
    });

    if (subscribers.length === 0) return { notified: 0 };

    // Send via Resend (batch)
    await step.run("send-email-batch", async () => {
      // Batch in groups of 100
      const batches = [];
      for (let i = 0; i < subscribers.length; i += 100) {
        batches.push(subscribers.slice(i, i + 100));
      }

      for (const batch of batches) {
        await resend.batch.send(
          batch.map((sub: any) => ({
            from: "FutureStack News <digest@futurestack.news>",
            to: sub.email,
            subject: `New Article: ${article.title}`,
            html: `<h1>${article.title}</h1><p>${article.excerpt}</p><br/><a href="https://futurestack.news/news/${article.slug}">Read Article</a>`,
          })),
        );
      }
    });

    return { notified: subscribers.length };
  },
);

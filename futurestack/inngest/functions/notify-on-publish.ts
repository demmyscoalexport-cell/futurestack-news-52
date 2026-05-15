import { inngest } from "../client";
import { Resend } from "resend";
import { db } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export const notifyOnPublish = inngest.createFunction(
  {
    id: "notify-on-publish",
    name: "Notify Subscribers on Article Publish",
    triggers: [{ event: "article/published" }],
  },
  async ({ event, step }) => {
    const { article } = event.data;

    if (!article.is_featured && article.status !== "published") {
      return { skipped: true };
    }

    const subscribers = await step.run("get-subscribers", async () => {
      const { rows } = await db.query(
        `SELECT email FROM newsletter_subscribers
         WHERE status = 'active' AND (unsubscribed IS NULL OR unsubscribed = false)
         LIMIT 5000`,
      );
      return rows as { email: string }[];
    });

    if (subscribers.length === 0) return { notified: 0 };

    if (!process.env.RESEND_API_KEY) {
      console.log(
        `[notify-on-publish] RESEND_API_KEY not set — would notify ${subscribers.length} subscribers`,
      );
      return { notified: 0, skipped: "no_resend_key" };
    }

    await step.run("send-email-batch", async () => {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://futurestack.live";
      for (let i = 0; i < subscribers.length; i += 100) {
        const batch = subscribers.slice(i, i + 100);
        await resend.batch.send(
          batch.map((sub) => ({
            from: process.env.RESEND_FROM_EMAIL || "DISCOVA <digest@primeaxistech.store>",
            to: sub.email,
            subject: `New: ${article.title}`,
            html: `
              <div style="background:#0f172a;color:#f1f5f9;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;border-radius:12px;">
                <h2 style="color:#818cf8;">${article.title}</h2>
                <p style="color:#94a3b8;">${article.excerpt || ""}</p>
                <a href="${siteUrl}/news/${article.slug}"
                   style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
                  Read Article
                </a>
              </div>`,
          })),
        );
      }
    });

    return { notified: subscribers.length };
  },
);

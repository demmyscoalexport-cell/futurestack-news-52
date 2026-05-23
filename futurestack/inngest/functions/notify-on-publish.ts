import { inngest } from "../client";
import { Resend } from "resend";
import { getActiveSubscribers } from "@/lib/supabase-writer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/env";
import webpush from "web-push";

function getResend() {
  const key = getEnv("RESEND_API_KEY");
  if (!key) return null;
  return new Resend(key);
}

const vapidPublic = getEnv("VAPID_PUBLIC_KEY");
const vapidPrivate = getEnv("VAPID_PRIVATE_KEY");
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails("mailto:hello@getdiscova.com", vapidPublic, vapidPrivate);
}

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://getdiscova.com";

    // Step 1: Email subscribers (reads from Supabase)
    const emailResult = await step.run("send-email-notifications", async () => {
      const resend = getResend();
      const subscribers = await getActiveSubscribers();
      if (subscribers.length === 0 || !resend) {
        return { notified: 0, skipped: !resend ? "no_resend_key" : "no_subscribers" };
      }

      for (let i = 0; i < subscribers.length; i += 100) {
        const batch = subscribers.slice(i, i + 100);
        await resend.batch.send(
          batch.map((sub) => ({
            from: getEnv("RESEND_FROM_EMAIL", "DISCOVA <digest@getdiscova.com>"),
            to:   sub.email,
            subject: `New on DISCOVA: ${article.title}`,
            html: `
              <div style="background:#0f172a;color:#f1f5f9;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;border-radius:12px;">
                <div style="font-size:13px;font-weight:700;color:#818cf8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;">DISCOVA</div>
                <h2 style="color:#ffffff;font-size:22px;margin:0 0 12px;">${article.title}</h2>
                <p style="color:#94a3b8;line-height:1.6;margin:0 0 24px;">${article.excerpt || ""}</p>
                <a href="${siteUrl}/news/${article.slug}"
                   style="display:inline-block;background:#4f46e5;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                  Read Article →
                </a>
                <p style="margin-top:32px;color:#475569;font-size:12px;">You're receiving this because you subscribed to DISCOVA updates.</p>
              </div>`,
          })),
        );
      }
      return { notified: subscribers.length };
    });

    // Step 2: Web push notifications
    const pushResult = await step.run("send-push-notifications", async () => {
      if (!vapidPublic || !vapidPrivate) {
        return { sent: 0, skipped: "no_vapid_keys" };
      }

      const supabase = createAdminClient();
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("id,endpoint,p256dh,auth")
        .limit(10000);

      if (!subs || subs.length === 0) return { sent: 0, skipped: "no_subscribers" };

      const payload = JSON.stringify({
        title:  `DISCOVA: ${article.title}`,
        body:   article.excerpt?.slice(0, 120) || "New article published",
        url:    `${siteUrl}/news/${article.slug}`,
        icon:   "/discova-logo.png",
        badge:  "/discova-logo.png",
      });

      let sent = 0;
      const expiredIds: string[] = [];

      await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
              { TTL: 86400 },
            );
            sent++;
          } catch (err: unknown) {
            if (err && typeof err === "object" && "statusCode" in err) {
              const code = (err as { statusCode: number }).statusCode;
              if (code === 404 || code === 410) expiredIds.push(sub.id);
            }
          }
        }),
      );

      // Clean up expired subscriptions
      if (expiredIds.length > 0) {
        await supabase.from("push_subscriptions").delete().in("id", expiredIds);
      }

      return { sent, expired: expiredIds.length };
    });

    return {
      article: article.slug,
      email:   emailResult,
      push:    pushResult,
    };
  },
);

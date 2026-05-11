import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2026-03-25.dahlia",
});
const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) break;

        // Determine plan from price ID on the session line items
        const expandedSession = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ["line_items"] },
        );
        const priceId = expandedSession.line_items?.data[0]?.price?.id;

        const proIds = [
          process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
          process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
        ];
        const plan = proIds.includes(priceId ?? "") ? "pro" : "team";

        await supabase
          .from("profiles")
          .update({
            plan,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", userId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;

        const proIds = [
          process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
          process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
        ];
        const plan = proIds.includes(priceId) ? "pro" : "team";

        await supabase
          .from("profiles")
          .update({
            plan,
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("profiles")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            plan_expires_at: null,
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.customer_email) break;

        await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ||
            "FutureStack <digest@futurestack.live>",
          to: invoice.customer_email,
          subject: "⚠️ Payment failed — action required",
          html: `
            <div style="background:#0f172a;color:#f1f5f9;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;border-radius:12px;">
              <h2 style="color:#f87171;">Payment Failed</h2>
              <p style="color:#94a3b8;">Hi there — we were unable to process your FutureStack Pro payment. Please update your payment method to avoid losing access.</p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/api/stripe/portal" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Update Payment Method</a>
            </div>
          `,
        });
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler failed:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

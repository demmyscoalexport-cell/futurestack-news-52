import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userEmail = session.customer_email || session.customer_details?.email;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userEmail && !customerId) break;

        const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items"],
        });
        const priceId = expandedSession.line_items?.data[0]?.price?.id;
        const proIds = [
          process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
          process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
        ];
        const plan = proIds.includes(priceId ?? "") ? "pro" : "team";

        // Store subscription in newsletter_subscribers extended fields or a dedicated table
        // For now log the successful subscription
        console.log(`[stripe/webhook] Subscription created: ${plan} for ${userEmail}, sub: ${subscriptionId}`);

        // Upsert into newsletter_subscribers to mark as pro
        if (userEmail) {
          await db.query(
            `INSERT INTO newsletter_subscribers (email, status, subscribed_at)
             VALUES ($1, 'active', NOW())
             ON CONFLICT (email) DO UPDATE SET status = 'active', updated_at = NOW()`,
            [userEmail.toLowerCase()],
          ).catch(() => {});
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[stripe/webhook] Subscription cancelled: ${subscription.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.error(`[stripe/webhook] Payment failed for: ${invoice.customer_email}`);
        break;
      }

      default:
        console.log(`[stripe/webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] Handler failed:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

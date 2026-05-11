import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Default to a dummy key if not present during development so typechecks pass
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || "sk_test_mocked_for_types";
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-03-25.dahlia" }); // Fixed standard apiVersion

const PRICE_IDS: Record<string, string> = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_mo",
  pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "price_pro_yr",
  team_monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || "price_team_mo",
};

export async function POST(req: Request) {
  try {
    const { priceId, userId } = await req.json();
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing`,
      metadata: { userId },
      subscription_data: {
        trial_period_days: 14,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const PLAN_PRICES: Record<string, { amount: number; currency: string; plan: "pro" | "team"; label: string }> = {
  pro_monthly:  { amount: 1200,  currency: "USD", plan: "pro",  label: "Pro Monthly"  },
  pro_annual:   { amount: 9900,  currency: "USD", plan: "pro",  label: "Pro Annual"   },
  team_monthly: { amount: 4900,  currency: "USD", plan: "team", label: "Team Monthly" },
  team_annual:  { amount: 39900, currency: "USD", plan: "team", label: "Team Annual"  },
};

export async function POST(req: Request) {
  if (!PAYSTACK_SECRET) {
    return NextResponse.json(
      { error: "Paystack is not configured on this deployment" },
      { status: 503 },
    );
  }

  try {
    const { planId, email: bodyEmail, currency = "USD" } = await req.json();

    const priceConfig = PLAN_PRICES[planId];
    if (!priceConfig) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Try to get logged-in user's email from Supabase session
    let userEmail = bodyEmail as string | undefined;
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) { userEmail = user.email; userId = user.id; }
    } catch { /* unauthenticated — continue */ }

    if (!userEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Paystack amount must be in the smallest currency unit (cents for USD, kobo for NGN)
    const resolvedCurrency = (currency === "NGN" ? "NGN" : "USD").toUpperCase();
    const ngn: Record<string, number> = {
      pro_monthly:  1440000,  // ₦14,400 in kobo
      pro_annual:   1188000, // ₦118,800 in kobo
      team_monthly: 5880000, // ₦58,800 in kobo
      team_annual:  47880000,// ₦478,800 in kobo
    };
    const amount = resolvedCurrency === "NGN" ? ngn[planId] : priceConfig.amount;

    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const callbackUrl = `${base}/api/paystack/verify`;

    const body = {
      email: userEmail,
      amount,
      currency: resolvedCurrency,
      callback_url: callbackUrl,
      metadata: {
        plan: priceConfig.plan,
        planId,
        label: priceConfig.label,
        userId: userId ?? "",
        cancel_action: `${base}/pricing`,
      },
    };

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Failed to initialize Paystack transaction" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });
  } catch (err) {
    console.error("[paystack/checkout]", err);
    return NextResponse.json({ error: "Failed to create Paystack checkout" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(`${BASE}/pricing?error=missing_reference`);
  }

  if (!PAYSTACK_SECRET) {
    return NextResponse.redirect(`${BASE}/pricing?error=not_configured`);
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await res.json();

    if (!data.status || data.data?.status !== "success") {
      console.error("[paystack/verify] Payment not successful:", data.data?.gateway_response);
      return NextResponse.redirect(`${BASE}/pricing?error=payment_failed`);
    }

    const meta = data.data.metadata as {
      plan?: "pro" | "team";
      planId?: string;
      userId?: string;
      label?: string;
    };

    const email: string = data.data.customer?.email;
    const plan = meta?.plan ?? "pro";
    const userId = meta?.userId;

    // Update the user's plan in Supabase profiles
    const supabase = createAdminClient();

    if (userId) {
      await supabase.from("profiles").update({ plan, updated_at: new Date().toISOString() }).eq("id", userId);
    } else if (email) {
      await supabase.from("profiles").update({ plan, updated_at: new Date().toISOString() }).eq("email", email);
    }

    // Log the transaction
    console.log(
      `[paystack/verify] ✓ Payment verified — plan:${plan} email:${email} ref:${reference} amount:${data.data.amount / 100} ${data.data.currency}`,
    );

    return NextResponse.redirect(`${BASE}/dashboard?upgraded=true&via=paystack`);
  } catch (err) {
    console.error("[paystack/verify] Error:", err);
    return NextResponse.redirect(`${BASE}/pricing?error=verification_failed`);
  }
}

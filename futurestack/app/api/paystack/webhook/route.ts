import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";

/** Verify Paystack webhook signature using HMAC-SHA512 */
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !PAYSTACK_SECRET) return false;
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET).update(payload).digest("hex");
  return hash === signature;
}

export async function POST(req: Request) {
  if (!PAYSTACK_SECRET) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.event) {
      case "charge.success": {
        const charge = event.data as {
          reference: string;
          customer: { email: string };
          amount: number;
          currency: string;
          metadata?: { plan?: "pro" | "team"; userId?: string; planId?: string };
        };

        const email = charge.customer?.email;
        const plan = charge.metadata?.plan ?? "pro";
        const userId = charge.metadata?.userId;

        if (userId) {
          await supabase.from("profiles").update({ plan, updated_at: new Date().toISOString() }).eq("id", userId);
        } else if (email) {
          await supabase.from("profiles").update({ plan, updated_at: new Date().toISOString() }).eq("email", email);
        }

        console.log(`[paystack/webhook] charge.success — plan:${plan} email:${email} ref:${charge.reference}`);
        break;
      }

      case "subscription.create": {
        const sub = event.data as {
          customer: { email: string };
          plan: { name: string };
          subscription_code: string;
        };
        console.log(`[paystack/webhook] subscription.create — ${sub.customer?.email} → ${sub.plan?.name}`);
        break;
      }

      case "subscription.disable": {
        const sub = event.data as {
          customer: { email: string };
          subscription_code: string;
        };
        const email = sub.customer?.email;
        if (email) {
          await supabase.from("profiles").update({ plan: "free", updated_at: new Date().toISOString() }).eq("email", email);
        }
        console.log(`[paystack/webhook] subscription.disable — downgraded to free: ${email}`);
        break;
      }

      default:
        console.log(`[paystack/webhook] Unhandled event: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[paystack/webhook] Handler failed:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

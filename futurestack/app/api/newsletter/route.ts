import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, role, topics, frequency } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    await db.query(
      `INSERT INTO newsletter_subscribers (email, role, topics, frequency, status, subscribed_at)
       VALUES ($1, $2, $3, $4, 'active', NOW())
       ON CONFLICT (email) DO UPDATE SET
         role = EXCLUDED.role,
         topics = EXCLUDED.topics,
         frequency = EXCLUDED.frequency,
         status = 'active',
         updated_at = NOW()`,
      [
        email.toLowerCase().trim(),
        role || null,
        topics ? JSON.stringify(topics) : null,
        frequency || "weekly",
      ],
    );

    return NextResponse.json({ success: true, message: "Subscribed successfully!" });
  } catch (err: unknown) {
    console.error("[newsletter]", err);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    await db.query(
      `UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribed = true, updated_at = NOW() WHERE email = $1`,
      [email.toLowerCase().trim()],
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[newsletter/unsubscribe]", err);
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }
}

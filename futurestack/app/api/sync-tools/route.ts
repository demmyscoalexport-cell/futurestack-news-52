import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const limitPerTopic = typeof body.limitPerTopic === "number" ? body.limitPerTopic : 10;

    await inngest.send({
      name: "producthunt/sync.requested" as string,
      data: { limitPerTopic, triggeredAt: new Date().toISOString() },
    });

    return NextResponse.json({
      ok: true,
      message: `Product Hunt sync triggered (${limitPerTopic} posts/topic)`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return POST(
    new Request("http://localhost/api/sync-tools", {
      method: "POST",
      body: JSON.stringify({ limitPerTopic: 10 }),
    }),
  );
}

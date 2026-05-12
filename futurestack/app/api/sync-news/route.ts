import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const max = typeof body.max === "number" ? body.max : 6;

    await inngest.send({
      name: "gnews/sync.requested" as string,
      data: { max, triggeredAt: new Date().toISOString() },
    });

    return NextResponse.json({
      ok: true,
      message: `GNews sync triggered (max ${max} articles)`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return POST(
    new Request("http://localhost/api/sync-news", {
      method: "POST",
      body: JSON.stringify({ max: 6 }),
    }),
  );
}

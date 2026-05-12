/**
 * POST /api/generate-articles
 * Manual trigger for daily AI article generation.
 * Sends an Inngest event → generate-daily-articles function.
 *
 * Body (all optional):
 *   { count?: number }   — number of articles to generate (default 3)
 */
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.min(Number(body.count ?? 3), 5); // cap at 5

    await inngest.send({
      name: "articles/generate.requested",
      data: { count, triggeredAt: new Date().toISOString() },
    });

    return NextResponse.json({
      ok: true,
      message: `Article generation started — generating ${count} articles`,
      count,
    });
  } catch (err) {
    console.error("[generate-articles]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    description: "POST to this endpoint to trigger daily AI article generation",
    usage: 'curl -X POST /api/generate-articles -H "Content-Type: application/json" -d \'{"count":3}\'',
  });
}

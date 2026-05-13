/**
 * POST /api/sync-scrapingbee  — trigger ScrapingBee news sync via Inngest
 * GET  /api/sync-scrapingbee  — status + source list
 *
 * Body (all optional):
 *   { maxPerSource?: number, sources?: string[] }
 *
 * Sends events directly to the Inngest dev server (localhost:8288)
 * rather than using inngest.send() which routes via Inngest Cloud.
 */

import { NextResponse } from "next/server";
import { SCRAPINGBEE_SOURCES } from "@/lib/scrapingbee";

const INNGEST_DEV_URL = "http://localhost:8288/e/key";

async function sendInngestEvent(name: string, data: Record<string, unknown>) {
  const res = await fetch(INNGEST_DEV_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Inngest event send failed: ${res.status}`);
  return res.json();
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.SCRAPINGBEE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "SCRAPINGBEE_API_KEY not configured" },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => ({})) as {
      maxPerSource?: number;
      sources?: string[];
    };

    const maxPerSource = body.maxPerSource ?? 5;
    const sources = body.sources ?? undefined;

    const result = await sendInngestEvent("scrapingbee/sync.requested", {
      maxPerSource,
      sources,
      triggeredAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: `ScrapingBee sync triggered — ${sources?.length ?? SCRAPINGBEE_SOURCES.length} sources, ${maxPerSource} items each`,
      inngest: result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  return NextResponse.json({
    configured: Boolean(apiKey),
    sources: SCRAPINGBEE_SOURCES.map((s) => ({
      name: s.name,
      domain: s.domain,
      category: s.category,
    })),
    cron: "Every 8 hours (0 */8 * * *)",
    manualTrigger: "POST /api/sync-scrapingbee",
  });
}

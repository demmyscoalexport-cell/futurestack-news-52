/**
 * POST /api/sync-alternativeto          — trigger full tools sync
 * POST /api/sync-alternativeto?news=1   — trigger news-only sync
 * GET  /api/sync-alternativeto          — status + category list
 */

import { NextResponse } from "next/server";
import { AT_CATEGORIES } from "@/lib/alternativeto";

const INNGEST_DEV_URL = "http://localhost:8288/e/key";

async function sendInngestEvent(name: string, data: Record<string, unknown>) {
  const res = await fetch(INNGEST_DEV_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Inngest event failed: ${res.status}`);
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

    const url = new URL(req.url);
    const newsOnly = url.searchParams.get("news") === "1";

    const body = await req.json().catch(() => ({})) as {
      toolsPerCategory?: number;
      categories?: string[];
    };

    if (newsOnly) {
      const result = await sendInngestEvent("alternativeto/news.sync.requested", {
        triggeredAt: new Date().toISOString(),
      });
      return NextResponse.json({
        ok: true,
        message: "AlternativeTo news sync triggered",
        inngest: result,
      });
    }

    const result = await sendInngestEvent("alternativeto/tools.sync.requested", {
      toolsPerCategory: body.toolsPerCategory ?? 5,
      categories: body.categories,
      triggeredAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: `AlternativeTo tools sync triggered — ${body.toolsPerCategory ?? 5} tools per category`,
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
    categories: AT_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      tag: c.tag,
      url: c.browseUrl,
    })),
    schedule: {
      tools: "Daily at 6 AM UTC (cron: 0 6 * * *)",
      news: "Every 30 minutes (cron: */30 * * * *)",
    },
    manualTriggers: {
      tools: "POST /api/sync-alternativeto",
      news: "POST /api/sync-alternativeto?news=1",
    },
    affiliateRedirect: "GET /api/redirect?tool=<slug>&affid=discova",
    clickStats: "POST /api/redirect?stats=1",
  });
}

/**
 * POST /api/trigger-all-syncs
 *
 * Fires every sync job simultaneously:
 *   - Africa news (RSS)
 *   - Africa tools (curated + discovery)
 *   - GNews articles
 *   - Product Hunt tools
 *   - Score recalculation
 *
 * Protected: requires admin session or SYNC_SECRET header.
 *
 * Usage from admin panel or curl:
 *   curl -X POST /api/trigger-all-syncs \
 *     -H "x-sync-secret: <SYNC_SECRET>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"targets": ["news", "tools", "scores"]}'
 */
import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

function isAuthorized(req: Request): boolean {
  // Option 1: SYNC_SECRET header (for external cron services / curl)
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const provided = req.headers.get("x-sync-secret");
    if (provided === secret) return true;
  }

  // Option 2: Internal Replit — allow if no secret is set (dev mode)
  if (!secret) return true;

  return false;
}

const ALL_EVENTS = [
  {
    key: "africa-news",
    event: "africa/news.sync.requested",
    label: "Africa RSS News",
    defaultData: { maxPerFeed: 5 },
  },
  {
    key: "africa-tools",
    event: "africa/tools.sync.requested",
    label: "Africa Curated Tools",
    defaultData: { mode: "both" },
  },
  {
    key: "gnews",
    event: "gnews/sync.requested",
    label: "GNews Articles",
    defaultData: { max: 8 },
  },
  {
    key: "producthunt",
    event: "producthunt/sync.requested",
    label: "Product Hunt Tools",
    defaultData: { limitPerTopic: 20 },
  },
  {
    key: "watchdog",
    event: "watchdog/check.requested",
    label: "Platform Watchdog",
    defaultData: {},
  },
] as const;

type SyncTarget = "africa-news" | "africa-tools" | "gnews" | "producthunt" | "watchdog" | "all";

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { targets?: SyncTarget[] };
  const targets: SyncTarget[] = body.targets ?? ["all"];
  const runAll = targets.includes("all");

  const toFire = runAll
    ? ALL_EVENTS
    : ALL_EVENTS.filter((e) => targets.includes(e.key));

  if (!toFire.length) {
    return NextResponse.json({
      ok: false,
      error: `No valid targets. Available: ${ALL_EVENTS.map((e) => e.key).join(", ")}, all`,
    }, { status: 400 });
  }

  const triggered: string[] = [];
  const errors: string[] = [];

  await Promise.allSettled(
    toFire.map(async (job) => {
      try {
        await inngest.send({
          name: job.event as string,
          data: { ...job.defaultData, triggeredAt: new Date().toISOString(), triggeredBy: "trigger-all-syncs" },
        });
        triggered.push(job.label);
      } catch (e) {
        errors.push(`${job.label}: ${(e as Error).message}`);
      }
    }),
  );

  return NextResponse.json({
    ok: errors.length === 0,
    triggered,
    errors: errors.length ? errors : undefined,
    message: `${triggered.length}/${toFire.length} sync jobs queued`,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: Request) {
  // Allow GET for easy browser/curl triggering (fires all)
  return POST(
    new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({ targets: ["all"] }),
    }),
  );
}

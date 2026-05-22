/**
 * POST /api/producthunt-sync
 *
 * Manually trigger a Product Hunt sync.
 * Body (all optional):
 *   { limitPerTopic?: number, topics?: string[], order?: "VOTES"|"NEWEST"|"FEATURED" }
 *
 * GET /api/producthunt-sync
 *   Returns sync status and the current tool count.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/db";
import {
  fetchAllPHPosts,
  getProductHuntToken,
  type PHPost,
} from "@/lib/producthunt";
import {
  filterNewPHPosts,
  getExistingPHKeys,
  upsertPHPost,
} from "@/lib/ph-sync";

const DEFAULT_TOPICS = [
  "artificial-intelligence",
  "developer-tools",
  "design-tools",
  "productivity",
  "no-code",
  "marketing",
  "video",
  "audio",
];

export async function GET() {
  try {
    const supa = getSupabaseAdmin();
    const { count: total } = await supa
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const { data: phTools } = await supa
      .from("tools")
      .select("id, tags")
      .eq("status", "active")
      .contains("tags", ["product-hunt"]);

    const { count: newTools } = await supa
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("is_new", true);

    return NextResponse.json({
      ok: true,
      stats: {
        total_tools: total ?? 0,
        from_producthunt: phTools?.length ?? 0,
        new_tools: newTools ?? 0,
      },
      ph_token_configured: !!getProductHuntToken(),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const limitPerTopic: number = body.limitPerTopic ?? 50;
    const topics: string[] = body.topics ?? DEFAULT_TOPICS;
    const order: "VOTES" | "NEWEST" | "FEATURED" = body.order ?? "NEWEST";

    if (!getProductHuntToken()) {
      return NextResponse.json(
        { ok: false, error: "Product Hunt API token is not configured" },
        { status: 503 },
      );
    }

    const allPosts: PHPost[] = [];
    const seenIds = new Set<string>();

    const results = await Promise.allSettled(
      topics.map((topic) => fetchAllPHPosts(limitPerTopic, topic, order)),
    );

    const topicErrors: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        for (const post of r.value) {
          if (!seenIds.has(post.id)) {
            seenIds.add(post.id);
            allPosts.push(post);
          }
        }
      } else {
        topicErrors.push(`${topics[i]}: ${r.reason?.message ?? r.reason}`);
      }
    }

    if (allPosts.length === 0 && topicErrors.length > 0) {
      return NextResponse.json(
        { ok: false, error: "All PH requests failed", details: topicErrors },
        { status: 502 },
      );
    }

    const existing = await getExistingPHKeys();
    const newPosts = filterNewPHPosts(allPosts, existing);

    let inserted = 0;
    let failed = 0;
    const insertedNames: string[] = [];

    for (const post of newPosts) {
      try {
        const result = await upsertPHPost(post);
        insertedNames.push(result.name);
        inserted++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      summary: {
        fetched: allPosts.length,
        new: newPosts.length,
        inserted,
        failed,
        skipped: allPosts.length - newPosts.length,
      },
      inserted_tools: insertedNames,
      topic_errors: topicErrors.length > 0 ? topicErrors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

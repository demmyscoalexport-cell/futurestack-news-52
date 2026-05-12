import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function requireAdmin(): Promise<{ error: NextResponse } | { ok: true }> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true };
}

/* ─── GET — list pending_review tools ─── */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const { rows } = await db.query(
    `SELECT
       t.id, t.name, t.slug, t.tagline, t.description,
       t.logo, t.website, t.website_url,
       t.category, t.pricing_model, t.has_free,
       t.africa_friendly, t.rating, t.review_count,
       t.upvote_count, t.tags, t.source,
       t.producthunt_url, t.created_at,
       COUNT(*) OVER() AS total_count
     FROM tools t
     WHERE t.status = 'pending_review'
     ORDER BY t.upvote_count DESC NULLS LAST, t.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  const total = rows[0]?.total_count ? parseInt(rows[0].total_count) : 0;
  const tools = rows.map(({ total_count: _, ...t }) => t);
  return NextResponse.json({ tools, total, limit, offset });
}

/* ─── POST — approve or reject a tool ─── */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id and action (approve|reject) required" }, { status: 400 });
  }

  if (action === "approve") {
    await db.query(
      `UPDATE tools SET
         status    = 'active',
         is_new    = true,
         new_until = NOW() + INTERVAL '7 days',
         last_updated = NOW()::date
       WHERE id = $1`,
      [id],
    );

    // Insert default scores if not present
    await db.query(
      `INSERT INTO tool_scores (tool_id, ease_of_use, value_for_money, feature_depth, support_quality, integration_richness, ai_capability)
       SELECT id, 7.0, 7.0, 7.0, 7.0, 7.0, 7.5 FROM tools WHERE id = $1
       ON CONFLICT (tool_id) DO NOTHING`,
      [id],
    );

    return NextResponse.json({ ok: true, action: "approved" });
  }

  // reject — soft delete
  await db.query(
    `UPDATE tools SET status = 'rejected', last_updated = NOW()::date WHERE id = $1`,
    [id],
  );
  return NextResponse.json({ ok: true, action: "rejected" });
}

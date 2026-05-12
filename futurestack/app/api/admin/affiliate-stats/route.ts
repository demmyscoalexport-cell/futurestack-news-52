import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function requireAdmin(): Promise<{ error: NextResponse } | { ok: true }> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true };
}

/** Summary stats for the admin dashboard widget */
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const [summary, topTools, dailyTrend] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '1 day')   AS today,
        COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '7 days')  AS week,
        COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '30 days') AS month,
        COUNT(*) AS total
      FROM affiliate_clicks
    `),
    db.query(`
      SELECT t.name, t.slug, t.logo,
             COUNT(ac.id)::int AS clicks_30d
      FROM affiliate_clicks ac
      JOIN tools t ON t.id = ac.tool_id
      WHERE ac.clicked_at >= NOW() - INTERVAL '30 days'
      GROUP BY t.id, t.name, t.slug, t.logo
      ORDER BY clicks_30d DESC
      LIMIT 5
    `),
    db.query(`
      SELECT
        date_trunc('day', clicked_at)::date AS day,
        COUNT(*)::int AS clicks
      FROM affiliate_clicks
      WHERE clicked_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `),
  ]);

  return NextResponse.json({
    summary: summary.rows[0],
    topTools: topTools.rows,
    dailyTrend: dailyTrend.rows,
  });
}

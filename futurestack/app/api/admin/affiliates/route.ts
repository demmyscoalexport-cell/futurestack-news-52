import { NextRequest, NextResponse } from "next/server";
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

/* ─── GET — list all tools with affiliate data + click counts ─── */
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { rows } = await db.query(`
    SELECT
      t.id, t.name, t.slug, t.logo,
      al.id          AS affiliate_id,
      al.affiliate_url,
      al.partner_name,
      al.commission_rate,
      al.notes,
      al.is_active,
      COALESCE(c30.cnt, 0)::int AS clicks_30d,
      COALESCE(c7.cnt,  0)::int AS clicks_7d,
      COALESCE(c1.cnt,  0)::int AS clicks_today
    FROM tools t
    LEFT JOIN affiliate_links al ON al.tool_id = t.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS cnt FROM affiliate_clicks
      WHERE tool_id = t.id AND clicked_at >= NOW() - INTERVAL '30 days'
    ) c30 ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS cnt FROM affiliate_clicks
      WHERE tool_id = t.id AND clicked_at >= NOW() - INTERVAL '7 days'
    ) c7 ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS cnt FROM affiliate_clicks
      WHERE tool_id = t.id AND clicked_at >= NOW() - INTERVAL '1 day'
    ) c1 ON true
    WHERE t.status = 'active'
    ORDER BY COALESCE(c30.cnt, 0) DESC, t.name ASC
  `);

  return NextResponse.json(rows);
}

/* ─── POST — create new affiliate link ─── */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { tool_id, affiliate_url, partner_name, commission_rate, notes } = body;

  if (!tool_id || !affiliate_url || !partner_name) {
    return NextResponse.json({ error: "tool_id, affiliate_url, and partner_name are required" }, { status: 400 });
  }

  const { rows } = await db.query(
    `INSERT INTO affiliate_links (tool_id, affiliate_url, partner_name, commission_rate, notes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tool_id) DO UPDATE SET
       affiliate_url = EXCLUDED.affiliate_url,
       partner_name  = EXCLUDED.partner_name,
       commission_rate = EXCLUDED.commission_rate,
       notes = EXCLUDED.notes,
       updated_at = NOW()
     RETURNING *`,
    [tool_id, affiliate_url, partner_name, commission_rate || 0, notes || null],
  );

  return NextResponse.json(rows[0]);
}

/* ─── PUT — update existing affiliate link (by id in body) ─── */
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, affiliate_url, partner_name, commission_rate, notes } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { rows } = await db.query(
    `UPDATE affiliate_links SET
       affiliate_url   = $1,
       partner_name    = $2,
       commission_rate = $3,
       notes           = $4,
       updated_at      = NOW()
     WHERE id = $5
     RETURNING *`,
    [affiliate_url, partner_name, commission_rate || 0, notes || null, id],
  );

  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

/* ─── PATCH — toggle is_active ─── */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, is_active } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.query(
    `UPDATE affiliate_links SET is_active = $1, updated_at = NOW() WHERE id = $2`,
    [is_active, id],
  );
  return NextResponse.json({ ok: true });
}

/* ─── DELETE — remove affiliate link ─── */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.query(`DELETE FROM affiliate_links WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}

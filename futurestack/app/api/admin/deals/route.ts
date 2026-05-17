import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { db } from "@/lib/db";
import { upsertDeal, deleteDeal } from "@/lib/queries/deals";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Number(searchParams.get("offset") ?? 0);
    const type = searchParams.get("type") ?? "";
    const status = searchParams.get("status") ?? "";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (type) { params.push(type); conditions.push(`type = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const filterParams = [...params];
    params.push(limit);
    params.push(offset);

    const [countRes, rowsRes] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS n FROM deals ${where}`, filterParams),
      db.query(
        `SELECT * FROM deals ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      ),
    ]);

    return NextResponse.json({ deals: rowsRes.rows, total: countRes.rows[0].n });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    if (!body.name || !body.discount || !body.deal_price || !body.url) {
      return NextResponse.json({ error: "Missing required fields: name, discount, deal_price, url" }, { status: 400 });
    }
    const result = await upsertDeal(body);
    return NextResponse.json({ deal: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const result = await upsertDeal(body);
    return NextResponse.json({ deal: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteDeal(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

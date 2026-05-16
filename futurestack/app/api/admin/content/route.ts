import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/* ─── GET — paginated articles list ─── */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page")   ?? "0");
  const limit  = parseInt(searchParams.get("limit")  ?? "20");
  const search = searchParams.get("search")           ?? "";
  const status = searchParams.get("status")           ?? "";

  const supabase = createAdminClient();
  let query = supabase
    .from("articles")
    .select("id,slug,title,excerpt,status,category,featured,view_count,read_time,published_at,created_at,featured_image", { count: "exact" });

  if (search) query = query.ilike("title", `%${search}%`);
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data ?? [], total: count ?? 0 });
}

/* ─── PATCH — toggle status or update fields ─── */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const allowed = ["status", "featured", "title", "excerpt", "category"];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in fields) patch[key] = fields[key];
  }
  if (fields.status === "PUBLISHED" && !fields.published_at) {
    patch.published_at = new Date().toISOString();
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("articles").update(patch).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/* ─── DELETE — remove article ─── */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

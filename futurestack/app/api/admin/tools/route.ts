import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/* ─── GET — paginated tool list ─── */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const page     = parseInt(searchParams.get("page")     ?? "0");
  const limit    = parseInt(searchParams.get("limit")    ?? "20");
  const search   = searchParams.get("search")            ?? "";
  const category = searchParams.get("category")          ?? "";
  const featured = searchParams.get("featured")          ?? "";

  const supabase = createAdminClient();
  let query = supabase
    .from("tools")
    .select("id,name,slug,short_description,logo,category,website,africa_friendly,featured,has_free,video_embed_url,promo_video_url,rating,review_count,created_at", { count: "exact" });

  if (search)   query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  if (category) query = query.eq("category", category);
  if (featured === "true")  query = query.eq("featured", true);
  if (featured === "false") query = query.eq("featured", false);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tools: data ?? [], total: count ?? 0 });
}

/* ─── PUT — update tool ─── */
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const allowed = [
    "name", "slug", "short_description", "description", "logo", "website",
    "category", "africa_friendly", "featured", "has_free",
    "video_embed_url", "promo_video_url",
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key];
  }
  patch.last_updated = new Date().toISOString();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tools")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* ─── PATCH — quick toggle (featured / africa_friendly) ─── */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("tools").update(fields).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/* ─── DELETE — remove tool ─── */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("tools").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

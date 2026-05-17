import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page")  ?? "0");
  const limit  = parseInt(searchParams.get("limit") ?? "25");
  const search = searchParams.get("search") ?? "";

  const supabase = createAdminClient();

  let query = supabase
    .from("reviews")
    .select("id,tool_id,user_name,rating,content,verified,location,created_at", { count: "exact" });

  if (search) query = query.ilike("content", `%${search}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Join tool names
  const toolIds = [...new Set((data ?? []).map(r => r.tool_id))];
  let toolMap: Record<string, { name: string; slug: string }> = {};
  if (toolIds.length > 0) {
    const { data: tools } = await supabase.from("tools").select("id,name,slug").in("id", toolIds);
    toolMap = Object.fromEntries((tools ?? []).map(t => [t.id, { name: t.name, slug: t.slug }]));
  }

  const reviews = (data ?? []).map(r => ({
    ...r,
    tool_name: toolMap[r.tool_id]?.name,
    tool_slug: toolMap[r.tool_id]?.slug,
  }));

  return NextResponse.json({ reviews, total: count ?? 0 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, verified } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("reviews").update({ verified }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

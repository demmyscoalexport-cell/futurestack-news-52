import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page")  ?? "0");
  const limit  = parseInt(searchParams.get("limit") ?? "30");
  const search = searchParams.get("search") ?? "";

  const supabase = createAdminClient();

  let query = supabase
    .from("profiles")
    .select("id,email,full_name,role,avatar_url,created_at", { count: "exact" });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [], total: count ?? 0 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, role } = await req.json();
  if (!id || !role) return NextResponse.json({ error: "id and role required" }, { status: 400 });

  const allowed = ["user", "editor", "admin"];
  if (!allowed.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

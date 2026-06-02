import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * For API route handlers — returns { ok: true } on success or
 * { error: NextResponse } with a 401/403 JSON payload on failure.
 *
 * Usage:
 *   const auth = await requireAdmin();
 *   if ("error" in auth) return auth.error;
 */
export async function requireAdmin(): Promise<{ error: NextResponse } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true };
}

/**
 * For Server Components — calls Next.js redirect() if the user is not
 * an authenticated admin. Safe to call at the top of any async page component.
 *
 * Usage:
 *   await checkAdminOrRedirect();
 */
export async function checkAdminOrRedirect(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");
}

import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "@/lib/config";

async function getAdminProfile(
  lookup: { clerkUserId: string } | { supabaseUserId: string },
): Promise<{ role: string | null } | null> {
  const supabase = createAdminClient();

  if ("clerkUserId" in lookup) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_user_id", lookup.clerkUserId)
      .maybeSingle();
    return data;
  }

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", lookup.supabaseUserId)
    .maybeSingle();
  return data;
}

export async function requireAdmin(): Promise<
  { error: NextResponse } | { ok: true }
> {
  if (config.clerk.isConfigured) {
    const { userId } = await clerkAuth();
    if (!userId) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const profile = await getAdminProfile({ clerkUserId: userId });
    if (profile?.role !== "admin") {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { ok: true };
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const profile = await getAdminProfile({ supabaseUserId: session.user.id });
  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true };
}

export async function checkAdminOrRedirect(): Promise<void> {
  if (config.clerk.isConfigured) {
    const { userId } = await clerkAuth();
    if (!userId) redirect(config.clerk.signInUrl);

    const profile = await getAdminProfile({ clerkUserId: userId });
    if (profile?.role !== "admin") redirect("/");
    return;
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const profile = await getAdminProfile({ supabaseUserId: session.user.id });
  if (profile?.role !== "admin") redirect("/");
}

import { createAdminClient } from "@/lib/supabase/admin";

export interface ClerkProfilePayload {
  clerkUserId: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
}

export async function syncClerkProfile(
  payload: ClerkProfilePayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createAdminClient();
    const { clerkUserId, email, fullName, avatarUrl, role } = payload;

    const { data: byClerk } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    const profilePatch = {
      clerk_user_id: clerkUserId,
      email,
      full_name: fullName ?? null,
      avatar_url: avatarUrl ?? null,
      updated_at: new Date().toISOString(),
      ...(role ? { role } : {}),
    };

    if (byClerk?.id) {
      const { error } = await supabase
        .from("profiles")
        .update(profilePatch)
        .eq("id", byClerk.id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    if (email) {
      const { data: byEmail } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (byEmail?.id) {
        const { error } = await supabase
          .from("profiles")
          .update(profilePatch)
          .eq("id", byEmail.id);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      }
    }

    const { error } = await supabase.from("profiles").insert({
      ...profilePatch,
      role: role ?? "user",
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Profile sync failed";
    return { ok: false, error: message };
  }
}

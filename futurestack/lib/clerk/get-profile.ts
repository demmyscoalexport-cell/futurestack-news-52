import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncClerkProfile } from "@/lib/clerk/sync-profile";

export interface ClerkLinkedProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string | null;
}

async function loadProfileByClerkId(
  clerkUserId: string,
): Promise<ClerkLinkedProfile | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (!data?.id) return null;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
  };
}

export async function ensureClerkProfile(
  clerkUserId: string,
): Promise<ClerkLinkedProfile | null> {
  const existing = await loadProfileByClerkId(clerkUserId);
  if (existing) return existing;

  const user = await currentUser();
  if (!user || user.id !== clerkUserId) return null;

  const email =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

  const result = await syncClerkProfile({
    clerkUserId: user.id,
    email,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    avatarUrl: user.imageUrl ?? null,
  });

  if (!result.ok) return null;
  return loadProfileByClerkId(clerkUserId);
}

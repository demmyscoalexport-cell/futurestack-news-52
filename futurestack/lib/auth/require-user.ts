import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { ensureClerkProfile } from "@/lib/clerk/get-profile";

export type AuthProvider = "clerk" | "supabase";

export interface AppUser {
  profileId: string;
  email: string | null;
  fullName: string | null;
  provider: AuthProvider;
}

export async function getOptionalUser(): Promise<AppUser | null> {
  if (config.clerk.isConfigured) {
    const { userId } = await clerkAuth();
    if (!userId) return null;

    const profile = await ensureClerkProfile(userId);
    if (!profile) return null;

    return {
      profileId: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      provider: "clerk",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    profileId: user.id,
    email: user.email ?? null,
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      null,
    provider: "supabase",
  };
}

export async function requireUser():
  Promise<{ user: AppUser } | { error: NextResponse }> {
  const user = await getOptionalUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user };
}

export async function requireUserOrRedirect(): Promise<AppUser> {
  const user = await getOptionalUser();
  if (user) return user;

  if (config.clerk.isConfigured) {
    redirect(config.clerk.signInUrl);
  }
  redirect("/login");
}

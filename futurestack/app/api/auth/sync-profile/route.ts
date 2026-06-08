import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { config } from "@/lib/config";
import { ensureClerkProfile } from "@/lib/clerk/get-profile";

export async function POST(): Promise<NextResponse> {
  if (!config.clerk.isConfigured) {
    return NextResponse.json(
      { success: false, error: "Clerk is not configured" },
      { status: 503 },
    );
  }

  const { userId } = await clerkAuth();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const profile = await ensureClerkProfile(userId);
  if (!profile) {
    return NextResponse.json(
      { success: false, error: "Profile sync failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    profile: {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    },
  });
}

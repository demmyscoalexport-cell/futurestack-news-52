import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/require-user";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        role: body.role || null,
        primary_goals: body.goals ?? [],
        monthly_tool_budget: body.monthlyBudget ?? 50,
        onboarding_completed: true,
      })
      .eq("id", auth.user.profileId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to save preferences" },
      { status: 500 },
    );
  }
}

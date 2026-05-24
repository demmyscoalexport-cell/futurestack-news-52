import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: body.role || null,
          primary_goals: body.goals ?? [],
          monthly_tool_budget: body.monthlyBudget ?? 50,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) {
        console.error("[preferences]", error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[preferences]", e);
    return NextResponse.json({ ok: true });
  }
}

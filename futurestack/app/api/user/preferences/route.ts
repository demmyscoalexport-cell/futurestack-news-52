import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const preferencesSchema = z.object({
  goals: z.array(z.string()).max(10).default([]),
  monthlyBudget: z.coerce.number().int().min(0).max(100000).default(50),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = preferencesSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid preferences payload" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { goals, monthlyBudget } = parsed.data;
    const { error } = await supabase
      .from("profiles")
      .update({
        primary_goals: goals,
        monthly_tool_budget: monthlyBudget,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Could not save preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not save preferences" },
      { status: 500 },
    );
  }
}

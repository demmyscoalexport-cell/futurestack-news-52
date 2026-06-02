import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const preferencesSchema = z.object({
  goals: z.array(z.string()).max(8).optional(),
  monthlyBudget: z.number().int().min(0).max(500).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = preferencesSchema.parse(await req.json());
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          primary_goals: body.goals ?? [],
          monthly_tool_budget: body.monthlyBudget ?? 50,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) {
        return NextResponse.json({ ok: false }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

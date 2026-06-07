import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const preferencesSchema = z
  .object({
    goals: z.array(z.string()).max(8).optional(),
    monthlyBudget: z.number().int().min(0).max(500).optional(),
  })
  .passthrough();

type ProfilePreferencesUpdate = {
  primary_goals: string[];
  monthly_tool_budget: number;
  onboarding_completed: true;
};

export function buildProfilePreferencesUpdate(input: unknown): ProfilePreferencesUpdate {
  const result = preferencesSchema.safeParse(input);
  const preferences = result.success ? result.data : {};

  return {
    primary_goals: preferences.goals ?? [],
    monthly_tool_budget: preferences.monthlyBudget ?? 50,
    onboarding_completed: true,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const update = buildProfilePreferencesUpdate(body);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update(update)
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

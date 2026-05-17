import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const supabase = createAdminClient();

  const [statsRes, trendRes, topRes] = await Promise.all([
    supabase.rpc("get_affiliate_stats"),
    supabase.rpc("get_affiliate_daily_trend"),
    supabase.rpc("get_top_affiliate_tools", { p_days: 30, p_limit: 5 }),
  ]);

  return NextResponse.json({
    summary:    statsRes.data ?? { today: 0, week: 0, month: 0, total: 0 },
    dailyTrend: trendRes.data ?? [],
    topTools:   topRes.data ?? [],
  });
}

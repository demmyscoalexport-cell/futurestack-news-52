import { createClient } from "@/lib/supabase/server";
import { getTools, getTrendingTools } from "@/lib/queries/tools";
import type { Tool } from "@/lib/types";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [allTools, trendingTools] = await Promise.all([
    getTools({ limit: 200 }),
    getTrendingTools(8),
  ]);

  const userName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.email?.split("@")[0] ??
    "Builder";

  return (
    <DashboardClient
      allTools={allTools as unknown as Tool[]}
      trendingTools={trendingTools as unknown as Tool[]}
      userName={userName}
    />
  );
}

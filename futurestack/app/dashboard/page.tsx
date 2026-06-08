export const dynamic = "force-dynamic";
import { getTools, getTrendingTools } from "@/lib/queries/tools";
import type { Tool } from "@/lib/types";
import { requireUserOrRedirect } from "@/lib/auth/require-user";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await requireUserOrRedirect();

  const [allTools, trendingTools] = await Promise.all([
    getTools({ limit: 200 }),
    getTrendingTools(8),
  ]);

  const userName =
    user?.fullName ?? user?.email?.split("@")[0] ?? "Builder";

  return (
    <DashboardClient
      allTools={allTools as unknown as Tool[]}
      trendingTools={trendingTools as unknown as Tool[]}
      userName={userName}
    />
  );
}

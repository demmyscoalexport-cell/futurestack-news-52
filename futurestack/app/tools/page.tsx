import { getTools, getToolCategories } from "@/lib/queries/tools";
import {
  tools as fallbackTools,
  toolCategories as fallbackCategories,
} from "@/lib/data";
import { ToolsContent } from "./tools-content";
import type { Tool, ToolCategory } from "@/lib/types";
import { resolveToolLogo } from "@/lib/logo-resolver";

export const metadata = {
  title: "AI Tools Directory",
  description:
    "Discover, compare and build with the best AI tools for freelancers, agencies, and SaaS founders.",
};

/** Normalize a Supabase tool row into the client-side Tool shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSupabaseTool(row: any): Tool {
  return {
    id: row.id,
    name: row.name ?? "Unnamed",
    slug: row.slug ?? row.id,
    description: row.description ?? "",
    shortDescription: row.short_description ?? row.tagline ?? "",
    logo: resolveToolLogo(row.name ?? "", row.logo, row.website),
    category: (row.category ?? "productivity") as ToolCategory,
    subcategories: row.subcategories ?? [],
    pricing: {
      hasFree: row.has_free ?? false,
      plans: [],
    },
    rating: row.avg_rating ?? row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    badges: row.badges ?? [],
    integrations: row.integrations ?? [],
    platforms: row.platforms ?? [],
    website: row.website ?? "",
    africaFriendly: row.africa_friendly ?? false,
    bestFor: row.best_for ?? [],
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    lastUpdated: row.updated_at ?? row.created_at ?? "",
    screenshots: row.screenshots ?? [],
  };
}

export default async function ToolsPage() {
  const [rawTools, categories] = await Promise.all([
    getTools({ limit: 100 }),
    getToolCategories(),
  ]);

  // Normalize Supabase tools to match the client-side Tool type
  const tools: Tool[] = rawTools.length
    ? rawTools.map(normalizeSupabaseTool)
    : fallbackTools;

  return (
    <ToolsContent
      initialTools={tools}
      initialCategories={categories.length ? categories : fallbackCategories}
    />
  );
}

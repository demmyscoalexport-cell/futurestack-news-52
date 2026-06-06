import type { Tool } from "@/lib/types";
import { getTools, getCategoriesWithSubcategories } from "@/lib/queries/tools";
import { ToolsContent } from "./tools-content";
import { resolveToolLogo } from "@/lib/logo-resolver";
import { Suspense } from "react";
import { tools as fallbackTools } from "@/lib/data";

export const metadata = {
  title: "Tools & Apps Directory | DISCOVA",
  description:
    "Discover, compare and build with 400+ tools — by category, pricing, and African compatibility. Built for creators, founders, and businesses across Africa.",
};

const DEFAULT_CATEGORIES = [
  { id: "writing", name: "Writing", icon: "✍️" },
  { id: "code", name: "Code", icon: "💻" },
  { id: "design", name: "Design", icon: "🎨" },
  { id: "video", name: "Video", icon: "🎬" },
  { id: "audio", name: "Audio", icon: "🎵" },
  { id: "automation", name: "Automation", icon: "⚙️" },
  { id: "productivity", name: "Productivity", icon: "⚡" },
  { id: "data", name: "Data", icon: "📊" },
  { id: "marketing", name: "Marketing", icon: "📢" },
  { id: "analytics", name: "Analytics", icon: "📈" },
];

function mergeCategories(
  dbCategories: Parameters<typeof ToolsContent>[0]["initialCategories"],
  tools: Tool[],
): Parameters<typeof ToolsContent>[0]["initialCategories"] {
  const byId = new Map(dbCategories.map((category) => [category.id, category]));
  return DEFAULT_CATEGORIES.map((category) => {
    const existing = byId.get(category.id);
    const count = tools.filter((tool) => tool.category === category.id || tool.category_name === category.id).length;
    return {
      ...category,
      ...existing,
      count: existing?.count ?? count,
      subcategories: existing?.subcategories ?? [],
    };
  });
}

export default async function ToolsPage() {
  const [rawTools, categories] = await Promise.all([
    getTools({ limit: 1000 }),
    getCategoriesWithSubcategories(),
  ]);

  const sourceTools = rawTools.length > 0 ? rawTools : fallbackTools;
  const tools = sourceTools.map((row) => ({
    ...row,
    logo: resolveToolLogo(
      String(row.name ?? ""),
      (row.logo as string | null) ?? null,
      String(row.website_url ?? row.website ?? ""),
    ),
  })) as Tool[];
  const mergedCategories = mergeCategories(
    categories as Parameters<typeof ToolsContent>[0]["initialCategories"],
    tools,
  );

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ToolsContent
        initialTools={tools}
        initialCategories={mergedCategories}
      />
    </Suspense>
  );
}

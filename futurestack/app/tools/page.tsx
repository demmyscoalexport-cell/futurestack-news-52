import type { Tool } from "@/lib/types";
import { getTools, getCategoriesWithSubcategories } from "@/lib/queries/tools";
import { ToolsContent } from "./tools-content";
import { resolveToolLogo } from "@/lib/logo-resolver";
import { Suspense } from "react";

export const metadata = {
  title: "Tools & Apps Directory | DISCOVA",
  description:
    "Discover, compare and build with 400+ tools — by category, pricing, and African compatibility. Built for creators, founders, and businesses across Africa.",
};

export default async function ToolsPage() {
  const [rawTools, categories] = await Promise.all([
    getTools({ limit: 1000 }),
    getCategoriesWithSubcategories(),
  ]);

  const tools = rawTools.map((row) => ({
    ...row,
    logo: resolveToolLogo(
      String(row.name ?? ""),
      (row.logo as string | null) ?? null,
      String(row.website_url ?? row.website ?? ""),
    ),
  })) as Tool[];

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ToolsContent
        initialTools={tools}
        initialCategories={categories as Parameters<typeof ToolsContent>[0]["initialCategories"]}
      />
    </Suspense>
  );
}

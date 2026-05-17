import { getTools, getCategoriesWithSubcategories } from "@/lib/queries/tools";
import { ToolsContent } from "./tools-content";
import { resolveToolLogo } from "@/lib/logo-resolver";

export const metadata = {
  title: "Tools & Apps Directory | DISCOVA",
  description:
    "Discover, compare and build with 400+ tools — by category, pricing, and African compatibility. Built for creators, founders, and businesses across Africa.",
};

export default async function ToolsPage() {
  const [rawTools, categories] = await Promise.all([
    getTools({ limit: 500 }),
    getCategoriesWithSubcategories(),
  ]);

  const tools = rawTools.map((row: Record<string, unknown>) => ({
    ...row,
    logo: resolveToolLogo(String(row.name ?? ""), row.logo as string | null, row.website as string),
  }));

  return (
    <ToolsContent
      initialTools={tools}
      initialCategories={categories}
    />
  );
}

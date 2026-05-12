import { getTools, getCategoriesWithSubcategories } from "@/lib/queries/tools";
import { ToolsContent } from "./tools-content";
import { resolveToolLogo } from "@/lib/logo-resolver";

export const metadata = {
  title: "AI Tools Directory | FutureStack",
  description:
    "Discover, compare and build with 50+ AI tools — by category, subcategory, pricing, and more. Built for freelancers, agencies, and founders.",
};

export default async function ToolsPage() {
  const [rawTools, categories] = await Promise.all([
    getTools({ limit: 200 }),
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

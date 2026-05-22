import { getTools, getToolCategories } from "@/lib/queries/tools";
import type { Tool } from "@/lib/types";
import {
  tools as fallbackTools,
  toolCategories as fallbackCategories,
} from "@/lib/data";
import { StackBuilderContent } from "./stack-builder-content";

export const metadata = {
  title: "Stack Builder",
  description:
    "Build your perfect AI tool stack. Select your role and combine the best tools for your workflow.",
};

export default async function StackBuilderPage() {
  const [tools, categories] = await Promise.all([
    getTools({ limit: 100 }),
    getToolCategories(),
  ]);

  return (
    <StackBuilderContent
      initialTools={(tools.length ? tools : fallbackTools) as Tool[]}
      initialCategories={categories.length ? categories : fallbackCategories}
    />
  );
}

import { getTrendingTools } from "@/lib/queries/tools";
import { tools as fallbackTools } from "@/lib/data";
import { ComparePickerClient } from "./compare-client";

export const metadata = {
  title: "Compare AI Tools",
  description: "Side-by-side comparison of AI tools — pricing, scores, features, and best-for recommendations.",
};

export default async function ComparePage() {
  let tools = await getTrendingTools(100);
  if (!tools?.length) tools = fallbackTools;

  return <ComparePickerClient tools={tools} />;
}

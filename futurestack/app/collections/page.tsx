export const dynamic = "force-dynamic";
import { getTrendingTools } from "@/lib/queries/tools";
import { tools as fallbackTools } from "@/lib/data";
import { CollectionsClient } from "./collections-client";

export const metadata = {
  title: "My Collections",
  description: "Your saved AI tools and bookmarks on DISCOVA.",
};

export default async function CollectionsPage() {
  let allTools = await getTrendingTools(200);
  if (!allTools?.length) allTools = fallbackTools;
  return <CollectionsClient allTools={allTools} />;
}

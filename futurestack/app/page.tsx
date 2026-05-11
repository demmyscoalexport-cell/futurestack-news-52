import { getFeaturedArticles } from "@/lib/queries/articles";
import { getTrendingTools, getToolCategories } from "@/lib/queries/tools";
import { getFeaturedStacks } from "@/lib/queries/stacks";
import {
  articles as fallbackArticles,
  tools as fallbackTools,
  stacks as fallbackStacks,
  toolCategories as fallbackCategories,
} from "@/lib/data";
import { HomeClient } from "./home-client";

export default async function HomePage() {
  const [featuredArticles, topTools, featuredStacks, toolCategories] =
    await Promise.all([
      getFeaturedArticles(4),
      getTrendingTools(5),
      getFeaturedStacks(3),
      getToolCategories(),
    ]);

  // Fall back to static mock data until Supabase tables are populated
  return (
    <HomeClient
      featuredArticles={
        featuredArticles?.length
          ? featuredArticles
          : fallbackArticles.filter((a) => a.featured).slice(0, 4)
      }
      topTools={topTools?.length ? topTools : fallbackTools.slice(0, 5)}
      featuredStacks={
        featuredStacks?.length
          ? featuredStacks
          : fallbackStacks.filter((s) => s.featured).slice(0, 3)
      }
      toolCategories={
        toolCategories?.length ? toolCategories : fallbackCategories
      }
    />
  );
}

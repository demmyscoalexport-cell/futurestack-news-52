import { getFeaturedArticles } from "@/lib/queries/articles";
import { getTrendingTools, getToolCategories, getRecentTools, getCatalogStats } from "@/lib/queries/tools";
import { getFeaturedStacks } from "@/lib/queries/stacks";
import {
  articles as fallbackArticles,
  tools as fallbackTools,
  stacks as fallbackStacks,
  toolCategories as fallbackCategories,
} from "@/lib/data";
import { HomeClient } from "./home-client";

export default async function HomePage() {
  const [featuredArticles, topTools, featuredStacks, toolCategories, recentTools, catalogStats] =
    await Promise.all([
      getFeaturedArticles(4),
      getTrendingTools(12),
      getFeaturedStacks(4),
      getToolCategories(),
      getRecentTools(6),
      getCatalogStats(),
    ]);

  return (
    <HomeClient
      featuredArticles={
        featuredArticles?.length
          ? featuredArticles
          : fallbackArticles.filter((a) => a.featured).slice(0, 4)
      }
      topTools={topTools?.length ? topTools : fallbackTools.slice(0, 12)}
      featuredStacks={
        featuredStacks?.length
          ? featuredStacks
          : fallbackStacks.filter((s) => s.featured).slice(0, 4)
      }
      toolCategories={
        toolCategories?.length ? toolCategories : fallbackCategories
      }
      recentTools={recentTools?.length ? recentTools : fallbackTools.slice(0, 6)}
      catalogStats={catalogStats}
    />
  );
}

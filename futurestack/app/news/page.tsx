import { getPublishedArticles } from "@/lib/queries/articles";
import { articles as fallbackArticles } from "@/lib/data";
import { NewsContent } from "./news-content";
import { config } from "@/lib/config";

export const metadata = {
  title: "News & Insights",
  description:
    "Stay ahead with AI tools, digital trends, and startup strategies from DISCOVA — Africa's discovery platform.",
};

async function getArticles() {
  // If Contentful is configured, try it first (editorial CMS content)
  if (config.contentful.spaceId && config.contentful.deliveryToken) {
    try {
      const { getContentfulNews } = await import("@/lib/contentful/service");
      const contentfulArticles = await getContentfulNews({ status: "published", limit: 50 });
      if (contentfulArticles.length > 0) {
        // Merge: Contentful articles first, then DB articles (deduplicate by slug)
        const dbArticles = await getPublishedArticles({ limit: 50 });
        const contentfulSlugs = new Set(contentfulArticles.map((a) => a.slug));
        const dbOnly = dbArticles.filter((a) => !contentfulSlugs.has(a.slug));
        return [...contentfulArticles, ...dbOnly];
      }
    } catch {
      // Contentful unavailable — fall through to DB
    }
  }

  // Primary: DB articles (GNews AI-generated + synced content)
  const dbArticles = await getPublishedArticles({ limit: 50 });
  if (dbArticles.length > 0) return dbArticles;

  // Last resort: static fallback data
  return fallbackArticles;
}

export default async function NewsPage() {
  const articles = await getArticles();
  return <NewsContent initialArticles={articles} />;
}

import { getPublishedArticles } from "@/lib/queries/articles";
import { articles as fallbackArticles } from "@/lib/data";
import { NewsContent } from "./news-content";

export const metadata = {
  title: "News & Insights",
  description:
    "Stay ahead with AI tools, digital trends, and startup strategies from DISCOVA — Africa's discovery platform.",
};

export default async function NewsPage() {
  const articles = await getPublishedArticles({ limit: 50 });
  return (
    <NewsContent
      initialArticles={articles.length ? articles : fallbackArticles}
    />
  );
}

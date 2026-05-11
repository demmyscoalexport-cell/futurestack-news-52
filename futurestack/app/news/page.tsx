import { getPublishedArticles } from "@/lib/queries/articles";
import { articles as fallbackArticles } from "@/lib/data";
import { NewsContent } from "./news-content";

export const metadata = {
  title: "News & Insights",
  description:
    "Stay ahead with AI tools, SaaS trends, and automation strategies from FutureStack News.",
};

export default async function NewsPage() {
  const articles = await getPublishedArticles({ limit: 50 });
  return (
    <NewsContent
      initialArticles={articles.length ? articles : fallbackArticles}
    />
  );
}

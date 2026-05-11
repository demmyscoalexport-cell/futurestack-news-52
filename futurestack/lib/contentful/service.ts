import { fetchContentfulEntries } from "@/lib/contentful/client";
import {
  mapContentfulArticle,
  mapContentfulTool,
} from "@/lib/contentful/mappers";
import type {
  NewsArticleContentFields,
  ToolContentFields,
} from "@/lib/contentful/types";

export async function getContentfulTools(options?: {
  categorySlug?: string;
  status?: "draft" | "published" | "archived";
  limit?: number;
}) {
  const data = await fetchContentfulEntries<ToolContentFields>("tool", {
    "fields.categorySlug": options?.categorySlug,
    "fields.status": options?.status ?? "published",
    limit: options?.limit ?? 100,
  });

  return data.items.map(mapContentfulTool);
}

export async function getContentfulNews(options?: {
  status?: "draft" | "published" | "archived";
  limit?: number;
}) {
  const limit = options?.limit ?? 30;
  const attempts: Array<Record<string, string | number | boolean | undefined>> =
    [
      {
        "fields.status": options?.status ?? "published",
        order: "-fields.publishedAt",
        limit,
      },
      {
        order: "-fields.publishDate",
        limit,
      },
      {
        order: "-sys.updatedAt",
        limit,
      },
    ];

  let lastError: unknown;
  for (const query of attempts) {
    try {
      const data = await fetchContentfulEntries<NewsArticleContentFields>(
        "newsArticle",
        query,
      );
      return data.items.map(mapContentfulArticle);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch newsArticle entries from Contentful");
}

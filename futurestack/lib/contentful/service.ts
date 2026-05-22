import { fetchContentfulEntries } from "@/lib/contentful/client";
import { getResolvedContentTypes } from "@/lib/contentful/content-types";
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
  const { tool: contentType } = await getResolvedContentTypes();
  if (!contentType) {
    return [];
  }

  const limit = options?.limit ?? 100;
  const requestedStatus = options?.status ?? "published";
  const statusAttempts =
    requestedStatus === "published"
      ? ["published", "active"]
      : [requestedStatus];

  let lastError: unknown;
  for (const status of statusAttempts) {
    try {
      const data = await fetchContentfulEntries<ToolContentFields>(contentType, {
        "fields.categorySlug": options?.categorySlug,
        "fields.status": status,
        limit,
      });
      if (data.items.length > 0 || status === statusAttempts.at(-1)) {
        return data.items.map(mapContentfulTool);
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  return [];
}

export async function getContentfulNews(options?: {
  status?: "draft" | "published" | "archived";
  limit?: number;
}) {
  const { news: contentType } = await getResolvedContentTypes();
  if (!contentType) {
    return [];
  }

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
        contentType,
        query,
      );
      return data.items.map(mapContentfulArticle);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch ${contentType} entries from Contentful`);
}

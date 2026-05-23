import { getContentfulContentTypeIds } from "@/lib/contentful/client";

const TOOL_CONTENT_TYPES = ["tool-2", "tool"] as const;
const NEWS_CONTENT_TYPES = ["newsArticle-3", "newsArticle-2", "newsArticle"] as const;

export type ToolContentTypeId = (typeof TOOL_CONTENT_TYPES)[number];
export type NewsContentTypeId = (typeof NEWS_CONTENT_TYPES)[number];

export function isToolContentType(contentType: string) {
  return (TOOL_CONTENT_TYPES as readonly string[]).includes(contentType);
}

export function isNewsContentType(contentType: string) {
  return (NEWS_CONTENT_TYPES as readonly string[]).includes(contentType);
}

export function resolveToolContentType(
  available: readonly string[],
): ToolContentTypeId | null {
  return TOOL_CONTENT_TYPES.find((id) => available.includes(id)) ?? null;
}

export function resolveNewsContentType(
  available: readonly string[],
): NewsContentTypeId | null {
  return NEWS_CONTENT_TYPES.find((id) => available.includes(id)) ?? null;
}

let cachedContentTypeIds: string[] | null = null;

export async function getResolvedContentTypes() {
  if (!cachedContentTypeIds) {
    cachedContentTypeIds = await getContentfulContentTypeIds();
  }

  return {
    available: cachedContentTypeIds,
    tool: resolveToolContentType(cachedContentTypeIds),
    news: resolveNewsContentType(cachedContentTypeIds),
  };
}

export function clearContentTypeCache() {
  cachedContentTypeIds = null;
}

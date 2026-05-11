import { config } from "@/lib/config";
import type { ContentfulCollection } from "@/lib/contentful/types";

type QueryValue = string | number | boolean | undefined;

function getBaseUrl() {
  const host = config.contentful.usePreviewApi
    ? "preview.contentful.com"
    : "cdn.contentful.com";

  const { spaceId, environment } = config.contentful;
  if (!spaceId || !environment) {
    throw new Error(
      "Contentful is not configured. Set CONTENTFUL_SPACE_ID and CONTENTFUL_ENVIRONMENT.",
    );
  }

  return `https://${host}/spaces/${spaceId}/environments/${environment}`;
}

function getDeliveryToken() {
  const token = config.contentful.usePreviewApi
    ? config.contentful.previewToken
    : config.contentful.deliveryToken;

  if (!token) {
    throw new Error(
      "Missing Contentful token. Set CONTENTFUL_DELIVERY_TOKEN (and CONTENTFUL_PREVIEW_TOKEN for preview mode).",
    );
  }

  return token;
}

export async function getContentfulContentTypeIds(): Promise<string[]> {
  const baseUrl = getBaseUrl();
  const token = getDeliveryToken();
  const response = await fetch(`${baseUrl}/content_types`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(
      `Contentful content type lookup failed (${response.status}): ${reason || "Unknown error"}`,
    );
  }

  const data = (await response.json()) as {
    items?: Array<{ sys?: { id?: string } }>;
  };

  return (data.items ?? [])
    .map((item) => item.sys?.id)
    .filter((id): id is string => Boolean(id));
}

function toSearchParams(query: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  return params;
}

export async function fetchContentfulEntries<TFields>(
  contentType: string,
  query: Record<string, QueryValue> = {},
): Promise<ContentfulCollection<TFields>> {
  const baseUrl = getBaseUrl();
  const token = getDeliveryToken();

  const params = toSearchParams({
    content_type: contentType,
    include: 2,
    limit: 100,
    ...query,
  });

  const response = await fetch(`${baseUrl}/entries?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 900, tags: ["contentful", contentType] },
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(
      `Contentful request failed (${response.status}): ${reason || "Unknown error"}`,
    );
  }

  return (await response.json()) as ContentfulCollection<TFields>;
}

export async function fetchContentfulEntryById<
  TFields = Record<string, unknown>,
>(entryId: string): Promise<{ sys: Record<string, unknown>; fields: TFields }> {
  const baseUrl = getBaseUrl();
  const token = getDeliveryToken();

  const response = await fetch(`${baseUrl}/entries/${entryId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(
      `Contentful entry lookup failed (${response.status}): ${reason || "Unknown error"}`,
    );
  }

  return (await response.json()) as {
    sys: Record<string, unknown>;
    fields: TFields;
  };
}

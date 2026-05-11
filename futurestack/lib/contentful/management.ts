import { config } from "@/lib/config";

const CONTENTFUL_MANAGEMENT_HOST = "https://api.contentful.com";
const CONTENTFUL_MGMT_CONTENT_TYPE =
  "application/vnd.contentful.management.v1+json";
const DEFAULT_LOCALE = process.env.CONTENTFUL_DEFAULT_LOCALE || "en-US";

type EntryFields = Record<string, unknown>;

interface ContentfulMgmtEntry {
  sys: {
    id: string;
    version: number;
  };
}

function requireManagementConfig() {
  if (!config.contentful.spaceId) {
    throw new Error("Missing CONTENTFUL_SPACE_ID");
  }
  if (!config.contentful.environment) {
    throw new Error(
      "Missing CONTENTFUL_ENVIRONMENT or CONTENTFUL_ENVIRONMENT_ID",
    );
  }
  if (!config.contentful.managementToken) {
    throw new Error("Missing CONTENTFUL_MANAGEMENT_TOKEN");
  }
}

async function managementRequest(path: string, init?: RequestInit) {
  requireManagementConfig();
  const response = await fetch(`${CONTENTFUL_MANAGEMENT_HOST}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.contentful.managementToken}`,
      "Content-Type": CONTENTFUL_MGMT_CONTENT_TYPE,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(
      `Contentful Management request failed (${response.status}): ${reason || "Unknown error"}`,
    );
  }

  return response;
}

function environmentBasePath() {
  return `/spaces/${config.contentful.spaceId}/environments/${config.contentful.environment}`;
}

function localizeFields(fields: EntryFields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      {
        [DEFAULT_LOCALE]: value,
      },
    ]),
  );
}

export async function findEntryBySlug(contentType: string, slug: string) {
  const params = new URLSearchParams({
    content_type: contentType,
    "fields.slug": slug,
    limit: "1",
  });
  const path = `${environmentBasePath()}/entries?${params.toString()}`;
  const response = await managementRequest(path, { method: "GET" });
  const data = (await response.json()) as { items?: ContentfulMgmtEntry[] };
  return data.items?.[0] ?? null;
}

export async function upsertEntryBySlug(options: {
  contentType: string;
  slug: string;
  fields: EntryFields;
  publish?: boolean;
  dryRun?: boolean;
}) {
  const { contentType, slug, fields, publish = true, dryRun = false } = options;

  if (dryRun) {
    return {
      entryId: null,
      slug,
      contentType,
      action: "would-create-or-update",
      published: publish ? "would-publish" : "skipped",
    };
  }

  const existing = await findEntryBySlug(contentType, slug);
  const localizedFields = localizeFields(fields);

  const basePath = `${environmentBasePath()}/entries`;
  let entry: ContentfulMgmtEntry;

  if (existing) {
    const response = await managementRequest(`${basePath}/${existing.sys.id}`, {
      method: "PUT",
      headers: {
        "X-Contentful-Version": String(existing.sys.version),
      },
      body: JSON.stringify({
        fields: localizedFields,
      }),
    });
    entry = (await response.json()) as ContentfulMgmtEntry;
  } else {
    const response = await managementRequest(basePath, {
      method: "POST",
      headers: {
        "X-Contentful-Content-Type": contentType,
      },
      body: JSON.stringify({
        fields: localizedFields,
      }),
    });
    entry = (await response.json()) as ContentfulMgmtEntry;
  }

  if (publish) {
    await managementRequest(`${basePath}/${entry.sys.id}/published`, {
      method: "PUT",
      headers: {
        "X-Contentful-Version": String(entry.sys.version),
      },
      body: JSON.stringify({}),
    });
  }

  return {
    entryId: entry.sys.id,
    slug,
    contentType,
    action: existing ? "updated" : "created",
    published: publish ? "published" : "skipped",
  };
}

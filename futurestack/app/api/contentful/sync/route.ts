import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchContentfulEntryById } from "@/lib/contentful/client";

function isAuthorized(req: Request) {
  const expected = process.env.CONTENTFUL_WEBHOOK_SECRET;
  if (!expected) return true;
  const provided = req.headers.get("x-futurestack-webhook-secret");
  return provided === expected;
}

type WebhookPayload = {
  sys?: {
    id?: string;
    contentType?: {
      sys?: {
        id?: string;
      };
    };
  };
  fields?: Record<string, unknown>;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readLocalized(
  fields: Record<string, unknown> | undefined,
  key: string,
): unknown {
  const raw = fields?.[key];
  if (raw === undefined || raw === null) return undefined;
  const localized = asObject(raw);
  if (!localized) return raw;

  if ("en-US" in localized) return localized["en-US"];
  const first = Object.values(localized)[0];
  return first;
}

function toStringValue(value: unknown) {
  if (value === undefined || value === null) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function inferAction(topic: string) {
  const normalized = topic.toLowerCase();
  if (normalized.includes("delete")) return "delete";
  if (normalized.includes("unpublish")) return "unpublish";
  if (normalized.includes("publish")) return "publish";
  return "unknown";
}

async function resolveCategoryId(categorySlug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function upsertWithFallback(
  table: "tools" | "articles",
  payloads: Array<Record<string, unknown>>,
  onConflict: string,
) {
  const supabase = createAdminClient();
  let lastError: string | null = null;

  for (const payload of payloads) {
    const { error } = await supabase
      .from(table)
      .upsert(payload, { onConflict });
    if (!error) return;
    lastError = error.message;
  }

  throw new Error(lastError ?? `Upsert failed for ${table}`);
}

async function upsertTool(
  fields: Record<string, unknown>,
  isPublished: boolean,
) {
  const name = toStringValue(readLocalized(fields, "name"));
  const slug = toStringValue(readLocalized(fields, "slug"));
  const tagline = toStringValue(readLocalized(fields, "tagline"));
  const description = toStringValue(readLocalized(fields, "description"));
  const websiteUrl = toStringValue(readLocalized(fields, "websiteUrl"));
  const category =
    toStringValue(readLocalized(fields, "categorySlug")) || "productivity";
  const subcategorySlugs = toStringArray(
    readLocalized(fields, "subcategorySlugs"),
  );
  const tags = toStringArray(readLocalized(fields, "tags"));
  const pricingModel = toStringValue(readLocalized(fields, "pricingModel"));
  const startingPriceRaw = readLocalized(fields, "startingPrice");
  const freeTierRaw = readLocalized(fields, "freeTier");
  const verifiedRaw = readLocalized(fields, "verified");

  if (!name || !slug) {
    throw new Error("Tool sync failed: missing required field(s) name/slug");
  }

  const shared = {
    name,
    slug,
    tagline,
    description,
    category,
    status: isPublished ? "active" : "inactive",
  };

  const payloads = [
    {
      ...shared,
      website_url: websiteUrl,
      pricing_type:
        pricingModel || ((freeTierRaw as boolean) ? "freemium" : "paid"),
      metadata: {
        tags,
        subcategorySlugs,
        startingPrice: startingPriceRaw,
        freeTier: Boolean(freeTierRaw),
        verified: Boolean(verifiedRaw),
        source: "contentful-sync",
      },
    },
    {
      ...shared,
      short_description: tagline || description,
      website: websiteUrl,
      subcategory: subcategorySlugs[0] ?? null,
      tags,
      pricing_model:
        pricingModel || ((freeTierRaw as boolean) ? "freemium" : "paid"),
      pricing_details:
        typeof startingPriceRaw === "number"
          ? [{ startingPrice: startingPriceRaw }]
          : [],
      is_verified: Boolean(verifiedRaw),
      africa_friendly: true,
    },
    {
      ...shared,
      website_url: websiteUrl,
    },
  ];

  await upsertWithFallback("tools", payloads, "slug");

  return {
    table: "tools",
    slug,
    action: isPublished ? "upserted" : "archived",
  };
}

async function upsertArticle(
  fields: Record<string, unknown>,
  isPublished: boolean,
) {
  const title = toStringValue(readLocalized(fields, "title"));
  const slug = toStringValue(readLocalized(fields, "slug"));
  const excerpt = toStringValue(readLocalized(fields, "excerpt"));
  const body = readLocalized(fields, "body");
  const content = toStringValue(body);
  const tags = toStringArray(readLocalized(fields, "tags"));
  const publishedAt =
    toStringValue(readLocalized(fields, "publishedAt")) ||
    toStringValue(readLocalized(fields, "publishDate")) ||
    new Date().toISOString();
  const readingTimeRaw = readLocalized(fields, "readingTime");

  if (!title || !slug) {
    throw new Error(
      "Article sync failed: missing required field(s) title/slug",
    );
  }

  const categorySlug =
    toStringValue(readLocalized(fields, "categorySlug")) || "ai-tools";
  const categoryId = await resolveCategoryId(categorySlug);

  const payloads = [
    {
      title,
      slug,
      excerpt,
      content,
      tags,
      category_id: categoryId,
      status: isPublished ? "published" : "draft",
      is_featured: false,
      is_ai_generated: false,
      is_premium: false,
      is_breaking: false,
      reading_time:
        typeof readingTimeRaw === "number"
          ? readingTimeRaw
          : Math.max(1, Math.ceil((content.split(/\s+/).length || 200) / 200)),
      word_count: content.split(/\s+/).length,
      seo_title: title,
      seo_description: excerpt || title,
      published_at: publishedAt,
    },
    {
      title,
      slug,
      excerpt,
      content,
      tags,
      status: isPublished ? "published" : "draft",
      reading_time:
        typeof readingTimeRaw === "number"
          ? readingTimeRaw
          : Math.max(1, Math.ceil((content.split(/\s+/).length || 200) / 200)),
      published_at: publishedAt,
    },
    {
      title,
      slug,
      content,
      status: isPublished ? "published" : "draft",
    },
  ];

  await upsertWithFallback("articles", payloads, "slug");

  return {
    table: "articles",
    slug,
    action: isPublished ? "upserted" : "drafted",
  };
}

async function archiveOrDeleteBySlug(
  contentType: string,
  slug: string,
  isDelete: boolean,
) {
  const supabase = createAdminClient();
  if (!slug) {
    throw new Error(
      "Missing slug in webhook payload for unpublish/delete operation",
    );
  }

  if (contentType === "tool") {
    if (isDelete) {
      const { error } = await supabase.from("tools").delete().eq("slug", slug);
      if (error) throw new Error(`Tool delete failed: ${error.message}`);
      return { table: "tools", slug, action: "deleted" };
    }
    const { error } = await supabase
      .from("tools")
      .update({ status: "inactive" })
      .eq("slug", slug);
    if (error) throw new Error(`Tool archive failed: ${error.message}`);
    return { table: "tools", slug, action: "archived" };
  }

  if (contentType === "newsArticle") {
    if (isDelete) {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("slug", slug);
      if (error) throw new Error(`Article delete failed: ${error.message}`);
      return { table: "articles", slug, action: "deleted" };
    }
    const { error } = await supabase
      .from("articles")
      .update({ status: "draft" })
      .eq("slug", slug);
    if (error) throw new Error(`Article unpublish failed: ${error.message}`);
    return { table: "articles", slug, action: "drafted" };
  }

  return { skipped: true, reason: `Unsupported content type: ${contentType}` };
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized webhook request" },
        { status: 401 },
      );
    }

    const topic = req.headers.get("x-contentful-topic") ?? "unknown";
    const action = inferAction(topic);
    const payload = (await req.json()) as WebhookPayload;
    const entityId = payload.sys?.id ?? null;
    let contentType = payload.sys?.contentType?.sys?.id ?? "";
    let fields = payload.fields;

    if (action === "publish" && entityId && (!contentType || !fields)) {
      const entry = await fetchContentfulEntryById(entityId);
      const sys = asObject(entry.sys);
      const contentTypeNode = asObject(sys?.contentType);
      const contentTypeSys = asObject(contentTypeNode?.sys);
      contentType = String(contentTypeSys?.id ?? contentType);
      fields = entry.fields;
    }

    const slug = toStringValue(readLocalized(fields, "slug"));
    let result: Record<string, unknown>;

    if (action === "delete") {
      result = await archiveOrDeleteBySlug(contentType, slug, true);
    } else if (action === "unpublish") {
      result = await archiveOrDeleteBySlug(contentType, slug, false);
    } else if (action === "publish") {
      if (contentType === "tool") {
        result = await upsertTool(fields ?? {}, true);
      } else if (contentType === "newsArticle") {
        result = await upsertArticle(fields ?? {}, true);
      } else {
        result = {
          skipped: true,
          reason: `Unsupported content type for publish: ${contentType || "unknown"}`,
        };
      }
    } else {
      result = { skipped: true, reason: `Unsupported webhook topic: ${topic}` };
    }

    return NextResponse.json({
      ok: true,
      topic,
      action,
      contentType,
      entityId,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Webhook sync failed",
      },
      { status: 500 },
    );
  }
}

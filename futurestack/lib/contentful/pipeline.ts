import { upsertEntryBySlug } from "@/lib/contentful/management";
import { getResolvedContentTypes } from "@/lib/contentful/content-types";

type AnyObject = Record<string, unknown>;

export interface PipelineOptions<TInput extends AnyObject> {
  dryRun?: boolean;
  publish?: boolean;
  items: TInput[];
}

export interface PipelineResult {
  ok: boolean;
  contentType: string;
  dryRun: boolean;
  publish: boolean;
  totals: {
    received: number;
    normalized: number;
    valid: number;
    succeeded: number;
    failed: number;
  };
  results: Array<Record<string, unknown>>;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function asStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeTool(item: AnyObject) {
  const name = String(item.name ?? "").trim();
  const slug = String(item.slug ?? "").trim() || toSlug(name);
  const description = String(item.description ?? item.tagline ?? "").trim();
  const websiteUrl = String(item.websiteUrl ?? item.url ?? "").trim();
  const categorySlug = String(item.categorySlug ?? "productivity").trim();

  return {
    name,
    slug,
    tagline: String(item.tagline ?? "").trim(),
    description,
    websiteUrl,
    categorySlug,
    tags: asStringList(item.tags),
    subcategorySlugs: asStringList(item.subcategorySlugs),
    pricingModel: String(item.pricingModel ?? "").trim() || undefined,
    startingPrice:
      typeof item.startingPrice === "number" ? item.startingPrice : undefined,
    freeTier: typeof item.freeTier === "boolean" ? item.freeTier : undefined,
    verified: typeof item.verified === "boolean" ? item.verified : undefined,
    futurestackScore:
      typeof item.futurestackScore === "number"
        ? item.futurestackScore
        : undefined,
    status: String(item.status ?? "published").trim(),
  };
}

function normalizeNews(item: AnyObject) {
  const title = String(item.title ?? "").trim();
  const slug = String(item.slug ?? "").trim() || toSlug(title);
  const body = String(item.body ?? item.content ?? "").trim();
  const excerpt = String(item.excerpt ?? "").trim();

  return {
    title,
    slug,
    excerpt,
    body,
    tags: asStringList(item.tags),
    publishedAt:
      String(item.publishedAt ?? item.publishDate ?? "").trim() || undefined,
    status: String(item.status ?? "published").trim(),
    readingTime:
      typeof item.readingTime === "number" ? item.readingTime : undefined,
  };
}

function validateTool(item: ReturnType<typeof normalizeTool>) {
  const errors: string[] = [];
  if (!item.name) errors.push("name is required");
  if (!item.slug) errors.push("slug is required");
  if (!item.description) errors.push("description is required");
  if (!item.websiteUrl) errors.push("websiteUrl/url is required");
  return errors;
}

function validateNews(item: ReturnType<typeof normalizeNews>) {
  const errors: string[] = [];
  if (!item.title) errors.push("title is required");
  if (!item.slug) errors.push("slug is required");
  if (!item.body) errors.push("body/content is required");
  return errors;
}

async function runUpserts(
  contentType: string,
  normalizedItems: AnyObject[],
  options: { dryRun: boolean; publish: boolean },
) {
  const results: Array<Record<string, unknown>> = [];

  for (const item of normalizedItems) {
    const slug = String(item.slug ?? "");
    try {
      const result = await upsertEntryBySlug({
        contentType,
        slug,
        fields: item,
        publish: options.publish,
        dryRun: options.dryRun,
      });
      results.push({
        ok: true,
        ...result,
      });
    } catch (error) {
      results.push({
        ok: false,
        slug,
        contentType,
        error: error instanceof Error ? error.message : "Unknown upsert error",
      });
    }
  }

  return results;
}

function summarize(
  contentType: string,
  receivedCount: number,
  normalizedCount: number,
  validCount: number,
  results: Array<Record<string, unknown>>,
  dryRun: boolean,
  publish: boolean,
): PipelineResult {
  const failed = results.filter((result) => result.ok === false).length;
  const succeeded = results.length - failed;
  return {
    ok: failed === 0,
    contentType,
    dryRun,
    publish,
    totals: {
      received: receivedCount,
      normalized: normalizedCount,
      valid: validCount,
      succeeded,
      failed,
    },
    results,
  };
}

export async function runToolPipeline(
  options: PipelineOptions<AnyObject>,
): Promise<PipelineResult> {
  const dryRun = options.dryRun ?? true;
  const publish = options.publish ?? !dryRun;
  const { tool: contentType } = await getResolvedContentTypes();
  if (!contentType) {
    throw new Error("tool/tool-2 content type not found in Contentful");
  }

  const normalized = options.items.map(normalizeTool);

  const validItems: AnyObject[] = [];
  const results: Array<Record<string, unknown>> = [];
  for (const item of normalized) {
    const errors = validateTool(item);
    if (errors.length > 0) {
      results.push({
        ok: false,
        contentType,
        slug: item.slug,
        errors,
      });
      continue;
    }
    validItems.push(item);
  }

  const upsertResults = await runUpserts(contentType, validItems, {
    dryRun,
    publish,
  });
  return summarize(
    contentType,
    options.items.length,
    normalized.length,
    validItems.length,
    [...results, ...upsertResults],
    dryRun,
    publish,
  );
}

export async function runNewsPipeline(
  options: PipelineOptions<AnyObject>,
): Promise<PipelineResult> {
  const dryRun = options.dryRun ?? true;
  const publish = options.publish ?? !dryRun;
  const { news: contentType } = await getResolvedContentTypes();
  if (!contentType) {
    throw new Error("newsArticle/newsArticle-2 content type not found in Contentful");
  }

  const normalized = options.items.map(normalizeNews);

  const validItems: AnyObject[] = [];
  const results: Array<Record<string, unknown>> = [];
  for (const item of normalized) {
    const errors = validateNews(item);
    if (errors.length > 0) {
      results.push({
        ok: false,
        contentType,
        slug: item.slug,
        errors,
      });
      continue;
    }
    validItems.push(item);
  }

  const upsertResults = await runUpserts(contentType, validItems, {
    dryRun,
    publish,
  });
  return summarize(
    contentType,
    options.items.length,
    normalized.length,
    validItems.length,
    [...results, ...upsertResults],
    dryRun,
    publish,
  );
}

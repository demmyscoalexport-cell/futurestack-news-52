import { NextResponse } from "next/server";
import { getContentfulNews, getContentfulTools } from "@/lib/contentful/service";
import { getContentfulContentTypeIds } from "@/lib/contentful/client";
import { db } from "@/lib/db";

/**
 * GET  /api/contentful/pull  — Preview: show what's available in Contentful
 * POST /api/contentful/pull  — Sync: pull Contentful content → write to DB
 *
 * Add header  x-discova-sync-secret: <CONTENTFUL_WEBHOOK_SECRET>  for auth.
 */

function isAuthorized(req: Request) {
  const expected = process.env.CONTENTFUL_WEBHOOK_SECRET;
  if (!expected) return true;
  const provided =
    req.headers.get("x-discova-sync-secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  return provided === expected;
}

async function resolveCategoryId(slug: string): Promise<string | null> {
  try {
    const { rows } = await db.query(
      `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function syncArticlesToDb(
  articles: Awaited<ReturnType<typeof getContentfulNews>>,
) {
  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      const categoryId = await resolveCategoryId("ai-tools");
      const wordCount = (article.content ?? "").split(/\s+/).length;
      const readingTime = article.readTime ?? Math.max(1, Math.ceil(wordCount / 200));

      await db.query(
        `INSERT INTO articles
           (slug, title, excerpt, content, tags, status, is_featured,
            is_ai_generated, reading_time, word_count, published_at, category_id)
         VALUES ($1,$2,$3,$4,$5,'published',false,false,$6,$7,$8,$9)
         ON CONFLICT (slug) DO UPDATE SET
           title        = EXCLUDED.title,
           excerpt      = EXCLUDED.excerpt,
           content      = EXCLUDED.content,
           tags         = EXCLUDED.tags,
           reading_time = EXCLUDED.reading_time,
           published_at = EXCLUDED.published_at,
           updated_at   = NOW()`,
        [
          article.slug,
          article.title,
          article.excerpt ?? "",
          article.content ?? "",
          article.tags ?? [],
          readingTime,
          wordCount,
          article.publishedAt ?? new Date().toISOString(),
          categoryId,
        ],
      );
      succeeded++;
    } catch (e) {
      failed++;
      errors.push(`${article.slug}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { succeeded, failed, errors };
}

async function syncToolsToDb(
  tools: Awaited<ReturnType<typeof getContentfulTools>>,
) {
  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const tool of tools) {
    try {
      await db.query(
        `INSERT INTO tools
           (slug, name, tagline, description, logo, website_url, category,
            status, africa_friendly, has_free, pricing_model, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active',true,$8,$9,$10)
         ON CONFLICT (slug) DO UPDATE SET
           name          = EXCLUDED.name,
           tagline       = EXCLUDED.tagline,
           description   = EXCLUDED.description,
           logo          = EXCLUDED.logo,
           website_url   = EXCLUDED.website_url,
           category      = EXCLUDED.category,
           has_free      = EXCLUDED.has_free,
           pricing_model = EXCLUDED.pricing_model,
           tags          = EXCLUDED.tags,
           updated_at    = NOW()`,
        [
          tool.slug,
          tool.name,
          tool.shortDescription ?? "",
          tool.shortDescription ?? "",
          tool.logo ?? "",
          tool.website ?? "",
          tool.category ?? "productivity",
          tool.pricing?.hasFree ?? false,
          tool.pricing?.plans?.[0]?.name?.toLowerCase() ?? "freemium",
          tool.bestFor ?? [],
        ],
      );
      succeeded++;
    } catch (e) {
      failed++;
      errors.push(`${tool.slug}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { succeeded, failed, errors };
}

// ── GET: preview what Contentful has ──────────────────────────────────────────

export async function GET() {
  try {
    const contentTypeIds = await getContentfulContentTypeIds();
    const hasToolType = contentTypeIds.includes("tool");
    const hasNewsType = contentTypeIds.includes("newsArticle");

    const [tools, news] = await Promise.all([
      hasToolType
        ? getContentfulTools({ status: "published", limit: 10 })
        : Promise.resolve([]),
      hasNewsType
        ? getContentfulNews({ status: "published", limit: 10 })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      ok: true,
      message: "Use POST to actually sync these into the database.",
      toolsCount: tools.length,
      newsCount: news.length,
      sampleToolSlugs: tools.slice(0, 3).map((t) => t.slug),
      sampleNewsSlugs: news.slice(0, 3).map((a) => a.slug),
      availableContentTypes: contentTypeIds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to pull Contentful data",
      },
      { status: 500 },
    );
  }
}

// ── POST: actually sync Contentful → DB ──────────────────────────────────────

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      syncNews?: boolean;
      syncTools?: boolean;
      limit?: number;
    };

    const syncNews = body.syncNews !== false;
    const syncTools = body.syncTools !== false;
    const limit = body.limit ?? 50;

    const contentTypeIds = await getContentfulContentTypeIds();
    const results: Record<string, unknown> = {};

    if (syncNews && contentTypeIds.includes("newsArticle")) {
      const articles = await getContentfulNews({ status: "published", limit });
      results.articles = await syncArticlesToDb(articles);
      (results.articles as Record<string, unknown>).total = articles.length;
    } else if (syncNews) {
      results.articles = { skipped: true, reason: "newsArticle content type not found in Contentful" };
    }

    if (syncTools && contentTypeIds.includes("tool")) {
      const tools = await getContentfulTools({ status: "published", limit });
      results.tools = await syncToolsToDb(tools);
      (results.tools as Record<string, unknown>).total = tools.length;
    } else if (syncTools) {
      results.tools = { skipped: true, reason: "tool content type not found in Contentful" };
    }

    return NextResponse.json({
      ok: true,
      message: "Contentful → Database sync complete",
      results,
      availableContentTypes: contentTypeIds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
    );
  }
}

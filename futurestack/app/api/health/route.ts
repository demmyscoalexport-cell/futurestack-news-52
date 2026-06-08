/**
 * GET /api/health
 *
 * Public health check — used by uptime monitors (UptimeRobot, BetterUptime, etc.)
 * Returns HTTP 200 when healthy, HTTP 503 when degraded.
 */
import { NextResponse } from "next/server";
import { db, DB_SOURCE } from "@/lib/db";
import { getProductHuntToken } from "@/lib/producthunt";
import { config } from "@/lib/config";
import { shouldUseSupabaseRest } from "@/lib/static-db-fallback";
import { getSupabaseAdmin } from "@/lib/supabase/db";

export const dynamic = "force-dynamic";

async function readCatalogCounts() {
  if (shouldUseSupabaseRest()) {
    const supa = getSupabaseAdmin();
    const [tools, articles, stacks] = await Promise.all([
      supa.from("tools").select("id", { count: "exact", head: true }).eq("status", "active"),
      supa.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
      supa.from("stacks").select("id", { count: "exact", head: true }),
    ]);
    return {
      source: "supabase-rest",
      activeTools: tools.count ?? 0,
      publishedArticles: articles.count ?? 0,
      stacks: stacks.count ?? 0,
    };
  }

  const [toolsRes, articlesRes, stacksRes] = await Promise.all([
    db.query(`SELECT COUNT(*) FILTER (WHERE status='active')::int AS active FROM tools`),
    db.query(`SELECT COUNT(*) FILTER (WHERE status='published')::int AS published FROM articles`),
    db.query(`SELECT COUNT(*)::int AS total FROM stacks`),
  ]);

  return {
    source: DB_SOURCE,
    activeTools: toolsRes.rows[0]?.active ?? 0,
    publishedArticles: articlesRes.rows[0]?.published ?? 0,
    stacks: stacksRes.rows[0]?.total ?? 0,
  };
}

export async function GET() {
  const start = Date.now();
  const checks: Record<string, unknown> = {};
  let ok = true;

  try {
    const counts = await readCatalogCounts();
    checks.database = { ok: true, ...counts };
  } catch (e) {
    checks.database = { ok: false, error: (e as Error).message };
    ok = false;
  }

  checks.clerk = {
    configured: config.clerk.isConfigured,
    webhook: Boolean(config.clerk.webhookSecret),
  };

  checks.supabase = {
    configured: config.supabase.isConfigured,
    serviceRole: Boolean(config.supabase.serviceRoleKey),
  };

  checks.contentful = {
    configured: config.contentful.isConfigured,
    webhook: Boolean(config.contentful.webhookSecret),
    preview: config.contentful.usePreviewApi,
  };

  checks.gnews = {
    configured: Boolean(process.env.GNEWS_API_KEY),
  };

  checks.producthunt = {
    configured: Boolean(getProductHuntToken()),
  };

  checks.ai = {
    anthropic: Boolean(
      process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    ),
    imageGen: Boolean(process.env.WAVESPEED_API_KEY),
    cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
  };

  checks.stripe = {
    configured: Boolean(process.env.STRIPE_SECRET_KEY),
  };

  checks.restMode = shouldUseSupabaseRest();

  const responseTime = Date.now() - start;

  return NextResponse.json(
    {
      ok,
      status: ok ? "healthy" : "degraded",
      platform: "DISCOVA",
      version: "2.0.0",
      environment: process.env.NODE_ENV ?? "development",
      responseTimeMs: responseTime,
      checkedAt: new Date().toISOString(),
      checks,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-DISCOVA-Status": ok ? "healthy" : "degraded",
      },
    },
  );
}

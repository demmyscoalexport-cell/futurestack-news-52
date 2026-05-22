/**
 * GET /api/health
 *
 * Public health check — used by uptime monitors (UptimeRobot, BetterUptime, etc.)
 * Returns HTTP 200 when healthy, HTTP 503 when degraded.
 *
 * Safe to call frequently — all queries are lightweight COUNT(*).
 */
import { NextResponse } from "next/server";
import { db, DB_SOURCE } from "@/lib/db";
import { getProductHuntToken } from "@/lib/producthunt";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, unknown> = {};
  let ok = true;

  // ── Database ────────────────────────────────────────────────────────────────
  try {
    const [toolsRes, articlesRes, stacksRes] = await Promise.all([
      db.query(`SELECT COUNT(*) FILTER (WHERE status='active')::int AS active FROM tools`),
      db.query(`SELECT COUNT(*) FILTER (WHERE status='published')::int AS published FROM articles`),
      db.query(`SELECT COUNT(*)::int AS total FROM stacks`),
    ]);

    checks.database = {
      ok: true,
      source: DB_SOURCE,
      activeTools: toolsRes.rows[0]?.active ?? 0,
      publishedArticles: articlesRes.rows[0]?.published ?? 0,
      stacks: stacksRes.rows[0]?.total ?? 0,
    };
  } catch (e) {
    checks.database = { ok: false, error: (e as Error).message };
    ok = false;
  }

  // ── Content sources ─────────────────────────────────────────────────────────
  checks.contentful = {
    configured: Boolean(config.contentful.spaceId && config.contentful.deliveryToken),
  };

  checks.gnews = {
    configured: Boolean(process.env.GNEWS_API_KEY),
  };

  checks.producthunt = {
    configured: Boolean(getProductHuntToken()),
  };

  // ── AI / Image generation ───────────────────────────────────────────────────
  checks.ai = {
    anthropic: Boolean(
      process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    ),
    imageGen: Boolean(process.env.WAVESPEED_API_KEY),
    cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
  };

  // ── Payments ────────────────────────────────────────────────────────────────
  checks.stripe = {
    configured: Boolean(process.env.STRIPE_SECRET_KEY),
  };

  // ── Summary ─────────────────────────────────────────────────────────────────
  const responseTime = Date.now() - start;

  const payload = {
    ok,
    status: ok ? "healthy" : "degraded",
    platform: "DISCOVA",
    version: "2.0.0",
    environment: process.env.NODE_ENV ?? "development",
    responseTimeMs: responseTime,
    checkedAt: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(payload, {
    status: ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "X-DISCOVA-Status": ok ? "healthy" : "degraded",
    },
  });
}

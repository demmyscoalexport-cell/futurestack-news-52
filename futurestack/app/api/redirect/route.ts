/**
 * GET /api/redirect?tool=<slug>
 *
 * Affiliate redirect endpoint with click tracking.
 *
 * 1. Looks up the tool by slug
 * 2. Records a click in affiliate_clicks (non-blocking)
 * 3. Redirects to the affiliate URL or tool website
 *
 * This is the internal handler for getdiscova.com/redirect?tool=...&affid=...
 * which points to this endpoint in production.
 *
 * Analytics tracked per click:
 *   - tool_id, tool_slug, referrer, user_agent, country (from CF header), timestamp
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const toolSlug = searchParams.get("tool");
  const affId = searchParams.get("affid") ?? "discova";

  if (!toolSlug) {
    return NextResponse.redirect("/", { status: 302 });
  }

  // ── 1. Look up tool + affiliate link ────────────────────────────────────────
  let destination = "/";
  let toolId: string | null = null;

  try {
    const { rows } = await db.query(
      `SELECT t.id, t.website_url, al.affiliate_url
       FROM tools t
       LEFT JOIN affiliate_links al ON al.tool_id = t.id AND al.is_active = true
       WHERE t.slug = $1
       LIMIT 1`,
      [toolSlug],
    );

    if (rows[0]) {
      toolId = rows[0].id as string;
      // Prefer affiliate URL if set, otherwise use website_url with UTM tags
      destination =
        rows[0].affiliate_url ||
        appendUtm(rows[0].website_url as string, affId);
    } else {
      // Tool not found — redirect to DISCOVA homepage with search hint
      destination = `/?q=${encodeURIComponent(toolSlug)}`;
    }
  } catch {
    // DB error — still redirect to homepage
    destination = "/";
  }

  // ── 2. Track the click (fire-and-forget, non-blocking) ───────────────────
  trackClick(toolId, toolSlug, req, affId).catch(() => null);

  // ── 3. Redirect ─────────────────────────────────────────────────────────
  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      // Prevent caching of redirect responses
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function appendUtm(url: string, source: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("ref", "discova");
    u.searchParams.set("utm_source", "discova");
    u.searchParams.set("utm_medium", "directory");
    u.searchParams.set("utm_campaign", "tool-discovery");
    if (source !== "discova") u.searchParams.set("utm_content", source);
    return u.toString();
  } catch {
    return url;
  }
}

async function trackClick(
  toolId: string | null,
  toolSlug: string,
  req: NextRequest,
  affId: string,
): Promise<void> {
  try {
    const referrer = req.headers.get("referer") ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;
    // Cloudflare country header (available on Replit deployed apps)
    const country = req.headers.get("cf-ipcountry") ?? null;

    await db.query(
      `INSERT INTO affiliate_clicks (
         tool_id, referrer, user_agent, country, aff_id, clicked_at
       ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [toolId, referrer, userAgent?.slice(0, 500) ?? null, country, affId],
    );
  } catch {
    // Silently ignore — tracking should never break the redirect
  }
}

// ── Analytics endpoint ────────────────────────────────────────────────────────
// GET /api/redirect/stats → top clicked tools

export async function POST(req: NextRequest) {
  // Internal stats endpoint — returns click analytics
  const { searchParams } = new URL(req.url);
  if (searchParams.get("stats") !== "1") {
    return NextResponse.json({ error: "Use GET for redirects" }, { status: 400 });
  }

  try {
    const { rows } = await db.query(`
      SELECT
        t.name,
        t.slug,
        COUNT(ac.id)::int AS total_clicks,
        COUNT(DISTINCT ac.country) AS countries,
        MAX(ac.clicked_at) AS last_clicked
      FROM affiliate_clicks ac
      JOIN tools t ON t.id = ac.tool_id
      GROUP BY t.id, t.name, t.slug
      ORDER BY total_clicks DESC
      LIMIT 50
    `);

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}

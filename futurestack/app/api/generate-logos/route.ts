import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/generate-logos
 * Bulk-generates AI logos for tools that are still using Clearbit/avatar logos.
 * Calls /api/generate-image for each tool internally.
 * Body: { limit?: number; force?: boolean; toolIds?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const { limit = 5, force = false, toolIds } = await req.json().catch(() => ({}));

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

    let tools: { id: string; name: string; slug: string; logo: string | null }[] = [];

    if (toolIds?.length) {
      const { rows } = await db.query(
        `SELECT id, name, slug, logo FROM tools WHERE id = ANY($1) AND status = 'active'`,
        [toolIds],
      );
      tools = rows;
    } else if (force) {
      const { rows } = await db.query(
        `SELECT id, name, slug, logo FROM tools WHERE status = 'active' ORDER BY is_featured DESC, review_count DESC LIMIT $1`,
        [limit],
      );
      tools = rows;
    } else {
      // Only tools without a Cloudinary logo
      const { rows } = await db.query(
        `SELECT id, name, slug, logo FROM tools
         WHERE status = 'active'
         AND (logo IS NULL OR logo NOT LIKE '%cloudinary%')
         ORDER BY is_featured DESC, review_count DESC
         LIMIT $1`,
        [limit],
      );
      tools = rows;
    }

    if (tools.length === 0) {
      return NextResponse.json({ ok: true, message: "All tools already have Cloudinary logos", processed: 0 });
    }

    const results: { name: string; slug: string; url?: string; error?: string }[] = [];

    for (const tool of tools) {
      try {
        const res = await fetch(`${baseUrl}/api/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "tool-logo",
            name: tool.name,
            toolId: tool.id,
          }),
        });

        const data = await res.json();
        if (data.success && data.url) {
          results.push({ name: tool.name, slug: tool.slug, url: data.url });
        } else {
          results.push({ name: tool.name, slug: tool.slug, error: data.error ?? "Unknown error" });
        }
      } catch (err: unknown) {
        results.push({
          name: tool.name,
          slug: tool.slug,
          error: err instanceof Error ? err.message : "Failed",
        });
      }

      // Small delay between generations to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    const succeeded = results.filter((r) => r.url).length;
    const failed = results.filter((r) => r.error).length;

    return NextResponse.json({
      ok: true,
      processed: tools.length,
      succeeded,
      failed,
      results,
    });
  } catch (error: unknown) {
    console.error("[generate-logos]", error);
    return NextResponse.json({ ok: false, error: "Bulk generation failed" }, { status: 500 });
  }
}

// GET /api/generate-logos — see how many tools need logos
export async function GET() {
  const { rows } = await db.query(
    `SELECT
      COUNT(*)::int AS total_active,
      COUNT(*) FILTER (WHERE logo LIKE '%cloudinary%')::int AS has_cloudinary_logo,
      COUNT(*) FILTER (WHERE logo IS NULL OR logo NOT LIKE '%cloudinary%')::int AS needs_logo
     FROM tools WHERE status = 'active'`,
  ).catch(() => ({ rows: [{ total_active: 0, has_cloudinary_logo: 0, needs_logo: 0 }] }));

  return NextResponse.json({
    ok: true,
    stats: rows[0],
    wavespeed: !!process.env.WAVESPEED_API_KEY,
    cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
  });
}

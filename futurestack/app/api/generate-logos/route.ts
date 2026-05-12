import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAndUpload } from "@/lib/image-gen";

/**
 * POST /api/generate-logos
 * Bulk-generates AI logos for tools — calls shared lib directly, no HTTP self-call.
 * Body: { limit?: number; force?: boolean; toolIds?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { limit = 5, force = false, toolIds } = body as {
      limit?: number;
      force?: boolean;
      toolIds?: string[];
    };

    type ToolRow = { id: string; name: string; slug: string; logo: string | null };
    let tools: ToolRow[] = [];

    if (toolIds?.length) {
      const { rows } = await db.query<ToolRow>(
        `SELECT id, name, slug, logo FROM tools WHERE id = ANY($1) AND status = 'active'`,
        [toolIds],
      );
      tools = rows;
    } else if (force) {
      const { rows } = await db.query<ToolRow>(
        `SELECT id, name, slug, logo FROM tools WHERE status = 'active' ORDER BY is_featured DESC, review_count DESC LIMIT $1`,
        [limit],
      );
      tools = rows;
    } else {
      const { rows } = await db.query<ToolRow>(
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
        const { finalUrl } = await generateAndUpload({ type: "tool-logo", name: tool.name });

        if (finalUrl) {
          await db.query(`UPDATE tools SET logo = $1 WHERE id = $2`, [finalUrl, tool.id]);
          results.push({ name: tool.name, slug: tool.slug, url: finalUrl });
        } else {
          results.push({ name: tool.name, slug: tool.slug, error: "Generation failed or timed out" });
        }
      } catch (err: unknown) {
        results.push({
          name: tool.name,
          slug: tool.slug,
          error: err instanceof Error ? err.message : "Failed",
        });
      }

      // Small delay between generations
      await new Promise((r) => setTimeout(r, 300));
    }

    const succeeded = results.filter((r) => r.url).length;
    const failed = results.filter((r) => r.error).length;

    return NextResponse.json({ ok: true, processed: tools.length, succeeded, failed, results });
  } catch (error: unknown) {
    console.error("[generate-logos]", error);
    return NextResponse.json({ ok: false, error: "Bulk generation failed" }, { status: 500 });
  }
}

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

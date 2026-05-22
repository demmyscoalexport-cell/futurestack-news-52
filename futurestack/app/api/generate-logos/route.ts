import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAndUpload } from "@/lib/image-gen";
import { isPostgresConfigured } from "@/lib/static-db-fallback";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/db";

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

    if (isPostgresConfigured()) {
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
    } else if (isSupabaseConfigured()) {
      const supa = getSupabaseAdmin();
      let q = supa
        .from("tools")
        .select("id, name, slug, logo_url")
        .eq("status", "active");

      if (toolIds?.length) q = q.in("id", toolIds);
      else if (!force) q = q.or("logo_url.is.null,logo_url.not.like.%cloudinary%");

      q = q.order("is_featured", { ascending: false }).order("review_count", { ascending: false });
      if (!toolIds?.length) q = q.limit(limit);

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      tools = (data ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        logo: t.logo_url ?? null,
      }));
    } else {
      return NextResponse.json(
        { ok: false, error: "No database configured" },
        { status: 503 },
      );
    }

    if (tools.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "All tools already have Cloudinary logos",
        processed: 0,
      });
    }

    const results: { name: string; slug: string; url?: string; error?: string }[] = [];

    for (const tool of tools) {
      try {
        const { finalUrl } = await generateAndUpload({ type: "tool-logo", name: tool.name });

        if (finalUrl) {
          if (isPostgresConfigured()) {
            await db.query(
              `UPDATE tools SET logo = $1, updated_at = NOW() WHERE id = $2`,
              [finalUrl, tool.id],
            );
          } else {
            const supa = getSupabaseAdmin();
            await supa
              .from("tools")
              .update({ logo_url: finalUrl, updated_at: new Date().toISOString() })
              .eq("id", tool.id);
          }
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
  try {
    if (isPostgresConfigured()) {
      const { rows } = await db.query(
        `SELECT
           COUNT(*)::int AS total_active,
           COUNT(*) FILTER (WHERE logo LIKE '%cloudinary%')::int AS has_cloudinary_logo,
           COUNT(*) FILTER (WHERE logo IS NULL OR logo NOT LIKE '%cloudinary%')::int AS needs_logo
         FROM tools WHERE status = 'active'`,
      );
      return NextResponse.json({
        ok: true,
        stats: rows[0],
        wavespeed: !!process.env.WAVESPEED_API_KEY,
        cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
      });
    }

    const supa = getSupabaseAdmin();
    const { count, error } = await supa
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    if (error) throw error;

    const { count: hasCloudinary } = await supa
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .like("logo_url", "%cloudinary%");

    const total = count ?? 0;
    const cloudCount = hasCloudinary ?? 0;

    return NextResponse.json({
      ok: true,
      stats: {
        total_active: total,
        has_cloudinary_logo: cloudCount,
        needs_logo: total - cloudCount,
      },
      wavespeed: !!process.env.WAVESPEED_API_KEY,
      cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
    });
  } catch {
    return NextResponse.json({
      ok: true,
      stats: { total_active: 0, has_cloudinary_logo: 0, needs_logo: 0 },
      wavespeed: !!process.env.WAVESPEED_API_KEY,
      cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
    });
  }
}

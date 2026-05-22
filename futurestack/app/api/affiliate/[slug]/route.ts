import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // 1. Try Supabase first (has affiliate_links table)
  let destination: string | null = null;
  let toolId: string | null = null;

  try {
    const supabase = createAdminClient();
    const { data: tool } = await supabase
      .from("tools")
      .select("id, website, affiliate_links(affiliate_url, is_active)")
      .eq("slug", slug)
      .single();

    if (tool) {
      toolId = (tool as any).id;
      const links = (tool as any)?.affiliate_links as { affiliate_url: string; is_active: boolean }[] | null;
      const activeLink = links?.find((l) => l.is_active);
      destination = activeLink?.affiliate_url || (tool as any)?.website || null;
    }
  } catch {
    // Supabase unavailable — fall through to local DB
  }

  // 2. Fall back to local PostgreSQL if Supabase gave us nothing
  if (!destination) {
    try {
      const result = await db.query(
        `SELECT id, website_url, website FROM tools WHERE slug = $1 LIMIT 1`,
        [slug],
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        toolId = row.id;
        destination = row.website_url || row.website || null;
      }
    } catch {
      // local DB also failed
    }
  }

  // 3. If we still have nothing useful, send to the tools listing
  if (!destination || destination === "https://getdiscova.com") {
    destination = "/tools";
  }

  // Fire-and-forget click tracking (best effort)
  if (toolId) {
    const referrer  = req.headers.get("referer") || null;
    const userAgent = req.headers.get("user-agent") || null;
    const forwarded = req.headers.get("x-forwarded-for");
    const ip        = forwarded ? forwarded.split(",")[0].trim() : null;
    const ipHash    = ip ? Buffer.from(ip).toString("base64").slice(0, 16) : null;
    const country   = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null;

    try {
      const supabase = createAdminClient();
      await supabase.from("affiliate_clicks").insert({
        tool_id: toolId,
        referrer,
        country,
        user_agent: userAgent?.slice(0, 255),
        ip_hash: ipHash,
      });
    } catch {
      // tracking failure is non-fatal
    }
  }

  return NextResponse.redirect(
    destination.startsWith("http") ? destination : `https://${destination}`,
    { status: 302, headers: { "Cache-Control": "no-store" } },
  );
}

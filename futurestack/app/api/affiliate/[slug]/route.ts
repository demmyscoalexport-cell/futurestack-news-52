import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Look up tool + affiliate link in one query
  const { rows } = await db.query(
    `SELECT t.id, t.website_url, t.website, al.affiliate_url
     FROM tools t
     LEFT JOIN affiliate_links al ON al.tool_id = t.id AND al.is_active = true
     WHERE t.slug = $1 LIMIT 1`,
    [slug],
  ).catch(() => ({ rows: [] as { id: string; website_url: string | null; website: string | null; affiliate_url: string | null }[] }));

  const tool = rows[0];
  const destination = tool?.affiliate_url || tool?.website_url || tool?.website || "https://futurestack.news";

  // Fire-and-forget click log (don't block redirect)
  if (tool?.id) {
    const referrer = req.headers.get("referer") || null;
    const userAgent = req.headers.get("user-agent") || null;
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : null;
    const ipHash = ip
      ? Buffer.from(ip).toString("base64").slice(0, 16)
      : null;

    // Best-effort country from Cloudflare header (or similar CDN)
    const country = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null;

    db.query(
      `INSERT INTO affiliate_clicks (tool_id, referrer, country, user_agent, ip_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [tool.id, referrer, country, userAgent?.slice(0, 255), ipHash],
    ).catch(() => {});
  }

  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

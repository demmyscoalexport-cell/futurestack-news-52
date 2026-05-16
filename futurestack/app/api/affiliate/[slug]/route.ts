import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tool } = await supabase
    .from("tools")
    .select("id, website, affiliate_links(affiliate_url, is_active)")
    .eq("slug", slug)
    .single()
    .catch(() => ({ data: null }));

  const links = (tool as any)?.affiliate_links as { affiliate_url: string; is_active: boolean }[] | null;
  const activeLink = links?.find((l) => l.is_active);
  const destination =
    activeLink?.affiliate_url ||
    (tool as any)?.website ||
    "https://discova.africa";

  if ((tool as any)?.id) {
    const referrer  = req.headers.get("referer") || null;
    const userAgent = req.headers.get("user-agent") || null;
    const forwarded = req.headers.get("x-forwarded-for");
    const ip        = forwarded ? forwarded.split(",")[0].trim() : null;
    const ipHash    = ip ? Buffer.from(ip).toString("base64").slice(0, 16) : null;
    const country   = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null;

    supabase.from("affiliate_clicks").insert({
      tool_id:    (tool as any).id,
      referrer,
      country,
      user_agent: userAgent?.slice(0, 255),
      ip_hash:    ipHash,
    }).then(() => {}).catch(() => {});
  }

  return NextResponse.redirect(destination, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}

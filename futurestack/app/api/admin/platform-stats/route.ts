import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const supabase = createAdminClient();

  // Try RPC function first (requires schema-additions.sql to have been run)
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_platform_stats");
  if (!rpcError && rpcData) return NextResponse.json(rpcData);

  // Fallback: fetch counts individually
  const [tools, articles, reviews, profiles, affiliates] = await Promise.all([
    supabase.from("tools").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("affiliate_links").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const [featuredTools, africaTools, publishedArticles] = await Promise.all([
    supabase.from("tools").select("*", { count: "exact", head: true }).eq("featured", true),
    supabase.from("tools").select("*", { count: "exact", head: true }).eq("africa_friendly", true),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "PUBLISHED"),
  ]);

  return NextResponse.json({
    total_tools:        tools.count ?? 0,
    featured_tools:     featuredTools.count ?? 0,
    africa_friendly:    africaTools.count ?? 0,
    total_articles:     articles.count ?? 0,
    published_articles: publishedArticles.count ?? 0,
    total_reviews:      reviews.count ?? 0,
    total_users:        profiles.count ?? 0,
    affiliate_links:    affiliates.count ?? 0,
    total_clicks:       0,
  });
}

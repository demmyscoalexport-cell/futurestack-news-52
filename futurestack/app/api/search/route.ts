import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shouldUseSupabaseRest } from "@/lib/static-db-fallback";
import { supabaseGetTools } from "@/lib/queries/supabase-read";
import { parseSmartSearch } from "@/lib/smart-search";
import { createAdminClient } from "@/lib/supabase/admin";

type SearchArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  href: string;
};

async function searchArticles(searchTerm: string, limit: number): Promise<SearchArticle[]> {
  const like = `%${searchTerm}%`;
  try {
    if (shouldUseSupabaseRest()) {
      const supa = createAdminClient();
      const { data } = await supa
        .from("articles")
        .select("id, title, slug, excerpt")
        .eq("status", "published")
        .or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
        .order("published_at", { ascending: false })
        .limit(limit);
      return (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        href: `/blog/${row.slug}`,
      }));
    }
    const { rows } = await db.query(
      `SELECT id, title, slug, excerpt
       FROM articles
       WHERE status IN ('published', 'PUBLISHED')
         AND (title ILIKE $1 OR excerpt ILIKE $1 OR slug ILIKE $1)
       ORDER BY published_at DESC NULLS LAST
       LIMIT $2`,
      [like, limit],
    );
    return rows.map((row: SearchArticle) => ({
      ...row,
      href: `/blog/${row.slug}`,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const rawQuery = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!rawQuery) {
      return NextResponse.json({ tools: [], articles: [], query: "", total: 0, intent: null });
    }

    const intent = parseSmartSearch(rawQuery);
    if (intent.redirect) {
      return NextResponse.json({
        tools: [],
        articles: [],
        query: rawQuery,
        total: 0,
        intent,
        redirect: intent.redirect,
      });
    }

    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 24);
    const searchTerm = intent.query;

    if (shouldUseSupabaseRest()) {
      const [tools, articles] = await Promise.all([
        supabaseGetTools({
          search: searchTerm,
          category: intent.category,
          africaFriendly: intent.africaOnly,
          hasFree: intent.freeOnly,
          limit,
        }),
        searchArticles(searchTerm, Math.min(limit, 6)),
      ]);
      return NextResponse.json({
        tools,
        articles,
        query: rawQuery,
        intent,
        total: tools.length + articles.length,
      });
    }

    const like = `%${searchTerm}%`;
    const conditions = [
      "(t.name ILIKE $1 OR t.tagline ILIKE $1 OR t.description ILIKE $1 OR $2 = ANY(t.tags))",
    ];
    const params: (string | boolean)[] = [like, searchTerm.toLowerCase()];
    let paramIdx = 3;

    if (intent.category) {
      conditions.push(`t.category = $${paramIdx}`);
      params.push(intent.category);
      paramIdx++;
    }
    if (intent.africaOnly) {
      conditions.push("t.africa_friendly = true");
    }
    if (intent.freeOnly) {
      conditions.push("(t.pricing_model IN ('free', 'freemium') OR t.has_free = true)");
    }

    const [{ rows: tools }, articles] = await Promise.all([
      db.query(
        `SELECT t.id, t.name, t.slug, t.tagline, t.logo, t.category, t.rating,
                t.has_free, t.africa_friendly, ts.futurestack_score, tc.name AS category_name
         FROM tools t
         LEFT JOIN tool_scores ts ON ts.tool_id = t.id
         LEFT JOIN tool_categories tc ON tc.id = t.category
         WHERE t.status = 'active' AND ${conditions.join(" AND ")}
         ORDER BY t.review_count DESC LIMIT ${limit}`,
        params,
      ),
      searchArticles(searchTerm, Math.min(limit, 6)),
    ]);

    return NextResponse.json({
      tools,
      articles,
      query: rawQuery,
      intent,
      total: tools.length + articles.length,
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Search failed", tools: [], total: 0 }, { status: 500 });
  }
}

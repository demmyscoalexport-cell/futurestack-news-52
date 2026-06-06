import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shouldUseSupabaseRest } from "@/lib/static-db-fallback";
import { supabaseGetTools } from "@/lib/queries/supabase-read";
import { parseSmartSearch } from "@/lib/smart-search";

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
      const tools = await supabaseGetTools({
        search: searchTerm,
        category: intent.category,
        africaFriendly: intent.africaOnly,
        hasFree: intent.freeOnly,
        limit,
      });
      return NextResponse.json({
        tools,
        articles: [],
        query: rawQuery,
        intent,
        total: tools.length,
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

    const { rows: tools } = await db.query(
      `SELECT t.id, t.name, t.slug, t.tagline, t.logo, t.category, t.rating,
              t.has_free, t.africa_friendly, ts.futurestack_score, tc.name AS category_name
       FROM tools t
       LEFT JOIN tool_scores ts ON ts.tool_id = t.id
       LEFT JOIN tool_categories tc ON tc.id = t.category
       WHERE t.status = 'active' AND ${conditions.join(" AND ")}
       ORDER BY t.review_count DESC LIMIT ${limit}`,
      params,
    );

    return NextResponse.json({
      tools,
      articles: [],
      query: rawQuery,
      intent,
      total: tools.length,
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Search failed", tools: [], total: 0 }, { status: 500 });
  }
}

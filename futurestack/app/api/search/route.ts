import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    if (!query?.trim()) return NextResponse.json({ tools: [], articles: [], query: "", total: 0 });

    const like = `%${query}%`;

    const [{ rows: tools }, { rows: articles }] = await Promise.all([
      db.query(
        `SELECT t.id, t.name, t.slug, t.tagline, t.logo, t.category, t.rating,
                t.has_free, t.africa_friendly, ts.futurestack_score, tc.name AS category_name
         FROM tools t
         LEFT JOIN tool_scores ts ON ts.tool_id = t.id
         LEFT JOIN tool_categories tc ON tc.id = t.category
         WHERE t.status = 'active'
           AND (t.name ILIKE $1 OR t.tagline ILIKE $1 OR t.description ILIKE $1 OR $2 = ANY(t.tags))
         ORDER BY t.review_count DESC LIMIT 10`,
        [like, query.toLowerCase()],
      ),
      db.query(
        `SELECT a.id, a.title, a.slug, a.excerpt AS meta_description, a.hero_image, a.published_at
         FROM articles a
         WHERE a.status = 'published'
           AND (a.title ILIKE $1 OR a.excerpt ILIKE $1)
         ORDER BY a.published_at DESC LIMIT 5`,
        [like],
      ),
    ]);

    return NextResponse.json({
      tools,
      articles,
      query,
      total: tools.length + articles.length,
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

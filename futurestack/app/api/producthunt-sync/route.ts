/**
 * POST /api/producthunt-sync
 *
 * Manually trigger a Product Hunt sync.
 * Body (all optional):
 *   { limitPerTopic?: number, topics?: string[], order?: "VOTES"|"NEWEST"|"FEATURED" }
 *
 * GET /api/producthunt-sync
 *   Returns sync status and the current tool count.
 */
import { NextRequest, NextResponse } from "next/server";
import { db as pool } from "@/lib/db";
import {
  fetchAllPHPosts,
  mapPHTopicsToCategory,
  mapPHPricingModel,
  votesToRating,
  phNameToSlug,
  resolvePHLogo,
  type PHPost,
} from "@/lib/producthunt";

const DEFAULT_TOPICS = [
  "artificial-intelligence",
  "developer-tools",
  "design-tools",
  "productivity",
  "no-code",
  "marketing",
  "video",
  "audio",
];

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active') AS total,
         COUNT(*) FILTER (WHERE 'product-hunt' = ANY(tags)) AS from_producthunt,
         COUNT(*) FILTER (WHERE is_new = true) AS new_tools
       FROM tools`,
    );
    const stats = rows[0];
    return NextResponse.json({
      ok: true,
      stats: {
        total_tools: Number(stats.total),
        from_producthunt: Number(stats.from_producthunt),
        new_tools: Number(stats.new_tools),
      },
      ph_token_configured: !!process.env.PRODUCTHUNT_API_TOKEN,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const limitPerTopic: number = body.limitPerTopic ?? 50;
    const topics: string[] = body.topics ?? DEFAULT_TOPICS;
    const order: "VOTES" | "NEWEST" | "FEATURED" = body.order ?? "NEWEST";

    if (!process.env.PRODUCTHUNT_API_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "PRODUCTHUNT_API_TOKEN is not configured" },
        { status: 503 },
      );
    }

    // Fetch from PH (across all requested topics, deduplicated)
    const allPosts: PHPost[] = [];
    const seenIds = new Set<string>();

    const results = await Promise.allSettled(
      topics.map((topic) => fetchAllPHPosts(limitPerTopic, topic, order)),
    );

    const topicErrors: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        for (const post of r.value) {
          if (!seenIds.has(post.id)) {
            seenIds.add(post.id);
            allPosts.push(post);
          }
        }
      } else {
        topicErrors.push(`${topics[i]}: ${r.reason?.message ?? r.reason}`);
      }
    }

    if (allPosts.length === 0 && topicErrors.length > 0) {
      return NextResponse.json(
        { ok: false, error: "All PH requests failed", details: topicErrors },
        { status: 502 },
      );
    }

    // Filter out tools already in DB
    const { rows: existing } = await pool.query<{ website_url: string; slug: string }>(
      "SELECT website_url, slug FROM tools WHERE status = 'active'",
    );
    const existingUrls = new Set(existing.map((r) => r.website_url?.toLowerCase()));
    const existingSlugs = new Set(existing.map((r) => r.slug));

    const newPosts = allPosts.filter((post) => {
      if (!post.website && !post.url) return false;
      const url = (post.website || post.url).toLowerCase();
      if (existingUrls.has(url)) return false;
      const slug = phNameToSlug(post.name);
      if (existingSlugs.has(slug)) return false;
      return true;
    });

    // Insert new tools
    let inserted = 0;
    let failed = 0;
    const insertedNames: string[] = [];

    for (const post of newPosts) {
      try {
        const slug = phNameToSlug(post.name);
        const topicNodes = post.topics.edges.map((e) => e.node);
        const category = mapPHTopicsToCategory(topicNodes);
        const { pricing_model, has_free } = mapPHPricingModel(post.tagline, post.description);
        const rating = votesToRating(post.votesCount);
        const logo = resolvePHLogo(post);
        const website = post.website || post.url;
        const description =
          post.description ||
          post.tagline ||
          `${post.name} — discovered on Product Hunt`;

        const tags: string[] = ["new", "product-hunt"];
        if (has_free) tags.push("free");
        if (post.votesCount >= 500) tags.push("trending");
        if (has_free) tags.push("africa-friendly");

        const africa_friendly = has_free;

        await pool.query(
          `INSERT INTO tools (
             name, slug, tagline, description, logo,
             website, website_url, category,
             pricing_model, pricing_details, has_free,
             africa_friendly, rating, review_count,
             tags, is_featured, is_verified, is_new,
             status, upvote_count, save_count, view_count
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$6,$7,
             $8,$9,$10,$11,$12,$13,
             $14,false,false,true,
             'active',$15,$16,$17
           )
           ON CONFLICT (slug) DO UPDATE SET
             tagline      = EXCLUDED.tagline,
             description  = EXCLUDED.description,
             logo         = EXCLUDED.logo,
             upvote_count = EXCLUDED.upvote_count,
             rating       = EXCLUDED.rating`,
          [
            post.name,
            slug,
            post.tagline,
            description,
            logo,
            website,
            category,
            pricing_model,
            JSON.stringify([]),
            has_free,
            africa_friendly,
            parseFloat(rating.toFixed(1)),
            Math.floor(post.votesCount / 10),
            tags,
            post.votesCount,
            Math.floor(post.votesCount * 0.1),
            Math.floor(post.votesCount * 0.5),
          ],
        );

        // Insert default scores
        const baseScore = parseFloat(rating.toFixed(1));
        await pool.query(
          `INSERT INTO tool_scores (tool_id, ease_of_use, value_for_money, feature_depth, support_quality, integration_richness, ai_capability)
           SELECT id, $1, $2, $3, $4, $5, $6 FROM tools WHERE slug = $7
           ON CONFLICT (tool_id) DO NOTHING`,
          [
            baseScore,
            has_free ? Math.min(10, baseScore + 0.5) : Math.max(5, baseScore - 0.5),
            baseScore,
            7.0,
            7.0,
            baseScore,
            ["writing", "code"].includes(category) ? Math.min(10, baseScore + 0.3) : baseScore,
            slug,
          ],
        );

        insertedNames.push(post.name);
        inserted++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      summary: {
        fetched: allPosts.length,
        new: newPosts.length,
        inserted,
        failed,
        skipped: allPosts.length - newPosts.length,
      },
      inserted_tools: insertedNames,
      topic_errors: topicErrors.length > 0 ? topicErrors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

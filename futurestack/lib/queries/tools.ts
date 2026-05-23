import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { resolveToolLogo } from "@/lib/logo-resolver";
import { useSupabaseRest } from "@/lib/static-db-fallback";
import {
  supabaseGetCategoriesWithSubcategories,
  supabaseGetFeaturedTools,
  supabaseGetRecentTools,
  supabaseGetToolBySlug,
  supabaseGetToolCategories,
  supabaseGetTools,
  supabaseGetTrendingTools,
} from "@/lib/queries/supabase-read";

type ToolRow = Record<string, unknown> & { name?: string; logo?: string | null; website?: string; website_url?: string };

// Apply logo resolver to a raw DB row so callers always get a usable logo URL
function withLogo<T extends ToolRow>(row: T): T {
  return { ...row, logo: resolveToolLogo(row.name ?? "", row.logo, row.website_url ?? row.website) };
}
function withLogos<T extends ToolRow>(rows: T[]): T[] {
  return rows.map(withLogo);
}

function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return fn().catch((e) => {
    console.error("[tools]", e?.message ?? e);
    return fallback;
  });
}

export async function getFeaturedTools(limit = 6) {
  if (useSupabaseRest()) {
    return safe(async () => withLogos(await supabaseGetFeaturedTools(limit)), []);
  }
  return safe(async () => {
    const { rows } = await db.query(
      `SELECT t.*, ts.futurestack_score
       FROM tools t
       LEFT JOIN tool_scores ts ON ts.tool_id = t.id
       WHERE t.is_featured = true AND t.status = 'active'
       ORDER BY t.created_at DESC LIMIT $1`,
      [limit],
    );
    return withLogos(rows);
  }, []);
}

export async function getTrendingTools(limit = 10) {
  if (useSupabaseRest()) {
    return safe(async () => withLogos(await supabaseGetTrendingTools(limit)), []);
  }
  return safe(async () => {
    const { rows } = await db.query(
      `SELECT t.*, ts.futurestack_score
       FROM tools t
       LEFT JOIN tool_scores ts ON ts.tool_id = t.id
       WHERE t.status = 'active'
       ORDER BY t.review_count DESC, t.rating DESC LIMIT $1`,
      [limit],
    );
    return withLogos(rows);
  }, []);
}

export async function getTools({
  category,
  subcategory,
  search,
  africaFriendly,
  hasFree,
  isNew,
  isFeatured,
  limit = 60,
  offset = 0,
}: {
  category?: string;
  subcategory?: string;
  search?: string;
  africaFriendly?: boolean;
  hasFree?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<ToolRow[]> {
  if (useSupabaseRest()) {
    return safe(
      async () =>
        withLogos(
          await supabaseGetTools({
            category,
            subcategory,
            search,
            africaFriendly,
            hasFree,
            isNew,
            isFeatured,
            limit,
            offset,
          }),
        ),
      [],
    );
  }
  return safe(async () => {
    const where: string[] = ["t.status = 'active'"];
    const params: unknown[] = [];
    let i = 1;

    if (category) { where.push(`t.category = $${i++}`); params.push(category); }
    if (subcategory) { where.push(`t.subcategory = $${i++}`); params.push(subcategory); }
    if (africaFriendly) where.push(`t.africa_friendly = true`);
    if (hasFree) where.push(`t.has_free = true`);
    if (isNew) where.push(`t.is_new = true`);
    if (isFeatured) where.push(`t.is_featured = true`);
    if (search) {
      where.push(`(t.name ILIKE $${i} OR t.tagline ILIKE $${i} OR t.description ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT t.*,
              ts.futurestack_score,
              (t.new_until IS NOT NULL AND t.new_until > NOW()) AS is_new
       FROM tools t LEFT JOIN tool_scores ts ON ts.tool_id = t.id
       WHERE ${where.join(" AND ")}
       ORDER BY t.is_featured DESC, t.review_count DESC, t.rating DESC
       LIMIT $${i++} OFFSET $${i++}`,
      params,
    );
    return withLogos(rows);
  }, []);
}

export async function getToolSubcategories(categoryId?: string) {
  return safe(async () => {
    const where = categoryId ? `WHERE ts.category_id = $1` : "";
    const params = categoryId ? [categoryId] : [];
    const { rows } = await db.query(
      `SELECT ts.id, ts.category_id, ts.name, ts.slug, ts.icon,
              COUNT(t.id)::int AS count
       FROM tool_subcategories ts
       LEFT JOIN tools t ON t.subcategory = ts.slug AND t.status = 'active'
       ${where}
       GROUP BY ts.id, ts.category_id, ts.name, ts.slug, ts.icon, ts.sort_order
       ORDER BY ts.sort_order, ts.name`,
      params,
    );
    return rows;
  }, []);
}

export async function getCategoriesWithSubcategories(): Promise<
  Array<{ id: string; name: string; icon?: string; count?: number; subcategories?: unknown[] }>
> {
  if (useSupabaseRest()) {
    return safe(
      async () =>
        (await supabaseGetCategoriesWithSubcategories()) as Array<{
          id: string;
          name: string;
          icon?: string;
          count?: number;
          subcategories?: unknown[];
        }>,
      [],
    );
  }
  return safe(async () => {
    const [categories, subcategories] = await Promise.all([
      getToolCategories(),
      getToolSubcategories(),
    ]);
    return categories.map((cat: { id: string; name: string; icon?: string; count?: number }) => ({
      ...cat,
      subcategories: subcategories.filter((s: { category_id: string }) => s.category_id === cat.id),
    }));
  }, []);
}

export async function getToolBySlug(slug: string) {
  if (useSupabaseRest()) {
    return safe(async () => {
      const tool = await supabaseGetToolBySlug(slug);
      if (!tool) return null;
      return {
        ...withLogo(tool),
        tool_pricing: [],
        alternatives: [],
        tool_changelogs: [],
        reviews: [],
      };
    }, null);
  }
  return safe(async () => {
    const { rows } = await db.query(
      `SELECT t.*, ts.ease_of_use, ts.value_for_money, ts.feature_depth,
              ts.support_quality, ts.integration_richness, ts.ai_capability,
              ts.futurestack_score, tc.name AS category_name, tc.icon AS category_icon
       FROM tools t
       LEFT JOIN tool_scores ts ON ts.tool_id = t.id
       LEFT JOIN tool_categories tc ON tc.id = t.category
       WHERE t.slug = $1`,
      [slug],
    );
    if (!rows[0]) return null;
    const tool = withLogo(rows[0]);
    const [pricing, alts, changelogs, reviews] = await Promise.all([
      db.query(`SELECT * FROM tool_pricing WHERE tool_id=$1 ORDER BY price_monthly ASC NULLS FIRST`, [tool.id]).then(r=>r.rows).catch(()=>[]),
      db.query(`SELECT t2.id,t2.name,t2.slug,t2.logo,t2.tagline,t2.website_url,ta.similarity_score FROM tool_alternatives ta JOIN tools t2 ON t2.id=ta.alternative_id WHERE ta.tool_id=$1 ORDER BY ta.similarity_score DESC LIMIT 6`,[tool.id]).then(r=>r.rows).then(withLogos).catch(()=>[]),
      db.query(`SELECT * FROM tool_changelogs WHERE tool_id=$1 ORDER BY published_at DESC LIMIT 5`,[tool.id]).then(r=>r.rows).catch(()=>[]),
      db.query(`SELECT * FROM reviews WHERE tool_id=$1 ORDER BY created_at DESC LIMIT 10`,[tool.id]).then(r=>r.rows).catch(()=>[]),
    ]);
    return { ...tool, tool_pricing: pricing, alternatives: alts, tool_changelogs: changelogs, reviews };
  }, null);
}

export const getToolBySlugCached = unstable_cache(
  async (slug: string) => getToolBySlug(slug),
  ["tool-by-slug"],
  { revalidate: 3600, tags: ["tools"] },
);

export async function getRecentTools(limit = 6) {
  if (useSupabaseRest()) {
    return safe(async () => withLogos(await supabaseGetRecentTools(limit)), []);
  }
  return safe(async () => {
    const { rows } = await db.query(
      `SELECT t.*, ts.futurestack_score
       FROM tools t
       LEFT JOIN tool_scores ts ON ts.tool_id = t.id
       WHERE t.status = 'active'
       ORDER BY t.created_at DESC LIMIT $1`,
      [limit],
    );
    return withLogos(rows);
  }, []);
}

export async function getToolCategories() {
  if (useSupabaseRest()) {
    return safe(async () => supabaseGetToolCategories(), []);
  }
  return safe(async () => {
    const { rows } = await db.query(
      `SELECT tc.id, tc.name, tc.icon,
              COUNT(t.id)::int AS count
       FROM tool_categories tc
       LEFT JOIN tools t ON t.category = tc.id AND t.status = 'active'
       GROUP BY tc.id, tc.name, tc.icon
       ORDER BY tc.name`,
    );
    return rows;
  }, []);
}

export async function getCatalogStats() {
  if (useSupabaseRest()) {
    const { getSupabaseAdmin } = await import("@/lib/supabase/db");
    const supa = getSupabaseAdmin();
    const [toolsRes, africaRes, stacksRes, categories] = await Promise.all([
      supa.from("tools").select("id", { count: "exact", head: true }).eq("status", "active"),
      supa.from("tools").select("id", { count: "exact", head: true }).eq("status", "active").eq("africa_friendly", true),
      supa.from("stacks").select("id", { count: "exact", head: true }),
      getToolCategories(),
    ]);
    const toolCount = toolsRes.count ?? 0;
    const africaCount = africaRes.count ?? 0;
    return {
      toolCount,
      categoryCount: categories.length || 16,
      stackCount: stacksRes.count ?? 0,
      africaReadyPct: toolCount > 0 ? Math.round((africaCount / toolCount) * 100) : 0,
    };
  }
  return safe(async () => {
    const { rows: toolRows } = await db.query(`SELECT COUNT(*)::int AS c FROM tools WHERE status = 'active'`);
    const { rows: africaRows } = await db.query(`SELECT COUNT(*)::int AS c FROM tools WHERE status = 'active' AND africa_friendly = true`);
    const { rows: stackRows } = await db.query(`SELECT COUNT(*)::int AS c FROM stacks`);
    const categories = await getToolCategories();
    const toolCount = toolRows[0]?.c ?? 0;
    const africaCount = africaRows[0]?.c ?? 0;
    return {
      toolCount,
      categoryCount: categories.length || 16,
      stackCount: stackRows[0]?.c ?? 0,
      africaReadyPct: toolCount > 0 ? Math.round((africaCount / toolCount) * 100) : 0,
    };
  }, { toolCount: 0, categoryCount: 16, stackCount: 0, africaReadyPct: 0 });
}

export async function searchTools(query: string, filters?: { category?: string; hasFree?: boolean }) {
  if (useSupabaseRest()) {
    return getTools({
      search: query,
      category: filters?.category,
      hasFree: filters?.hasFree,
      limit: 20,
    });
  }
  return safe(async () => {
    const where = [`(t.name ILIKE $1 OR t.tagline ILIKE $1 OR t.description ILIKE $1)`, `t.status='active'`];
    const params: unknown[] = [`%${query}%`];
    let i = 2;
    if (filters?.category) { where.push(`t.category=$${i++}`); params.push(filters.category); }
    if (filters?.hasFree) where.push(`t.has_free=true`);
    const { rows } = await db.query(
      `SELECT t.*,ts.futurestack_score FROM tools t LEFT JOIN tool_scores ts ON ts.tool_id=t.id WHERE ${where.join(" AND ")} LIMIT 20`,
      params,
    );
    return withLogos(rows);
  }, []);
}

import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return fn().catch((e) => {
    console.error("[tools]", e?.message ?? e);
    return fallback;
  });
}

export async function getFeaturedTools(limit = 6) {
  return safe(async () => {
    const { rows } = await db.query(
      `SELECT t.*, ts.futurestack_score
       FROM tools t
       LEFT JOIN tool_scores ts ON ts.tool_id = t.id
       WHERE t.is_featured = true AND t.status = 'active'
       ORDER BY t.created_at DESC LIMIT $1`,
      [limit],
    );
    return rows;
  }, []);
}

export async function getTrendingTools(limit = 10) {
  return safe(async () => {
    const { rows } = await db.query(
      `SELECT t.*, ts.futurestack_score
       FROM tools t
       LEFT JOIN tool_scores ts ON ts.tool_id = t.id
       WHERE t.status = 'active'
       ORDER BY t.review_count DESC, t.rating DESC LIMIT $1`,
      [limit],
    );
    return rows;
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
} = {}) {
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
      `SELECT t.*, ts.futurestack_score
       FROM tools t LEFT JOIN tool_scores ts ON ts.tool_id = t.id
       WHERE ${where.join(" AND ")}
       ORDER BY t.is_featured DESC, t.review_count DESC, t.rating DESC
       LIMIT $${i++} OFFSET $${i++}`,
      params,
    );
    return rows;
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

export async function getCategoriesWithSubcategories() {
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
    const tool = rows[0];
    const [pricing, alts, changelogs, reviews] = await Promise.all([
      db.query(`SELECT * FROM tool_pricing WHERE tool_id=$1 ORDER BY price_monthly ASC NULLS FIRST`, [tool.id]).then(r=>r.rows).catch(()=>[]),
      db.query(`SELECT t2.id,t2.name,t2.slug,t2.logo,t2.tagline,ta.similarity_score FROM tool_alternatives ta JOIN tools t2 ON t2.id=ta.alternative_id WHERE ta.tool_id=$1 ORDER BY ta.similarity_score DESC LIMIT 6`,[tool.id]).then(r=>r.rows).catch(()=>[]),
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

export async function getToolCategories() {
  return safe(async () => {
    const { rows } = await db.query(
      `SELECT id, name, icon, count FROM tool_categories ORDER BY name`,
    );
    return rows;
  }, []);
}

export async function searchTools(query: string, filters?: { category?: string; hasFree?: boolean }) {
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
    return rows;
  }, []);
}

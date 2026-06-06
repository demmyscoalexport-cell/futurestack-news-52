import { db } from "@/lib/db";
import type { Article } from "@/lib/types";
import { shouldUseSupabaseRest } from "@/lib/static-db-fallback";
import {
  supabaseGetArticleBySlug,
  supabaseGetPublishedArticles,
} from "@/lib/queries/supabase-read";

function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return fn().catch((e) => {
    console.error("[articles]", e?.message ?? e);
    return fallback;
  });
}

async function queryArticlesWithFallback(
  sql: string,
  params: unknown[],
  fallbackSql: string,
  fallbackParams: unknown[],
) {
  try {
    return await db.query(sql, params);
  } catch {
    return db.query(fallbackSql, fallbackParams);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapArticle(row: any): any {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    content: row.content || "",
    featuredImage: row.hero_image || row.cover_image_url || "",
    publishedAt: row.published_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    readTime: row.reading_time || Math.ceil((row.word_count || 1000) / 200),
    category: row.category_slug || "ai-tools",
    tags: row.tags || [],
    targetRoles: [],
    viewCount: row.view_count || 0,
    featured: row.is_featured || false,
    author: row.author_name ? { name: row.author_name, role: "Staff Writer", avatar: row.author_avatar } : null,
    // GNews source attribution fields
    source_name: row.source_name || null,
    source_url: row.source_url || null,
  } as unknown as Article;
}

export async function getPublishedArticles({
  category,
  search,
  limit = 20,
  offset = 0,
}: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (shouldUseSupabaseRest()) {
    return safe(async () => supabaseGetPublishedArticles({ limit, offset }), []);
  }
  return safe(async () => {
    const where = [`a.status = 'published'`];
    const params: unknown[] = [];
    let i = 1;
    if (category) { where.push(`c.slug = $${i++}`); params.push(category); }
    if (search) {
      where.push(`(a.title ILIKE $${i} OR a.excerpt ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }
    params.push(limit, offset);
    const limitParam = i++;
    const offsetParam = i++;
    const { rows } = await queryArticlesWithFallback(
      `SELECT a.*, c.slug AS category_slug, c.name AS category_name,
              au.name AS author_name, au.avatar AS author_avatar
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       LEFT JOIN authors au ON au.id = a.author_id
       WHERE ${where.join(" AND ")}
       ORDER BY a.published_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params,
      `SELECT a.*, a.category AS category_slug, a.category AS category_name,
              au.name AS author_name, au.avatar AS author_avatar
       FROM articles a
       LEFT JOIN authors au ON au.id = a.author_id
       WHERE ${where.join(" AND ").replaceAll("c.slug", "a.category")}
       ORDER BY a.published_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params,
    );
    return rows.map(mapArticle);
  }, []);
}

export async function getFeaturedArticles(limit = 4) {
  if (shouldUseSupabaseRest()) {
    return safe(async () => supabaseGetPublishedArticles({ limit, featured: true }), []);
  }
  return safe(async () => {
    const { rows } = await queryArticlesWithFallback(
      `SELECT a.*, c.slug AS category_slug, c.name AS category_name,
              au.name AS author_name, au.avatar AS author_avatar
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       LEFT JOIN authors au ON au.id = a.author_id
       WHERE a.status = 'published' AND a.is_featured = true
       ORDER BY a.published_at DESC LIMIT $1`,
      [limit],
      `SELECT a.*, a.category AS category_slug, a.category AS category_name,
              au.name AS author_name, au.avatar AS author_avatar
       FROM articles a
       LEFT JOIN authors au ON au.id = a.author_id
       WHERE a.status = 'published' AND coalesce(a.featured, false) = true
       ORDER BY a.published_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(mapArticle);
  }, []);
}

export async function getArticleBySlug(slug: string) {
  if (shouldUseSupabaseRest()) {
    return safe(async () => supabaseGetArticleBySlug(slug), null);
  }
  return safe(async () => {
    const { rows } = await queryArticlesWithFallback(
      `SELECT a.*, c.slug AS category_slug, c.name AS category_name,
              au.name AS author_name, au.avatar AS author_avatar
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       LEFT JOIN authors au ON au.id = a.author_id
       WHERE a.slug = $1 AND a.status = 'published'`,
      [slug],
      `SELECT a.*, a.category AS category_slug, a.category AS category_name,
              au.name AS author_name, au.avatar AS author_avatar
       FROM articles a
       LEFT JOIN authors au ON au.id = a.author_id
       WHERE a.slug = $1 AND a.status = 'published'`,
      [slug],
    );
    if (!rows[0]) return null;
    // fire-and-forget view count
    db.query(`UPDATE articles SET view_count = view_count + 1 WHERE slug = $1`, [slug]).catch(() => {});
    return mapArticle(rows[0]);
  }, null);
}

export async function getArticleCategories() {
  return safe(async () => {
    const { rows } = await db.query(`SELECT id, name, slug FROM categories ORDER BY name`);
    return rows;
  }, []);
}

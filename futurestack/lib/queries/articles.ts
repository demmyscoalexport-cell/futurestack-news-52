import { createClient } from "@/lib/supabase/server";
import type { Article } from "@/lib/types";

function mapArticle(row: any): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    content: row.content || "",
    featuredImage: row.cover_image_url || "",
    publishedAt: row.published_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    readTime: row.reading_time || Math.ceil((row.word_count || 1000) / 200),
    category: row.category?.slug || "ai-tools",
    tags: row.tags || [],
    targetRoles: [],
    viewCount: row.view_count || 0,
    featured: row.is_featured || false,
    author: row.author || null,
  } as Article;
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
  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select("*, category:categories(id,name,slug)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category_id", category);
  if (search)
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) {
    console.error("[getPublishedArticles]", error.message);
    return [];
  }
  return (data || []).map(mapArticle);
}

export async function getFeaturedArticles(limit = 4) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*, category:categories(id,name,slug)")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getFeaturedArticles]", error.message);
    return [];
  }
  return (data || []).map(mapArticle);
}

export async function getArticleBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*, category:categories(id,name,slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("[getArticleBySlug]", error.message);
    return null;
  }

  // Fire-and-forget view count bump
  supabase
    .from("articles")
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq("slug", slug)
    .then(() => {});

  return mapArticle(data);
}

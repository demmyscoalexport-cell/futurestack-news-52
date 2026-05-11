import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export async function getFeaturedTools(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tools")
    .select(
      `
      *,
      tool_categories(name, id, icon),
      tool_scores(futurestack_score),
      reviews(rating)
    `,
    )
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data?.map((tool) => ({
    ...tool,
    avg_rating: tool.reviews?.length
      ? tool.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        tool.reviews.length
      : null,
    review_count: tool.reviews?.length ?? 0,
  }));
}

export async function getToolBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tools")
    .select(
      `
      *,
      tool_categories(name, id, icon),
      tool_scores(*),
      tool_pricing(*),
      tool_changelogs(*),
      reviews(*, profiles(full_name, avatar_url)),
      tool_alternatives!tool_alternatives_tool_id_fkey(
        alternative:tools!tool_alternatives_alternative_id_fkey(name, slug, logo, short_description)
      )
    `,
    )
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

export async function getTrendingTools(limit = 10) {
  const supabase = await createClient();
  // Trending = most saves + most reviews in last 7 days
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data } = await supabase
    .from("tools")
    .select(
      `
      *,
      tool_scores(futurestack_score),
      saved_tools(count),
      reviews(count)
    `,
    )
    .gte("created_at", sevenDaysAgo)
    .order("review_count", { ascending: false }) // using reviews instead of dynamic view_count for trend
    .limit(limit);

  return data;
}

export async function searchTools(
  query: string,
  filters?: {
    category?: string;
    hasFree?: boolean;
    minScore?: number;
  },
) {
  const supabase = await createClient();
  let q = supabase
    .from("tools")
    .select("*, tool_categories(name, id), tool_scores(futurestack_score)")
    .textSearch("name", query, { type: "websearch" });

  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.hasFree) q = q.eq("has_free", true);
  if (filters?.minScore)
    q = q.gte("tool_scores.futurestack_score", filters.minScore);

  const { data } = await q.limit(20);
  return data;
}

export async function getToolCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tool_categories")
    .select("id, name, icon, count")
    .order("name");
  if (error) {
    console.error("[getToolCategories]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getTools({
  category,
  search,
  limit = 24,
  offset = 0,
}: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  // basic backward compatibility for generic fetching
  const supabase = await createClient();
  let q = supabase
    .from("tools")
    .select("*")
    .range(offset, offset + limit - 1);
  if (category) q = q.eq("category", category);
  if (search)
    q = q.or(`name.ilike.%${search}%,short_description.ilike.%${search}%`);
  const { data } = await q;
  return data || [];
}

export const getToolBySlugCached = unstable_cache(
  async (slug: string) => getToolBySlug(slug),
  ["tool-by-slug"],
  { revalidate: 3600, tags: ["tools"] },
);

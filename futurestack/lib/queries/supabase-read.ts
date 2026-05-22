/**
 * Read tools/articles/stacks via Supabase REST when API keys are set
 * but SUPABASE_DB_URL (direct Postgres) is not.
 */
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/db";

export { isSupabaseConfigured };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function mapToolRow(row: Row): Row {
  const scores = Array.isArray(row.tool_scores)
    ? row.tool_scores[0]
    : row.tool_scores;
  return {
    ...row,
    logo: row.logo ?? row.logo_url ?? null,
    website: row.website ?? row.website_url ?? null,
    website_url: row.website_url ?? row.website ?? null,
    futurestack_score: scores?.futurestack_score ?? row.futurestack_score ?? null,
    has_free:
      row.has_free ??
      (row.pricing_model === "freemium" || row.pricing_model === "free"),
  };
}

const TOOL_SELECT = "*, tool_scores(futurestack_score)";

export async function supabaseGetTools(opts: {
  category?: string;
  subcategory?: string;
  search?: string;
  africaFriendly?: boolean;
  hasFree?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<Row[]> {
  const {
    category,
    subcategory,
    search,
    africaFriendly,
    hasFree,
    isNew,
    isFeatured,
    limit = 60,
    offset = 0,
  } = opts;

  const supa = getSupabaseAdmin();
  let q = supa.from("tools").select(TOOL_SELECT).eq("status", "active");

  if (category) q = q.eq("category", category);
  if (subcategory) q = q.eq("subcategory", subcategory);
  if (africaFriendly) q = q.eq("africa_friendly", true);
  if (hasFree) q = q.or("pricing_model.eq.freemium,pricing_model.eq.free");
  if (isNew) q = q.eq("is_new", true);
  if (isFeatured) q = q.eq("is_featured", true);
  if (search) {
    q = q.or(
      `name.ilike.%${search}%,tagline.ilike.%${search}%,description.ilike.%${search}%`,
    );
  }

  q = q
    .order("is_featured", { ascending: false })
    .order("review_count", { ascending: false });

  // Paginate — Supabase returns max 1000 rows per request; catalog is ~409 tools
  const pageSize = 1000;
  const rows: Row[] = [];
  let pageOffset = offset;
  const need = limit;

  while (rows.length < need) {
    const end = pageOffset + Math.min(pageSize, need - rows.length) - 1;
    const { data, error } = await q.range(pageOffset, end);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    pageOffset += pageSize;
  }

  return rows.map(mapToolRow);
}

export async function supabaseGetToolBySlug(slug: string): Promise<Row | null> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("tools")
    .select(TOOL_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapToolRow(data) : null;
}

export async function supabaseGetToolCategories(): Promise<Row[]> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("tool_categories")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function supabaseGetFeaturedTools(limit = 6): Promise<Row[]> {
  return supabaseGetTools({ isFeatured: true, limit });
}

export async function supabaseGetTrendingTools(limit = 10): Promise<Row[]> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("tools")
    .select(TOOL_SELECT)
    .eq("status", "active")
    .order("review_count", { ascending: false })
    .order("rating", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapToolRow);
}

export async function supabaseGetRecentTools(limit = 6): Promise<Row[]> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("tools")
    .select(TOOL_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapToolRow);
}

export async function supabaseGetCategoriesWithSubcategories(): Promise<Row[]> {
  const categories = await supabaseGetToolCategories();
  return categories.map((cat) => ({ ...cat, subcategories: [] }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapArticle(row: Row): any {
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
    author: null,
  };
}

export async function supabaseGetPublishedArticles(opts: {
  limit?: number;
  offset?: number;
  featured?: boolean;
} = {}) {
  const { limit = 20, offset = 0, featured } = opts;
  const supa = getSupabaseAdmin();
  let q = supa.from("articles").select("*").in("status", ["published", "PUBLISHED"]);
  if (featured) q = q.eq("is_featured", true);
  const { data, error } = await q
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapArticle);
}

export async function supabaseGetArticleBySlug(slug: string) {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .in("status", ["published", "PUBLISHED"])
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapArticle(data) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStackRow(row: Row): any {
  const embeddedTools = Array.isArray(row.tools) ? row.tools : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    targetRole: row.target_role || "freelancer",
    category: row.category || "general",
    cloneCount: row.clone_count || 0,
    rating: row.rating || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    featured: row.featured || row.is_featured || false,
    creator: null,
    tools: embeddedTools.map((t: Row) => mapToolRow(t)),
  };
}

export async function supabaseGetStacks(opts: {
  featured?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const { featured, limit = 12, offset = 0 } = opts;
  const supa = getSupabaseAdmin();
  let q = supa.from("stacks").select("*");
  if (featured) q = q.eq("is_featured", true);
  const { data, error } = await q
    .order("clone_count", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapStackRow);
}

export async function supabaseGetStackBySlug(slug: string) {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("stacks")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapStackRow(data) : null;
}

export async function supabaseGetStackById(id: string) {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("stacks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapStackRow(data) : null;
}

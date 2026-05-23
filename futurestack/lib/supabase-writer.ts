/**
 * Supabase writer helper for Inngest functions.
 *
 * All Inngest functions write data to Supabase (the live database)
 * using the admin client. Column names match the Supabase schema.
 */
import { createAdminClient } from "@/lib/supabase/admin";

function client() {
  return createAdminClient();
}

/** Resolve or create the AI author, returns the author UUID */
export async function resolveAIAuthor(): Promise<string | null> {
  const supabase = client();

  const { data: existing } = await supabase
    .from("authors")
    .select("id")
    .eq("name", "DISCOVA AI")
    .single();

  if (existing?.id) return existing.id;

  const { data: inserted } = await supabase
    .from("authors")
    .insert({
      name:   "DISCOVA AI",
      bio:    "AI-powered editorial intelligence monitoring the digital tool ecosystem across Africa 24/7.",
      avatar: "/avatars/ai-author.png",
      role:   "ai",
    })
    .select("id")
    .single();

  return inserted?.id ?? null;
}

/** Check which article slugs already exist (for deduplication) */
export async function getExistingArticleSlugs(slugs: string[]): Promise<Set<string>> {
  if (!slugs.length) return new Set();
  const supabase = client();
  const { data } = await supabase.from("articles").select("slug").in("slug", slugs);
  return new Set((data ?? []).map(r => r.slug));
}

/** Check which article source_urls already exist */
export async function getExistingSourceUrls(urls: string[]): Promise<Set<string>> {
  if (!urls.length) return new Set();
  const supabase = client();
  try {
    const { data } = await supabase
      .from("articles")
      .select("slug")
      .in("slug", urls.map((u) => u.slice(-80)));
    return new Set((data ?? []).map((r: { slug: string }) => r.slug));
  } catch {
    return new Set();
  }
}

/** Get recent article titles for deduplication */
export async function getRecentArticleTitles(days = 7): Promise<string[]> {
  const supabase = client();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("articles")
    .select("title")
    .gte("created_at", since);
  return (data ?? []).map(r => r.title);
}

interface ArticleInput {
  title:         string;
  slug:          string;
  excerpt:       string;
  content:       string;
  hero_image?:   string | null;
  author_id?:    string | null;
  category?:     string | null;
  tags?:         string[];
  read_time?:    number;
  status?:       string;
  featured?:     boolean;
  source_url?:   string | null;
}

/** Upsert an article to Supabase (returns the saved slug) */
export async function upsertArticle(input: ArticleInput): Promise<string | null> {
  const supabase = client();

  const payload: Record<string, unknown> = {
    title:        input.title,
    slug:         input.slug,
    excerpt:      input.excerpt,
    content:      input.content,
    featured_image: input.hero_image ?? null,
    author_id:    input.author_id ?? null,
    category:     input.category ?? "ai-tools",
    tags:         input.tags ?? [],
    read_time:    input.read_time ?? 3,
    status:       (input.status === "published" ? "PUBLISHED" : input.status) ?? "PUBLISHED",
    featured:     input.featured ?? false,
    published_at: new Date().toISOString(),
    created_at:   new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("articles")
    .upsert(payload, { onConflict: "slug" })
    .select("slug")
    .single();

  if (error) {
    console.error("[supabase-writer] upsertArticle error:", error.message);
    return null;
  }

  return data?.slug ?? null;
}

interface ToolInput {
  name: string;
  slug: string;
  tagline?: string;
  short_description?: string;
  description: string;
  logo?: string | null;
  website?: string | null;
  category?: string | null;
  has_free?: boolean;
  africa_friendly?: boolean;
  rating?: number;
  review_count?: number;
  tags?: string[];
  featured?: boolean;
}

/** Upsert a tool to Supabase (returns the saved tool id) */
export async function upsertTool(input: ToolInput): Promise<string | null> {
  const supabase = client();

  const payload: Record<string, unknown> = {
    name: input.name,
    slug: input.slug,
    tagline: input.tagline ?? input.short_description ?? "",
    description: input.description,
    logo: input.logo ?? null,
    website_url: input.website ?? null,
    category: input.category ?? "productivity",
    pricing_model: input.has_free ? "freemium" : "paid",
    pricing_details: [],
    africa_friendly: input.africa_friendly ?? false,
    rating: input.rating ?? 0,
    review_count: input.review_count ?? 0,
    tags: input.tags ?? [],
    is_featured: input.featured ?? false,
    status: "active",
    last_updated: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("tools")
    .upsert(payload, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) {
    console.error("[supabase-writer] upsertTool error:", error.message);
    return null;
  }

  return data?.id ?? null;
}

/** Check which tool slugs already exist in Supabase */
export async function getExistingToolSlugs(): Promise<Set<string>> {
  const supabase = client();
  const { data } = await supabase.from("tools").select("slug");
  return new Set((data ?? []).map(r => r.slug));
}

/** Get newsletter subscribers from Supabase */
export async function getActiveSubscribers(): Promise<{ email: string }[]> {
  const supabase = client();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("email")
    .eq("status", "active");
  return data ?? [];
}

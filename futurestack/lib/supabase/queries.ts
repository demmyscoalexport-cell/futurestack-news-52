import { createClient } from "@/lib/supabase/server";

// ─── Tools ───────────────────────────────────────────────────────────────────

export async function getTools({
  category,
  search,
  africaFriendly,
  hasFree,
  limit = 24,
  offset = 0,
}: {
  category?: string;
  search?: string;
  africaFriendly?: boolean;
  hasFree?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("tools")
    .select("*")
    .eq("status", "active")
    .order("review_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (africaFriendly) query = query.eq("africa_friendly", true);
  if (hasFree) query = query.eq("pricing_model", "freemium");
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,tagline.ilike.%${search}%,category.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getTools]", error);
    return [];
  }

  return data ?? [];
}

export async function getToolBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("[getToolBySlug]", error);
    return null;
  }

  return data;
}

export async function getTopTools(limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("status", "active")
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getTopTools]", error);
    return [];
  }

  return data ?? [];
}

export async function getToolCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tool_categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("[getToolCategories]", error);
    return [];
  }

  return data ?? [];
}

// ─── Articles ────────────────────────────────────────────────────────────────

export async function getArticles({
  category,
  search,
  featured,
  limit = 12,
  offset = 0,
}: {
  category?: string;
  search?: string;
  featured?: boolean;
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
  if (featured) query = query.eq("is_featured", true);
  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getArticles]", error);
    return [];
  }

  return data ?? [];
}

export async function getArticleBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*, category:categories(id,name,slug)")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("[getArticleBySlug]", error);
    return null;
  }

  // Increment view count (fire-and-forget)
  supabase
    .from("articles")
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq("slug", slug)
    .then(() => {});

  return data;
}

export async function getFeaturedArticles(limit = 4) {
  return getArticles({ featured: true, limit });
}

// ─── Stacks ──────────────────────────────────────────────────────────────────

export async function getStacks({
  targetRole,
  category,
  featured,
  limit = 12,
  offset = 0,
}: {
  targetRole?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("stacks")
    .select("*, stack_tools(tools(*))")
    .order("clone_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (targetRole) query = query.eq("target_role", targetRole);
  if (category) query = query.eq("category", category);
  if (featured) query = query.eq("featured", true);

  const { data, error } = await query;

  if (error) {
    console.error("[getStacks]", error);
    return [];
  }

  return data ?? [];
}

export async function getStackBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stacks")
    .select("*, stack_tools(tools(*))")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("[getStackBySlug]", error);
    return null;
  }

  return data;
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export async function subscribeToNewsletter({
  email,
  role,
}: {
  email: string;
  role?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      { email, role, subscribed_at: new Date().toISOString() },
      { onConflict: "email" },
    );

  if (error) {
    console.error("[subscribeToNewsletter]", error);
    return { error: "Could not subscribe. Please try again." };
  }

  return { success: true };
}

// ─── User Saved Items ─────────────────────────────────────────────────────────

export async function getSavedTools(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("saved_tools")
    .select("tools(*)")
    .eq("user_id", userId);

  if (error) {
    console.error("[getSavedTools]", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => row.tools);
}

export async function toggleSaveTool(userId: string, toolId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("saved_tools")
    .select("id")
    .eq("user_id", userId)
    .eq("tool_id", toolId)
    .single();

  if (existing) {
    await supabase
      .from("saved_tools")
      .delete()
      .eq("user_id", userId)
      .eq("tool_id", toolId);
    return { saved: false };
  } else {
    await supabase
      .from("saved_tools")
      .insert({ user_id: userId, tool_id: toolId });
    return { saved: true };
  }
}

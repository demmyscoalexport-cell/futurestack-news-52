import { createClient } from "@/lib/supabase/server";
import type { Stack } from "@/lib/types";

function mapStack(row: any): Stack {
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
    featured: row.featured || false,
    creator: row.creator || null,
    tools: (row.stack_tools || []).map((st: any) => {
      const toolRow = st.tools || {};
      return {
        ...toolRow,
        shortDescription: toolRow.tagline || "",
        logo: toolRow.logo_url || "",
        reviewCount: toolRow.review_count || 0,
        badges: toolRow.tags || [],
        pricing: { hasFree: toolRow.pricing_model === "freemium", plans: [] },
      };
    }),
  } as unknown as Stack;
}

export async function getPublicStacks({
  targetRole,
  featured,
  limit = 12,
  offset = 0,
}: {
  targetRole?: string;
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
  if (featured) query = query.eq("featured", true);

  const { data, error } = await query;
  if (error) {
    console.error("[getPublicStacks]", error.message);
    return [];
  }
  return (data || []).map(mapStack);
}

export async function getFeaturedStacks(limit = 3) {
  return getPublicStacks({ featured: true, limit });
}

export async function getStackById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stacks")
    .select("*, stack_tools(tools(*))")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("[getStackById]", error?.message);
    return null;
  }
  return mapStack(data);
}

export async function getStackBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stacks")
    .select("*, stack_tools(tools(*))")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("[getStackBySlug]", error?.message);
    return null;
  }
  return mapStack(data);
}

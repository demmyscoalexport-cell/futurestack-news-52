import { db } from "@/lib/db";
import { resolveToolLogo } from "@/lib/logo-resolver";
import { useSupabaseRest } from "@/lib/static-db-fallback";
import {
  supabaseGetStackById,
  supabaseGetStackBySlug,
  supabaseGetStacks,
} from "@/lib/queries/supabase-read";
import type { Stack } from "@/lib/types";

function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return fn().catch((e) => {
    console.error("[stacks]", e?.message ?? e);
    return fallback;
  });
}

async function attachTools(stackRows: any[]): Promise<any[]> {
  if (!stackRows.length) return stackRows;
  const ids = stackRows.map((s) => s.id);
  const { rows: links } = await db.query(
    `SELECT st.stack_id, st.position, t.*
     FROM stack_tools st JOIN tools t ON t.id = st.tool_id
     WHERE st.stack_id = ANY($1) ORDER BY st.position ASC`,
    [ids],
  );
  const byStack: Record<string, any[]> = {};
  for (const r of links) {
    (byStack[r.stack_id] ??= []).push({
      ...r,
      shortDescription: r.tagline || "",
      badges: r.tags || [],
      pricing: { hasFree: r.pricing_model === "freemium", plans: [] },
    });
  }
  return stackRows.map((s) => ({ ...s, tools: byStack[s.id] ?? [] }));
}

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
    creator: null,
    tools: (row.tools || []).map((t: any) => ({
      ...t,
      shortDescription: t.tagline || "",
      logo: resolveToolLogo(t.name ?? "", t.logo, t.website_url ?? t.website),
      reviewCount: t.review_count || 0,
      badges: t.tags || [],
      pricing: { hasFree: t.pricing_model === "freemium", plans: [] },
    })),
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
  if (useSupabaseRest()) {
    return safe(async () => {
      const rows = await supabaseGetStacks({ featured, limit, offset });
      return rows.map(mapStack);
    }, []);
  }
  return safe(async () => {
    const where: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (targetRole) { where.push(`s.target_role = $${i++}`); params.push(targetRole); }
    if (featured) where.push(`s.featured = true`);
    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT s.* FROM stacks s
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY s.clone_count DESC LIMIT $${i++} OFFSET $${i++}`,
      params,
    );
    const withTools = await attachTools(rows);
    return withTools.map(mapStack);
  }, []);
}

export async function getFeaturedStacks(limit = 3) {
  return getPublicStacks({ featured: true, limit });
}

export async function getStackBySlug(slug: string) {
  if (useSupabaseRest()) {
    return safe(async () => {
      const row = await supabaseGetStackBySlug(slug);
      return row ? mapStack(row) : null;
    }, null);
  }
  return safe(async () => {
    const { rows } = await db.query(`SELECT * FROM stacks WHERE slug = $1`, [slug]);
    if (!rows[0]) return null;
    const [withTools] = await attachTools(rows);
    return mapStack(withTools);
  }, null);
}

export async function getStackById(id: string) {
  if (useSupabaseRest()) {
    return safe(async () => {
      const row = await supabaseGetStackById(id);
      return row ? mapStack(row) : null;
    }, null);
  }
  return safe(async () => {
    const { rows } = await db.query(`SELECT * FROM stacks WHERE id = $1`, [id]);
    if (!rows[0]) return null;
    const [withTools] = await attachTools(rows);
    return mapStack(withTools);
  }, null);
}

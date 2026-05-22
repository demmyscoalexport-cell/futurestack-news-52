/**
 * Product Hunt → Supabase REST sync (live schema: logo_url, no futurestack_score writes).
 */
import { getSupabaseAdmin } from "@/lib/supabase/db";
import type { PHPost } from "@/lib/producthunt";
import {
  mapPHTopicsToCategory,
  mapPHPricingModel,
  votesToRating,
  votesToCatalogRating,
  phNameToSlug,
  resolvePHLogo,
} from "@/lib/producthunt";

export interface PHUpsertMeta {
  slug: string;
  name: string;
  website: string;
  tagline: string;
  description: string;
  id: string;
}

export async function getExistingPHKeys(): Promise<{
  urls: Set<string>;
  slugs: Set<string>;
}> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("tools")
    .select("website_url, slug")
    .in("status", ["active", "pending_review"]);
  if (error) throw new Error(error.message);

  const urls = new Set<string>();
  const slugs = new Set<string>();
  for (const row of data ?? []) {
    if (row.website_url) urls.add(String(row.website_url).toLowerCase());
    if (row.slug) slugs.add(String(row.slug));
  }
  return { urls, slugs };
}

export function filterNewPHPosts(
  posts: PHPost[],
  existing: { urls: Set<string>; slugs: Set<string> },
  limit?: number,
): PHPost[] {
  const filtered = posts.filter((post) => {
    if (!post.website && !post.url) return false;
    const url = (post.website || post.url).toLowerCase();
    if (existing.urls.has(url)) return false;
    const slug = phNameToSlug(post.name);
    if (existing.slugs.has(slug)) return false;
    return true;
  });
  return limit != null ? filtered.slice(0, limit) : filtered;
}

function buildToolRow(post: PHPost) {
  const slug = phNameToSlug(post.name);
  const topicNodes = post.topics.edges.map((e) => e.node);
  const category = mapPHTopicsToCategory(topicNodes);
  const { pricing_model, has_free } = mapPHPricingModel(post.tagline, post.description);
  const rating = votesToCatalogRating(post.votesCount);
  const logo = resolvePHLogo(post);
  const website = post.website || post.url;
  const description =
    post.description ||
    post.tagline ||
    `${post.name} — discovered on Product Hunt`;

  const tags: string[] = ["new", "product-hunt"];
  if (has_free) tags.push("free", "africa-friendly");
  if (post.votesCount >= 500) tags.push("trending");

  const now = new Date().toISOString();
  const baseScore = parseFloat(votesToRating(post.votesCount).toFixed(1));

  return {
    toolRow: {
      name: post.name,
      slug,
      tagline: post.tagline,
      description,
      logo_url: logo || null,
      website_url: website,
      category,
      tags,
      pricing_model,
      pricing_details: [],
      africa_friendly: has_free,
      rating,
      review_count: Math.max(1, Math.floor(post.votesCount / 10)),
      is_featured: false,
      is_verified: false,
      is_new: true,
      has_api: false,
      status: "active",
      upvote_count: post.votesCount,
      save_count: Math.floor(post.votesCount * 0.1),
      last_updated: now,
      updated_at: now,
    },
    scoreRow: {
      ease_of_use: baseScore,
      value_for_money: has_free
        ? Math.min(10, baseScore + 0.5)
        : Math.max(5, baseScore - 0.5),
      feature_depth: baseScore,
      support_quality: 7.0,
      integration_richness: 7.0,
      ai_capability:
        category === "writing" || category === "code"
          ? Math.min(10, baseScore + 0.3)
          : baseScore,
      updated_at: now,
    },
    meta: {
      slug,
      name: post.name,
      website,
      tagline: post.tagline,
      description,
    },
  };
}

/** Upsert one PH post into tools + tool_scores via Supabase REST. */
export async function upsertPHPost(post: PHPost): Promise<PHUpsertMeta> {
  const supa = getSupabaseAdmin();
  const { toolRow, scoreRow, meta } = buildToolRow(post);

  const { data, error } = await supa
    .from("tools")
    .upsert(toolRow, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: scoreError } = await supa.from("tool_scores").upsert(
    { tool_id: data.id, ...scoreRow },
    { onConflict: "tool_id" },
  );
  if (scoreError) throw new Error(scoreError.message);

  return { ...meta, id: data.id as string };
}

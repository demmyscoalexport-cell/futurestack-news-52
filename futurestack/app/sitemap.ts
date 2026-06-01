import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SEO_LANDING_PAGES } from "@/lib/seo-pages";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getdiscova.com";

type ToolSitemapRow = {
  slug: string;
  updated_at: string | null;
};

type ArticleSitemapRow = {
  slug: string;
  updated_at: string | null;
};

type ComparisonSitemapRow = {
  tool1_slug: string;
  tool2_slug: string;
  updated_at: string | null;
};

function staticSitemap(): MetadataRoute.Sitemap {
  const seoUrls: MetadataRoute.Sitemap = SEO_LANDING_PAGES.map((p) => ({
    url: `${BASE_URL}/best/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/tools`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/discover`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/compare`, priority: 0.85, changeFrequency: "weekly" },
    { url: `${BASE_URL}/collections`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${BASE_URL}/onboarding`, priority: 0.75, changeFrequency: "monthly" },
    { url: `${BASE_URL}/news`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/radar`, priority: 0.8, changeFrequency: "weekly" },
    {
      url: `${BASE_URL}/stack-builder`,
      priority: 0.8,
      changeFrequency: "weekly",
    },
    { url: `${BASE_URL}/pricing`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/stacks`, priority: 0.7, changeFrequency: "weekly" },
    {
      url: `${BASE_URL}/submit-tool`,
      priority: 0.6,
      changeFrequency: "monthly",
    },
    ...seoUrls,
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSupabaseConfigured()) {
    return staticSitemap();
  }

  const supabase = await createClient();

  // Fetch dynamic slugs in parallel
  const [
    { data: tools },
    { data: articles },
    { data: comparisons },
  ] = await Promise.all([
    supabase
      .from("tools")
      .select("slug, updated_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("articles")
      .select("slug, updated_at")
      .in("status", ["published", "PUBLISHED"])
      .order("published_at", { ascending: false })
      .limit(300),
    supabase
      .from("tool_comparisons")
      .select("tool1_slug, tool2_slug, updated_at")
      .order("view_count", { ascending: false })
      .limit(50),
  ]);

  const toolUrls: MetadataRoute.Sitemap = ((tools ?? []) as ToolSitemapRow[]).map((t) => ({
    url: `${BASE_URL}/tools/${t.slug}`,
    lastModified: t.updated_at ? new Date(t.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const articleUrls: MetadataRoute.Sitemap = (
    (articles ?? []) as ArticleSitemapRow[]
  ).map((a) => ({
    url: `${BASE_URL}/news/${a.slug}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const comparisonUrls: MetadataRoute.Sitemap = (
    (comparisons ?? []) as ComparisonSitemapRow[]
  ).map((c) => ({
      url: `${BASE_URL}/compare/${c.tool1_slug}-vs-${c.tool2_slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
  }));

  return [
    ...staticSitemap(),
    ...toolUrls,
    ...articleUrls,
    ...comparisonUrls,
  ];
}

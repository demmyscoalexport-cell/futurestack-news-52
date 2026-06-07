import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SEO_LANDING_PAGES } from "@/lib/seo-pages";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getdiscova.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let tools: { slug: string; updated_at: string }[] = [];
  let articles: { slug: string; updated_at: string }[] = [];
  let comparisons: { tool1_slug: string; tool2_slug: string; updated_at: string }[] = [];

  try {
    const supabase = await createClient();
    const [toolsRes, articlesRes, comparisonsRes] = await Promise.all([
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
    tools = toolsRes.data ?? [];
    articles = articlesRes.data ?? [];
    comparisons = comparisonsRes.data ?? [];
  } catch {
    // Supabase not available at build time — sitemap will only include static routes
  }

  const toolUrls: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${BASE_URL}/tools/${t.slug}`,
    lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const newsUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/news/${a.slug}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const blogUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/blog/${a.slug}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const comparisonUrls: MetadataRoute.Sitemap = comparisons.map(
    (c) => ({
      url: `${BASE_URL}/compare/${c.tool1_slug}-vs-${c.tool2_slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

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
    { url: `${BASE_URL}/blog`, priority: 0.9, changeFrequency: "daily" },
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
    ...toolUrls,
    ...newsUrls,
    ...blogUrls,
    ...comparisonUrls,
    ...seoUrls,
  ];
}

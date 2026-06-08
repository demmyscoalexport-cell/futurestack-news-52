/**
 * Blog content service — reads from Contentful first, falls back to Supabase articles.
 */
import type {
  BlogPost,
  BlogListItem,
  BlogAuthor,
  BlogCategory,
  BlogTag,
  BlogSearchResult,
} from "./types";
import { estimateReadingTime, getCategoryName } from "./utils";
import { config } from "@/lib/config";

function getContentfulBase(): string | null {
  const { spaceId, environment, deliveryToken } = config.contentful;
  if (!spaceId || !deliveryToken) return null;
  const host = config.contentful.usePreviewApi
    ? "preview.contentful.com"
    : "cdn.contentful.com";
  return `https://${host}/spaces/${spaceId}/environments/${environment}`;
}

function contentfulHeaders() {
  const token = config.contentful.usePreviewApi
    ? config.contentful.previewToken
    : config.contentful.deliveryToken;
  return { Authorization: `Bearer ${token}` };
}

async function contentfulFetch(path: string): Promise<unknown> {
  const base = getContentfulBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      headers: contentfulHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Mappers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAuthor(entry: any): BlogAuthor {
  const f = entry?.fields ?? {};
  return {
    id: entry?.sys?.id ?? "discova",
    name: f.name ?? "DISCOVA Team",
    slug: f.slug ?? "discova-team",
    bio: f.bio ?? "The DISCOVA editorial team.",
    avatar: f.avatar?.fields?.file?.url
      ? `https:${f.avatar.fields.file.url}`
      : undefined,
    role: f.role ?? "Editor",
    twitter: f.twitter,
    linkedin: f.linkedin,
    website: f.website,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(entry: any): BlogCategory {
  const f = entry?.fields ?? {};
  return {
    id: entry?.sys?.id ?? "ai-tools",
    name: f.name ?? getCategoryName(f.slug ?? "ai-tools"),
    slug: f.slug ?? "ai-tools",
    description: f.description,
    color: f.color,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTag(entry: any): BlogTag {
  const f = entry?.fields ?? {};
  return {
    id: entry?.sys?.id ?? f.slug ?? "tag",
    name: f.name ?? f.slug ?? "tag",
    slug: f.slug ?? "tag",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function richTextToMarkdown(doc: any): string {
  if (!doc || doc.nodeType !== "document") return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function nodeToMd(node: any): string {
    if (!node) return "";
    switch (node.nodeType) {
      case "document":
        return node.content.map(nodeToMd).join("\n\n");
      case "paragraph":
        return node.content.map(nodeToMd).join("");
      case "heading-1":
        return `# ${node.content.map(nodeToMd).join("")}`;
      case "heading-2":
        return `## ${node.content.map(nodeToMd).join("")}`;
      case "heading-3":
        return `### ${node.content.map(nodeToMd).join("")}`;
      case "heading-4":
        return `#### ${node.content.map(nodeToMd).join("")}`;
      case "unordered-list":
        return node.content
          .map((item: unknown) => `- ${nodeToMd(item as typeof node).trim()}`)
          .join("\n");
      case "ordered-list":
        return node.content
          .map((item: unknown, i: number) => `${i + 1}. ${nodeToMd(item as typeof node).trim()}`)
          .join("\n");
      case "list-item":
        return node.content.map(nodeToMd).join("");
      case "blockquote":
        return node.content
          .map((n: typeof node) => `> ${nodeToMd(n)}`)
          .join("\n");
      case "code":
        return `\`\`\`\n${node.content.map(nodeToMd).join("")}\n\`\`\``;
      case "hr":
        return "---";
      case "text": {
        let text = node.value ?? "";
        if (node.marks?.some((m: { type: string }) => m.type === "bold")) text = `**${text}**`;
        if (node.marks?.some((m: { type: string }) => m.type === "italic")) text = `*${text}*`;
        if (node.marks?.some((m: { type: string }) => m.type === "code")) text = `\`${text}\``;
        return text;
      }
      case "hyperlink":
        return `[${node.content.map(nodeToMd).join("")}](${node.data?.uri ?? "#"})`;
      case "embedded-asset-block": {
        const asset = node.data?.target?.fields;
        if (asset?.file?.url)
          return `![${asset.title ?? ""}](https:${asset.file.url})`;
        return "";
      }
      default:
        return node.content ? node.content.map(nodeToMd).join("") : "";
    }
  }
  return nodeToMd(doc);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBlogPost(entry: any, includes?: any): BlogPost {
  const f = entry?.fields ?? {};
  const content = typeof f.content === "string"
    ? f.content
    : richTextToMarkdown(f.content);

  const authorEntry = f.author?.sys?.id
    ? includes?.Entry?.find((e: { sys: { id: string } }) => e.sys.id === f.author.sys.id)
    : null;
  const categoryEntry = f.category?.sys?.id
    ? includes?.Entry?.find((e: { sys: { id: string } }) => e.sys.id === f.category.sys.id)
    : null;
  const tagEntries = (f.tags ?? [])
    .map((t: { sys: { id: string } }) =>
      includes?.Entry?.find((e: { sys: { id: string } }) => e.sys.id === t.sys?.id)
    )
    .filter(Boolean);

  const author: BlogAuthor = authorEntry
    ? mapAuthor(authorEntry)
    : { id: "discova", name: "DISCOVA Team", slug: "discova-team", bio: "" };

  const category: BlogCategory = categoryEntry
    ? mapCategory(categoryEntry)
    : {
        id: f.categorySlug ?? "ai-tools",
        name: getCategoryName(f.categorySlug ?? "ai-tools"),
        slug: f.categorySlug ?? "ai-tools",
      };

  const tags: BlogTag[] = tagEntries.map(mapTag);

  const publishedAt = f.publishDate ?? entry.sys?.createdAt ?? new Date().toISOString();
  const updatedAt = f.updatedDate ?? entry.sys?.updatedAt ?? publishedAt;
  const readingTime = f.readingTime ?? estimateReadingTime(content);

  return {
    id: entry.sys?.id ?? f.slug,
    title: f.title ?? "Untitled",
    slug: f.slug ?? "",
    excerpt: f.excerpt ?? f.description ?? "",
    content,
    featuredImage: f.featuredImage?.fields?.file?.url
      ? `https:${f.featuredImage.fields.file.url}`
      : f.heroImage?.fields?.file?.url
      ? `https:${f.heroImage.fields.file.url}`
      : undefined,
    featuredImageAlt: f.featuredImage?.fields?.title ?? f.title,
    category,
    tags,
    author,
    faqs: Array.isArray(f.faqs)
      ? f.faqs.map((q: { question?: string; answer?: string }) => ({
          question: q.question ?? "",
          answer: q.answer ?? "",
        }))
      : undefined,
    seo: f.seo
      ? {
          metaTitle: f.seo.fields?.metaTitle,
          metaDescription: f.seo.fields?.metaDescription,
          focusKeyword: f.seo.fields?.focusKeyword,
          keywords: f.seo.fields?.keywords,
        }
      : undefined,
    publishedAt,
    updatedAt,
    readingTime,
    featured: f.featured ?? false,
    status: f.status ?? "published",
    tldr: f.tldr,
    keyTakeaways: f.keyTakeaways ?? f.key_takeaways,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toListItem(post: BlogPost): BlogListItem {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    category: post.category,
    tags: post.tags,
    author: post.author,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
    featured: post.featured,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getBlogPosts(options?: {
  limit?: number;
  skip?: number;
  category?: string;
  tag?: string;
  featured?: boolean;
  order?: string;
}): Promise<BlogSearchResult> {
  const limit = options?.limit ?? 12;
  const skip = options?.skip ?? 0;

  const params = new URLSearchParams({
    content_type: "blogPost",
    limit: String(limit),
    skip: String(skip),
    include: "3",
    "fields.status": "published",
    order: options?.order ?? "-fields.publishDate",
  });

  if (options?.category) params.set("fields.category.fields.slug", options.category);
  if (options?.featured) params.set("fields.featured", "true");

  const data = await contentfulFetch(`/entries?${params}`) as {
    items?: unknown[];
    total?: number;
    includes?: unknown;
  } | null;

  if (!data?.items?.length) {
    return getSupabaseBlogPosts(options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = data.items.map((item: any) =>
    toListItem(mapBlogPost(item, data.includes))
  );

  return {
    posts,
    total: data.total ?? posts.length,
    page: Math.floor(skip / limit) + 1,
    perPage: limit,
    hasMore: skip + limit < (data.total ?? 0),
  };
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const data = await contentfulFetch(
    `/entries?content_type=blogPost&fields.slug=${slug}&include=5&limit=1`
  ) as { items?: unknown[]; includes?: unknown } | null;

  if (data?.items?.[0]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapBlogPost(data.items[0] as any, data.includes);
  }

  return getSupabaseBlogPostBySlug(slug);
}

export async function getFeaturedBlogPosts(limit = 4): Promise<BlogListItem[]> {
  const result = await getBlogPosts({ limit, featured: true });
  if (result.posts.length > 0) return result.posts;

  const all = await getBlogPosts({ limit });
  return all.posts.slice(0, limit);
}

export async function getRelatedBlogPosts(
  post: BlogPost,
  limit = 3
): Promise<BlogListItem[]> {
  const result = await getBlogPosts({
    category: post.category.slug,
    limit: limit + 1,
  });
  return result.posts.filter((p) => p.slug !== post.slug).slice(0, limit);
}

// ─── Supabase fallback ───────────────────────────────────────────────────────

async function getSupabaseBlogPosts(options?: {
  limit?: number;
  skip?: number;
  category?: string;
  featured?: boolean;
}): Promise<BlogSearchResult> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    let query = supabase
      .from("articles")
      .select("*", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (options?.category) query = query.eq("category", options.category);
    if (options?.featured) query = query.eq("featured", true);
    if (options?.skip) query = query.range(options.skip, (options.skip ?? 0) + (options.limit ?? 12) - 1);
    else query = query.limit(options?.limit ?? 12);

    const { data, count } = await query;

    const posts: BlogListItem[] = (data ?? []).map(supabaseArticleToBlogListItem);
    const limit = options?.limit ?? 12;
    const skip = options?.skip ?? 0;

    return {
      posts,
      total: count ?? posts.length,
      page: Math.floor(skip / limit) + 1,
      perPage: limit,
      hasMore: skip + posts.length < (count ?? 0),
    };
  } catch {
    return { posts: FALLBACK_POSTS, total: FALLBACK_POSTS.length, page: 1, perPage: 12, hasMore: false };
  }
}

async function getSupabaseBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (!data) return FALLBACK_POSTS_FULL.find((p) => p.slug === slug) ?? null;
    return supabaseArticleToBlogPost(data);
  } catch {
    return FALLBACK_POSTS_FULL.find((p) => p.slug === slug) ?? null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function supabaseArticleToBlogListItem(row: any): BlogListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    featuredImage: row.featured_image ?? row.cover_image_url ?? row.hero_image,
    category: {
      id: row.category ?? "ai-tools",
      name: getCategoryName(row.category ?? "ai-tools"),
      slug: row.category ?? "ai-tools",
    },
    tags: (row.tags ?? []).map((t: string) => ({ id: t, name: t, slug: t })),
    author: {
      id: row.author_id ?? "discova",
      name: row.author_name ?? "DISCOVA Team",
      slug: "discova-team",
      bio: "",
    },
    publishedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
    readingTime: row.read_time ?? row.reading_time ?? 5,
    featured: row.featured ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function supabaseArticleToBlogPost(row: any): BlogPost {
  const li = supabaseArticleToBlogListItem(row);
  return {
    ...li,
    content: row.content ?? "",
    updatedAt: row.updated_at ?? li.publishedAt,
    status: row.status ?? "published",
    faqs: row.faqs,
    keyTakeaways: row.key_takeaways,
    tldr: row.tldr,
  };
}

// ─── Static fallback data ────────────────────────────────────────────────────

const FALLBACK_AUTHOR: BlogAuthor = {
  id: "discova-team",
  name: "DISCOVA Team",
  slug: "discova-team",
  bio: "The DISCOVA editorial team researches and reviews the best AI tools and software.",
  role: "Editorial Team",
};

export const FALLBACK_POSTS: BlogListItem[] = [
  {
    id: "1",
    title: "Best AI Tools in 2026: The Definitive Guide",
    slug: "best-ai-tools-2026",
    excerpt:
      "We tested 200+ AI tools so you don't have to. Here are the ones that actually deliver results for creators, founders, and teams.",
    featuredImage: undefined,
    category: { id: "ai-tools", name: "AI Tools", slug: "ai-tools" },
    tags: [
      { id: "ai", name: "AI", slug: "ai" },
      { id: "tools", name: "Tools", slug: "tools" },
    ],
    author: FALLBACK_AUTHOR,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    readingTime: 18,
    featured: true,
  },
  {
    id: "2",
    title: "ChatGPT vs Claude: Which AI Is Right for Your Business in 2026?",
    slug: "chatgpt-vs-claude-2026",
    excerpt:
      "A head-to-head comparison of the two most powerful AI assistants. We break down writing, coding, analysis, and pricing — so you can decide.",
    featuredImage: undefined,
    category: { id: "comparisons", name: "Comparisons", slug: "comparisons" },
    tags: [
      { id: "chatgpt", name: "ChatGPT", slug: "chatgpt" },
      { id: "claude", name: "Claude", slug: "claude" },
    ],
    author: FALLBACK_AUTHOR,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    readingTime: 12,
    featured: true,
  },
  {
    id: "3",
    title: "The Complete Guide to AI Writing Tools for Content Marketers",
    slug: "ai-writing-tools-guide",
    excerpt:
      "From ideation to publishing, discover how AI writing tools can 10x your content output without sacrificing quality.",
    featuredImage: undefined,
    category: { id: "ai-writing", name: "AI Writing", slug: "ai-writing" },
    tags: [
      { id: "writing", name: "Writing", slug: "writing" },
      { id: "content", name: "Content", slug: "content" },
    ],
    author: FALLBACK_AUTHOR,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    readingTime: 14,
    featured: false,
  },
  {
    id: "4",
    title: "Best AI Coding Tools: Cursor vs Windsurf vs GitHub Copilot",
    slug: "best-ai-coding-tools",
    excerpt:
      "We put the top AI coding assistants through real-world tests. Here's which one actually makes you a better developer.",
    featuredImage: undefined,
    category: { id: "ai-coding", name: "AI Coding", slug: "ai-coding" },
    tags: [
      { id: "coding", name: "Coding", slug: "coding" },
      { id: "cursor", name: "Cursor", slug: "cursor" },
    ],
    author: FALLBACK_AUTHOR,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    readingTime: 11,
    featured: false,
  },
  {
    id: "5",
    title: "How to Build a $1M Business With AI Tools (2026 Playbook)",
    slug: "build-business-with-ai-tools",
    excerpt:
      "Real founders share how they've used AI to replace expensive hires, automate workflows, and grow revenue — without a VC check.",
    featuredImage: undefined,
    category: { id: "startups", name: "Startups", slug: "startups" },
    tags: [
      { id: "startups", name: "Startups", slug: "startups" },
      { id: "business", name: "Business", slug: "business" },
    ],
    author: FALLBACK_AUTHOR,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    readingTime: 16,
    featured: false,
  },
  {
    id: "6",
    title: "AI SEO in 2026: How to Rank on ChatGPT, Perplexity & Google",
    slug: "ai-seo-guide-2026",
    excerpt:
      "Search has changed. Here's your updated playbook for ranking on AI-powered search engines alongside traditional Google SEO.",
    featuredImage: undefined,
    category: { id: "seo", name: "SEO", slug: "seo" },
    tags: [
      { id: "seo", name: "SEO", slug: "seo" },
      { id: "ai-search", name: "AI Search", slug: "ai-search" },
    ],
    author: FALLBACK_AUTHOR,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    readingTime: 13,
    featured: false,
  },
];

export const FALLBACK_POSTS_FULL: BlogPost[] = FALLBACK_POSTS.map((p) => ({
  ...p,
  content: `## Introduction\n\nThis is a placeholder article for **${p.title}**.\n\n## Key Points\n\nCheck back soon for the full content.\n\n## Conclusion\n\nStay tuned for more updates from the DISCOVA team.`,
  updatedAt: p.publishedAt,
  status: "published" as const,
}));

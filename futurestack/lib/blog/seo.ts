import type { Metadata } from "next";
import type { BlogPost, BlogListItem, BlogCategory, BlogAuthor } from "./types";

const SITE_URL = "https://getdiscova.com";
const SITE_NAME = "DISCOVA";
const DEFAULT_OG = `${SITE_URL}/og-default.png`;

function buildOGImageUrl(title: string, category?: string): string {
  const params = new URLSearchParams({ title });
  if (category) params.set("category", category);
  return `${SITE_URL}/api/og/article?${params}`;
}

export function getBlogIndexMeta(): Metadata {
  const title = "Blog — AI Tools, Guides & Insights | DISCOVA";
  const description =
    "Expert guides, comparisons, and industry insights on the best AI tools. Learn how to use AI to grow your business, create content, and automate workflows.";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog`,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG],
    },
  };
}

export function getBlogPostMeta(post: BlogPost): Metadata {
  const seo = post.seo ?? {};
  const title = seo.metaTitle ?? `${post.title} | DISCOVA Blog`;
  const description = seo.metaDescription ?? post.excerpt;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const ogImage = post.featuredImage ?? buildOGImageUrl(post.title, post.category.name);

  return {
    title,
    description,
    keywords: seo.keywords ?? post.tags.map((t) => t.name),
    authors: [{ name: post.author.name, url: `${SITE_URL}/blog/author/${post.author.slug}` }],
    alternates: {
      canonical: seo.canonicalUrl ?? url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      section: post.category.name,
      tags: post.tags.map((t) => t.name),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.featuredImageAlt ?? post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: post.author.twitter ? `@${post.author.twitter}` : "@getdiscova",
    },
    robots: seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  };
}

export function getBlogCategoryMeta(category: BlogCategory): Metadata {
  const title = `${category.name} Articles & Guides | DISCOVA Blog`;
  const description =
    category.description ??
    `Browse our collection of expert ${category.name} articles, guides, and insights on DISCOVA.`;
  const url = `${SITE_URL}/blog/category/${category.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function getBlogAuthorMeta(author: BlogAuthor): Metadata {
  const title = `${author.name} — Author | DISCOVA Blog`;
  const description = author.bio || `Articles and guides by ${author.name} on DISCOVA Blog.`;
  const url = `${SITE_URL}/blog/author/${author.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "profile",
      images: author.avatar ? [{ url: author.avatar, width: 400, height: 400, alt: author.name }] : [],
    },
    twitter: { card: "summary", title, description, images: author.avatar ? [author.avatar] : [] },
  };
}

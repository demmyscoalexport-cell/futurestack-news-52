import type { Article, Tool } from "@/lib/types";
import type {
  ContentfulEntry,
  NewsArticleContentFields,
  ToolContentFields,
} from "@/lib/contentful/types";

const DEFAULT_AUTHOR = {
  id: "futurestack-editorial",
  name: "DISCOVA Editorial",
  avatar: "/images/authors/futurestack.png",
  role: "Editorial Team",
};

export function mapContentfulTool(
  entry: ContentfulEntry<ToolContentFields>,
): Tool {
  const fields = entry.fields;
  const category = (fields.categorySlug ?? "productivity") as Tool["category"];

  return {
    id: entry.sys.id,
    name: fields.name,
    slug: fields.slug,
    description: fields.longDescription ?? fields.description ?? "",
    shortDescription: fields.tagline ?? fields.description ?? "",
    logo: fields.logoUrl ?? "/placeholder-logo.svg",
    category,
    subcategories: fields.subcategorySlugs ?? [],
    pricing: {
      hasFree: fields.freeTier ?? false,
      plans: [
        {
          name: fields.pricingModel ?? "Standard",
          price:
            typeof fields.startingPrice === "number"
              ? `$${fields.startingPrice}`
              : "Custom",
          period: "month",
          features: [],
        },
      ],
    },
    rating:
      typeof fields.futurestackScore === "number"
        ? Math.min(5, Math.max(1, fields.futurestackScore / 20))
        : 0,
    reviewCount: 0,
    badges: [
      ...(fields.verified ? ["editor-pick" as const] : []),
      ...(fields.featured ? ["trending" as const] : []),
    ],
    integrations: [],
    platforms: ["web"],
    website: fields.websiteUrl ?? "",
    africaFriendly: true,
    bestFor: fields.audience ?? fields.tags ?? [],
    pros: fields.pros ?? [],
    cons: fields.cons ?? [],
    lastUpdated: entry.sys.updatedAt,
    screenshots: fields.galleryImages ?? [],
    tagline: fields.tagline,
    website_url: fields.websiteUrl,
    has_free: fields.freeTier,
    pricing_model: fields.pricingModel,
    is_featured: fields.featured,
    is_new: fields.trending,
    tags: fields.tags,
    status: fields.status,
    features: fields.features,
    videos: fields.videos,
    faqs: fields.faqs,
    useCases: fields.useCases,
  };
}

export function mapContentfulArticle(
  entry: ContentfulEntry<NewsArticleContentFields>,
): Article {
  const fields = entry.fields;
  const content =
    typeof fields.body === "string"
      ? fields.body
      : fields.body
        ? JSON.stringify(fields.body)
        : "";

  return {
    id: entry.sys.id,
    slug: fields.slug,
    title: fields.title,
    excerpt: fields.excerpt ?? "",
    content,
    featuredImage: fields.heroImageUrl ?? "/placeholder.svg",
    author: DEFAULT_AUTHOR,
    publishedAt:
      fields.publishedAt ?? fields.publishDate ?? entry.sys.createdAt,
    updatedAt: entry.sys.updatedAt,
    readTime: fields.readingTime ?? 4,
    category: "saas-news",
    tags: fields.tags ?? [],
    targetRoles: ["freelancer", "agency", "saas-founder"],
    viewCount: 0,
    featured: false,
  };
}

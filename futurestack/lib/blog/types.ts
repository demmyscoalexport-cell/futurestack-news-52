export interface BlogAuthor {
  id: string;
  name: string;
  slug: string;
  bio: string;
  avatar?: string;
  role?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  count?: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogSEOMeta {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export interface BlogToolRecommendation {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description: string;
  category: string;
  rating?: number;
  pricingModel?: string;
  visitUrl?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  category: BlogCategory;
  tags: BlogTag[];
  author: BlogAuthor;
  faqs?: BlogFAQ[];
  seo?: BlogSEOMeta;
  recommendedTools?: BlogToolRecommendation[];
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  featured: boolean;
  status: "draft" | "published" | "archived";
  tldr?: string;
  keyTakeaways?: string[];
  series?: {
    id: string;
    title: string;
    position: number;
    total: number;
  };
}

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category: BlogCategory;
  tags: BlogTag[];
  author: BlogAuthor;
  publishedAt: string;
  readingTime: number;
  featured: boolean;
}

export interface BlogCollection {
  id: string;
  title: string;
  description: string;
  slug: string;
  coverImage?: string;
  articles: BlogListItem[];
}

export interface BlogSearchResult {
  posts: BlogListItem[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export type BlogSortBy = "newest" | "oldest" | "popular";

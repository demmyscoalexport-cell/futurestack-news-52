export interface ContentfulSys {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentfulEntry<TFields = Record<string, unknown>> {
  sys: ContentfulSys;
  fields: TFields;
}

export interface ContentfulCollection<TFields = Record<string, unknown>> {
  total: number;
  skip: number;
  limit: number;
  items: Array<ContentfulEntry<TFields>>;
}

export interface ToolContentFields {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  categorySlug?: string;
  subcategorySlugs?: string[];
  tags?: string[];
  pricingModel?: string;
  startingPrice?: number;
  freeTier?: boolean;
  verified?: boolean;
  futurestackScore?: number;
  status?: "draft" | "published" | "archived";
}

export interface NewsArticleContentFields {
  title: string;
  slug: string;
  excerpt?: string;
  body?: string | Record<string, unknown>;
  heroImageUrl?: string;
  publishDate?: string;
  featuredImage?: {
    sys?: {
      id?: string;
    };
  };
  tags?: string[];
  readingTime?: number;
  status?: "draft" | "published" | "archived";
  publishedAt?: string;
}

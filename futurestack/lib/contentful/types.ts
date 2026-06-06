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
  longDescription?: string;
  logoUrl?: string;
  websiteUrl?: string;
  companyName?: string;
  heroImage?: string;
  galleryImages?: string[];
  categorySlug?: string;
  subcategorySlugs?: string[];
  tags?: string[];
  audience?: string[];
  useCases?: string[];
  pros?: string[];
  cons?: string[];
  features?: ToolFeatureFields[];
  videos?: ToolVideoFields[];
  faqs?: ToolFAQFields[];
  alternatives?: ToolAlternativeFields[];
  aiSummary30?: string;
  aiSummary120?: string;
  aiDeepAnalysis?: string;
  pricingModel?: string;
  startingPrice?: number;
  freeTier?: boolean;
  verified?: boolean;
  featured?: boolean;
  trending?: boolean;
  editorPick?: boolean;
  futurestackScore?: number;
  status?: "draft" | "published" | "archived";
}

export interface ToolFeatureFields {
  title: string;
  description: string;
  icon?: string;
  priority?: number;
}

export interface ToolVideoFields {
  title: string;
  youtubeUrl: string;
  thumbnail?: string;
  duration?: string;
  creator?: string;
  featured?: boolean;
}

export interface ToolFAQFields {
  question: string;
  answer: string;
  order?: number;
}

export interface ToolAlternativeFields {
  name: string;
  slug: string;
  logoUrl?: string;
  summary?: string;
}

export interface ToolPricingFields {
  tierName: string;
  priceMonthly?: number;
  priceAnnual?: number;
  currency?: string;
  features?: string[];
  isPopular?: boolean;
  isFreeTier?: boolean;
}

export interface ToolCompanyFields {
  name: string;
  slug: string;
  websiteUrl?: string;
  logoUrl?: string;
}

export interface VerificationStatusFields {
  officialWebsiteVerified?: boolean;
  workingProduct?: boolean;
  reviewedByDiscova?: boolean;
  noMalware?: boolean;
  noSpam?: boolean;
  recentlyUpdated?: boolean;
  trustedSource?: boolean;
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

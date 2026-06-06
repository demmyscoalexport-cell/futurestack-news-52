export type UserRole = "freelancer" | "agency" | "saas-founder";

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  logo: string;
  category: ToolCategory;
  subcategories: string[];
  pricing: ToolPricing;
  rating: number;
  reviewCount: number;
  badges: ToolBadge[];
  integrations: string[];
  platforms: string[];
  website: string;
  africaFriendly: boolean;
  bestFor: string[];
  pros: string[];
  cons: string[];
  lastUpdated: string;
  screenshots?: string[];
  gallery?: string[];
  heroImage?: string;
  company_name?: string;
  features?: Array<{ title: string; description: string; icon?: string; priority?: number }> | string[];
  videos?: Array<{
    title: string;
    youtubeUrl: string;
    thumbnail?: string;
    duration?: string;
    creator?: string;
    featured?: boolean;
  }>;
  faqs?: Array<{ question: string; answer: string; order?: number }>;
  useCases?: string[];
  audience?: string[];
  aiSummary30?: string;
  aiSummary120?: string;
  aiDeepAnalysis?: string;
  // DB snake_case fields returned from SQL queries
  tagline?: string;
  category_name?: string;
  category_icon?: string;
  created_at?: string;
  updated_at?: string;
  website_url?: string;
  has_free?: boolean;
  pricing_model?: string;
  is_featured?: boolean;
  is_new?: boolean;
  africa_friendly?: boolean;
  upvote_count?: number;
  review_count?: number;
  view_count?: number;
  save_count?: number;
  source?: string;
  producthunt_url?: string;
  futurestack_score?: number;
  tags?: string[];
  status?: string;
}

export type ToolCategory =
  | "writing"
  | "design"
  | "code"
  | "video"
  | "audio"
  | "data"
  | "automation"
  | "productivity"
  | "marketing"
  | "analytics";

export interface ToolPricing {
  hasFree: boolean;
  freeDescription?: string;
  plans: PricingPlan[];
}

export interface PricingPlan {
  name: string;
  price: string;
  period: "month" | "year" | "one-time";
  features: string[];
}

export type ToolBadge =
  | "free"
  | "pro"
  | "africa-friendly"
  | "no-code"
  | "new"
  | "trending"
  | "editor-pick";

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: Author;
  publishedAt: string;
  updatedAt: string;
  readTime: number;
  category: ArticleCategory;
  tags: string[];
  targetRoles: UserRole[];
  viewCount: number;
  featured: boolean;
  toolsCompared?: Tool[];
}

export type ArticleCategory =
  | "ai-tools"
  | "saas-news"
  | "tutorials"
  | "case-studies"
  | "comparisons"
  | "industry-trends";

export interface Author {
  id: string;
  name: string;
  avatar: string;
  role: string;
  bio?: string;
}

export interface Stack {
  id: string;
  slug: string;
  name: string;
  description: string;
  tools: Tool[];
  creator: Author;
  targetRole: UserRole;
  category: string;
  cloneCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  verified: boolean;
  rating: number;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  location?: string;
}

export interface NewsletterSubscription {
  email: string;
  role?: UserRole;
  topics: ArticleCategory[];
  frequency: "daily" | "weekly" | "breaking-only";
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  savedTools: string[];
  savedStacks: string[];
  myStacks: Stack[];
  aiToolScore: number;
  newsletterSettings: NewsletterSubscription;
  createdAt: string;
}

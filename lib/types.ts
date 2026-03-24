export type UserRole = 'freelancer' | 'agency' | 'saas-founder'

export interface Tool {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  logo: string
  category: ToolCategory
  subcategories: string[]
  pricing: ToolPricing
  rating: number
  reviewCount: number
  badges: ToolBadge[]
  integrations: string[]
  platforms: string[]
  website: string
  africaFriendly: boolean
  bestFor: string[]
  pros: string[]
  cons: string[]
  lastUpdated: string
}

export type ToolCategory = 
  | 'writing'
  | 'design'
  | 'code'
  | 'video'
  | 'audio'
  | 'data'
  | 'automation'
  | 'productivity'
  | 'marketing'
  | 'analytics'

export interface ToolPricing {
  hasFree: boolean
  freeDescription?: string
  plans: PricingPlan[]
}

export interface PricingPlan {
  name: string
  price: string
  period: 'month' | 'year' | 'one-time'
  features: string[]
}

export type ToolBadge = 
  | 'free'
  | 'pro'
  | 'africa-friendly'
  | 'no-code'
  | 'new'
  | 'trending'
  | 'editor-pick'

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  featuredImage: string
  author: Author
  publishedAt: string
  updatedAt: string
  readTime: number
  category: ArticleCategory
  tags: string[]
  targetRoles: UserRole[]
  viewCount: number
  featured: boolean
  toolsCompared?: Tool[]
}

export type ArticleCategory = 
  | 'ai-tools'
  | 'saas-news'
  | 'tutorials'
  | 'case-studies'
  | 'comparisons'
  | 'industry-trends'

export interface Author {
  id: string
  name: string
  avatar: string
  role: string
  bio?: string
}

export interface Stack {
  id: string
  slug: string
  name: string
  description: string
  tools: Tool[]
  creator: Author
  targetRole: UserRole
  category: string
  cloneCount: number
  rating: number
  createdAt: string
  updatedAt: string
  featured: boolean
}

export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar: string
  verified: boolean
  rating: number
  content: string
  upvotes: number
  downvotes: number
  createdAt: string
  location?: string
}

export interface NewsletterSubscription {
  email: string
  role?: UserRole
  topics: ArticleCategory[]
  frequency: 'daily' | 'weekly' | 'breaking-only'
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
  savedTools: string[]
  savedStacks: string[]
  myStacks: Stack[]
  aiToolScore: number
  newsletterSettings: NewsletterSubscription
  createdAt: string
}

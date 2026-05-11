// ─── Shared signal shape coming from RSS or Perplexity ───────────────────────
export interface NewsSignal {
  title: string;
  summary: string;
  url: string;
  category: string; // e.g. 'ai-tools', 'saas-news', 'industry-trends'
  source: string; // feed name or 'perplexity'
  fetchedAt: string; // ISO timestamp
}

// ─── Inngest event payloads ───────────────────────────────────────────────────
export interface FetchSignalsEvent {
  triggeredBy?: string; // 'cron' | 'manual'
}

export interface SignalReceivedEvent {
  signal: NewsSignal;
}

export interface ArticleApprovedEvent {
  signal: NewsSignal;
  relevanceScore: number;
  articleAngle: string;
  reason: string;
}

export interface ArticlePublishedEvent {
  articleId: string;
  slug: string;
  title: string;
  publishedAt: string;
}

// ─── AI output shapes ─────────────────────────────────────────────────────────
export interface RelevanceJudgment {
  score: number; // 1–10
  reason: string;
  article_angle: string;
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  content: string; // MDX
  excerpt: string;
  readTime: number;
  category: string;
  tags: string[];
  targetRoles: string[];
}

export interface SeoMeta {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  focusKeyword: string;
}

export interface SocialCopy {
  twitter: string;
  linkedin: string;
  instagram: string;
}

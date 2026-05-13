/**
 * GNews API client — fetches real AI/tech news articles
 * Docs: https://gnews.io/docs/v4
 */

export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

const BASE_URL = "https://gnews.io/api/v4";

const QUERIES = [
  { q: "AI tools productivity SaaS", category: "ai-tools" },
  { q: "artificial intelligence software startup", category: "ai-tools" },
  { q: "ChatGPT Claude Gemini Anthropic OpenAI", category: "ai-tools" },
  { q: "automation workflow no-code tools", category: "automation" },
  { q: "SaaS business growth technology", category: "saas-news" },
  { q: "AI design tools creative software", category: "design" },
  { q: "machine learning developer tools", category: "ai-tools" },
];

export async function fetchGNewsArticles(opts: {
  query?: string;
  max?: number;
  lang?: string;
}): Promise<GNewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) throw new Error("GNEWS_API_KEY not set");

  const { query = "artificial intelligence tools", max = 10, lang = "en" } = opts;

  const params = new URLSearchParams({
    q: query,
    token: apiKey,
    lang,
    max: String(max),
    in: "title,description",
    sortby: "publishedAt",
  });

  const res = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { "User-Agent": "DISCOVA/1.0" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GNews API error ${res.status}: ${body}`);
  }

  const data: GNewsResponse = await res.json();
  return data.articles ?? [];
}

export async function fetchMultipleTopics(maxPerTopic = 5): Promise<GNewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  // Fetch from multiple queries and deduplicate by URL
  const seen = new Set<string>();
  const all: GNewsArticle[] = [];

  // Run in parallel but limit to 3 topics to stay within free tier rate limits
  const selectedQueries = QUERIES.slice(0, 3);

  const results = await Promise.allSettled(
    selectedQueries.map((q) =>
      fetchGNewsArticles({ query: q.q, max: maxPerTopic }),
    ),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const article of result.value) {
        if (!seen.has(article.url)) {
          seen.add(article.url);
          all.push(article);
        }
      }
    }
  }

  return all;
}

/** Map a GNews article to a category slug */
export function categoriseArticle(article: GNewsArticle): string {
  const text = `${article.title} ${article.description}`.toLowerCase();
  if (/automat|workflow|zapier|make\.com|n8n/.test(text)) return "automation";
  if (/design|figma|canva|midjourney|dall-e|stable.diffusion/.test(text)) return "design";
  if (/market|seo|ads|content.creat/.test(text)) return "marketing";
  if (/code|develop|github|vs.code|cursor|copilot/.test(text)) return "tutorials";
  if (/africa|nigeria|kenya|ghana|startups.*africa/.test(text)) return "africa-tech";
  if (/trend|report|survey|industry|2026/.test(text)) return "industry-trends";
  return "ai-tools";
}

/** Estimate reading time from content */
export function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

/**
 * ScrapingBee client for DISCOVA
 *
 * Scrapes full article content from premium tech news sites that block
 * simple HTTP requests or require JavaScript rendering.
 *
 * Docs: https://www.scrapingbee.com/documentation/
 */

const BASE_URL = "https://app.scrapingbee.com/api/v1/";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScrapedArticle {
  title: string;
  excerpt: string;
  content: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string | null;
  author: string | null;
  sourceName: string;
  sourceDomain: string;
}

export interface NewsSource {
  name: string;
  domain: string;
  feedUrl: string;
  category: string;
  renderJs: boolean;
  /** CSS selectors for extract_rules — site-specific extraction */
  selectors?: {
    title?: string;
    body?: string;
    image?: string;
    date?: string;
    author?: string;
  };
}

// ── Premium news sources to scrape ──────────────────────────────────────────

export const SCRAPINGBEE_SOURCES: NewsSource[] = [
  // Global AI / tech
  {
    name: "TechCrunch AI",
    domain: "techcrunch.com",
    feedUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "ai-tools",
    renderJs: false,
  },
  {
    name: "VentureBeat",
    domain: "venturebeat.com",
    feedUrl: "https://venturebeat.com/feed/",
    category: "ai-tools",
    renderJs: false,
  },
  {
    name: "The Next Web",
    domain: "thenextweb.com",
    feedUrl: "https://thenextweb.com/feed",
    category: "ai-tools",
    renderJs: false,
  },
  {
    name: "MIT Technology Review",
    domain: "technologyreview.com",
    feedUrl: "https://www.technologyreview.com/feed/",
    category: "ai-tools",
    renderJs: false,
  },
  // Emerging markets / Africa-relevant global coverage
  {
    name: "Rest of World",
    domain: "restofworld.org",
    feedUrl: "https://restofworld.org/feed/",
    category: "africa-tech",
    renderJs: false,
  },
  // SaaS / founders / business
  {
    name: "SaaStr Blog",
    domain: "saastr.com",
    feedUrl: "https://www.saastr.com/feed/",
    category: "saas-news",
    renderJs: false,
  },
  {
    name: "Product Hunt Blog",
    domain: "producthunt.com",
    feedUrl: "https://blog.producthunt.com/feed",
    category: "saas-news",
    renderJs: false,
  },
  // Design / creative tools
  {
    name: "Creative Bloq",
    domain: "creativebloq.com",
    feedUrl: "https://www.creativebloq.com/rss",
    category: "design",
    renderJs: false,
  },
  // Freelancer / remote work
  {
    name: "Indie Hackers",
    domain: "indiehackers.com",
    feedUrl: "https://www.indiehackers.com/feed.xml",
    category: "saas-news",
    renderJs: false,
  },
];

// ── RSS Feed Scraping ────────────────────────────────────────────────────────

interface RssFeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string | null;
  content: string;
}

/**
 * Fetch an RSS feed via ScrapingBee (bypasses Cloudflare, geo-restrictions etc.)
 * Returns raw XML string.
 */
async function fetchFeedViaScrapingBee(
  feedUrl: string,
  apiKey: string,
  renderJs = false,
): Promise<string | null> {
  const params = new URLSearchParams({
    api_key: apiKey,
    url: feedUrl,
    render_js: renderJs ? "true" : "false",
  });

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: { "User-Agent": "DISCOVA/1.0 News Aggregator" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`ScrapingBee ${res.status} for ${feedUrl}: ${await res.text().catch(() => "")}`);
  }

  return res.text();
}

/** Parse RSS/Atom XML into feed items (no external dependency) */
export function parseRssXml(xml: string): RssFeedItem[] {
  const items: RssFeedItem[] = [];

  // Handle both <item> (RSS) and <entry> (Atom)
  const itemPattern = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[1];

    const title = extractTag(block, "title") ?? extractTag(block, "dc:title") ?? "";
    const link =
      extractTag(block, "link") ??
      extractAtomLink(block) ??
      extractTag(block, "guid") ??
      "";
    const description =
      extractTag(block, "description") ??
      extractTag(block, "summary") ??
      extractTag(block, "content:encoded") ??
      "";
    const pubDate =
      extractTag(block, "pubDate") ??
      extractTag(block, "published") ??
      extractTag(block, "updated") ??
      new Date().toISOString();
    const imageUrl =
      extractMediaUrl(block) ??
      extractTag(block, "og:image") ??
      extractEnclosureUrl(block) ??
      null;
    const content =
      extractTag(block, "content:encoded") ??
      extractTag(block, "content") ??
      description;

    if (title && link) {
      items.push({
        title: stripHtml(title).trim(),
        link: link.trim(),
        description: stripHtml(description).slice(0, 500).trim(),
        pubDate,
        imageUrl,
        content: stripHtml(content).slice(0, 3000).trim(),
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  // Handle CDATA sections
  const cdataMatch = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i",
  ).exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  // Plain text
  const plainMatch = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml);
  if (plainMatch) return plainMatch[1].trim();

  return null;
}

function extractAtomLink(block: string): string | null {
  const m = /<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i.exec(block);
  return m ? m[1] : null;
}

function extractMediaUrl(block: string): string | null {
  const m = /<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i.exec(block);
  return m ? m[1] : null;
}

function extractEnclosureUrl(block: string): string | null {
  const m = /<enclosure[^>]+url=["']([^"']+)["']/i.exec(block);
  return m ? m[1] : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Full Article Scraping ────────────────────────────────────────────────────

/**
 * Scrape a full article page via ScrapingBee using extract_rules.
 * Returns the body text (up to 4000 chars) plus any metadata found.
 */
export async function scrapeArticlePage(
  url: string,
  apiKey: string,
  opts: { renderJs?: boolean; selectors?: NewsSource["selectors"] } = {},
): Promise<{ body: string; author: string | null; imageUrl: string | null } | null> {
  const selectors = opts.selectors ?? {};

  const extractRules = JSON.stringify({
    body: {
      selector: selectors.body ?? "article p, .article-body p, .post-content p, main p",
      type: "list",
      output: "%text",
    },
    author: {
      selector:
        selectors.author ??
        "[rel='author'], .author-name, .byline, .post-author",
      type: "item",
      output: "%text",
    },
    image: {
      selector: selectors.image ?? "article img, .hero-image img, .featured-image img",
      type: "item",
      output: "@src",
    },
  });

  const params = new URLSearchParams({
    api_key: apiKey,
    url,
    render_js: opts.renderJs ? "true" : "false",
    extract_rules: extractRules,
  });

  try {
    const res = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      body?: string[];
      author?: string;
      image?: string;
    };

    const bodyParts: string[] = Array.isArray(data.body) ? data.body : [];
    const body = bodyParts
      .map((p) => p.trim())
      .filter((p) => p.length > 30)
      .join("\n\n")
      .slice(0, 4000);

    return {
      body: body || "",
      author: data.author?.trim() ?? null,
      imageUrl: data.image?.trim() ?? null,
    };
  } catch {
    return null;
  }
}

// ── Main scrape function ─────────────────────────────────────────────────────

/**
 * Fetch and parse a news source's RSS feed via ScrapingBee.
 * Returns cleaned article stubs ready for Claude expansion.
 */
export async function scrapeNewsSource(
  source: NewsSource,
  opts: { maxItems?: number; scrapeFullArticles?: boolean } = {},
): Promise<ScrapedArticle[]> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) throw new Error("SCRAPINGBEE_API_KEY not set");

  const { maxItems = 8, scrapeFullArticles = false } = opts;

  // 1. Fetch the RSS feed
  const xml = await fetchFeedViaScrapingBee(source.feedUrl, apiKey, source.renderJs);
  if (!xml) return [];

  const items = parseRssXml(xml).slice(0, maxItems);
  if (items.length === 0) return [];

  const results: ScrapedArticle[] = [];

  for (const item of items) {
    let fullBody = item.content || item.description;
    let author: string | null = null;
    let imageUrl = item.imageUrl;

    // Optionally scrape the full article for richer content
    if (scrapeFullArticles && item.link && fullBody.length < 500) {
      const scraped = await scrapeArticlePage(item.link, apiKey, {
        renderJs: source.renderJs,
        selectors: source.selectors,
      });
      if (scraped) {
        if (scraped.body.length > fullBody.length) fullBody = scraped.body;
        author = scraped.author;
        imageUrl = imageUrl || scraped.imageUrl;
      }
    }

    results.push({
      title: item.title,
      excerpt: item.description.slice(0, 300),
      content: fullBody,
      url: item.link,
      imageUrl,
      publishedAt: item.pubDate,
      author,
      sourceName: source.name,
      sourceDomain: source.domain,
    });
  }

  return results;
}

/** Categorise scraped article to DISCOVA category slug */
export function categoriseScrapedArticle(article: ScrapedArticle, sourceCategory: string): string {
  const text = `${article.title} ${article.excerpt}`.toLowerCase();
  if (/automat|workflow|zapier|make\.com|n8n/.test(text)) return "automation";
  if (/design|figma|canva|midjourney|dall-e|stable.diffusion/.test(text)) return "design";
  if (/market|seo|ads|content.creat/.test(text)) return "marketing";
  if (/code|develop|github|vs.code|cursor|copilot/.test(text)) return "tutorials";
  if (/africa|nigeria|kenya|ghana|emerging.market/.test(text)) return "africa-tech";
  if (/trend|report|survey|industry|2026/.test(text)) return "industry-trends";
  if (/saas|startup|venture|funding|product.hunt/.test(text)) return "saas-news";
  return sourceCategory;
}

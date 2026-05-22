/**
 * AlternativeTo.net scraper — DISCOVA content engine
 *
 * Uses ScrapingBee to extract tools and news from AlternativeTo's
 * 6 target categories. AlternativeTo renders with React so we use
 * render_js=true on category pages.
 *
 * Docs: https://www.scrapingbee.com/documentation/
 */

const SCRAPINGBEE_BASE = "https://app.scrapingbee.com/api/v1/";

// ── Category definitions ─────────────────────────────────────────────────────

export interface ATCategory {
  id: string;
  name: string;
  slug: string;          // DISCOVA category slug
  atSlug: string;        // AlternativeTo category param
  browseUrl: string;     // listing page URL
  tag: string;           // display tag
}

export const AT_CATEGORIES: ATCategory[] = [
  {
    id: "business",
    name: "Business & Commerce",
    slug: "productivity",
    atSlug: "business-and-commerce",
    browseUrl: "https://alternativeto.net/browse/search/?cats=business-and-commerce&sort=likes",
    tag: "Business & Commerce",
  },
  {
    id: "ai-tools",
    name: "AI Tools and Services",
    slug: "ai-tools",
    atSlug: "ai-and-machine-learning",
    browseUrl: "https://alternativeto.net/browse/search/?cats=ai-and-machine-learning&sort=likes",
    tag: "AI Tools",
  },
  {
    id: "development",
    name: "Development",
    slug: "code",
    atSlug: "developer-tools",
    browseUrl: "https://alternativeto.net/browse/search/?cats=developer-tools&sort=likes",
    tag: "Development",
  },
  {
    id: "education",
    name: "Education",
    slug: "productivity",
    atSlug: "education",
    browseUrl: "https://alternativeto.net/browse/search/?cats=education&sort=likes",
    tag: "Education",
  },
  {
    id: "remote-work",
    name: "Remote Work and Collaboration",
    slug: "productivity",
    atSlug: "online-collaboration",
    browseUrl: "https://alternativeto.net/browse/search/?cats=online-collaboration&sort=likes",
    tag: "Remote Work",
  },
  {
    id: "tech-news",
    name: "Tech News",
    slug: "saas-news",
    atSlug: "news",
    browseUrl: "https://alternativeto.net/news/",
    tag: "Tech News",
  },
];

// ── Raw scraped types ─────────────────────────────────────────────────────────

export interface ATTool {
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  logoUrl: string | null;
  likes: number;
  platforms: string[];
  category: ATCategory;
  sourceUrl: string;       // the AT detail page
  affiliateLink: string;   // https://getdiscova.com/redirect?tool=...&affid=discova
}

export interface ATNewsItem {
  title: string;
  url: string;
  excerpt: string;
  publishedAt: string | null;
  imageUrl: string | null;
  category: ATCategory;
}

// ── ScrapingBee helpers ──────────────────────────────────────────────────────

async function sbFetch(
  url: string,
  opts: {
    renderJs?: boolean;
    extractRules?: Record<string, unknown>;
    waitFor?: number;
  } = {},
): Promise<string> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) throw new Error("SCRAPINGBEE_API_KEY not set");

  const params = new URLSearchParams({
    api_key: apiKey,
    url,
    render_js: opts.renderJs ? "true" : "false",
  });

  if (opts.extractRules) {
    params.set("extract_rules", JSON.stringify(opts.extractRules));
  }
  if (opts.waitFor) {
    params.set("wait_for", String(opts.waitFor));
  }

  const res = await fetch(`${SCRAPINGBEE_BASE}?${params}`, {
    headers: { "User-Agent": "DISCOVA/1.0 Content Engine" },
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ScrapingBee ${res.status} for ${url}: ${body.slice(0, 200)}`);
  }

  return res.text();
}

// ── HTML parsing helpers ─────────────────────────────────────────────────────

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

function extractAttr(html: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, "i");
  const m = re.exec(html);
  return m ? m[1] : null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/** Build the DISCOVA affiliate redirect link for a tool */
export function buildAffiliateLink(toolName: string, affId = "discova"): string {
  const slug = slugify(toolName);
  return `https://getdiscova.com/redirect?tool=${encodeURIComponent(slug)}&affid=${encodeURIComponent(affId)}`;
}

/** Internal tracking URL used by the redirect API */
export function buildInternalRedirectUrl(toolSlug: string): string {
  return `/api/redirect?tool=${encodeURIComponent(toolSlug)}`;
}

// ── Tool listing scraper ─────────────────────────────────────────────────────

/**
 * Scrape up to `limit` tools from an AlternativeTo category listing page.
 * AlternativeTo renders with JavaScript so we use render_js=true.
 */
export async function scrapeATCategory(
  category: ATCategory,
  limit = 5,
): Promise<ATTool[]> {
  let html: string;
  try {
    html = await sbFetch(category.browseUrl, {
      renderJs: true,
      waitFor: 2000,
    });
  } catch (err) {
    throw new Error(`Failed to scrape ${category.name}: ${err}`);
  }

  const tools: ATTool[] = [];

  // AlternativeTo tool cards have consistent markup. Extract all app list items.
  // Pattern: <li class="... AppListItem ..."> or article elements with data-testid
  // We parse the raw HTML for tool blocks.

  // Match tool cards — they contain an <a> with /software/ in href
  const cardPattern = /<(?:li|article)[^>]*class="[^"]*(?:AppListItem|app-list-item|appListItem)[^"]*"[^>]*>([\s\S]*?)<\/(?:li|article)>/gi;
  // Fallback: grab all software links with metadata
  const linkPattern = /href="(https:\/\/alternativeto\.net\/software\/([^/]+)\/)"[^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  // Primary: try card blocks
  while ((match = cardPattern.exec(html)) !== null && tools.length < limit) {
    const block = match[1];

    const nameMatch = /href="https:\/\/alternativeto\.net\/software\/([^/]+)\/"[^>]*>\s*([^<]{2,60})/i.exec(block);
    if (!nameMatch) continue;

    const atSlug = nameMatch[1];
    if (seen.has(atSlug)) continue;
    seen.add(atSlug);

    const name = stripHtml(nameMatch[2]).trim();
    if (!name || name.length < 2) continue;

    const sourceUrl = `https://alternativeto.net/software/${atSlug}/`;

    // Description
    const descMatch = /<p[^>]*class="[^"]*(?:description|desc|tagline)[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(block);
    const description = descMatch ? stripHtml(descMatch[1]) : "";

    // Logo
    const logoUrl =
      extractAttr(block, "img", "src") ??
      extractAttr(block, "img", "data-src") ??
      null;

    // Likes / votes count
    const likesMatch = /(\d[\d,]*)\s*(?:likes?|votes?)/i.exec(block);
    const likes = likesMatch ? parseInt(likesMatch[1].replace(/,/g, ""), 10) : 0;

    // Website URL — link with external href
    const websiteMatch = /href="(https?:\/\/(?!alternativeto\.net)[^"]+)"[^>]*>\s*(?:Visit|Website|Homepage)/i.exec(block);
    const websiteUrl = websiteMatch ? websiteMatch[1] : `https://alternativeto.net/software/${atSlug}/`;

    tools.push({
      name,
      slug: slugify(name),
      description,
      websiteUrl,
      logoUrl: logoUrl?.startsWith("http") ? logoUrl : null,
      likes,
      platforms: [],
      category,
      sourceUrl,
      affiliateLink: buildAffiliateLink(name),
    });
  }

  // Fallback: if card parsing found nothing, try link-based extraction
  if (tools.length === 0) {
    while ((match = linkPattern.exec(html)) !== null && tools.length < limit) {
      const href = match[1];
      const atSlug = match[2];
      if (seen.has(atSlug)) continue;
      seen.add(atSlug);

      // Extract name from surrounding context
      const rawName = stripHtml(match[3]).split("\n")[0].trim();
      if (!rawName || rawName.length < 2) continue;

      tools.push({
        name: rawName,
        slug: slugify(rawName),
        description: "",
        websiteUrl: href,
        logoUrl: null,
        likes: 0,
        platforms: [],
        category,
        sourceUrl: href,
        affiliateLink: buildAffiliateLink(rawName),
      });
    }
  }

  return tools.slice(0, limit);
}

// ── News scraper ─────────────────────────────────────────────────────────────

/**
 * Scrape the AlternativeTo news/blog page for recent articles.
 */
export async function scrapeATNews(limit = 10): Promise<ATNewsItem[]> {
  const newsCategory = AT_CATEGORIES.find((c) => c.id === "tech-news")!;
  let html: string;

  try {
    html = await sbFetch(newsCategory.browseUrl, { renderJs: true, waitFor: 1500 });
  } catch (err) {
    throw new Error(`Failed to scrape AT news: ${err}`);
  }

  const items: ATNewsItem[] = [];
  const seen = new Set<string>();

  // Match article cards — AT news uses <article> or card elements
  const articlePattern = /<(?:article|div)[^>]*class="[^"]*(?:post|article|news-item|card)[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/gi;

  let match: RegExpExecArray | null;

  while ((match = articlePattern.exec(html)) !== null && items.length < limit) {
    const block = match[1];

    const linkMatch = /href="(https:\/\/alternativeto\.net\/news\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!linkMatch) continue;

    const url = linkMatch[1];
    if (seen.has(url)) continue;
    seen.add(url);

    const title = stripHtml(linkMatch[2]).trim();
    if (!title || title.length < 10) continue;

    const excerptMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);
    const excerpt = excerptMatch ? stripHtml(excerptMatch[1]).slice(0, 400) : "";

    const dateMatch = /<time[^>]+datetime="([^"]+)"/i.exec(block);
    const imageUrl =
      extractAttr(block, "img", "src") ?? extractAttr(block, "img", "data-src") ?? null;

    items.push({
      title,
      url,
      excerpt,
      publishedAt: dateMatch ? dateMatch[1] : new Date().toISOString(),
      imageUrl: imageUrl?.startsWith("http") ? imageUrl : null,
      category: newsCategory,
    });
  }

  return items;
}

// ── Scrape all categories ────────────────────────────────────────────────────

export async function scrapeAllATCategories(toolsPerCategory = 5): Promise<{
  tools: ATTool[];
  news: ATNewsItem[];
  errors: string[];
}> {
  const toolCategories = AT_CATEGORIES.filter((c) => c.id !== "tech-news");
  const allTools: ATTool[] = [];
  const errors: string[] = [];

  for (const cat of toolCategories) {
    try {
      const tools = await scrapeATCategory(cat, toolsPerCategory);
      allTools.push(...tools);
    } catch (err) {
      errors.push(`${cat.name}: ${err}`);
    }
  }

  let news: ATNewsItem[] = [];
  try {
    news = await scrapeATNews(10);
  } catch (err) {
    errors.push(`Tech News: ${err}`);
  }

  return { tools: allTools, news, errors };
}

type ProviderName = "newsapi" | "tavily";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function fetchProviderNews(options?: {
  provider?: ProviderName;
  query?: string;
  limit?: number;
}) {
  const provider = options?.provider ?? "newsapi";
  if (provider === "tavily") {
    return fetchNewsFromTavily(options);
  }
  return fetchNewsFromNewsApi(options);
}

export async function fetchProviderTools(options?: {
  provider?: ProviderName;
  query?: string;
  limit?: number;
}) {
  const provider = options?.provider ?? "tavily";
  if (provider === "newsapi") {
    return fetchToolsFromNewsApi(options);
  }
  return fetchToolsFromTavily(options);
}

async function fetchNewsFromNewsApi(options?: {
  query?: string;
  limit?: number;
}) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error("Missing NEWS_API_KEY");

  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 100);
  const query = options?.query ?? "AI tools OR SaaS launch";
  const params = new URLSearchParams({
    q: query,
    language: "en",
    sortBy: "publishedAt",
    pageSize: String(limit),
    apiKey,
  });

  const response = await fetch(`https://newsapi.org/v2/everything?${params}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    const reason = await response.text();
    throw new Error(
      `NewsAPI request failed (${response.status}): ${reason || "Unknown error"}`,
    );
  }

  const data = (await response.json()) as {
    articles?: Array<{
      title?: string;
      description?: string;
      content?: string;
      url?: string;
      publishedAt?: string;
      source?: { name?: string };
    }>;
  };

  return (data.articles ?? [])
    .filter((article) => article.title && article.url)
    .map((article) => ({
      title: article.title as string,
      slug: toSlug(article.title as string),
      excerpt: article.description ?? "",
      body: article.content ?? article.description ?? "",
      tags: ["ai", "news", (article.source?.name ?? "source").toLowerCase()],
      publishedAt: article.publishedAt,
      status: "published",
      sourceUrl: article.url,
    }));
}

async function fetchNewsFromTavily(options?: {
  query?: string;
  limit?: number;
}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("Missing TAVILY_API_KEY");

  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 20);
  const query = options?.query ?? "latest AI tools and SaaS product news";

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: limit,
      topic: "news",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(
      `Tavily request failed (${response.status}): ${reason || "Unknown error"}`,
    );
  }

  const data = (await response.json()) as {
    results?: Array<{ title?: string; content?: string; url?: string }>;
  };

  return (data.results ?? [])
    .filter((item) => item.title && item.url)
    .map((item) => ({
      title: item.title as string,
      slug: toSlug(item.title as string),
      excerpt: item.content?.slice(0, 240) ?? "",
      body: item.content ?? "",
      tags: ["ai", "news", "tavily"],
      status: "published",
      sourceUrl: item.url,
    }));
}

async function fetchToolsFromTavily(options?: {
  query?: string;
  limit?: number;
}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("Missing TAVILY_API_KEY");

  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 20);
  const query = options?.query ?? "best AI tools for founders and freelancers";

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: limit,
      topic: "general",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(
      `Tavily request failed (${response.status}): ${reason || "Unknown error"}`,
    );
  }

  const data = (await response.json()) as {
    results?: Array<{ title?: string; content?: string; url?: string }>;
  };

  return (data.results ?? [])
    .filter((item) => item.title && item.url)
    .map((item) => ({
      name: item.title as string,
      slug: toSlug(item.title as string),
      tagline: item.content?.slice(0, 140) ?? "",
      description: item.content ?? "",
      websiteUrl: item.url,
      categorySlug: "productivity",
      tags: ["ai", "tool", "tavily"],
      status: "published",
    }));
}

async function fetchToolsFromNewsApi(options?: {
  query?: string;
  limit?: number;
}) {
  const newsItems = await fetchNewsFromNewsApi(options);
  return newsItems.map((item) => ({
    name: item.title,
    slug: item.slug,
    tagline: item.excerpt,
    description: item.body,
    websiteUrl: String(item.sourceUrl ?? ""),
    categorySlug: "productivity",
    tags: ["ai", "tool", "news-derived"],
    status: "draft",
  }));
}

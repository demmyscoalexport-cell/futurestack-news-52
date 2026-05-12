/**
 * Product Hunt API v2 client
 * GraphQL endpoint: https://api.producthunt.com/v2/api/graphql
 * Auth: Bearer token (Developer Token from PH dashboard)
 */

const PH_API = "https://api.producthunt.com/v2/api/graphql";

export interface PHPost {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string | null;
  url: string;
  website: string | null;
  votesCount: number;
  pricingType: "FREE" | "PAID" | "FREE_PLAN_AVAILABLE" | null;
  createdAt: string;
  thumbnail: { url: string } | null;
  topics: { edges: { node: { name: string; slug: string } }[] };
}

export interface PHPostsPage {
  edges: { node: PHPost }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

const POSTS_QUERY = `
  query GetPosts($first: Int!, $after: String, $topic: String, $order: PostsOrder) {
    posts(first: $first, after: $after, topic: $topic, order: $order) {
      edges {
        node {
          id
          name
          slug
          tagline
          description
          url
          website
          votesCount
          pricingType
          createdAt
          thumbnail { url }
          topics { edges { node { name slug } } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function phQuery<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const token = process.env.PRODUCTHUNT_API_TOKEN;
  if (!token) throw new Error("PRODUCTHUNT_API_TOKEN is not set");

  const res = await fetch(PH_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (!res.ok || json.errors?.length) {
    throw new Error(
      `PH API error ${res.status}: ${json.errors?.[0]?.message ?? res.statusText}`,
    );
  }

  return json.data as T;
}

/**
 * Fetch one page of Product Hunt posts.
 * @param first   items per page (max 20)
 * @param after   cursor from previous page
 * @param topic   PH topic slug to filter (e.g. "artificial-intelligence")
 * @param order   VOTES | NEWEST | FEATURED (default VOTES)
 */
export async function fetchPHPosts(
  first = 20,
  after: string | null = null,
  topic: string | null = null,
  order: "VOTES" | "NEWEST" | "FEATURED" = "VOTES",
): Promise<PHPostsPage> {
  const data = await phQuery<{ posts: PHPostsPage }>(POSTS_QUERY, {
    first,
    after: after ?? undefined,
    topic: topic ?? undefined,
    order,
  });
  return data.posts;
}

/**
 * Fetch up to `limit` posts across multiple pages, optionally filtered by topic.
 */
export async function fetchAllPHPosts(
  limit = 200,
  topic: string | null = null,
  order: "VOTES" | "NEWEST" | "FEATURED" = "VOTES",
): Promise<PHPost[]> {
  const all: PHPost[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore && all.length < limit) {
    const remaining = limit - all.length;
    const pageSize = Math.min(20, remaining);
    const page = await fetchPHPosts(pageSize, cursor, topic, order);
    all.push(...page.edges.map((e) => e.node));
    hasMore = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor ?? null;
    if (!cursor) break;
    // Small delay to be polite to the API
    await new Promise((r) => setTimeout(r, 300));
  }

  return all;
}

// ── Topic → FutureStack category mapping ────────────────────────────────────

const TOPIC_TO_CATEGORY: Record<string, string> = {
  "artificial-intelligence": "writing",
  "machine-learning": "writing",
  "generative-ai": "writing",
  "chatbots": "writing",
  "copywriting": "writing",
  "writing-tools": "writing",
  "developer-tools": "code",
  "github": "code",
  "api": "code",
  "no-code": "automation",
  "low-code": "automation",
  "automation": "automation",
  "zapier": "automation",
  "design-tools": "design",
  "graphic-design": "design",
  "image-generation": "design",
  "ui-ux": "design",
  "video": "video",
  "video-editing": "video",
  "screen-recording": "video",
  "audio": "audio",
  "podcasting": "audio",
  "text-to-speech": "audio",
  "music": "audio",
  "marketing": "marketing",
  "seo": "marketing",
  "social-media": "marketing",
  "email-marketing": "marketing",
  "productivity": "productivity",
  "task-management": "productivity",
  "project-management": "productivity",
  "analytics": "analytics",
  "data": "analytics",
  "business-intelligence": "analytics",
};

export function mapPHTopicsToCategory(
  topics: { name: string; slug: string }[],
): string {
  for (const topic of topics) {
    const cat = TOPIC_TO_CATEGORY[topic.slug];
    if (cat) return cat;
  }
  // Fallback: check name keywords
  const names = topics.map((t) => t.name.toLowerCase()).join(" ");
  if (names.includes("ai") || names.includes("intelligence")) return "writing";
  if (names.includes("code") || names.includes("dev")) return "code";
  if (names.includes("design") || names.includes("image")) return "design";
  if (names.includes("video")) return "video";
  if (names.includes("audio") || names.includes("voice")) return "audio";
  if (names.includes("market") || names.includes("seo")) return "marketing";
  if (names.includes("product") || names.includes("analyt")) return "analytics";
  if (names.includes("automat") || names.includes("workflow")) return "automation";
  return "productivity";
}

export function mapPHPricingModel(
  pricingType: PHPost["pricingType"],
): { pricing_model: string; has_free: boolean } {
  switch (pricingType) {
    case "FREE":
      return { pricing_model: "free", has_free: true };
    case "FREE_PLAN_AVAILABLE":
      return { pricing_model: "freemium", has_free: true };
    case "PAID":
      return { pricing_model: "paid", has_free: false };
    default:
      return { pricing_model: "freemium", has_free: true };
  }
}

/** Convert PH upvote count to a rough FutureStack rating (6.0–9.5) */
export function votesToRating(votes: number): number {
  if (votes >= 2000) return 9.0 + Math.min(0.5, (votes - 2000) / 10000);
  if (votes >= 1000) return 8.5;
  if (votes >= 500) return 8.0;
  if (votes >= 200) return 7.5;
  if (votes >= 100) return 7.0;
  return 6.5;
}

/** Build a slug from the tool name */
export function phNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Get the best logo URL for a PH tool */
export function resolvePHLogo(post: PHPost): string {
  // Use PH thumbnail if available (they host it reliably)
  if (post.thumbnail?.url) return post.thumbnail.url;
  // Fallback: Google favicon from website
  if (post.website) {
    try {
      const host = new URL(post.website).hostname;
      const parts = host.split(".");
      const root = parts.length > 2 ? parts.slice(-2).join(".") : host;
      return `https://www.google.com/s2/favicons?domain=${root}&sz=128`;
    } catch {
      return "";
    }
  }
  return "";
}

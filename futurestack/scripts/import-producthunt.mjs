#!/usr/bin/env node
/**
 * Bulk-import Product Hunt tools into Supabase REST (live schema).
 *
 * Usage:
 *   node scripts/import-producthunt.mjs
 *   node scripts/import-producthunt.mjs --limit 30 --order NEWEST
 *   node scripts/import-producthunt.mjs --topic artificial-intelligence --limit 50
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const t = line.trim().replace(/\r$/, "");
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 0) continue;
  process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

const PH_TOKEN =
  process.env.PRODUCTHUNT_API_TOKEN ||
  process.env.PRODUCTHUNT_DEVELOPER_TOKEN ||
  process.env.PRODUCTHUNT_ACCESS_TOKEN;

if (!PH_TOKEN) {
  console.error("❌  Product Hunt token not set (PRODUCTHUNT_API_TOKEN / DEVELOPER / ACCESS)");
  process.exit(1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
};

const LIMIT = parseInt(getArg("--limit", "50"), 10);
const TARGET = parseInt(getArg("--target", "150"), 10);
const ORDER = getArg("--order", "NEWEST");
const SINGLE_TOPIC = getArg("--topic", null);
const WITH_NEWS = !args.includes("--no-news");

const DEFAULT_TOPICS = [
  "artificial-intelligence",
  "developer-tools",
  "design-tools",
  "productivity",
  "no-code",
  "marketing",
  "video",
  "audio",
  "analytics",
  "automation",
  "saas",
  "fintech",
  "education",
  "security",
  "ecommerce",
];
const TOPICS = SINGLE_TOPIC ? [SINGLE_TOPIC] : DEFAULT_TOPICS;

const TOPIC_MAP = {
  "artificial-intelligence": "writing",
  "machine-learning": "writing",
  "generative-ai": "writing",
  "developer-tools": "code",
  "no-code": "automation",
  "automation": "automation",
  "design-tools": "design",
  "video": "video",
  "audio": "audio",
  "marketing": "marketing",
  "productivity": "productivity",
  "analytics": "analytics",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function phRequest(query, variables) {
  const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PH_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message ?? res.statusText);
  }
  return json.data;
}

const POSTS_QUERY = `
  query GetPosts($first: Int!, $after: String, $topic: String, $order: PostsOrder) {
    posts(first: $first, after: $after, topic: $topic, order: $order) {
      edges {
        node {
          id name slug tagline description url website
          votesCount createdAt
          thumbnail { url }
          topics { edges { node { name slug } } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function fetchTopic(topic, limit) {
  const posts = [];
  let cursor = null;
  let hasMore = true;
  while (hasMore && posts.length < limit) {
    const pageSize = Math.min(20, limit - posts.length);
    const data = await phRequest(POSTS_QUERY, {
      first: pageSize,
      after: cursor,
      topic,
      order: ORDER,
    });
    const page = data.posts;
    posts.push(...page.edges.map((e) => e.node));
    hasMore = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
    if (!cursor) break;
    await sleep(300);
  }
  return posts;
}

function getCategory(topics) {
  for (const t of topics) {
    if (TOPIC_MAP[t.slug]) return TOPIC_MAP[t.slug];
  }
  const names = topics.map((t) => t.name.toLowerCase()).join(" ");
  if (names.includes("ai")) return "writing";
  if (names.includes("code") || names.includes("dev")) return "code";
  if (names.includes("design")) return "design";
  return "productivity";
}

function getPricing(tagline, description) {
  const text = `${tagline ?? ""} ${description ?? ""}`.toLowerCase();
  if (text.includes("free forever") || text.includes("open source") || text.includes("open-source")) {
    return { model: "free", hasFree: true };
  }
  if (text.includes("free plan") || text.includes("free tier") || text.includes("freemium") || text.includes("free trial")) {
    return { model: "freemium", hasFree: true };
  }
  if (text.includes("per month") || text.includes("subscription")) {
    return { model: "paid", hasFree: false };
  }
  return { model: "freemium", hasFree: true };
}

function toCatalogRating(votes) {
  if (votes >= 2000) return 5.0;
  if (votes >= 1000) return 4.8;
  if (votes >= 500) return 4.5;
  if (votes >= 200) return 4.2;
  if (votes >= 100) return 4.0;
  if (votes >= 50) return 3.8;
  return 3.5;
}

function toScore(votes) {
  if (votes >= 2000) return Math.min(9.5, 9.0 + (votes - 2000) / 10000);
  if (votes >= 1000) return 8.5;
  if (votes >= 500) return 8.0;
  if (votes >= 200) return 7.5;
  if (votes >= 100) return 7.0;
  return 6.5;
}

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function getLogo(post) {
  if (post.thumbnail?.url) return post.thumbnail.url;
  const site = post.website || post.url;
  if (site) {
    try {
      const host = new URL(site).hostname;
      const parts = host.split(".");
      const root = parts.length > 2 ? parts.slice(-2).join(".") : host;
      return `https://www.google.com/s2/favicons?domain=${root}&sz=128`;
    } catch {
      return "";
    }
  }
  return "";
}

function buildRows(post) {
  const slug = toSlug(post.name);
  const topicNodes = post.topics.edges.map((e) => e.node);
  const category = getCategory(topicNodes);
  const { model: pricing_model, hasFree } = getPricing(post.tagline, post.description);
  const rating = toCatalogRating(post.votesCount);
  const baseScore = parseFloat(toScore(post.votesCount).toFixed(1));
  const website = post.website || post.url;
  const description = post.description || post.tagline || `${post.name} — on Product Hunt`;
  const tags = ["new", "product-hunt"];
  if (hasFree) tags.push("free", "africa-friendly");
  if (post.votesCount >= 500) tags.push("trending");
  const now = new Date().toISOString();

  return {
    toolRow: {
      name: post.name,
      slug,
      tagline: post.tagline,
      short_description: post.tagline || description.slice(0, 160),
      description,
      logo: getLogo(post) || null,
      website: website,
      website_url: website,
      producthunt_url: post.url,
      source: "product-hunt",
      category,
      tags,
      pricing_model,
      pricing_details: [],
      africa_friendly: hasFree,
      has_free: hasFree,
      rating,
      review_count: Math.max(1, Math.floor(post.votesCount / 10)),
      is_featured: false,
      is_verified: false,
      is_new: true,
      has_api: false,
      status: "active",
      upvote_count: post.votesCount,
      save_count: Math.floor(post.votesCount * 0.1),
      last_updated: now,
      created_at: now,
    },
    scoreRow: {
      ease_of_use: baseScore,
      value_for_money: hasFree ? Math.min(10, baseScore + 0.5) : Math.max(5, baseScore - 0.5),
      feature_depth: baseScore,
      support_quality: 7.0,
      integration_richness: 7.0,
      ai_capability: baseScore,
      updated_at: now,
    },
    slug,
  };
}

async function upsertLaunchArticle(post, slug, category) {
  if (!WITH_NEWS) return true;
  const articleSlug = `${slug}-product-hunt-launch`;
  const title = `${post.name} launches on Product Hunt`;
  const excerpt = post.tagline || `${post.name} is a new ${category} tool worth watching.`;
  const content = [
    `# ${post.name}`,
    "",
    post.description || post.tagline || "",
    "",
    `**Category:** ${category}`,
    `**Product Hunt votes:** ${post.votesCount}`,
    "",
    `[View on Product Hunt](${post.url})`,
  ].join("\n");
  const wordCount = content.split(/\s+/).length;

  const { error } = await sb.from("articles").upsert(
    {
      slug: articleSlug,
      title,
      excerpt,
      content,
      tags: ["product-hunt", "launch", category],
      category: "ai-tools",
      status: "published",
      published_at: post.createdAt || new Date().toISOString(),
      reading_time: Math.max(1, Math.ceil(wordCount / 200)),
      word_count: wordCount,
      is_ai_generated: false,
      is_featured: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug" },
  );
  if (error) throw error;
  return true;
}

async function main() {
  console.log(`\n🚀  DISCOVA ← Product Hunt (Supabase REST)`);
  console.log(`   Topics: ${TOPICS.join(", ")}`);
  console.log(`   Limit : ${LIMIT}/topic  Target: ${TARGET} new tools  Order: ${ORDER}\n`);

  const { count: beforeCount } = await sb
    .from("tools")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  console.log(`   Tools before: ${beforeCount ?? 0}`);

  const allPosts = [];
  const seenIds = new Set();
  for (const topic of TOPICS) {
    process.stdout.write(`  📡 ${topic.padEnd(28)} `);
    try {
      const posts = await fetchTopic(topic, LIMIT);
      let added = 0;
      for (const p of posts) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          allPosts.push(p);
          added++;
        }
      }
      console.log(`${posts.length} fetched, ${added} unique`);
    } catch (e) {
      console.log(`❌  ${e.message}`);
    }
    await sleep(1200);
  }
  console.log(`\n  Total unique posts: ${allPosts.length}`);

  const { data: existing } = await sb.from("tools").select("website_url, slug").eq("status", "active");
  const existingUrls = new Set((existing ?? []).map((r) => r.website_url?.toLowerCase()).filter(Boolean));
  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));

  const toInsert = allPosts.filter((p) => {
    if (!p.website && !p.url) return false;
    const url = (p.website || p.url).toLowerCase();
    if (existingUrls.has(url)) return false;
    if (existingSlugs.has(toSlug(p.name))) return false;
    return true;
  });

  console.log(`  Already in DB: ${allPosts.length - toInsert.length}`);
  console.log(`  New to insert: ${Math.min(toInsert.length, TARGET)}\n`);

  if (toInsert.length === 0) {
    console.log("  ✅  Nothing new to add.\n");
    return;
  }

  let inserted = 0;
  let newsInserted = 0;
  let failed = 0;

  for (const post of toInsert.slice(0, TARGET)) {
    const { toolRow, scoreRow, slug } = buildRows(post);
    process.stdout.write(`  ${post.name.slice(0, 40).padEnd(41)} `);
    try {
      const { data, error } = await sb
        .from("tools")
        .upsert(toolRow, { onConflict: "slug" })
        .select("id")
        .single();
      if (error) throw error;

      const { error: scoreErr } = await sb.from("tool_scores").upsert(
        { tool_id: data.id, ...scoreRow },
        { onConflict: "tool_id" },
      );
      if (scoreErr) throw scoreErr;

      try {
        await upsertLaunchArticle(post, slug, toolRow.category);
        newsInserted++;
      } catch (newsErr) {
        console.log(`⚠️ news: ${newsErr.message.slice(0, 40)}`);
      }

      console.log("✅");
      inserted++;
    } catch (e) {
      console.log(`❌  ${e.message.slice(0, 60)}`);
      failed++;
    }
  }

  const { count: afterCount } = await sb
    .from("tools")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  console.log(`\n✅  Done — tools inserted: ${inserted}, news: ${newsInserted}, failed: ${failed}`);
  console.log(`   Tools after: ${afterCount ?? 0} (was ${beforeCount ?? 0})\n`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

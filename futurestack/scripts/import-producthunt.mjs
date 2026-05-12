#!/usr/bin/env node
/**
 * scripts/import-producthunt.mjs
 *
 * Bulk-import Product Hunt tools into the DB.
 * Usage:
 *   node scripts/import-producthunt.mjs              # default: 50/topic, NEWEST order
 *   node scripts/import-producthunt.mjs --limit 100  # 100 per topic
 *   node scripts/import-producthunt.mjs --order VOTES
 *   node scripts/import-producthunt.mjs --topic artificial-intelligence --limit 200
 *   node scripts/import-producthunt.mjs --all        # all default topics, 200/each
 */
import pg from "pg";
import { readFileSync } from "fs";
import https from "https";

// ── Load .env.local ──────────────────────────────────────────────────────────
try {
  const env = readFileSync(".env.local", "utf-8");
  for (const line of env.split("\n")) {
    const t = line.trim().replace(/\r$/, "");
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
} catch { /* rely on shell env */ }

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false, max: 3 });

const PH_TOKEN = process.env.PRODUCTHUNT_API_TOKEN;
if (!PH_TOKEN) {
  console.error("❌  PRODUCTHUNT_API_TOKEN is not set");
  process.exit(1);
}

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
};

const LIMIT      = parseInt(getArg("--limit", args.includes("--all") ? "200" : "50"), 10);
const ORDER      = getArg("--order", "NEWEST");
const SINGLE_TOPIC = getArg("--topic", null);

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
];
const TOPICS = SINGLE_TOPIC ? [SINGLE_TOPIC] : DEFAULT_TOPICS;

// ── Product Hunt GraphQL client ───────────────────────────────────────────────
function phRequest(query, variables) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const opts = {
      hostname: "api.producthunt.com",
      path: "/v2/api/graphql",
      method: "POST",
      headers: {
        Authorization: `Bearer ${PH_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.errors?.length) reject(new Error(parsed.errors[0].message));
          else resolve(parsed.data);
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const POSTS_QUERY = `
  query GetPosts($first: Int!, $after: String, $topic: String, $order: PostsOrder) {
    posts(first: $first, after: $after, topic: $topic, order: $order) {
      edges {
        node {
          id name slug tagline description url website
          votesCount pricingType createdAt
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
    const remaining = limit - posts.length;
    const pageSize = Math.min(20, remaining);
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

// ── Mapping helpers ───────────────────────────────────────────────────────────
const TOPIC_MAP = {
  "artificial-intelligence": "writing",
  "machine-learning": "writing",
  "generative-ai": "writing",
  "chatbots": "writing",
  "developer-tools": "code",
  "api": "code",
  "no-code": "automation",
  "automation": "automation",
  "design-tools": "design",
  "image-generation": "design",
  "video": "video",
  "video-editing": "video",
  "audio": "audio",
  "podcasting": "audio",
  "text-to-speech": "audio",
  "marketing": "marketing",
  "seo": "marketing",
  "productivity": "productivity",
  "analytics": "analytics",
};

function getCategory(topics) {
  for (const t of topics) {
    if (TOPIC_MAP[t.slug]) return TOPIC_MAP[t.slug];
  }
  const names = topics.map((t) => t.name.toLowerCase()).join(" ");
  if (names.includes("ai")) return "writing";
  if (names.includes("code") || names.includes("dev")) return "code";
  if (names.includes("design")) return "design";
  if (names.includes("video")) return "video";
  if (names.includes("audio") || names.includes("voice")) return "audio";
  return "productivity";
}

function getPricing(pricingType) {
  if (pricingType === "FREE") return { model: "free", hasFree: true };
  if (pricingType === "FREE_PLAN_AVAILABLE") return { model: "freemium", hasFree: true };
  if (pricingType === "PAID") return { model: "paid", hasFree: false };
  return { model: "freemium", hasFree: true };
}

function toRating(votes) {
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
    } catch { return ""; }
  }
  return "";
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀  FutureStack ← Product Hunt importer`);
  console.log(`   Topics : ${TOPICS.join(", ")}`);
  console.log(`   Limit  : ${LIMIT} per topic`);
  console.log(`   Order  : ${ORDER}\n`);

  // 1. Fetch from PH
  const allPosts = [];
  const seenIds = new Set();

  for (const topic of TOPICS) {
    process.stdout.write(`  📡 ${topic.padEnd(30)} `);
    try {
      const posts = await fetchTopic(topic, LIMIT);
      let added = 0;
      for (const p of posts) {
        if (!seenIds.has(p.id)) { seenIds.add(p.id); allPosts.push(p); added++; }
      }
      console.log(`${posts.length} fetched, ${added} unique`);
    } catch (e) {
      console.log(`❌  ${e.message}`);
    }
  }
  console.log(`\n  Total unique posts fetched: ${allPosts.length}`);

  // 2. Filter out existing
  const { rows: existing } = await pool.query(
    "SELECT website_url, slug FROM tools WHERE status = 'active'",
  );
  const existingUrls  = new Set(existing.map((r) => r.website_url?.toLowerCase()));
  const existingSlugs = new Set(existing.map((r) => r.slug));

  const toInsert = allPosts.filter((p) => {
    if (!p.website && !p.url) return false;
    if (existingUrls.has((p.website || p.url).toLowerCase())) return false;
    if (existingSlugs.has(toSlug(p.name))) return false;
    return true;
  });
  console.log(`  Already in DB : ${allPosts.length - toInsert.length}`);
  console.log(`  New to insert : ${toInsert.length}\n`);

  if (toInsert.length === 0) {
    console.log("  ✅  Nothing new to add.\n");
    await pool.end();
    return;
  }

  // 3. Insert
  let inserted = 0, failed = 0;
  for (const post of toInsert) {
    const slug = toSlug(post.name);
    const topicNodes = post.topics.edges.map((e) => e.node);
    const category = getCategory(topicNodes);
    const { model: pricing_model, hasFree: has_free } = getPricing(post.pricingType);
    const rating = toRating(post.votesCount);
    const logo = getLogo(post);
    const website = post.website || post.url;
    const description = post.description || post.tagline || `${post.name} — on Product Hunt`;
    const africa_friendly = has_free;

    const tags = ["new", "product-hunt"];
    if (has_free) tags.push("free");
    if (post.votesCount >= 500) tags.push("trending");
    if (africa_friendly) tags.push("africa-friendly");

    process.stdout.write(`  [${String(inserted + failed + 1).padStart(4)}/${toInsert.length}] ${post.name.slice(0, 35).padEnd(36)} `);

    try {
      const { rows } = await pool.query(
        `INSERT INTO tools (
           name, slug, tagline, description, logo,
           website, website_url, category,
           pricing_model, pricing_details, has_free,
           africa_friendly, rating, review_count,
           tags, is_featured, is_verified, is_new,
           status, upvote_count, save_count, view_count
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$6,$7,
           $8,$9,$10,$11,$12,$13,
           $14,false,false,true,
           'active',$15,$16,$17
         )
         ON CONFLICT (slug) DO UPDATE SET
           tagline      = EXCLUDED.tagline,
           description  = EXCLUDED.description,
           logo         = EXCLUDED.logo,
           upvote_count = EXCLUDED.upvote_count,
           rating       = EXCLUDED.rating
         RETURNING id`,
        [
          post.name, slug, post.tagline, description, logo,
          website, category, pricing_model, JSON.stringify([]),
          has_free, africa_friendly, parseFloat(rating.toFixed(1)),
          Math.max(1, Math.floor(post.votesCount / 10)), tags,
          post.votesCount, Math.floor(post.votesCount * 0.1),
          Math.floor(post.votesCount * 0.5),
        ],
      );
      const toolId = rows[0].id;
      const base = parseFloat(rating.toFixed(1));
      await pool.query(
        `INSERT INTO tool_scores (tool_id, ease_of_use, value_for_money, feature_depth, support_quality, integration_richness, ai_capability)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (tool_id) DO NOTHING`,
        [
          toolId, base,
          has_free ? Math.min(10, base + 0.5) : Math.max(5, base - 0.5),
          base, 7.0, 7.0, base,
        ],
      );
      console.log("✅");
      inserted++;
    } catch (e) {
      console.log(`❌  ${e.message.slice(0, 60)}`);
      failed++;
    }
  }

  const { rows: final } = await pool.query("SELECT COUNT(*) FROM tools WHERE status='active'");
  console.log(`\n✅  Done! Inserted: ${inserted}  Failed: ${failed}`);
  console.log(`   Total tools in DB: ${final[0].count}\n`);
  await pool.end();
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

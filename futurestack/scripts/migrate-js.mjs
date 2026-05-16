#!/usr/bin/env node
/**
 * DISCOVA — Replit PG → Supabase JS migration (HTTPS only, no direct DB connection)
 * Maps Replit PG column names → actual Supabase column names discovered via OpenAPI
 */
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env.local"), override: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SRC_DB_URL   = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_KEY) { console.error("❌ Missing Supabase credentials"); process.exit(1); }

const sb  = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const src = new pg.Pool({ connectionString: SRC_DB_URL });
const log = (e, m) => console.log(`${e}  ${m}`);

async function upsert(table, rows, conflict = "id") {
  if (!rows.length) return 0;
  let total = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + 100), { onConflict: conflict });
    if (error) log("⚠️", `${table} [${i}-${i+100}]: ${error.message}`);
    else total += Math.min(100, rows.length - i);
  }
  return total;
}

async function main() {
  console.log("\n══════════════════════════════════════════════");
  console.log("  DISCOVA — Supabase Migration (via HTTPS)");
  console.log(`  → ${SUPABASE_URL}`);
  console.log("══════════════════════════════════════════════\n");

  // ── 1. tool_categories (id, name, icon, count) ──────────────────────────
  log("📦", "tool_categories...");
  const { rows: cats } = await src.query("SELECT id, name, icon, count FROM tool_categories");
  log("✅", `tool_categories: ${await upsert("tool_categories", cats, "id")} rows`);

  // ── 2. authors ── Supabase: id, name, avatar, role, bio, created_at ─────
  log("📦", "authors...");
  const { rows: authorsRaw } = await src.query("SELECT id, name, avatar, role, bio, created_at FROM authors");
  log("✅", `authors: ${await upsert("authors", authorsRaw, "id")} rows`);

  // ── 3. tools ── map Replit PG → Supabase columns ─────────────────────────
  // Supabase: id,name,slug,description,short_description,logo,category,subcategories,
  //           has_free,free_description,pricing_plans,rating,review_count,badges,
  //           integrations,platforms,website,africa_friendly,best_for,pros,cons,
  //           featured,last_updated,created_at
  log("📦", "tools (409 rows)...");
  const { rows: toolsRaw } = await src.query(`
    SELECT id, name, slug, tagline, description, logo, website, category,
           subcategory, has_free, africa_friendly, rating, review_count,
           is_featured, last_updated, created_at, status, tags,
           pricing_model, pricing_details, source
    FROM tools
  `);
  const tools = toolsRaw.map(t => ({
    id:                t.id,
    name:              t.name,
    slug:              t.slug,
    short_description: t.tagline,
    description:       t.description,
    logo:              t.logo,
    website:           t.website,
    category:          t.category,
    has_free:          t.has_free,
    africa_friendly:   t.africa_friendly,
    rating:            t.rating,
    review_count:      t.review_count,
    featured:          t.is_featured,
    last_updated:      t.last_updated,
    created_at:        t.created_at,
  }));
  log("✅", `tools: ${await upsert("tools", tools, "slug")} rows`);

  // ── 4. article categories ─────────────────────────────────────────────────
  // Supabase schema doesn't have a separate categories table in this project
  // articles.category is a text field — skip UUID-based categories table
  log("⏭️", "skipping categories table (Supabase uses text category on articles)");

  // ── 5. articles ── Supabase: id,slug,title,excerpt,content,featured_image,
  //                  author_id,status,published_at,updated_at,read_time,
  //                  category,tags,target_roles,view_count,featured,created_at
  log("📦", "articles...");
  const { rows: articlesRaw } = await src.query(`
    SELECT a.id, a.slug, a.title, a.excerpt, a.content, a.hero_image,
           a.author_id, a.status, a.published_at, a.updated_at,
           a.reading_time, a.tags, a.is_featured, a.view_count, a.created_at,
           c.slug AS cat_slug
    FROM articles a
    LEFT JOIN categories c ON c.id = a.category_id
  `);
  const articles = articlesRaw.map(a => ({
    id:             a.id,
    slug:           a.slug,
    title:          a.title,
    excerpt:        a.excerpt,
    content:        a.content,
    featured_image: a.hero_image,
    author_id:      a.author_id,
    status:         a.status,
    published_at:   a.published_at,
    updated_at:     a.updated_at,
    read_time:      a.reading_time,
    tags:           a.tags,
    category:       a.cat_slug,
    featured:       a.is_featured,
    view_count:     a.view_count,
    created_at:     a.created_at,
  }));
  log("✅", `articles: ${await upsert("articles", articles, "slug")} rows`);

  // ── 6. stacks ── Supabase: id,slug,name,description,creator_id,target_role,
  //                category,clone_count,rating,featured,created_at,updated_at
  log("📦", "stacks...");
  const { rows: stacksRaw } = await src.query(`
    SELECT id, slug, name, description, target_role, category,
           clone_count, rating, featured, created_at, updated_at
    FROM stacks
  `);
  log("✅", `stacks: ${await upsert("stacks", stacksRaw, "id")} rows`);

  // ── 7. stack_tools ── Supabase: id, stack_id, tool_id, position ──────────
  log("📦", "stack_tools...");
  const { rows: stRaw } = await src.query("SELECT id, stack_id, tool_id, position FROM stack_tools");
  log("✅", `stack_tools: ${await upsert("stack_tools", stRaw, "id")} rows`);

  // ── 8. tool_scores ── Supabase: id,tool_id,ease_of_use,value_for_money,
  //                      feature_depth,support_quality,integration_richness,
  //                      ai_capability,futurestack_score,last_calculated_at,updated_at
  log("📦", "tool_scores...");
  const { rows: scoresRaw } = await src.query(`
    SELECT id, tool_id, ease_of_use, value_for_money, feature_depth,
           support_quality, integration_richness, ai_capability,
           futurestack_score, updated_at
    FROM tool_scores
  `);
  const scores = scoresRaw.map(s => ({
    id:                   s.id,
    tool_id:              s.tool_id,
    ease_of_use:          s.ease_of_use,
    value_for_money:      s.value_for_money,
    feature_depth:        s.feature_depth,
    support_quality:      s.support_quality,
    integration_richness: s.integration_richness,
    ai_capability:        s.ai_capability,
    // futurestack_score is a GENERATED column — omit it, DB computes it
    updated_at:           s.updated_at,
  }));
  log("✅", `tool_scores: ${await upsert("tool_scores", scores, "id")} rows`);

  // ── 9. tool_pricing ── Supabase: id,tool_id,tier_name,price_monthly,
  //                       price_annual,currency,features,is_popular,is_free_tier,limits,created_at
  log("📦", "tool_pricing...");
  const { rows: pricingRaw } = await src.query(`
    SELECT id, tool_id, tier_name, price_monthly, price_annual, currency, features, is_popular
    FROM tool_pricing
  `);
  const pricing = pricingRaw.map(p => ({
    id:            p.id,
    tool_id:       p.tool_id,
    tier_name:     p.tier_name,
    price_monthly: p.price_monthly,
    price_annual:  p.price_annual,
    currency:      p.currency,
    features:      p.features,
    is_popular:    p.is_popular,
  }));
  log("✅", `tool_pricing: ${await upsert("tool_pricing", pricing, "id")} rows`);

  // ── 10. reviews ── Supabase: id,tool_id,user_id,user_name,verified,rating,
  //                   content,upvotes,downvotes,location,created_at
  log("📦", "reviews...");
  const { rows: reviewsRaw } = await src.query(`
    SELECT id, tool_id, user_name, location, rating, content, created_at
    FROM reviews
  `);
  const reviews = reviewsRaw.map(r => ({
    id:        r.id,
    tool_id:   r.tool_id,
    user_name: r.user_name,
    location:  r.location,
    rating:    r.rating,
    content:   r.content,
    created_at: r.created_at,
  }));
  log("✅", `reviews: ${await upsert("reviews", reviews, "id")} rows`);

  // ── 11. newsletter_subscribers ───────────────────────────────────────────
  log("📦", "newsletter_subscribers...");
  const { rows: subs } = await src.query("SELECT id, email, role, subscribed_at, is_confirmed, unsubscribed FROM newsletter_subscribers");
  const subsClean = subs.map(s => ({
    id:           s.id,
    email:        s.email,
    role:         s.role,
    subscribed_at: s.subscribed_at,
    confirmed:    s.is_confirmed,
    unsubscribed: s.unsubscribed,
  }));
  log("✅", `newsletter_subscribers: ${await upsert("newsletter_subscribers", subsClean, "email")} rows`);

  await src.end();

  console.log("\n══════════════════════════════════════════════");
  console.log("✅  Migration complete!");
  console.log("══════════════════════════════════════════════\n");
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });

#!/usr/bin/env node
/**
 * Import 409 tools from SQL dumps → Supabase REST (service role).
 * Maps SQL columns to live schema (logo_url, no has_free, etc.)
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  if (k) process.env[k] = v;
}

const SQL_COLS = [
  "id", "name", "slug", "tagline", "description", "logo", "website", "website_url",
  "category", "tags", "pricing_model", "pricing_details", "has_free", "africa_friendly",
  "rating", "review_count", "is_featured", "is_verified", "is_new", "has_api", "status",
  "upvote_count", "save_count", "view_count", "last_updated", "created_at", "subcategory",
  "new_until", "source", "producthunt_url",
];

function parseSqlValue(raw) {
  const v = raw.trim();
  if (v === "NULL") return null;
  if (v === "TRUE") return true;
  if (v === "FALSE") return false;
  if (v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1).replace(/''/g, "'");
  }
  if (v.startsWith("ARRAY[") && v.includes("]::")) {
    const inner = v.slice(6, v.indexOf("]::"));
    if (!inner.trim()) return [];
    return [...inner.matchAll(/'((?:[^']|'')*)'/g)].map((m) =>
      m[1].replace(/''/g, "'"),
    );
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function splitValues(valuesStr) {
  const parts = [];
  let cur = "";
  let inStr = false;
  let depthParen = 0;
  let depthBracket = 0;

  for (let j = 0; j < valuesStr.length; j++) {
    const c = valuesStr[j];
    if (c === "'") {
      if (inStr && valuesStr[j + 1] === "'") {
        cur += "''";
        j++;
        continue;
      }
      inStr = !inStr;
      cur += c;
      continue;
    }
    if (!inStr) {
      if (c === "(") depthParen++;
      else if (c === ")") depthParen--;
      else if (c === "[") depthBracket++;
      else if (c === "]") depthBracket--;
      else if (c === "," && depthParen === 0 && depthBracket === 0) {
        parts.push(cur.trim());
        cur = "";
        continue;
      }
    }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

const PRICING_MODELS = new Set(["free", "freemium", "paid", "enterprise"]);

function mapToLiveRow(sqlRow) {
  const id = slugToId.get(sqlRow.slug) ?? sqlRow.id;
  let pricingModel = String(sqlRow.pricing_model ?? "freemium");
  if (!PRICING_MODELS.has(pricingModel)) pricingModel = "freemium";

  let rating = parseFloat(String(sqlRow.rating ?? ""));
  if (Number.isNaN(rating)) rating = 0;
  rating = Math.min(5, Math.max(0, rating));

  return {
    id,
    name: sqlRow.name,
    slug: sqlRow.slug,
    tagline: sqlRow.tagline,
    description: sqlRow.description,
    logo_url: sqlRow.logo ?? null,
    website_url: sqlRow.website_url ?? sqlRow.website ?? null,
    category: sqlRow.category,
    subcategory: sqlRow.subcategory ?? null,
    tags: Array.isArray(sqlRow.tags) ? sqlRow.tags : [],
    pricing_model: pricingModel,
    pricing_details: [],
    africa_friendly: sqlRow.africa_friendly ?? false,
    rating,
    review_count: Number(sqlRow.review_count) || 0,
    is_featured: sqlRow.is_featured ?? false,
    is_verified: sqlRow.is_verified ?? false,
    is_new: sqlRow.is_new ?? false,
    has_api: sqlRow.has_api ?? false,
    status: "active",
    upvote_count: Number(sqlRow.upvote_count) || 0,
    save_count: Number(sqlRow.save_count) || 0,
    last_updated: sqlRow.last_updated ?? null,
    created_at: sqlRow.created_at ?? null,
    updated_at: sqlRow.created_at ?? null,
  };
}

function extractToolsFromSql(sql) {
  const re =
    /INSERT INTO tools \([^)]+\)\s*VALUES \(([\s\S]*?)\)\s*ON CONFLICT/gi;
  const rows = [];
  let m;
  while ((m = re.exec(sql)) !== null) {
    const parts = splitValues(m[1]);
    if (parts.length !== SQL_COLS.length) continue;
    const sqlRow = {};
    SQL_COLS.forEach((col, idx) => {
      sqlRow[col] = parseSqlValue(parts[idx]);
    });
    if (sqlRow.slug) rows.push(mapToLiveRow(sqlRow));
  }
  return rows;
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const slugToId = new Map();
{
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from("tools").select("id, slug").range(offset, offset + 999);
    if (error) {
      console.error("Failed to list tools:", error.message);
      process.exit(1);
    }
    if (!data?.length) break;
    for (const t of data) slugToId.set(t.slug, t.id);
    if (data.length < 1000) break;
    offset += 1000;
  }
}
console.log(`Existing tools in DB: ${slugToId.size}`);

const files = ["step2_categories_tools_1.sql", "step3_tools_2_scores_1.sql"];
let all = [];

for (const file of files) {
  const sql = readFileSync(join(root, "supabase", file), "utf8");
  const rows = extractToolsFromSql(sql);
  console.log(`${file}: ${rows.length} tools`);
  all.push(...rows);
}

const seen = new Set();
all = all.filter((r) => {
  if (seen.has(r.slug)) return false;
  seen.add(r.slug);
  return true;
});
console.log(`Unique tools to upsert: ${all.length}`);

for (let i = 0; i < all.length; i += 25) {
  const batch = all.slice(i, i + 25);
  const { error } = await sb.from("tools").upsert(batch, { onConflict: "slug" });
  if (error) {
    console.error(`Batch ${i} failed:`, error.message);
    console.error("Sample row:", JSON.stringify(batch[0], null, 2));
    process.exit(1);
  }
  console.log(`  ${Math.min(i + 25, all.length)} / ${all.length}`);
}

const { count } = await sb
  .from("tools")
  .select("id", { count: "exact", head: true })
  .eq("status", "active");
console.log(`\n✅ Active tools in Supabase: ${count}`);

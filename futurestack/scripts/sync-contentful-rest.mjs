#!/usr/bin/env node
/**
 * Sync Contentful news + tools into Supabase REST (no Postgres required).
 *
 * Usage:
 *   node scripts/sync-contentful-rest.mjs
 *   node scripts/sync-contentful-rest.mjs --news-only --limit 50
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

const space = process.env.CONTENTFUL_SPACE_ID;
const env = process.env.CONTENTFUL_ENVIRONMENT || "master";
const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
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
const NEWS_ONLY = args.includes("--news-only");
const TOOLS_ONLY = args.includes("--tools-only");

async function fetchContentTypes() {
  const res = await fetch(
    `https://cdn.contentful.com/spaces/${space}/environments/${env}/content_types`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json();
  return (data.items ?? []).map((i) => i.sys.id);
}

async function fetchEntries(contentType, limit) {
  const res = await fetch(
    `https://cdn.contentful.com/spaces/${space}/environments/${env}/entries?content_type=${contentType}&limit=${limit}&include=2`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json();
  return data.items ?? [];
}

function pickField(fields, key) {
  const val = fields?.[key];
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (!val || typeof val !== "object") return "";
  const first = Object.values(val)[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "nodeType" in first) {
    return richTextToPlain(first);
  }
  return "";
}

function richTextToPlain(node) {
  if (!node) return "";
  if (node.nodeType === "text" && typeof node.value === "string") return node.value;
  if (!Array.isArray(node.content)) return "";
  return node.content.map(richTextToPlain).join("\n\n");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function pickTags(fields) {
  const val = fields?.tags;
  if (Array.isArray(val)) return val.map(String);
  if (!val || typeof val !== "object") return [];
  const raw = Object.values(val)[0];
  return Array.isArray(raw) ? raw.map(String) : [];
}

async function syncNews(contentType) {
  const entries = await fetchEntries(contentType, LIMIT);
  let ok = 0;
  let fail = 0;
  for (const entry of entries) {
    const fields = entry.fields ?? {};
    let slug = pickField(fields, "slug") || slugify(pickField(fields, "title"));
    if (!slug) slug = entry.sys.id;
    const title = pickField(fields, "title");
    const excerpt = pickField(fields, "excerpt") || pickField(fields, "summary");
    const content = pickField(fields, "body") || pickField(fields, "content") || excerpt;
    if (!title) continue;
    const wordCount = content.split(/\s+/).length;
    const { error } = await sb.from("articles").upsert(
      {
        slug,
        title,
        excerpt,
        content,
        tags: pickTags(fields).length ? pickTags(fields) : ["contentful"],
        category: pickField(fields, "category") || "ai-tools",
        status: "published",
        published_at: entry.sys.updatedAt || new Date().toISOString(),
        reading_time: Math.max(1, Math.ceil(wordCount / 200)),
        word_count: wordCount,
        is_ai_generated: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    if (error) {
      fail++;
      console.log(`  ❌ ${slug}: ${error.message.slice(0, 60)}`);
    } else {
      ok++;
    }
  }
  return { ok, fail, total: entries.length };
}

async function syncTools(contentType) {
  const entries = await fetchEntries(contentType, LIMIT);
  let ok = 0;
  let fail = 0;
  for (const entry of entries) {
    const fields = entry.fields ?? {};
    const name = pickField(fields, "name") || pickField(fields, "title");
    if (!name.trim()) continue;
    let slug = pickField(fields, "slug") || slugify(name);
    if (!slug) slug = entry.sys.id;
    const { error } = await sb.from("tools").upsert(
      {
        slug,
        name: name.trim(),
        tagline: pickField(fields, "tagline") || pickField(fields, "shortDescription"),
        description:
          pickField(fields, "description") ||
          pickField(fields, "shortDescription") ||
          name,
        logo: pickField(fields, "logo") || null,
        website_url: pickField(fields, "websiteUrl") || pickField(fields, "website") || pickField(fields, "url") || "",
        category: pickField(fields, "categorySlug") || pickField(fields, "category") || "productivity",
        status: "active",
        tags: pickTags(fields).length ? pickTags(fields) : ["contentful"],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    if (error) {
      fail++;
    } else {
      ok++;
    }
  }
  return { ok, fail, total: entries.length };
}

async function main() {
  if (!space || !token) {
    console.error("Missing CONTENTFUL_SPACE_ID or CONTENTFUL_DELIVERY_TOKEN");
    process.exit(1);
  }

  const types = await fetchContentTypes();
  const newsType = ["newsArticle-2", "newsArticle-3", "newsArticle"].find((t) => types.includes(t));
  const toolType = ["tool-2", "tool"].find((t) => types.includes(t));

  console.log("\n📰  Contentful → Supabase REST sync\n");

  if (!TOOLS_ONLY && newsType) {
    console.log(`Syncing news (${newsType}, limit ${LIMIT})...`);
    const news = await syncNews(newsType);
    console.log(`  News: ${news.ok} ok, ${news.fail} failed (${news.total} fetched)\n`);
  }

  if (!NEWS_ONLY && toolType) {
    console.log(`Syncing tools (${toolType}, limit ${LIMIT})...`);
    const tools = await syncTools(toolType);
    console.log(`  Tools: ${tools.ok} ok, ${tools.fail} failed (${tools.total} fetched)\n`);
  }

  const [{ count: toolCount }, { count: articleCount }] = await Promise.all([
    sb.from("tools").select("id", { count: "exact", head: true }).eq("status", "active"),
    sb.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  console.log(`Catalog now: ${toolCount ?? 0} tools, ${articleCount ?? 0} published articles\n`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

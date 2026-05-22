#!/usr/bin/env node
/**
 * Import tool_scores, articles, stacks, etc. from SQL dumps via Management API.
 * Skips broken tool INSERTs (schema mismatch). Tools already imported via REST.
 */
import { readFileSync, existsSync } from "fs";
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

const ref =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ??
  null;
const token = process.env.SUPABASE_MANAGEMENT_TOKEN;

if (!ref || !token) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_MANAGEMENT_TOKEN in .env.local");
  process.exit(1);
}

const SECTIONS = [
  {
    file: "step3_tools_2_scores_1.sql",
    start: "-- ── tool_scores",
    end: null,
    label: "tool_scores (step3)",
  },
  {
    file: "step4_scores_2_articles_stacks.sql",
    start: null,
    end: "-- ── tool_pricing",
    label: "tool_scores (step4 part 1)",
  },
  {
    file: "step4_scores_2_articles_stacks.sql",
    start: "-- ── tool_pricing",
    end: "-- ── tool_alternatives",
    label: "tool_pricing",
  },
  {
    file: "step4_scores_2_articles_stacks.sql",
    start: "-- ── tool_alternatives",
    end: "-- ── articles",
    label: "tool_alternatives",
  },
  {
    file: "step4_scores_2_articles_stacks.sql",
    start: "-- ── articles",
    end: "-- ── stacks",
    label: "articles",
  },
  {
    file: "step4_scores_2_articles_stacks.sql",
    start: "-- ── stacks",
    end: "-- ── stack_tools",
    label: "stacks",
  },
  {
    file: "step4_scores_2_articles_stacks.sql",
    start: "-- ── stack_tools",
    end: null,
    label: "stack_tools",
  },
];

function sliceSection(file, startMarker, endMarker) {
  const path = join(root, "supabase", file);
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  const lines = readFileSync(path, "utf8").split("\n");
  let start = 0;
  if (startMarker) {
    const i = lines.findIndex((l) => l.includes(startMarker));
    if (i === -1) throw new Error(`Start marker not found: ${startMarker}`);
    start = i;
  }
  let end = lines.length;
  if (endMarker) {
    const i = lines.findIndex((l) => l.includes(endMarker));
    if (i === -1) throw new Error(`End marker not found: ${endMarker}`);
    end = i;
  }
  return lines.slice(start, end).join("\n");
}

function stripLeadingGarbage(sql) {
  const m = sql.match(/^INSERT INTO /m);
  if (!m) return sql;
  return sql.slice(m.index);
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

function parseSqlValue(raw) {
  const v = raw.trim();
  if (v === "NULL") return null;
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

function extractSqlStackIdToSlug(sql) {
  const map = new Map();
  const re = /INSERT INTO stacks \([^)]+\)\s*VALUES \(([\s\S]*?)\)\s*ON CONFLICT/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const parts = splitValues(m[1]);
    if (parts.length < 3) continue;
    const id = parseSqlValue(parts[0]);
    const slug = parseSqlValue(parts[2]);
    if (id && slug) map.set(String(id), String(slug));
  }
  return map;
}

function extractSqlToolIdToSlug(sql) {
  const map = new Map();
  const re = /INSERT INTO tools \([^)]+\)\s*VALUES \(([\s\S]*?)\)\s*ON CONFLICT/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const parts = splitValues(m[1]);
    if (parts.length < 3) continue;
    const id = parseSqlValue(parts[0]);
    const slug = parseSqlValue(parts[2]);
    if (id && slug) map.set(String(id), String(slug));
  }
  return map;
}

/** tool_pricing.features is jsonb — cast text[] arrays (not article tags) */
function transformFeaturesToJsonb(sql) {
  if (!sql.includes("INSERT INTO tool_pricing")) return sql;
  return sql.replace(
    /ARRAY\[((?:[^\]]|\][^,\]])*)\]::text\[\]/g,
    (_, inner) => `to_jsonb(ARRAY[${inner}]::text[])`,
  );
}

/** Live articles table uses cover_image_url (no hero_image / source_* columns) */
function transformArticles(sql) {
  if (!sql.includes("INSERT INTO articles")) return sql;

  let s = sql
    .replace(/\s*hero_image = EXCLUDED\.hero_image,?\s*/gi, "\n    cover_image_url = EXCLUDED.cover_image_url,\n    ")
    .replace(/\s*meta_description = EXCLUDED\.meta_description,?\s*/gi, "\n    ")
    .replace(/\s*source_url = EXCLUDED\.source_url,?\s*/gi, "\n    ")
    .replace(/,\s*source_url = EXCLUDED\.source_url\s*/gi, "\n    ")
    .replace(/,\s*source_name = EXCLUDED\.source_name\s*/gi, "")
    .replace(/,(\s*);/g, ";");

  return s.replace(
    /INSERT INTO articles \(([^)]+)\)\s*VALUES \(([\s\S]*?)\)\s*ON CONFLICT/gi,
    (_, colsStr, valuesStr) => {
      const origCols = colsStr.split(",").map((c) => c.trim());
      const parts = splitValues(valuesStr);
      const drop = new Set(["hero_image", "meta_description", "source_url", "source_name"]);
      const heroIdx = origCols.indexOf("hero_image");
      const coverIdx = origCols.indexOf("cover_image_url");

      const kept = origCols
        .map((c, i) => ({ c, v: parts[i] ?? "NULL" }))
        .filter(({ c }) => !drop.has(c));

      if (heroIdx >= 0 && coverIdx >= 0) {
        const cover = kept.find((k) => k.c === "cover_image_url");
        const heroVal = parts[heroIdx];
        if (cover && (cover.v === "NULL" || !cover.v) && heroVal && heroVal !== "NULL") {
          cover.v = heroVal;
        }
      }

      const cols = kept.map(({ c }) => c).join(", ");
      const vals = kept.map(({ v }) => v).join(", ");
      return `INSERT INTO articles (${cols}) VALUES (${vals}) ON CONFLICT`;
    },
  );
}

async function fetchAllLiveTools(sb) {
  const rows = [];
  let offset = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await sb
      .from("tools")
      .select("id, slug")
      .range(offset, offset + page - 1);
    if (error) throw new Error(`tools fetch: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < page) break;
    offset += page;
  }
  return rows;
}

/** Remap SQL dump tool UUIDs to live Supabase tool IDs (by slug) */
function remapToolIds(sql, idRemap) {
  let out = sql;
  for (const [sqlId, liveId] of idRemap) {
    if (sqlId !== liveId) {
      out = out.replaceAll(`'${sqlId}'`, `'${liveId}'`);
    }
  }
  return out;
}

/** Live schema computes futurestack_score — strip from INSERT/UPSERT SQL */
function transformStatement(sql) {
  let s = sql.includes("INSERT INTO tool_pricing")
    ? transformFeaturesToJsonb(sql)
    : sql;
  s = transformArticles(s);
  if (idRemap.size) s = remapToolIds(s, idRemap);
  if (stackIdRemap.size) s = remapToolIds(s, stackIdRemap);

  if (!s.includes("INSERT INTO tool_scores")) return s;

  s = s.replace(/INSERT INTO tool_scores \(([^)]+)\)/, (_, cols) => {
    const next = cols
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c !== "futurestack_score")
      .join(", ");
    return `INSERT INTO tool_scores (${next})`;
  });

  s = s.replace(/VALUES \(([\s\S]*?)\)\s*ON CONFLICT/i, (_, values) => {
    const parts = splitValues(values);
    if (parts.length === 10) parts.splice(8, 1);
    return `VALUES (${parts.join(", ")}) ON CONFLICT`;
  });

  s = s.replace(/\s*futurestack_score = EXCLUDED\.futurestack_score,?\s*/gi, "\n    ");
  return s;
}

function splitInsertStatements(sql) {
  const cleaned = stripLeadingGarbage(sql);
  const parts = cleaned.split(/(?=^INSERT INTO )/m).filter((s) => s.trim());
  return parts.map((s) => {
    const stmt = s.trim().endsWith(";") ? s.trim() : `${s.trim()};`;
    return transformStatement(stmt);
  });
}

async function runQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.message ?? JSON.stringify(body);
    throw new Error(`[${res.status}] ${msg}`);
  }
  return body;
}

async function runSection(section, batchSize = 10) {
  console.log(`\n📦  ${section.label}`);
  const sql = sliceSection(section.file, section.start, section.end);
  const statements = splitInsertStatements(sql);
  console.log(`   ${statements.length} INSERT statements`);

  for (let i = 0; i < statements.length; i += batchSize) {
    const batch = statements.slice(i, i + batchSize).join("\n");
    try {
      await runQuery(batch);
      console.log(`   ✅  ${Math.min(i + batchSize, statements.length)} / ${statements.length}`);
    } catch (e) {
      console.error(`   ❌  batch ${i} failed: ${e.message}`);
      if (batchSize > 1) {
        console.log("   ↻  retrying one statement at a time...");
        for (let j = i; j < Math.min(i + batchSize, statements.length); j++) {
          try {
            await runQuery(statements[j]);
          } catch (err) {
            console.error(`   ⚠️  skip statement ${j + 1}: ${err.message.slice(0, 120)}`);
          }
        }
      } else {
        throw e;
      }
    }
  }
}

async function count(label, sql) {
  try {
    const rows = await runQuery(sql);
    console.log(`   ${label}: ${rows?.[0]?.n ?? "?"}`);
  } catch (e) {
    console.log(`   ${label}: ${e.message}`);
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const sqlIdToSlug = new Map();
for (const file of ["step2_categories_tools_1.sql", "step3_tools_2_scores_1.sql"]) {
  const path = join(root, "supabase", file);
  if (existsSync(path)) {
    for (const [id, slug] of extractSqlToolIdToSlug(readFileSync(path, "utf8"))) {
      sqlIdToSlug.set(id, slug);
    }
  }
}

const liveTools = await fetchAllLiveTools(sb);
const slugToLiveId = new Map(liveTools.map((t) => [t.slug, t.id]));
const liveIds = new Set((liveTools ?? []).map((t) => t.id));
const idRemap = new Map();
for (const [sqlId, slug] of sqlIdToSlug) {
  const liveId = slugToLiveId.get(slug);
  if (liveId && liveId !== sqlId) idRemap.set(sqlId, liveId);
}

const sqlStackIdToSlug = new Map();
const stackSqlPath = join(root, "supabase", "step4_scores_2_articles_stacks.sql");
if (existsSync(stackSqlPath)) {
  for (const [id, slug] of extractSqlStackIdToSlug(readFileSync(stackSqlPath, "utf8"))) {
    sqlStackIdToSlug.set(id, slug);
  }
}
const { data: liveStacks } = await sb.from("stacks").select("id, slug");
const slugToLiveStackId = new Map((liveStacks ?? []).map((s) => [s.slug, s.id]));
const stackIdRemap = new Map();
for (const [sqlId, slug] of sqlStackIdToSlug) {
  const liveId = slugToLiveStackId.get(slug);
  if (liveId && liveId !== sqlId) stackIdRemap.set(sqlId, liveId);
}

console.log(`
╔══════════════════════════════════════════════════╗
║  DISCOVA — Import scores, articles, stacks      ║
╚══════════════════════════════════════════════════╝
Project: ${ref}
Tool ID remap: ${idRemap.size} | Stack ID remap: ${stackIdRemap.size} (live tools: ${slugToLiveId.size})
`);

console.log("Before:");
await count("tool_scores", "select count(*)::int as n from tool_scores");
await count("articles", "select count(*)::int as n from articles where status='published'");
await count("stacks", "select count(*)::int as n from stacks");
await count("stack_tools", "select count(*)::int as n from stack_tools");

const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const skipScores = !process.argv.includes("--include-scores");
const toRun = (only
  ? SECTIONS.filter((s) => s.label.toLowerCase().includes(only.toLowerCase()))
  : SECTIONS
).filter((s) => (skipScores ? !s.label.startsWith("tool_scores") : true));

for (const section of toRun) {
  await runSection(section);
}

console.log("\nAfter:");
await count("tool_scores", "select count(*)::int as n from tool_scores");
await count("articles", "select count(*)::int as n from articles where status='published'");
await count("stacks", "select count(*)::int as n from stacks");
await count("stack_tools", "select count(*)::int as n from stack_tools");
console.log("\n✅  Content import finished. Restart: npm run dev\n");

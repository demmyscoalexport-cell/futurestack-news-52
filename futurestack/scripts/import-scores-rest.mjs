#!/usr/bin/env node
/**
 * Import tool_scores via Supabase REST — remaps SQL tool IDs to live IDs by slug.
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
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

const SQL_TOOL_COLS = ["id", "name", "slug"];

function extractSqlToolIdToSlug(sql) {
  const map = new Map();
  const re =
    /INSERT INTO tools \([^)]+\)\s*VALUES \(([\s\S]*?)\)\s*ON CONFLICT/gi;
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

function extractScores(sql) {
  const rows = [];
  const re =
    /INSERT INTO tool_scores \([^)]+\)\s*VALUES \(([\s\S]*?)\)\s*ON CONFLICT/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const parts = splitValues(m[1]);
    if (parts.length < 10) continue;
    rows.push({
      id: parseSqlValue(parts[0]),
      tool_id: parseSqlValue(parts[1]),
      ease_of_use: parseSqlValue(parts[2]),
      value_for_money: parseSqlValue(parts[3]),
      feature_depth: parseSqlValue(parts[4]),
      support_quality: parseSqlValue(parts[5]),
      integration_richness: parseSqlValue(parts[6]),
      ai_capability: parseSqlValue(parts[7]),
      updated_at: parseSqlValue(parts[9]),
    });
  }
  return rows;
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const sqlIdToSlug = new Map();
for (const file of ["step2_categories_tools_1.sql", "step3_tools_2_scores_1.sql"]) {
  const sql = readFileSync(join(root, "supabase", file), "utf8");
  for (const [id, slug] of extractSqlToolIdToSlug(sql)) sqlIdToSlug.set(id, slug);
}
console.log(`SQL tool id→slug map: ${sqlIdToSlug.size}`);

const { data: liveTools } = await sb.from("tools").select("id, slug");
const slugToLiveId = new Map((liveTools ?? []).map((t) => [t.slug, t.id]));
const liveIds = new Set((liveTools ?? []).map((t) => t.id));
console.log(`Live tools: ${slugToLiveId.size}`);

function resolveLiveToolId(sqlToolId) {
  if (liveIds.has(sqlToolId)) return sqlToolId;
  const slug = sqlIdToSlug.get(sqlToolId);
  if (slug && slugToLiveId.has(slug)) return slugToLiveId.get(slug);
  return null;
}

let allScores = [];
for (const file of ["step3_tools_2_scores_1.sql", "step4_scores_2_articles_stacks.sql"]) {
  const sql = readFileSync(join(root, "supabase", file), "utf8");
  const chunk = extractScores(sql);
  console.log(`${file}: ${chunk.length} scores`);
  allScores.push(...chunk);
}

const byTool = new Map();
for (const row of allScores) {
  const liveToolId = resolveLiveToolId(row.tool_id);
  if (!liveToolId) continue;
  byTool.set(liveToolId, {
    tool_id: liveToolId,
    ease_of_use: row.ease_of_use,
    value_for_money: row.value_for_money,
    feature_depth: row.feature_depth,
    support_quality: row.support_quality,
    integration_richness: row.integration_richness,
    ai_capability: row.ai_capability,
    updated_at: row.updated_at,
  });
}

const toUpsert = [...byTool.values()];
console.log(`Scores to upsert (unique tools): ${toUpsert.length}`);

for (let i = 0; i < toUpsert.length; i += 50) {
  const batch = toUpsert.slice(i, i + 50);
  const { error } = await sb.from("tool_scores").upsert(batch, { onConflict: "tool_id" });
  if (error) {
    console.error(`Batch ${i} failed:`, error.message);
    process.exit(1);
  }
  console.log(`  ${Math.min(i + 50, toUpsert.length)} / ${toUpsert.length}`);
}

const { count } = await sb
  .from("tool_scores")
  .select("id", { count: "exact", head: true });
console.log(`\n✅ tool_scores in Supabase: ${count}`);

#!/usr/bin/env node
/**
 * Import the full 409-tool catalog from GitHub main SQL dumps into Supabase.
 *
 * Option A — Management API (recommended, no DB password):
 *   SUPABASE_MANAGEMENT_TOKEN=...  (https://app.supabase.com/account/tokens)
 *
 * Option B — Direct Postgres:
 *   SUPABASE_DB_URL=postgresql://...
 *
 * Usage:
 *   node scripts/import-full-catalog.mjs
 *   node scripts/import-full-catalog.mjs --step 2   # run one step only
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  if (k && !process.env[k]) process.env[k] = v;
}

const STEPS = [
  { id: "1", file: "deploy_schema.sql", label: "Schema" },
  { id: "2", file: "step2_categories_tools_1.sql", label: "Categories + tools 1–200" },
  { id: "3", file: "step3_tools_2_scores_1.sql", label: "Tools 201–409 + scores" },
  { id: "4", file: "step4_scores_2_articles_stacks.sql", label: "Scores + articles + stacks" },
];

const onlyStep = process.argv.find((a) => a.startsWith("--step="))?.split("=")[1]
  ?? (process.argv.includes("--step") ? process.argv[process.argv.indexOf("--step") + 1] : null);

function projectRef() {
  const db = process.env.SUPABASE_DB_URL ?? "";
  const m1 = db.match(/postgres\.([a-z0-9]+):/);
  if (m1) return m1[1];
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const m2 = api.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  return m2?.[1] ?? null;
}

async function runViaManagementApi(sql, label) {
  const ref = projectRef();
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
  if (!ref || !token) return false;

  console.log(`\n📦  ${label} → Supabase (${ref}) via Management API...`);
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
    console.error(`❌  ${label} failed [${res.status}]:`, body.message ?? JSON.stringify(body));
    process.exit(1);
  }
  console.log(`✅  ${label} applied`);
  return true;
}

async function runViaPg(sql, label) {
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url?.startsWith("postgresql://")) return false;

  console.log(`\n📦  ${label} → Postgres...`);
  const pool = new pg.Pool({
    connectionString: url,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : false,
  });
  try {
    await pool.query(sql);
    console.log(`✅  ${label} applied`);
    return true;
  } finally {
    await pool.end();
  }
}

async function runSqlFile(file, label) {
  const path = join(root, "supabase", file);
  if (!existsSync(path)) {
    console.error(`❌  Missing ${path}`);
    process.exit(1);
  }
  const sql = readFileSync(path, "utf8");
  const viaApi = await runViaManagementApi(sql, label);
  if (viaApi) return;
  const viaPg = await runViaPg(sql, label);
  if (viaPg) return;

  console.error(`
❌  Cannot import — add ONE of these to futurestack/.env.local:

  SUPABASE_MANAGEMENT_TOKEN=...   → https://app.supabase.com/account/tokens
  SUPABASE_DB_URL=postgresql://... → Supabase → Settings → Database → pooler URI

Then re-run:  node scripts/import-full-catalog.mjs
`);
  process.exit(1);
}

async function countTools() {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const { count, error } = await sb
    .from("tools")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

console.log(`
╔══════════════════════════════════════════════════╗
║  FutureStack — Import full tool catalog (409)   ║
╚══════════════════════════════════════════════════╝
Project: ${projectRef() ?? "unknown"}
`);

const steps = onlyStep
  ? STEPS.filter((s) => s.id === onlyStep)
  : STEPS;

if (!steps.length) {
  console.error("Invalid --step. Use 1, 2, 3, or 4.");
  process.exit(1);
}

let before = 0;
try {
  before = await countTools();
  console.log(`Tools in Supabase now: ${before}`);
} catch (e) {
  console.log(`Could not count tools yet: ${e.message}`);
}

for (const step of steps) {
  await runSqlFile(step.file, step.label);
}

try {
  const after = await countTools();
  console.log(`
══════════════════════════════════════════════════
✅  Import complete
   Tools before: ${before}
   Tools after:  ${after}  (expected ~409 active)
   Restart dev:  npm run dev
   Preview:      http://localhost:3000/tools
══════════════════════════════════════════════════
`);
} catch (e) {
  console.log(`\n✅  SQL applied. Verify tool count in Supabase dashboard.\n`);
}

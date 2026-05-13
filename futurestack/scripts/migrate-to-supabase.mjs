#!/usr/bin/env node
/**
 * DISCOVA — Migrate data from Replit PostgreSQL → Supabase
 *
 * Usage:
 *   cd futurestack
 *   node scripts/migrate-to-supabase.mjs
 *
 * What it does:
 *   1. Connects to your current Replit PG (DATABASE_URL)
 *   2. Reads all tables
 *   3. Generates a migration SQL file at ./supabase/data_migration.sql
 *   4. You paste / run that file in Supabase SQL Editor
 *
 * Prerequisites:
 *   - Run the schema first: paste supabase/deploy_schema.sql into Supabase SQL Editor
 *   - Then run this script to export data
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dir = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
  const envPath = join(__dir, "../.env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not required in CI
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set. Cannot connect to source database.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("localhost") || DATABASE_URL.includes("helium")
    ? false
    : { rejectUnauthorized: false },
  max: 3,
});

function esc(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Array.isArray(val)) {
    return `ARRAY[${val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(",")}]::text[]`;
  }
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportTable(tableName, onConflict, sql = []) {
  let rows;
  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at ASC NULLS FIRST`);
    rows = result.rows;
  } catch {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName}`);
      rows = result.rows;
    } catch (e2) {
      console.warn(`  ⚠️  Skipping ${tableName}: ${e2.message}`);
      return;
    }
  }

  if (!rows.length) {
    console.log(`  ○ ${tableName}: empty`);
    return;
  }

  sql.push(`\n-- ── ${tableName} (${rows.length} rows) ────────────────────────`);

  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = cols.map(c => esc(row[c]));
    const updates = cols
      .filter(c => c !== "id")
      .map(c => `${c} = EXCLUDED.${c}`)
      .join(",\n    ");
    sql.push(
      `INSERT INTO ${tableName} (${cols.join(", ")})\nVALUES (${vals.join(", ")})\nON CONFLICT (${onConflict}) DO UPDATE SET\n    ${updates};`
    );
  }

  console.log(`  ✅  ${tableName}: ${rows.length} rows`);
}

async function main() {
  console.log("\n🚀  DISCOVA — Supabase Data Migration Export");
  console.log("══════════════════════════════════════════════");
  console.log("Source: Replit PostgreSQL\n");

  const sql = [
    "-- ════════════════════════════════════════════════════════════",
    "-- DISCOVA — Data Migration: Replit PG → Supabase",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Run this AFTER applying supabase/deploy_schema.sql",
    "-- ════════════════════════════════════════════════════════════",
    "\nSET session_replication_role = replica; -- disable FK checks during import\n",
  ];

  await exportTable("tool_categories", "id", sql);
  await exportTable("authors", "id", sql);
  await exportTable("categories", "id", sql);
  await exportTable("tools", "slug", sql);
  await exportTable("tool_scores", "tool_id", sql);
  await exportTable("tool_pricing", "id", sql);
  await exportTable("tool_alternatives", "tool_id, alternative_id", sql);
  await exportTable("articles", "slug", sql);
  await exportTable("stacks", "slug", sql);
  await exportTable("stack_tools", "id", sql);

  sql.push("\nSET session_replication_role = DEFAULT; -- re-enable FK checks");

  const outPath = join(__dir, "../supabase/data_migration.sql");
  writeFileSync(outPath, sql.join("\n") + "\n");

  await pool.end();

  console.log("\n══════════════════════════════════════════════");
  console.log(`✅  Done! Migration SQL written to:`);
  console.log(`    futurestack/supabase/data_migration.sql\n`);
  console.log("Next steps:");
  console.log("  1. Go to Supabase Dashboard → SQL Editor");
  console.log("  2. Run: supabase/deploy_schema.sql  (schema)");
  console.log("  3. Run: supabase/data_migration.sql (data)");
  console.log("  4. Copy your DB connection string:");
  console.log("     Supabase → Settings → Database → URI (Transaction pooler)");
  console.log("  5. Add it as secret: SUPABASE_DB_URL");
  console.log("  6. Restart the app — it will auto-switch to Supabase\n");
}

main().catch(e => {
  console.error("❌  Migration failed:", e.message);
  process.exit(1);
});

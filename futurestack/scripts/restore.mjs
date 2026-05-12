#!/usr/bin/env node
/**
 * FutureStack Restore Script
 * Run: node scripts/restore.mjs
 *
 * Use this when returning to the project after a break to verify and restore
 * the project to a fully working state.
 *
 * Steps:
 *  1. Check DB connectivity
 *  2. Re-seed if data is missing
 *  3. Restore logos for any tools missing them
 *  4. Print next steps
 */

import pg from "pg";
import { execSync } from "child_process";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const log = (msg) => console.log(msg);
const ok = (msg)  => console.log("  ✅", msg);
const warn = (msg) => console.log("  ⚠️ ", msg);
const err = (msg)  => console.log("  ❌", msg);

log("\n🔍  FutureStack Restore Check\n" + "─".repeat(40));

// 1. Check DB
let toolCount = 0;
let logosMissing = 0;
try {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM tools WHERE status='active')::int AS tools,
       (SELECT COUNT(*) FROM tools WHERE (logo IS NULL OR logo='') AND status='active')::int AS missing_logos,
       (SELECT COUNT(*) FROM articles)::int AS articles,
       (SELECT COUNT(*) FROM stacks)::int  AS stacks`
  );
  toolCount    = rows[0].tools;
  logosMissing = rows[0].missing_logos;

  log("\nDatabase counts:");
  log(`  Tools:    ${rows[0].tools}  (expected 54)`);
  log(`  Articles: ${rows[0].articles}  (expected 8)`);
  log(`  Stacks:   ${rows[0].stacks}  (expected 9)`);
  log(`  Missing logos: ${logosMissing}`);
} catch (e) {
  err(`DB connection failed: ${e.message}`);
  log("\n  → Check that DATABASE_URL is set and Replit PostgreSQL is running.");
  process.exit(1);
}

// 2. Re-seed if needed
if (toolCount < 50) {
  warn("Tools count too low — re-seeding database...");
  try {
    execSync("node scripts/seed-pg.mjs --quick", { stdio: "inherit" });
    ok("Database re-seeded successfully.");
  } catch (e) {
    err("Seeding failed: " + e.message);
  }
} else {
  ok(`Database has ${toolCount} active tools.`);
}

// 3. Restore logos via Clearbit/Google favicon for any missing ones
if (logosMissing > 0) {
  warn(`${logosMissing} tool(s) missing logos — restoring via Clearbit...`);
  const { rows } = await pool.query(
    `SELECT id, name, slug, website_url FROM tools WHERE (logo IS NULL OR logo='') AND status='active'`
  );
  for (const tool of rows) {
    if (!tool.website_url) continue;
    try {
      const hostname = new URL(tool.website_url).hostname;
      const parts = hostname.split(".");
      const domain = parts.includes("google") ? "google.com" : parts.slice(-2).join(".");
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      await pool.query("UPDATE tools SET logo=$1 WHERE id=$2", [logoUrl, tool.id]);
      log(`    Restored logo for ${tool.name}`);
    } catch {
      log(`    Skipped ${tool.name} (no valid URL)`);
    }
  }
  ok("Logo restore complete.");
} else {
  ok("All tools have logos.");
}

await pool.end();

// 4. Summary
log("\n" + "═".repeat(40));
log("✅  Project is ready. Start with:");
log("    npm run dev          (from futurestack/)");
log("    node scripts/healthcheck.mjs   (verify everything)");
log("═".repeat(40) + "\n");

#!/usr/bin/env node
/**
 * Runs schema-additions.sql against Supabase via the Management API.
 * Requires SUPABASE_MANAGEMENT_TOKEN in env (Personal Access Token from
 * https://app.supabase.com/account/tokens).
 *
 * Usage:  node scripts/run-schema.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });

const PROJECT_REF = "nuyigpwhmyiogfzsdvzw";
const TOKEN       = process.env.SUPABASE_MANAGEMENT_TOKEN;

if (!TOKEN) {
  console.error(
    "\n❌  SUPABASE_MANAGEMENT_TOKEN is not set.\n" +
    "    1. Go to https://app.supabase.com/account/tokens\n" +
    "    2. Generate a new token, copy it\n" +
    "    3. Add it as a Replit secret named SUPABASE_MANAGEMENT_TOKEN\n" +
    "    4. Re-run: node scripts/run-schema.mjs\n"
  );
  process.exit(1);
}

const __dir  = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(__dir, "../supabase/schema-additions.sql");
const sql     = readFileSync(sqlFile, "utf8");

// Split on semicolons, keeping only non-empty statements
// Management API runs one statement at a time
const statements = sql
  .split(";")
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--"));

console.log(`\n📦 Running ${statements.length} SQL statements against ${PROJECT_REF}...\n`);

let ok = 0, failed = 0;

for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({ query: stmt + ";" }),
      }
    );

    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      console.log(`  ✅  ${preview}`);
      ok++;
    } else {
      // Treat "already exists" and "duplicate" as warnings, not failures
      const msg = (body.message || body.error || JSON.stringify(body)).toLowerCase();
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate") ||
        msg.includes("does not exist") && stmt.toUpperCase().startsWith("DROP")
      ) {
        console.log(`  ⚠️   (skipped — already applied) ${preview}`);
        ok++;
      } else {
        console.error(`  ❌  FAILED [${res.status}]: ${body.message || JSON.stringify(body)}`);
        console.error(`       Statement: ${preview}`);
        failed++;
      }
    }
  } catch (err) {
    console.error(`  ❌  Network error: ${err.message}`);
    failed++;
  }
}

console.log(`\n${"─".repeat(60)}`);
console.log(`Done: ${ok} succeeded, ${failed} failed`);

if (failed === 0) {
  console.log("\n✅  Schema applied successfully! You can now run:");
  console.log("    node scripts/migrate-affiliates.mjs\n");
} else {
  console.log("\n⚠️   Some statements failed — check the errors above.\n");
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Runs schema-additions.sql against Supabase via the Management API.
 * Sends the entire file as one query (Supabase supports multi-statement batches).
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
  console.error("\n❌  SUPABASE_MANAGEMENT_TOKEN is not set.\n");
  process.exit(1);
}

const __dir  = dirname(fileURLToPath(import.meta.url));
const sql    = readFileSync(join(__dir, "../supabase/schema-additions.sql"), "utf8");

console.log(`\n📦  Sending schema-additions.sql to Supabase (${PROJECT_REF})...\n`);

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }
);

const body = await res.json().catch(() => ({}));

if (res.ok) {
  console.log("✅  Schema applied successfully!\n");
  console.log("Now run the affiliate migration:");
  console.log("    cd futurestack && node scripts/migrate-affiliates.mjs\n");
} else {
  // Print the error clearly so we know exactly what failed
  const msg = body.message || body.error || JSON.stringify(body, null, 2);
  console.error(`❌  Failed [${res.status}]:\n\n${msg}\n`);
  process.exit(1);
}

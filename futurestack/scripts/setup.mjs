#!/usr/bin/env node
/**
 * DISCOVA — One-Command Setup
 * ───────────────────────────
 * Run from futurestack/ directory:
 *   node scripts/setup.mjs
 *
 * What this does:
 *   1. Validates your .env.local is present and has required vars
 *   2. Tests the Supabase database connection
 *   3. Applies the full DB schema
 *   4. Seeds initial tool data (quick mode — no AI image generation)
 *   5. Tells you exactly what to do next
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

// ── helpers ─────────────────────────────────────────────────────────────────

const ok  = (msg) => console.log(`  ✅  ${msg}`);
const err = (msg) => console.error(`  ❌  ${msg}`);
const info = (msg) => console.log(`  ℹ️   ${msg}`);
const step = (n, msg) => console.log(`\n${"─".repeat(50)}\n  Step ${n}: ${msg}\n${"─".repeat(50)}`);
const die  = (msg) => { err(msg); process.exit(1); };

// ── load .env.local ──────────────────────────────────────────────────────────

const envPath = resolve(root, ".env.local");
if (!existsSync(envPath)) {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║         DISCOVA — First-time Setup            ║
  ╚═══════════════════════════════════════════════╝

  ❌  .env.local not found.

  Run this first:
    cp .env.example .env.local

  Then open .env.local and fill in at least:
    NEXT_PUBLIC_SUPABASE_URL     → from Supabase → Settings → API
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY
    SUPABASE_DB_URL              → Transaction pooler URI (port 6543)
    SUPABASE_DB_PASSWORD

  Then re-run:  node scripts/setup.mjs
`);
  process.exit(1);
}

// Parse .env.local into process.env
const envContent = readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  if (key && !process.env[key]) process.env[key] = val;
}

console.log(`
  ╔═══════════════════════════════════════════════╗
  ║         DISCOVA — Setup                       ║
  ╚═══════════════════════════════════════════════╝
`);

// ── step 1: validate env vars ────────────────────────────────────────────────

step(1, "Checking environment variables");

const required = {
  NEXT_PUBLIC_SUPABASE_URL:   "Supabase → Settings → API → Project URL",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase → Settings → API → anon/public key",
  SUPABASE_SERVICE_ROLE_KEY:  "Supabase → Settings → API → service_role key",
  SUPABASE_DB_URL:            "Supabase → Settings → Database → Transaction pooler URI (port 6543)",
};

let missing = false;
for (const [key, hint] of Object.entries(required)) {
  if (!process.env[key]) {
    err(`${key} is missing\n       → Get it from: ${hint}`);
    missing = true;
  } else {
    ok(key);
  }
}
if (missing) die("\nFill in the missing values in .env.local and re-run.");

// ── step 2: test DB connection ────────────────────────────────────────────────

step(2, "Testing database connection");

let pg;
try {
  const { default: PgPkg } = await import("pg");
  pg = PgPkg.Pool ?? PgPkg;
} catch {
  die('pg package not found. Run: npm install');
}

const pool = new pg({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  connectionTimeoutMillis: 8000,
});

try {
  const { rows } = await pool.query("SELECT version()");
  ok(`Connected → ${rows[0].version.split(" ").slice(0, 2).join(" ")}`);
} catch (e) {
  err(`Cannot connect to database: ${e.message}`);
  console.log(`
  Check that:
  • SUPABASE_DB_URL uses the Transaction pooler URL (port 6543)
  • SUPABASE_DB_PASSWORD is correct
  • Your Supabase project is active (not paused)
  `);
  await pool.end();
  process.exit(1);
}

// ── step 3: apply schema ─────────────────────────────────────────────────────

step(3, "Applying database schema");

const schemaPath = resolve(root, "supabase/deploy_schema.sql");
if (!existsSync(schemaPath)) {
  err("supabase/deploy_schema.sql not found");
  await pool.end();
  process.exit(1);
}

const schema = readFileSync(schemaPath, "utf8");

// Split on statement boundaries and run each chunk
const statements = schema
  .split(/;\s*$/m)
  .map(s => s.trim())
  .filter(s => s.length > 10 && !s.startsWith("--"));

let applied = 0;
let skipped = 0;
for (const stmt of statements) {
  try {
    await pool.query(stmt);
    applied++;
  } catch (e) {
    // Idempotent errors (already exists etc.) are fine
    if (e.message.includes("already exists") || e.message.includes("duplicate")) {
      skipped++;
    } else {
      // Non-fatal: warn but continue
      console.log(`  ⚠️   ${e.message.split("\n")[0]}`);
    }
  }
}
ok(`Schema applied (${applied} statements, ${skipped} already existed)`);

// ── step 4: seed tool data ────────────────────────────────────────────────────

step(4, "Seeding initial tool data");

const { rows: existing } = await pool.query("SELECT COUNT(*) FROM tools").catch(() => ({ rows: [{ count: "0" }] }));
const toolCount = parseInt(existing[0].count);

if (toolCount > 50) {
  ok(`Database already has ${toolCount} tools — skipping seed`);
} else {
  info(`Found ${toolCount} tools — running quick seed...`);
  await pool.end();

  // Run the seed script as a child process
  const { spawn } = await import("child_process");
  await new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/seed-pg.mjs", "--quick"], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Seed exited with code ${code}`)));
  });

  console.log("");
  ok("Seed complete");
  // pool is already ended
  process.exit(0);
}

await pool.end();

// ── done ─────────────────────────────────────────────────────────────────────

console.log(`
${"═".repeat(52)}
  ✅  DISCOVA is ready!

  Start the dev server:
    npm run dev

  Then open:  http://localhost:3000

  Admin panel (after signing in as admin):
    http://localhost:3000/admin

  To give yourself admin access, run in Supabase SQL Editor:
    UPDATE profiles SET role = 'admin' WHERE email = 'you@email.com';
${"═".repeat(52)}
`);

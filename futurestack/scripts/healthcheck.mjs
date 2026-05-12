#!/usr/bin/env node
/**
 * FutureStack Health Check
 * Run: node scripts/healthcheck.mjs
 *
 * Checks:
 *  1. PostgreSQL connectivity + data integrity
 *  2. All public pages return HTTP 200
 *  3. All API routes respond correctly
 *  4. Environment secrets are present
 *  5. Logo coverage (all tools have logos)
 */

import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local so secrets defined there are visible to this script
const __dir = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(resolve(__dir, "../.env.local"), "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not present — rely on system env */ }

const BASE = "http://localhost:3000";
const { Pool } = pg;

// ── helpers ──────────────────────────────────────────────────────────────────
const pass = (msg) => console.log("  ✅", msg);
const fail = (msg) => { console.log("  ❌", msg); failures++; };
const section = (title) => console.log(`\n── ${title} ${"─".repeat(50 - title.length)}`);

let failures = 0;

async function get(path, expectedCode = 200) {
  try {
    const r = await fetch(`${BASE}${path}`);
    return r.status;
  } catch {
    return 0;
  }
}

async function post(path, body) {
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.status;
  } catch {
    return 0;
  }
}

// ── 1. Environment secrets ────────────────────────────────────────────────────
section("Environment secrets");

const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "WAVESPEED_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
];
const optional = ["INNGEST_SIGNING_KEY", "STRIPE_SECRET_KEY"];

for (const key of required) {
  process.env[key] ? pass(key) : fail(`${key} — MISSING (required)`);
}
for (const key of optional) {
  process.env[key] ? pass(`${key} (optional)`) : console.log("  ⚠️ ", `${key} — not set (optional)`);
}

// ── 2. Database ───────────────────────────────────────────────────────────────
section("PostgreSQL database");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DB_MINIMUMS = {
  "tools (active)":    { sql: "SELECT COUNT(*) FROM tools WHERE status='active'", min: 50 },
  "tools with logos":  { sql: "SELECT COUNT(*) FROM tools WHERE logo IS NOT NULL AND logo != '' AND status='active'", min: 50 },
  "articles":          { sql: "SELECT COUNT(*) FROM articles", min: 5 },
  "stacks":            { sql: "SELECT COUNT(*) FROM stacks", min: 5 },
  "tool_pricing rows": { sql: "SELECT COUNT(*) FROM tool_pricing", min: 50 },
  "tool_scores rows":  { sql: "SELECT COUNT(*) FROM tool_scores", min: 50 },
  "categories":        { sql: "SELECT COUNT(*) FROM tool_categories", min: 5 },
  "authors":           { sql: "SELECT COUNT(*) FROM authors", min: 3 },
};

try {
  for (const [label, { sql, min }] of Object.entries(DB_MINIMUMS)) {
    const { rows } = await pool.query(sql);
    const n = parseInt(rows[0].count);
    n >= min ? pass(`${label}: ${n}`) : fail(`${label}: ${n} (expected ≥ ${min})`);
  }
} catch (e) {
  fail(`Database connection failed: ${e.message}`);
}

await pool.end();

// ── 3. Pages (GET 200) ────────────────────────────────────────────────────────
section("Pages");

const PAGES = [
  "/",
  "/tools",
  "/news",
  "/stacks",
  "/stack-builder",
  "/methodology",
  "/tools/zapier",
  "/tools/chatgpt",
  "/tools/canva",
];

for (const path of PAGES) {
  const code = await get(path);
  code === 200 ? pass(`${path}`) : fail(`${path} → HTTP ${code}`);
}

// ── 4. API routes ─────────────────────────────────────────────────────────────
section("API routes");

const API_CHECKS = [
  { method: "GET",  path: "/api/search?q=zapier",    expected: 200 },
  { method: "GET",  path: "/api/generate-image",     expected: 200 },
  { method: "GET",  path: "/api/generate-logos",     expected: 200 },
  { method: "GET",  path: "/api/inngest",             expected: 200 },
  { method: "POST", path: "/api/newsletter",         body: { email: "healthcheck@futurestack.test" }, expected: [200, 400, 409] },
  { method: "POST", path: "/api/submit-tool",        body: { name: "", website: "" },                 expected: [200, 400, 422] },
];

for (const check of API_CHECKS) {
  const code = check.method === "POST"
    ? await post(check.path, check.body)
    : await get(check.path);
  const ok = Array.isArray(check.expected)
    ? check.expected.includes(code)
    : code === check.expected;
  ok
    ? pass(`${check.method} ${check.path} → ${code}`)
    : fail(`${check.method} ${check.path} → ${code} (expected ${JSON.stringify(check.expected)})`);
}

// ── 5. Logo coverage ──────────────────────────────────────────────────────────
section("Logo coverage");

const logoPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const { rows } = await logoPool.query(
    `SELECT name, slug FROM tools WHERE (logo IS NULL OR logo = '') AND status = 'active' ORDER BY name`
  );
  rows.length === 0
    ? pass("All active tools have logos")
    : rows.forEach((t) => fail(`${t.name} (${t.slug}) has no logo`));
} catch (e) {
  fail(`Logo check failed: ${e.message}`);
}
await logoPool.end();

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(55));
if (failures === 0) {
  console.log("✅  All checks passed — project is healthy.");
} else {
  console.log(`❌  ${failures} check(s) failed — review the output above.`);
  process.exit(1);
}
console.log("═".repeat(55) + "\n");

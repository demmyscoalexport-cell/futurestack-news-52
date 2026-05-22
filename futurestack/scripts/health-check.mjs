#!/usr/bin/env node
/**
 * Quick health check: Supabase REST + Contentful delivery API
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  if (k && !process.env[k]) process.env[k] = v;
}

const ok = (label, detail) => console.log(`✅  ${label}: ${detail}`);
const fail = (label, detail) => console.log(`❌  ${label}: ${detail}`);

console.log("\n═══ DISCOVA health check ═══\n");

// Supabase REST
try {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tools?select=id&status=eq.active`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const count = res.headers.get("content-range")?.split("/")[1] ?? "?";
  if (res.ok) ok("Supabase tools", `${count} active`);
  else fail("Supabase tools", `${res.status}`);
} catch (e) {
  fail("Supabase tools", e.message);
}

for (const [table, filter] of [
  ["tool_scores", ""],
  ["articles", "&status=eq.published"],
  ["stacks", ""],
]) {
  try {
    const q = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=id${filter}`;
    const res = await fetch(q, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    });
    const count = res.headers.get("content-range")?.split("/")[1] ?? "?";
    if (res.ok) ok(`Supabase ${table}`, count);
    else fail(`Supabase ${table}`, `${res.status}`);
  } catch (e) {
    fail(`Supabase ${table}`, e.message);
  }
}

// Contentful delivery
const space = process.env.CONTENTFUL_SPACE_ID;
const env = process.env.CONTENTFUL_ENVIRONMENT || "master";
const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
if (!space || !token) {
  fail("Contentful", "missing CONTENTFUL_SPACE_ID or CONTENTFUL_DELIVERY_TOKEN");
} else {
  try {
    const res = await fetch(
      `https://cdn.contentful.com/spaces/${space}/environments/${env}/entries?limit=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const body = await res.json().catch(() => ({}));
    if (res.ok) ok("Contentful delivery", `${body.total ?? "?"} entries`);
    else fail("Contentful delivery", `${res.status} ${body.message ?? ""}`);
  } catch (e) {
    fail("Contentful delivery", e.message);
  }
}

const mgmt = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
if (mgmt) {
  try {
    const res = await fetch(`https://api.contentful.com/spaces/${space}/environments/${env}`, {
      headers: { Authorization: `Bearer ${mgmt}` },
    });
    if (res.ok) ok("Contentful management", "connected");
    else fail("Contentful management", `${res.status} (optional)`);
  } catch (e) {
    fail("Contentful management", e.message);
  }
} else {
  console.log("ℹ️  Contentful management token not set (optional for sync)");
}

console.log(`\nSite URL: ${process.env.NEXT_PUBLIC_SITE_URL ?? "not set"}\n`);

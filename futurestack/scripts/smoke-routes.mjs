#!/usr/bin/env node
/**
 * Smoke-test public routes after deploy.
 * Usage: SITE_URL=https://getdiscova.com node scripts/smoke-routes.mjs
 */
const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const routes = [
  "/",
  "/tools",
  "/blog",
  "/blog/best-ai-tools-2026",
  "/news",
  "/discover",
  "/compare",
  "/api/health",
];

let failed = 0;

for (const path of routes) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const ok = res.status >= 200 && res.status < 400;
    console.log(`${ok ? "✓" : "✗"} ${res.status} ${path}`);
    if (!ok) failed++;
    if (path === "/api/health" && ok) {
      const json = await res.json();
      if (!json.ok) {
        console.log(`  ✗ health payload not ok`);
        failed++;
      } else {
        console.log(`  activeTools: ${json.checks?.database?.activeTools ?? "?"}`);
      }
    }
  } catch (err) {
    console.log(`✗ ERR ${path} — ${err.message}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} route(s) failed against ${base}`);
  process.exit(1);
}

console.log(`\nAll ${routes.length} routes passed on ${base}`);

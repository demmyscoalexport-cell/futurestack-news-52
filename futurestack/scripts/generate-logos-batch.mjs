#!/usr/bin/env node
/**
 * Batch-generate Cloudinary logos via /api/generate-logos
 * Usage: node scripts/generate-logos-batch.mjs [limit] [port]
 */
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const t = line.trim().replace(/\r$/, "");
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 0) continue;
  process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

const limit = parseInt(process.argv[2] || "10", 10);
const port = process.argv[3] || process.env.PORT || "3000";
const base = `http://localhost:${port}`;

async function getStats() {
  const res = await fetch(`${base}/api/generate-logos`);
  return res.json();
}

async function generateBatch(batchLimit) {
  const res = await fetch(`${base}/api/generate-logos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: batchLimit }),
  });
  return res.json();
}

async function main() {
  console.log(`\n🎨  Logo generation — target ${limit} tools\n`);

  let stats;
  try {
    stats = await getStats();
  } catch (e) {
    console.error(`❌  Dev server not reachable at ${base}. Start with: npm run dev`);
    process.exit(1);
  }

  console.log(`   Before: ${stats.stats?.needs_logo ?? "?"} need logos (${stats.stats?.has_cloudinary_logo ?? "?"} on Cloudinary)`);
  console.log(`   WaveSpeed: ${stats.wavespeed ? "✅" : "❌"}  Cloudinary: ${stats.cloudinary ? "✅" : "❌"}\n`);

  let totalSucceeded = 0;
  let totalFailed = 0;
  let remaining = limit;

  while (remaining > 0) {
    const batch = Math.min(5, remaining);
    process.stdout.write(`  Batch of ${batch}… `);
    const result = await generateBatch(batch);
    if (!result.ok) {
      console.log(`❌  ${result.error ?? "failed"}`);
      break;
    }
    console.log(`${result.succeeded}/${result.processed} succeeded`);
    totalSucceeded += result.succeeded ?? 0;
    totalFailed += result.failed ?? 0;
    remaining -= batch;
    if (result.processed === 0) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  const after = await getStats().catch(() => null);
  console.log(`\n✅  Done — ${totalSucceeded} logos generated, ${totalFailed} failed`);
  if (after?.stats) {
    console.log(`   After: ${after.stats.needs_logo} need logos, ${after.stats.has_cloudinary_logo} on Cloudinary\n`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

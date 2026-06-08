#!/usr/bin/env node
/**
 * Push .env.local values to Vercel (UTF-8, no BOM).
 * Usage: node scripts/push-vercel-env.mjs [production|preview|development|all]
 */
import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");
const targetArg = process.argv[2] || "production";
const targets =
  targetArg === "all"
    ? ["production", "preview", "development"]
    : [targetArg];

const KEYS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_USE_REST",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "PRODUCTHUNT_ACCESS_TOKEN",
  "GNEWS_API_KEY",
  "THENEWSAPI_KEY",
  "WAVESPEED_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "SCRAPINGBEE_API_KEY",
  "CONTENTFUL_SPACE_ID",
  "CONTENTFUL_ENVIRONMENT",
  "CONTENTFUL_DELIVERY_TOKEN",
  "CONTENTFUL_PREVIEW_TOKEN",
  "CONTENTFUL_MANAGEMENT_TOKEN",
  "CONTENTFUL_WEBHOOK_SECRET",
  "CONTENTFUL_USE_PREVIEW_API",
  "CONTENTFUL_DEFAULT_LOCALE",
  "SESSION_SECRET",
];

const vars = {};
for (const line of readFileSync(envPath, "utf8").replace(/^\uFEFF/, "").split("\n")) {
  const t = line.trim().replace(/\r$/, "");
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 0) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  vars[k] = v.replace(/^\uFEFF/, "").trim();
}

for (const env of targets) {
  console.log(`\n=== ${env} ===`);
  for (const key of KEYS) {
    const value = vars[key];
    if (!value) {
      console.log(`skip ${key}`);
      continue;
    }
    const res = spawnSync("vercel", ["env", "add", key, env, "--force"], {
      input: value,
      encoding: "utf8",
      cwd: root,
      shell: true,
    });
    if (res.status !== 0) {
      console.error(`FAIL ${key}:`, String(res.stderr || res.stdout).slice(0, 100));
    } else {
      console.log(`ok ${key}`);
    }
  }
}

console.log("\nDone.");

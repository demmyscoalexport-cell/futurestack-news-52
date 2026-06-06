#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();
const packagePath = resolve(root, "package.json");
const lockPath = resolve(root, "package-lock.json");
const nextConfigPath = resolve(root, "next.config.mjs");

const requiredFiles = [
  ["package.json", packagePath],
  ["package-lock.json", lockPath],
  ["next.config.mjs", nextConfigPath],
];

const missingFiles = requiredFiles
  .filter(([, path]) => !existsSync(path))
  .map(([label]) => label);

// NEXT_PUBLIC_SITE_URL is optional — defaults to production domain if unset
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.NEXT_PUBLIC_SITE_URL = "https://getdiscova.com";
}

const missingEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
].filter((key) => !process.env[key]);

const packageJson = existsSync(packagePath)
  ? JSON.parse(readFileSync(packagePath, "utf8"))
  : null;

const problems = [];

if (missingFiles.length > 0) {
  problems.push(
    `Vercel root directory is wrong or required files are missing: ${missingFiles.join(", ")}. Set Vercel Project Settings -> Root Directory to "futurestack".`,
  );
}

if (packageJson?.name !== "my-project") {
  problems.push(
    `Unexpected package.json project name. Vercel should build from the futurestack directory, not the repository root.`,
  );
}

if (missingEnv.length > 0) {
  problems.push(
    `Missing required Vercel environment variables: ${missingEnv.join(", ")}. Add them in Vercel Project Settings -> Environment Variables for Production, Preview, and Development.`,
  );
}

if (
  process.env.SUPABASE_DB_URL &&
  !process.env.SUPABASE_DB_URL.startsWith("postgresql://") &&
  !process.env.SUPABASE_DB_URL.startsWith("postgres://")
) {
  problems.push("SUPABASE_DB_URL is set but is not a valid postgres:// connection string.");
}

if (problems.length > 0) {
  console.error("\nDISCOVA Vercel preflight failed:\n");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  console.error("\nSee docs/VERCEL_DEPLOYMENT.md for exact setup steps.\n");
  process.exit(1);
}

console.log("DISCOVA Vercel preflight passed.");

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
  const project = process.env.VERCEL_PROJECT_NAME ?? "futurestack-news-52";
  const envHint = `Add them on Vercel project "${project}" -> Settings -> Environment Variables (Production, Preview, Development).`;
  if (process.env.VERCEL === "1") {
    console.warn(
      `\nDISCOVA Vercel preflight warning: missing ${missingEnv.join(", ")}. ${envHint}\n`,
    );
  } else {
    problems.push(`Missing required Vercel environment variables: ${missingEnv.join(", ")}. ${envHint}`);
  }
}

if (process.env.SUPABASE_DB_URL && !process.env.SUPABASE_DB_URL.startsWith("postgresql://")) {
  problems.push("SUPABASE_DB_URL is set but is not a valid postgresql:// connection string.");
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

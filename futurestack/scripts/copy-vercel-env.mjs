#!/usr/bin/env node
/**
 * Copy all environment variables from one Vercel project to another.
 *
 * Default: discova-ai-platform → futurestack-news-52
 *
 * Usage:
 *   VERCEL_TOKEN=xxx node scripts/copy-vercel-env.mjs
 *   VERCEL_TOKEN=xxx node scripts/copy-vercel-env.mjs --dry-run
 *   VERCEL_TOKEN=xxx node scripts/copy-vercel-env.mjs --source other --target futurestack-news-52
 *
 * Optional:
 *   VERCEL_TEAM_ID=team_xxx   or   VERCEL_TEAM_SLUG=demmyscoalexport-4319s-projects
 */
const API = "https://api.vercel.com";

const DEFAULT_SOURCE = "discova-ai-platform";
const DEFAULT_TARGET = "futurestack-news-52";
const DEFAULT_TEAM_SLUG = "demmyscoalexport-4319s-projects";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

function readArg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const source = readArg("--source", process.env.VERCEL_SOURCE_PROJECT ?? DEFAULT_SOURCE);
const target = readArg("--target", process.env.VERCEL_TARGET_PROJECT ?? DEFAULT_TARGET);
const token = process.env.VERCEL_TOKEN;

if (!token) {
  console.error(
    "Missing VERCEL_TOKEN. Create one at https://vercel.com/account/tokens and rerun."
  );
  process.exit(1);
}

function teamQuery() {
  const params = new URLSearchParams();
  if (process.env.VERCEL_TEAM_ID) {
    params.set("teamId", process.env.VERCEL_TEAM_ID);
  } else if (process.env.VERCEL_TEAM_SLUG) {
    params.set("slug", process.env.VERCEL_TEAM_SLUG);
  } else {
    params.set("slug", DEFAULT_TEAM_SLUG);
  }
  return params;
}

async function api(path, { method = "GET", body } = {}) {
  const sep = path.includes("?") ? "&" : "?";
  const team = teamQuery();
  const url = `${API}${path}${sep}${team}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.error?.message ?? data?.message ?? res.statusText;
    throw new Error(`${method} ${path} failed (${res.status}): ${msg}`);
  }

  return data;
}

async function fetchAllEnv(project) {
  const envs = [];
  let until;

  for (;;) {
    const q = new URLSearchParams({ decrypt: "true", limit: "100" });
    if (until) q.set("until", until);

    const data = await api(`/v10/projects/${encodeURIComponent(project)}/env?${q}`);
    const batch = data.envs ?? [];
    envs.push(...batch);

    if (batch.length < 100) break;
    until = batch[batch.length - 1]?.id;
    if (!until) break;
  }

  return envs;
}

function normalizeTargets(targetField) {
  if (!targetField) return ["production"];
  return Array.isArray(targetField) ? targetField : [targetField];
}

async function upsertEnv(project, record) {
  const payload = {
    key: record.key,
    value: record.value,
    type: record.type ?? "encrypted",
    target: normalizeTargets(record.target),
  };

  if (record.gitBranch) {
    payload.gitBranch = record.gitBranch;
  }
  if (record.comment) {
    payload.comment = record.comment;
  }

  return api(
    `/v10/projects/${encodeURIComponent(project)}/env?upsert=true`,
    { method: "POST", body: payload }
  );
}

async function main() {
  console.log(`Source: ${source}`);
  console.log(`Target: ${target}`);
  console.log(`Team:   ${process.env.VERCEL_TEAM_ID ?? process.env.VERCEL_TEAM_SLUG ?? DEFAULT_TEAM_SLUG}`);
  if (dryRun) console.log("Mode:   dry-run (no writes)\n");
  else console.log("");

  const sourceEnvs = await fetchAllEnv(source);
  const actionable = sourceEnvs.filter((e) => e.type !== "system" && e.key);

  console.log(`Found ${actionable.length} variables on ${source} (${sourceEnvs.length} total including system).\n`);

  if (actionable.length === 0) {
    console.log("Nothing to copy.");
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const record of actionable) {
    const targets = normalizeTargets(record.target).join(",");
    const branch = record.gitBranch ? ` branch=${record.gitBranch}` : "";
    const label = `${record.key} [${targets}]${branch}`;

    if (dryRun) {
      console.log(`would copy ${label}`);
      ok++;
      continue;
    }

    try {
      await upsertEnv(target, record);
      console.log(`ok   ${label}`);
      ok++;
    } catch (err) {
      console.error(`FAIL ${label}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone. ${ok} succeeded, ${fail} failed.`);

  if (fail > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

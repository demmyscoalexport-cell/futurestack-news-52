#!/usr/bin/env node
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: tools } = await sb.from("tools").select("id, slug, rating").eq("status", "active");
const { data: scores } = await sb.from("tool_scores").select("tool_id");
const scored = new Set((scores ?? []).map((r) => r.tool_id));
const missing = (tools ?? []).filter((t) => !scored.has(t.id));

let n = 0;
for (const t of missing) {
  const base = Number(t.rating) || 7;
  const { error } = await sb.from("tool_scores").upsert(
    {
      tool_id: t.id,
      ease_of_use: base,
      value_for_money: base,
      feature_depth: base,
      support_quality: 7,
      integration_richness: 7,
      ai_capability: base,
    },
    { onConflict: "tool_id" },
  );
  if (!error) n++;
}

console.log(`Backfilled ${n}/${missing.length} missing tool_scores`);

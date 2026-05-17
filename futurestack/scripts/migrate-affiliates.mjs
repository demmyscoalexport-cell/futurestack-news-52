/**
 * Migrate affiliate_links from Replit PG → Supabase
 * Run: node scripts/migrate-affiliates.mjs
 *
 * Prerequisites: Run supabase/schema-additions.sql in the Supabase SQL Editor first.
 */

import dotenv from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local", override: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const replitDb = new pg.Pool({ connectionString: process.env.DATABASE_URL });

console.log("══════════════════════════════════════════════");
console.log("  DISCOVA — Affiliate Migration → Supabase");
console.log("══════════════════════════════════════════════\n");

async function run() {
  // 1. Fetch all affiliate_links from Replit PG
  const { rows: links } = await replitDb.query(`
    SELECT al.id, al.affiliate_url, al.partner_name,
           al.commission_rate::float, al.notes, al.is_active,
           al.created_at,
           t.slug AS tool_slug
    FROM affiliate_links al
    JOIN tools t ON t.id = al.tool_id
  `);

  console.log(`📦  Found ${links.length} affiliate links in Replit PG`);

  // 2. For each link, look up the tool in Supabase by slug and upsert
  let ok = 0, skip = 0;
  for (const link of links) {
    const { data: tool, error: toolErr } = await supabase
      .from("tools")
      .select("id")
      .eq("slug", link.tool_slug)
      .single();

    if (toolErr || !tool) {
      console.log(`  ⚠️  Tool not found in Supabase: ${link.tool_slug}`);
      skip++;
      continue;
    }

    const { error } = await supabase
      .from("affiliate_links")
      .upsert({
        tool_id:         tool.id,
        affiliate_url:   link.affiliate_url,
        partner_name:    link.partner_name,
        commission_rate: link.commission_rate,
        notes:           link.notes,
        is_active:       link.is_active,
        created_at:      link.created_at,
      }, { onConflict: "tool_id" });

    if (error) {
      console.log(`  ❌ Failed ${link.tool_slug}: ${error.message}`);
      skip++;
    } else {
      ok++;
    }
  }

  console.log(`✅  Migrated ${ok} affiliate links (${skip} skipped)\n`);

  // 3. Verify
  const { count } = await supabase
    .from("affiliate_links")
    .select("*", { count: "exact", head: true });
  console.log(`🔍  Supabase affiliate_links now has ${count} rows`);

  await replitDb.end();
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

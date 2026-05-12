#!/usr/bin/env node
/**
 * Seed affiliate links for top 20 tools.
 * Run from the futurestack/ directory:
 *   node scripts/seed-affiliates.mjs
 */

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool();

const AFFILIATES = [
  { slug: "notion-ai",        affiliate_url: "https://affiliate.notion.so/futurestack",                             partner_name: "Notion",        commission_rate: 50 },
  { slug: "canva",            affiliate_url: "https://partner.canva.com/futurestack",                                partner_name: "Canva",         commission_rate: 36 },
  { slug: "n8n",              affiliate_url: "https://n8n.io/?ref=futurestack",                                      partner_name: "n8n",           commission_rate: 30 },
  { slug: "invideo-ai",       affiliate_url: "https://invideo.io/?ref=futurestack",                                  partner_name: "InVideo AI",    commission_rate: 25 },
  { slug: "surfer-seo",       affiliate_url: "https://surferseo.com/?fp_ref=futurestack",                            partner_name: "Surfer SEO",    commission_rate: 25 },
  { slug: "elevenlabs",       affiliate_url: "https://elevenlabs.io/?from=futurestack",                              partner_name: "ElevenLabs",    commission_rate: 22 },
  { slug: "zapier",           affiliate_url: "https://zapier.com/?utm_source=futurestack&utm_medium=affiliate",      partner_name: "Zapier",        commission_rate: 20 },
  { slug: "grammarly",        affiliate_url: "https://grammarly.go2cloud.org/aff_c?offer_id=2&aff_id=futurestack",  partner_name: "Grammarly",     commission_rate: 20 },
  { slug: "make",             affiliate_url: "https://www.make.com/en/register?pc=futurestack",                      partner_name: "Make",          commission_rate: 20 },
  { slug: "quillbot",         affiliate_url: "https://quillbot.com/?ref=futurestack",                                partner_name: "QuillBot",      commission_rate: 20 },
  { slug: "jasper-ai",        affiliate_url: "https://www.jasper.ai/?fpr=futurestack",                              partner_name: "Jasper",        commission_rate: 25 },
  { slug: "copy-ai",          affiliate_url: "https://www.copy.ai/?via=futurestack",                                 partner_name: "Copy.ai",       commission_rate: 45 },
  { slug: "writesonic",       affiliate_url: "https://writesonic.com/?via=futurestack",                              partner_name: "Writesonic",    commission_rate: 30 },
  { slug: "midjourney",       affiliate_url: "https://www.midjourney.com/account/?ref=futurestack",                  partner_name: "Midjourney",    commission_rate: 0  },
  { slug: "descript",         affiliate_url: "https://www.descript.com/?lmref=futurestack",                          partner_name: "Descript",      commission_rate: 15 },
  { slug: "murf-ai",          affiliate_url: "https://murf.ai/?via=futurestack",                                     partner_name: "Murf AI",       commission_rate: 20 },
  { slug: "pictory",          affiliate_url: "https://pictory.ai?ref=futurestack",                                   partner_name: "Pictory",       commission_rate: 20 },
  { slug: "semrush",          affiliate_url: "https://www.semrush.com/lp/brand-monitoring/?ref=futurestack",         partner_name: "SEMrush",       commission_rate: 40 },
  { slug: "hubspot",          affiliate_url: "https://www.hubspot.com/?hubs_signup-url=futurestack",                 partner_name: "HubSpot",       commission_rate: 30 },
  { slug: "frase-io",         affiliate_url: "https://www.frase.io/?via=futurestack",                                partner_name: "Frase",         commission_rate: 30 },
];

async function run() {
  let seeded = 0;
  let skipped = 0;

  for (const aff of AFFILIATES) {
    const { rows: toolRows } = await pool.query(
      `SELECT id FROM tools WHERE slug = $1 AND status = 'active' LIMIT 1`,
      [aff.slug],
    );

    if (!toolRows.length) {
      console.log(`  skip  ${aff.slug} — tool not found or inactive`);
      skipped++;
      continue;
    }

    const tool_id = toolRows[0].id;

    await pool.query(
      `INSERT INTO affiliate_links (tool_id, affiliate_url, partner_name, commission_rate, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (tool_id) DO UPDATE SET
         affiliate_url   = EXCLUDED.affiliate_url,
         partner_name    = EXCLUDED.partner_name,
         commission_rate = EXCLUDED.commission_rate,
         is_active       = true,
         updated_at      = NOW()`,
      [tool_id, aff.affiliate_url, aff.partner_name, aff.commission_rate],
    );

    console.log(`  ✓  ${aff.slug} → ${aff.partner_name} (${aff.commission_rate}%)`);
    seeded++;
  }

  console.log(`\nDone: ${seeded} seeded, ${skipped} skipped.`);
  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });

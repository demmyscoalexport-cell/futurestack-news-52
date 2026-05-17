#!/usr/bin/env node
/**
 * Push DISCOVA tools + articles from DB → Contentful CMA
 * Parallel batches of 5 with 80ms inter-batch delay
 * Run: node scripts/push-to-contentful.mjs
 */

import pg from 'pg';
const { Pool } = pg;

const SPACE  = process.env.CONTENTFUL_SPACE_ID;
const ENV    = process.env.CONTENTFUL_ENVIRONMENT || 'master';
const TOKEN  = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const BASE   = `https://api.contentful.com/spaces/${SPACE}/environments/${ENV}`;
const BATCH  = 3;
const DELAY  = 600;

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/vnd.contentful.management.v1+json',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const loc   = val => ({ 'en-US': val });

/** Convert plain text / markdown to a minimal Contentful RichText document */
function toRichText(text) {
  const raw = (text || '').trim();
  // Split on blank lines → separate paragraphs
  const chunks = raw.split(/\n{2,}/).map(c => c.replace(/\n/g, ' ').trim()).filter(Boolean);
  if (!chunks.length) chunks.push('');
  return {
    nodeType: 'document',
    data: {},
    content: chunks.map(chunk => ({
      nodeType: 'paragraph',
      data: {},
      content: [{
        nodeType: 'text',
        value: chunk,
        marks: [],
        data: {},
      }],
    })),
  };
}

async function getSlugsInContentful(contentType) {
  const existing = new Set();
  let skip = 0, total = Infinity;
  while (skip < total) {
    const res = await fetch(
      `${BASE}/entries?content_type=${contentType}&select=fields.slug&limit=200&skip=${skip}`,
      { headers: HEADERS }
    ).then(r => r.json());
    total = res.total ?? 0;
    res.items?.forEach(e => {
      const s = e.fields?.slug?.['en-US'];
      if (s) existing.add(s);
    });
    skip += res.items?.length || 200;
    if (!res.items?.length) break;
  }
  return existing;
}

async function createAndPublish(contentType, fields) {
  const entry = await fetch(`${BASE}/entries`, {
    method: 'POST',
    headers: { ...HEADERS, 'X-Contentful-Content-Type': contentType },
    body: JSON.stringify({ fields }),
  }).then(async r => {
    const j = await r.json();
    if (!r.ok) throw new Error(`${r.status}: ${j.message} — ${JSON.stringify(j.details?.errors?.[0] || {}).slice(0, 200)}`);
    return j;
  });
  // publish
  const pub = await fetch(`${BASE}/entries/${entry.sys.id}/published`, {
    method: 'PUT',
    headers: { ...HEADERS, 'X-Contentful-Version': String(entry.sys.version) },
  });
  if (!pub.ok) {
    const pj = await pub.json();
    throw new Error(`Publish ${entry.sys.id}: ${pj.message}`);
  }
  return entry;
}

async function pushInBatches(items, label, contentType, toFields) {
  const existing = await getSlugsInContentful(contentType);
  console.log(`  ${existing.size} already in Contentful`);
  const toCreate = items.filter(i => !existing.has(i.slug));
  console.log(`  ${toCreate.length} to create\n`);

  let created = 0, failed = 0;
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const batch = toCreate.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async item => {
        try {
          await createAndPublish(contentType, toFields(item));
          process.stdout.write('.');
          created++;
        } catch (e) {
          process.stdout.write('✗');
          console.error(`\n  ✗ ${item.slug}: ${e.message}`);
          failed++;
        }
      })
    );
    if (i + BATCH < toCreate.length) await sleep(DELAY);
  }
  console.log(`\n\n  ${label}: ${created} created, ${existing.size} skipped, ${failed} failed`);
  return { created, failed };
}

async function main() {
  if (!SPACE || !TOKEN) { console.error('Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN'); process.exit(1); }

  const check = await fetch(`${BASE}/content_types`, { headers: HEADERS }).then(r => r.json());
  if (check.sys?.type === 'Error') { console.error('CMA denied:', check.message); process.exit(1); }
  console.log(`✓ CMA access OK — space: ${SPACE}\n`);

  const db = new Pool({ connectionString: process.env.DATABASE_URL });

  // ── Tools ──────────────────────────────────────────────────────────────────
  const { rows: tools } = await db.query(
    `SELECT slug, name, tagline, description, logo, website_url, category,
            tags, pricing_model, has_free, is_verified, status
     FROM tools WHERE status = 'active' ORDER BY name`
  );
  console.log(`── Tools (${tools.length}) ──────────────────────────────`);

  await pushInBatches(tools, 'Tools', 'tool-2', t => ({
    name:         loc(t.name || ''),
    slug:         loc(t.slug),
    tagline:      loc(t.tagline || ''),
    description:  loc(toRichText(t.description)),   // RichText
    websiteUrl:   loc(t.website_url || ''),
    categorySlug: loc(t.category || ''),
    pricingModel: loc(t.pricing_model || 'free'),
    freeTier:     loc(Boolean(t.has_free)),
    verified:     loc(Boolean(t.is_verified)),
    status:       loc(t.status || 'active'),
    tags:         loc(Array.isArray(t.tags) ? t.tags : []),
  }));

  // ── Articles ───────────────────────────────────────────────────────────────
  const { rows: articles } = await db.query(
    `SELECT a.slug, a.title, a.excerpt, a.content, a.seo_title,
            a.seo_description, a.tags, a.status, a.is_featured,
            a.reading_time, a.published_at, c.slug as cat_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     ORDER BY a.created_at`
  );
  console.log(`\n── Articles (${articles.length}) ─────────────────────────`);

  await pushInBatches(articles, 'Articles', 'newsArticle-2', a => ({
    title:          loc(a.title || ''),
    slug:           loc(a.slug),
    excerpt:        loc(a.excerpt || ''),
    body:           loc(toRichText(a.content)),      // RichText
    seoTitle:       loc(a.seo_title || a.title || ''),
    seoDescription: loc(a.seo_description || a.excerpt || ''),
    tags:           loc(Array.isArray(a.tags) ? a.tags : []),
    category:       loc(a.cat_slug || 'general'),
    publishedAt:    loc(a.published_at ? new Date(a.published_at).toISOString() : new Date().toISOString()),
    readingTime:    loc(String(a.reading_time || 5)),  // Symbol (string)
    status:         loc(a.status || 'published'),
    featured:       loc(Boolean(a.is_featured)),
    trendingScore:  loc(0),
  }));

  await db.end();
  console.log('\n✅ Done!');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

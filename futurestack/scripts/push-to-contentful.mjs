#!/usr/bin/env node
/**
 * Push DISCOVA tools + articles from the local DB → Contentful CMA
 * Uses content types: tool-2, newsArticle-2
 * Run: node scripts/push-to-contentful.mjs
 */

import pg from 'pg';
const { Pool } = pg;

const SPACE  = process.env.CONTENTFUL_SPACE_ID;
const ENV    = process.env.CONTENTFUL_ENVIRONMENT || 'master';
const TOKEN  = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const BASE   = `https://api.contentful.com/spaces/${SPACE}/environments/${ENV}`;

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/vnd.contentful.management.v1+json',
};

// ─── helpers ────────────────────────────────────────────────────────────────
const loc = (val) => ({ 'en-US': val });

async function cmaRequest(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`CMA ${method} ${path} → ${res.status}: ${json.message || JSON.stringify(json)}`);
  return json;
}

async function upsertEntry(contentType, fields, slug) {
  // Check if entry with this slug already exists
  const existing = await fetch(
    `${BASE}/entries?content_type=${contentType}&fields.slug=${encodeURIComponent(slug)}&limit=1`,
    { headers: HEADERS }
  ).then(r => r.json());

  let entry;
  if (existing.items && existing.items.length > 0) {
    const id = existing.items[0].sys.id;
    const version = existing.items[0].sys.version;
    entry = await cmaRequest('PUT', `/entries/${id}`, { fields });
    console.log(`  ↻ updated  [${contentType}] ${slug}`);
  } else {
    entry = await cmaRequest('POST', '/entries', {
      sys: { contentType: { sys: { id: contentType } } },
      fields,
    });
    // Set content type header (required for POST)
    entry = await fetch(`${BASE}/entries`, {
      method: 'POST',
      headers: { ...HEADERS, 'X-Contentful-Content-Type': contentType },
      body: JSON.stringify({ fields }),
    }).then(r => r.json());
    console.log(`  + created  [${contentType}] ${slug}`);
  }

  // Publish it
  try {
    await fetch(`${BASE}/entries/${entry.sys.id}/published`, {
      method: 'PUT',
      headers: { ...HEADERS, 'X-Contentful-Version': String(entry.sys.version) },
    });
  } catch (e) {
    console.warn(`    ⚠ publish failed for ${slug}:`, e.message);
  }

  return entry;
}

async function createEntry(contentType, fields) {
  const entry = await fetch(`${BASE}/entries`, {
    method: 'POST',
    headers: { ...HEADERS, 'X-Contentful-Content-Type': contentType },
    body: JSON.stringify({ fields }),
  }).then(async r => {
    const json = await r.json();
    if (!r.ok) throw new Error(`${r.status}: ${json.message || JSON.stringify(json)}`);
    return json;
  });

  // Publish
  await fetch(`${BASE}/entries/${entry.sys.id}/published`, {
    method: 'PUT',
    headers: { ...HEADERS, 'X-Contentful-Version': String(entry.sys.version) },
  });

  return entry;
}

async function entryExistsBySlug(contentType, slug) {
  const res = await fetch(
    `${BASE}/entries?content_type=${contentType}&fields.slug=${encodeURIComponent(slug)}&limit=1`,
    { headers: HEADERS }
  ).then(r => r.json());
  return res.total > 0 ? res.items[0] : null;
}

// ─── push tools ─────────────────────────────────────────────────────────────
async function pushTools(db) {
  const { rows } = await db.query(
    `SELECT slug, name, tagline, description, logo, website_url, category,
            tags, pricing_model, has_free, is_verified, status
     FROM tools WHERE status = 'active' ORDER BY name`
  );

  console.log(`\nPushing ${rows.length} tools → Contentful [tool-2]`);
  let created = 0, skipped = 0, failed = 0;

  for (const t of rows) {
    try {
      const existing = await entryExistsBySlug('tool-2', t.slug);
      if (existing) { console.log(`  ✓ skip    [tool-2] ${t.slug}`); skipped++; continue; }

      const fields = {
        name:         loc(t.name),
        slug:         loc(t.slug),
        tagline:      loc(t.tagline || ''),
        description:  loc(t.description || ''),
        websiteUrl:   loc(t.website_url || ''),
        categorySlug: loc(t.category || ''),
        pricingModel: loc(t.pricing_model || 'free'),
        freeTier:     loc(Boolean(t.has_free)),
        verified:     loc(Boolean(t.is_verified)),
        status:       loc(t.status || 'active'),
        tags:         loc(Array.isArray(t.tags) ? t.tags : []),
      };

      await createEntry('tool-2', fields);
      console.log(`  ✓ created [tool-2] ${t.slug}`);
      created++;
      // small delay to respect rate limits
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.error(`  ✗ failed  [tool-2] ${t.slug}:`, e.message);
      failed++;
    }
  }

  console.log(`Tools: ${created} created, ${skipped} skipped, ${failed} failed`);
}

// ─── push articles ───────────────────────────────────────────────────────────
async function pushArticles(db) {
  const { rows } = await db.query(
    `SELECT a.slug, a.title, a.excerpt, a.content, a.hero_image,
            a.seo_title, a.seo_description, a.tags, a.status,
            a.is_featured, a.reading_time, a.published_at, c.slug as cat_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     ORDER BY a.created_at`
  );

  console.log(`\nPushing ${rows.length} articles → Contentful [newsArticle-2]`);
  let created = 0, skipped = 0, failed = 0;

  for (const a of rows) {
    try {
      const existing = await entryExistsBySlug('newsArticle-2', a.slug);
      if (existing) { console.log(`  ✓ skip    [newsArticle-2] ${a.slug}`); skipped++; continue; }

      const fields = {
        title:       loc(a.title),
        slug:        loc(a.slug),
        excerpt:     loc(a.excerpt || ''),
        body:        loc(a.content || ''),
        seoTitle:    loc(a.seo_title || a.title),
        seoDescription: loc(a.seo_description || a.excerpt || ''),
        tags:        loc(Array.isArray(a.tags) ? a.tags : []),
        category:    loc(a.cat_slug || 'general'),
        publishedAt: loc(a.published_at ? new Date(a.published_at).toISOString() : new Date().toISOString()),
        readingTime: loc(a.reading_time || 5),
        status:      loc(a.status || 'published'),
        featured:    loc(Boolean(a.is_featured)),
        trendingScore: loc(0),
      };

      await createEntry('newsArticle-2', fields);
      console.log(`  ✓ created [newsArticle-2] ${a.slug}`);
      created++;
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.error(`  ✗ failed  [newsArticle-2] ${a.slug}:`, e.message);
      failed++;
    }
  }

  console.log(`Articles: ${created} created, ${skipped} skipped, ${failed} failed`);
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!SPACE || !TOKEN) {
    console.error('Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN');
    process.exit(1);
  }

  // Verify CMA access
  const check = await fetch(`${BASE}/content_types`, { headers: HEADERS }).then(r => r.json());
  if (check.sys?.type === 'Error') {
    console.error('CMA access denied:', check.message);
    console.error('Fix: In Contentful → Org Settings → Access Management → enable Personal Access Tokens');
    process.exit(1);
  }
  console.log('✓ CMA access confirmed — space:', SPACE);
  console.log('  Content types available:', check.items?.map(ct => ct.sys.id).join(', '));

  const db = new Pool({ connectionString: process.env.DATABASE_URL });

  await pushTools(db);
  await pushArticles(db);

  await db.end();
  console.log('\n✅ Done — all content pushed to Contentful!');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

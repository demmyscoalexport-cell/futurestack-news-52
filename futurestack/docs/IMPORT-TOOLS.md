# Import 409 tools into Supabase

Your app is built for **409 active tools**. They ship in this repo as SQL:

| File | Contents |
|------|----------|
| `supabase/step2_categories_tools_1.sql` | Categories + tools 1–200 |
| `supabase/step3_tools_2_scores_1.sql` | Tools 201–409 + scores |
| `supabase/step4_scores_2_articles_stacks.sql` | Articles + stacks |

## Why you only see 15 tools locally

`.env.local` points at Supabase project **`mjqkptowvgzmrojlgcms`**, which currently has **15 tools**.

GitHub main / Replit production uses **`nuyigpwhmyiogfzsdvzw`** (see root `replit.md`) — that project may already have the full catalog if you used it on Replit.

## Option A — Import into your current Supabase (recommended)

1. Create a token: [Supabase Account Tokens](https://app.supabase.com/account/tokens)
2. Add to `futurestack/.env.local`:

```
SUPABASE_MANAGEMENT_TOKEN=sbp_...
```

3. Run:

```bash
cd futurestack
npm run import:catalog
```

4. Restart dev server and open http://localhost:3000/tools

## Option B — Use production Supabase credentials

If you have keys for **`nuyigpwhmyiogfzsdvzw`**, replace in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://nuyigpwhmyiogfzsdvzw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Option C — Manual SQL (no token)

1. Open Supabase → SQL Editor
2. Run each file in order: `deploy_schema.sql`, step 2, 3, 4
3. Or visit `/api/admin/migration-sql` when dev server is running for download links

## Verify

```bash
node scripts/check-supabase.mjs
```

Expected: `tools: 409 rows` (or close, active status)

# Deploy to futurestack-news-52 (getdiscova.com)

Production project: **`futurestack-news-52`**  
Domain: **`getdiscova.com`**

## Required Vercel settings (one time)

Open: https://vercel.com/demmyscoalexport-4319s-projects/futurestack-news-52/settings/general

| Setting | Value |
|---|---|
| **Root Directory** | `futurestack` |
| **Production Branch** | `main` |
| **Node.js Version** | `22.x` |
| **Framework** | Next.js |

If Root Directory is blank, builds fail with **"No Next.js version detected"**.

## Required environment variables

**Settings → Environment Variables** on `futurestack-news-52`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://getdiscova.com
```

Copy any remaining vars from `.env.example` (Contentful, Resend, etc.).

## Deploy latest build

Pushes to `main` deploy automatically. To deploy manually:

1. **Deployments** → latest `main` commit → **Redeploy**
2. Or push any commit to `main`

## Verify

- https://getdiscova.com
- https://getdiscova.com/blog
- https://getdiscova.com/api/health

```bash
cd futurestack && SITE_URL=https://getdiscova.com npm run smoke:routes
```

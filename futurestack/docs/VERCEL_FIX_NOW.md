# Fix getdiscova.com in 2 minutes

**You do NOT need a new Vercel account.** The app builds successfully. The domain just needs to be wired to the latest Production deployment on the correct project.

## Which project?

| Project | Use for |
|---|---|
| **`discova-ai-platform`** | Production — `getdiscova.com`, all env vars, blog |
| `futurestack-news-52` | Legacy — ignore it (auto-skipped on every push) |

## Step 1 — Open the right project

https://vercel.com/demmyscoalexport-4319s-projects/discova-ai-platform

## Step 2 — Promote the latest deploy to Production

1. Click **Deployments**
2. Open the top **Ready** deployment from branch `main` (green checkmark)
3. Click the **⋯** menu → **Promote to Production**

If you only see **Redeploy**, use that on the latest successful `main` deployment.

## Step 3 — Make the site public

1. **Settings** → **Deployment Protection**
2. Set protection to **None** (or disable Vercel Authentication for Production)
3. Save

## Step 4 — Confirm project settings (one time)

| Setting | Value |
|---|---|
| Root Directory | `futurestack` |
| Production Branch | `main` |
| Domains | `getdiscova.com`, `www.getdiscova.com` |

## Step 5 — Verify

Open https://getdiscova.com — you should see the homepage, not `404 NOT_FOUND`.

```bash
cd futurestack
SITE_URL=https://getdiscova.com npm run smoke:routes
```

## Optional — stop failure emails from the old project

On **`futurestack-news-52`** → **Settings** → **Git** → **Disconnect Repository**

This stops the duplicate project from watching `main` entirely.

## Why you saw "No Next.js version detected"

That error is on **`futurestack-news-52`** when Vercel builds from the repo root instead of `futurestack/`. That project is no longer used for production. New pushes skip it automatically.

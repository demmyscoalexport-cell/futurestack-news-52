import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

/**
 * GET /api/affiliate/:slug
 * Tracked redirect: log the click then 302 to the affiliate URL (or fallback to website).
 */
router.get("/affiliate/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;

  let toolId: string | null = null;
  let destination = "https://futurestack.news";

  try {
    const { rows } = await pool.query<{
      id: string;
      website_url: string | null;
      website: string | null;
      affiliate_url: string | null;
    }>(
      `SELECT t.id, t.website_url, t.website, al.affiliate_url
       FROM tools t
       LEFT JOIN affiliate_links al ON al.tool_id = t.id AND al.is_active = true
       WHERE t.slug = $1
       LIMIT 1`,
      [slug],
    );

    if (rows[0]) {
      toolId = rows[0].id;
      destination =
        rows[0].affiliate_url ??
        rows[0].website_url ??
        rows[0].website ??
        destination;
    }
  } catch {
    req.log.warn({ slug }, "affiliate lookup failed — falling back to homepage");
  }

  // Fire-and-forget click log (do not block the redirect)
  if (toolId) {
    const referrer = req.headers.referer ?? req.headers.referrer ?? null;
    const userAgent = req.headers["user-agent"]?.slice(0, 255) ?? null;
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      typeof forwarded === "string"
        ? forwarded.split(",")[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0]
          : null;
    const ipHash = ip
      ? Buffer.from(ip).toString("base64").slice(0, 16)
      : null;
    const country =
      (req.headers["cf-ipcountry"] as string | undefined) ??
      (req.headers["x-vercel-ip-country"] as string | undefined) ??
      null;

    pool
      .query(
        `INSERT INTO affiliate_clicks (tool_id, referrer, country, user_agent, ip_hash)
         VALUES ($1, $2, $3, $4, $5)`,
        [toolId, referrer, country, userAgent, ipHash],
      )
      .catch((err) => req.log.error({ err }, "affiliate_clicks insert failed"));
  }

  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, destination);
});

export default router;

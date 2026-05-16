-- ================================================================
-- DISCOVA — Supabase Schema Additions
-- Paste this entire file into the Supabase SQL Editor and run it.
-- Safe to run multiple times (IF NOT EXISTS / OR REPLACE).
-- ================================================================

-- ── 1. Video columns on tools ────────────────────────────────────
ALTER TABLE tools ADD COLUMN IF NOT EXISTS video_embed_url text;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS promo_video_url text;

-- ── 2. Affiliate links table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id         uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  affiliate_url   text NOT NULL,
  partner_name    text NOT NULL,
  commission_rate numeric(5,2) DEFAULT 0,
  notes           text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(tool_id)
);

-- ── 3. Affiliate clicks table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id    uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  clicked_at timestamptz DEFAULT now(),
  referrer   text,
  country    text,
  user_agent text,
  ip_hash    text
);
CREATE INDEX IF NOT EXISTS affiliate_clicks_tool_idx ON affiliate_clicks(tool_id);
CREATE INDEX IF NOT EXISTS affiliate_clicks_time_idx ON affiliate_clicks(clicked_at DESC);

-- ── 4. Enable RLS on all sensitive tables ────────────────────────
ALTER TABLE tools           ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- ── 5. Tools policies ────────────────────────────────────────────
DROP POLICY IF EXISTS "tools_public_select"  ON tools;
CREATE POLICY "tools_public_select" ON tools FOR SELECT USING (true);

DROP POLICY IF EXISTS "tools_admin_write" ON tools;
CREATE POLICY "tools_admin_write" ON tools FOR ALL
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 6. Articles policies ─────────────────────────────────────────
DROP POLICY IF EXISTS "articles_public_select" ON articles;
CREATE POLICY "articles_public_select" ON articles FOR SELECT USING (true);

DROP POLICY IF EXISTS "articles_admin_write" ON articles;
CREATE POLICY "articles_admin_write" ON articles FOR ALL
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 7. Reviews policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "reviews_public_select" ON reviews;
CREATE POLICY "reviews_public_select" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_own_insert" ON reviews;
CREATE POLICY "reviews_own_insert" ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
CREATE POLICY "reviews_admin_all" ON reviews FOR ALL
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 8. Affiliate links policies (admin-only) ─────────────────────
DROP POLICY IF EXISTS "affiliate_links_admin_all" ON affiliate_links;
CREATE POLICY "affiliate_links_admin_all" ON affiliate_links FOR ALL
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 9. Affiliate clicks policies ─────────────────────────────────
DROP POLICY IF EXISTS "affiliate_clicks_public_insert" ON affiliate_clicks;
CREATE POLICY "affiliate_clicks_public_insert" ON affiliate_clicks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "affiliate_clicks_admin_select" ON affiliate_clicks;
CREATE POLICY "affiliate_clicks_admin_select" ON affiliate_clicks
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 10. RPC: affiliate summary stats ─────────────────────────────
CREATE OR REPLACE FUNCTION get_affiliate_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'today', COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '1 day'),
    'week',  COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '7 days'),
    'month', COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '30 days'),
    'total', COUNT(*)
  )
  FROM affiliate_clicks;
$$;

-- ── 11. RPC: per-tool affiliate data + click counts ───────────────
CREATE OR REPLACE FUNCTION get_affiliate_tools()
RETURNS TABLE (
  id              uuid,
  name            text,
  slug            text,
  logo            text,
  affiliate_id    uuid,
  affiliate_url   text,
  partner_name    text,
  commission_rate numeric,
  notes           text,
  is_active       boolean,
  clicks_30d      bigint,
  clicks_7d       bigint,
  clicks_today    bigint,
  sparkline       json
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id, t.name, t.slug, t.logo,
    al.id           AS affiliate_id,
    al.affiliate_url,
    al.partner_name,
    al.commission_rate,
    al.notes,
    al.is_active,
    COALESCE(SUM(CASE WHEN c.clicked_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN c.clicked_at >= NOW() - INTERVAL '7 days'  THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN c.clicked_at >= NOW() - INTERVAL '1 day'   THEN 1 ELSE 0 END), 0),
    COALESCE((
      SELECT json_agg(json_build_object('day', day::text, 'clicks', cnt) ORDER BY day)
      FROM (
        SELECT date_trunc('day', clicked_at)::date AS day, COUNT(*)::bigint AS cnt
        FROM affiliate_clicks
        WHERE tool_id = t.id AND clicked_at >= NOW() - INTERVAL '30 days'
        GROUP BY 1
      ) spark_data
    ), '[]'::json)
  FROM tools t
  LEFT JOIN affiliate_links al ON al.tool_id = t.id
  LEFT JOIN affiliate_clicks c ON c.tool_id = t.id
  GROUP BY t.id, t.name, t.slug, t.logo, al.id, al.affiliate_url,
           al.partner_name, al.commission_rate, al.notes, al.is_active
  ORDER BY COALESCE(SUM(CASE WHEN c.clicked_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END), 0) DESC, t.name ASC;
$$;

-- ── 12. RPC: daily click trend (30 days) ─────────────────────────
CREATE OR REPLACE FUNCTION get_affiliate_daily_trend()
RETURNS TABLE (day date, clicks bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT date_trunc('day', clicked_at)::date AS day, COUNT(*)::bigint AS clicks
  FROM affiliate_clicks
  WHERE clicked_at >= NOW() - INTERVAL '30 days'
  GROUP BY 1
  ORDER BY 1 ASC;
$$;

-- ── 13. RPC: top tools by clicks ─────────────────────────────────
CREATE OR REPLACE FUNCTION get_top_affiliate_tools(p_days int DEFAULT 30, p_limit int DEFAULT 10)
RETURNS TABLE (name text, slug text, logo text, clicks bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.name, t.slug, t.logo, COUNT(c.id)::bigint AS clicks
  FROM affiliate_clicks c
  JOIN tools t ON t.id = c.tool_id
  WHERE c.clicked_at >= NOW() - (p_days || ' days')::interval
  GROUP BY t.id, t.name, t.slug, t.logo
  ORDER BY clicks DESC
  LIMIT p_limit;
$$;

-- ── 14. Platform analytics summary ───────────────────────────────
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_tools',       (SELECT COUNT(*) FROM tools),
    'featured_tools',    (SELECT COUNT(*) FROM tools WHERE featured = true),
    'africa_friendly',   (SELECT COUNT(*) FROM tools WHERE africa_friendly = true),
    'total_articles',    (SELECT COUNT(*) FROM articles),
    'published_articles',(SELECT COUNT(*) FROM articles WHERE status = 'PUBLISHED'),
    'total_reviews',     (SELECT COUNT(*) FROM reviews),
    'total_users',       (SELECT COUNT(*) FROM profiles),
    'affiliate_links',   (SELECT COUNT(*) FROM affiliate_links WHERE is_active = true),
    'total_clicks',      (SELECT COUNT(*) FROM affiliate_clicks)
  );
$$;

-- ── 15. Web push subscriptions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; anonymous cannot read
CREATE POLICY "service role full access on push_subscriptions"
  ON push_subscriptions FOR ALL TO service_role USING (true);

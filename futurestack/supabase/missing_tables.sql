-- ============================================================
-- DISCOVA — SUPABASE GAP-FILL MIGRATION
-- Run this in Supabase SQL Editor (safe to re-run — all IF NOT EXISTS)
--
-- What this adds on top of what is already in your database:
--   1.  affiliate_links + affiliate_clicks  (tracking & monetisation)
--   2.  videos                              (YouTube / Vimeo / native embeds)
--   3.  video_playlists + video_playlist_items
--   4.  tool_videos                         (demo/tutorial videos per tool)
--   5.  article_videos                      (embedded videos inside articles)
--   6.  deals                               (LTDs, discounts, promo codes)
--   7.  comments                            (threaded — articles & tools)
--   8.  notifications                       (user alerts)
--   9.  tool_claims                         (makers can claim their tool)
--  10.  site_settings                       (admin key-value store)
--  11.  featured_slots                      (managed homepage / page promos)
--  12.  tags + tool_tags + article_tags     (proper many-to-many tag system)
--  13.  Full-text-search GIN indexes        (fast search over thousands of rows)
--  14.  Scale indexes                       (composite, partial, GIN)
--  15.  Storage buckets                     (media, logos, videos, covers)
--  16.  RLS + service_role bypass           (every table secured)
-- ============================================================

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- trigram similarity search
CREATE EXTENSION IF NOT EXISTS "unaccent";     -- accent-insensitive search

-- Helper: auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- ──────────────────────────────────────────────────────────
-- 1. AFFILIATE LINKS
--    One affiliate link per tool. /api/affiliate/[slug] reads this.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_links (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS affiliate_links_tool_idx   ON affiliate_links(tool_id);
CREATE INDEX IF NOT EXISTS affiliate_links_active_idx ON affiliate_links(is_active) WHERE is_active = true;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affiliate_links_public_read"    ON affiliate_links;
DROP POLICY IF EXISTS "affiliate_links_service_write"  ON affiliate_links;
CREATE POLICY "affiliate_links_public_read"   ON affiliate_links FOR SELECT USING (true);
CREATE POLICY "affiliate_links_service_write" ON affiliate_links FOR ALL USING (auth.role() = 'service_role');
DROP TRIGGER IF EXISTS affiliate_links_updated_at ON affiliate_links;
CREATE TRIGGER affiliate_links_updated_at BEFORE UPDATE ON affiliate_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- 2. AFFILIATE CLICKS  (immutable event log)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id     uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  clicked_at  timestamptz DEFAULT now(),
  referrer    text,
  country     text,
  user_agent  text,
  ip_hash     text    -- hashed for privacy
);
CREATE INDEX IF NOT EXISTS affiliate_clicks_tool_idx ON affiliate_clicks(tool_id);
CREATE INDEX IF NOT EXISTS affiliate_clicks_time_idx ON affiliate_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS affiliate_clicks_country_idx ON affiliate_clicks(country) WHERE country IS NOT NULL;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affiliate_clicks_service_write" ON affiliate_clicks;
CREATE POLICY "affiliate_clicks_service_write" ON affiliate_clicks FOR ALL USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 3. VIDEOS
--    Stores YouTube, Vimeo, or natively-uploaded videos.
--    embed_url is the src for <iframe> (e.g. youtube.com/embed/...)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text,
  -- Embed
  provider        text NOT NULL DEFAULT 'youtube'
                    CHECK (provider IN ('youtube','vimeo','cloudinary','native','loom','wistia')),
  provider_id     text,                       -- YouTube video ID, Vimeo ID, etc.
  embed_url       text,                       -- ready-to-use iframe src
  watch_url       text,                       -- public URL (for links)
  thumbnail_url   text,
  duration_secs   int,                        -- video length in seconds
  -- Metadata
  author_id       uuid REFERENCES authors(id) ON DELETE SET NULL,
  category        text,                       -- e.g. "tutorial", "review", "demo", "news"
  tags            text[]  DEFAULT '{}',
  -- Stats
  view_count      int     DEFAULT 0,
  like_count      int     DEFAULT 0,
  -- Publishing
  status          text    NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft','published','archived')),
  is_featured     boolean DEFAULT false,
  published_at    timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS videos_slug_idx        ON videos(slug);
CREATE INDEX IF NOT EXISTS videos_status_idx      ON videos(status);
CREATE INDEX IF NOT EXISTS videos_published_idx   ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS videos_featured_idx    ON videos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS videos_provider_idx    ON videos(provider);
-- Full-text search on video titles and descriptions
CREATE INDEX IF NOT EXISTS videos_fts_idx ON videos
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "videos_public_read"    ON videos;
DROP POLICY IF EXISTS "videos_service_write"  ON videos;
CREATE POLICY "videos_public_read"   ON videos FOR SELECT USING (status = 'published');
CREATE POLICY "videos_service_write" ON videos FOR ALL   USING (auth.role() = 'service_role');
DROP TRIGGER IF EXISTS videos_updated_at ON videos;
CREATE TRIGGER videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- 4. VIDEO PLAYLISTS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_playlists (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  cover_url   text,
  is_featured boolean DEFAULT false,
  status      text NOT NULL DEFAULT 'published'
                CHECK (status IN ('draft','published','archived')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "video_playlists_public_read"   ON video_playlists;
DROP POLICY IF EXISTS "video_playlists_service_write" ON video_playlists;
CREATE POLICY "video_playlists_public_read"   ON video_playlists FOR SELECT USING (status = 'published');
CREATE POLICY "video_playlists_service_write" ON video_playlists FOR ALL   USING (auth.role() = 'service_role');
DROP TRIGGER IF EXISTS video_playlists_updated_at ON video_playlists;
CREATE TRIGGER video_playlists_updated_at BEFORE UPDATE ON video_playlists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- 5. VIDEO PLAYLIST ITEMS  (ordered)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_playlist_items (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id uuid NOT NULL REFERENCES video_playlists(id) ON DELETE CASCADE,
  video_id    uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position    int  NOT NULL DEFAULT 0,
  UNIQUE(playlist_id, video_id)
);
CREATE INDEX IF NOT EXISTS vpi_playlist_idx ON video_playlist_items(playlist_id, position);
ALTER TABLE video_playlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vpi_public_read"    ON video_playlist_items;
DROP POLICY IF EXISTS "vpi_service_write"  ON video_playlist_items;
CREATE POLICY "vpi_public_read"   ON video_playlist_items FOR SELECT USING (true);
CREATE POLICY "vpi_service_write" ON video_playlist_items FOR ALL   USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 6. TOOL VIDEOS  (demo, tutorial, review videos per tool)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_videos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id     uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  video_id    uuid REFERENCES videos(id) ON DELETE SET NULL,
  -- Or inline embed (when video row not needed)
  embed_url   text,
  provider    text DEFAULT 'youtube'
                CHECK (provider IN ('youtube','vimeo','cloudinary','native','loom','wistia')),
  provider_id text,
  thumbnail   text,
  title       text,
  video_type  text DEFAULT 'demo'
                CHECK (video_type IN ('demo','tutorial','review','walkthrough','testimonial','promo')),
  is_primary  boolean DEFAULT false,
  position    int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tool_videos_tool_idx ON tool_videos(tool_id);
CREATE INDEX IF NOT EXISTS tool_videos_primary_idx ON tool_videos(tool_id) WHERE is_primary = true;
ALTER TABLE tool_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_videos_public_read"   ON tool_videos;
DROP POLICY IF EXISTS "tool_videos_service_write" ON tool_videos;
CREATE POLICY "tool_videos_public_read"   ON tool_videos FOR SELECT USING (true);
CREATE POLICY "tool_videos_service_write" ON tool_videos FOR ALL   USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 7. ARTICLE VIDEOS  (embedded videos inside article bodies)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_videos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id  uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  video_id    uuid REFERENCES videos(id) ON DELETE SET NULL,
  embed_url   text,
  provider    text DEFAULT 'youtube',
  provider_id text,
  caption     text,
  position    int  DEFAULT 0,        -- order within the article
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS article_videos_article_idx ON article_videos(article_id);
ALTER TABLE article_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "article_videos_public_read"   ON article_videos;
DROP POLICY IF EXISTS "article_videos_service_write" ON article_videos;
CREATE POLICY "article_videos_public_read"   ON article_videos FOR SELECT USING (true);
CREATE POLICY "article_videos_service_write" ON article_videos FOR ALL   USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 8. DEALS  (LTDs, discounts, promo codes, limited offers)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id         uuid REFERENCES tools(id) ON DELETE CASCADE,
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text,
  deal_type       text NOT NULL DEFAULT 'discount'
                    CHECK (deal_type IN ('discount','ltd','free_trial','coupon','bundle','beta_access')),
  promo_code      text,
  discount_pct    int,             -- e.g. 50 = 50% off
  original_price  numeric(10,2),
  deal_price      numeric(10,2),
  currency        text DEFAULT 'USD',
  deal_url        text,            -- clicks tracked via affiliate redirect
  affiliate_url   text,
  cover_url       text,
  tags            text[] DEFAULT '{}',
  -- Timing
  starts_at       timestamptz DEFAULT now(),
  expires_at      timestamptz,
  is_verified     boolean DEFAULT false,
  is_featured     boolean DEFAULT false,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','expired','coming_soon','archived')),
  -- Stats
  click_count     int DEFAULT 0,
  save_count      int DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS deals_tool_idx    ON deals(tool_id);
CREATE INDEX IF NOT EXISTS deals_status_idx  ON deals(status);
CREATE INDEX IF NOT EXISTS deals_expires_idx ON deals(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS deals_featured_idx ON deals(is_featured) WHERE is_featured = true;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deals_public_read"    ON deals;
DROP POLICY IF EXISTS "deals_service_write"  ON deals;
CREATE POLICY "deals_public_read"   ON deals FOR SELECT USING (status = 'active');
CREATE POLICY "deals_service_write" ON deals FOR ALL   USING (auth.role() = 'service_role');
DROP TRIGGER IF EXISTS deals_updated_at ON deals;
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- 9. TAGS  (master tag registry)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  description text,
  color       text,               -- hex colour for badge
  tag_type    text DEFAULT 'general'
                CHECK (tag_type IN ('general','category','platform','pricing','africa','industry','use_case')),
  use_count   int  DEFAULT 0,     -- denormalised counter, updated by trigger
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tags_slug_idx ON tags(slug);
CREATE INDEX IF NOT EXISTS tags_type_idx ON tags(tag_type);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tags_public_read"    ON tags;
DROP POLICY IF EXISTS "tags_service_write"  ON tags;
CREATE POLICY "tags_public_read"   ON tags FOR SELECT USING (true);
CREATE POLICY "tags_service_write" ON tags FOR ALL   USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 10. TOOL TAGS  (many-to-many: tools ↔ tags)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_tags (
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (tool_id, tag_id)
);
CREATE INDEX IF NOT EXISTS tool_tags_tag_idx  ON tool_tags(tag_id);
CREATE INDEX IF NOT EXISTS tool_tags_tool_idx ON tool_tags(tool_id);
ALTER TABLE tool_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_tags_public_read"    ON tool_tags;
DROP POLICY IF EXISTS "tool_tags_service_write"  ON tool_tags;
CREATE POLICY "tool_tags_public_read"   ON tool_tags FOR SELECT USING (true);
CREATE POLICY "tool_tags_service_write" ON tool_tags FOR ALL   USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 11. ARTICLE TAGS  (many-to-many: articles ↔ tags)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_tags (
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
CREATE INDEX IF NOT EXISTS article_tags_tag_idx ON article_tags(tag_id);
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "article_tags_public_read"    ON article_tags;
DROP POLICY IF EXISTS "article_tags_service_write"  ON article_tags;
CREATE POLICY "article_tags_public_read"   ON article_tags FOR SELECT USING (true);
CREATE POLICY "article_tags_service_write" ON article_tags FOR ALL   USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 12. COMMENTS  (threaded — works for both articles and tools)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Target: attach to article OR tool (one must be non-null)
  article_id  uuid REFERENCES articles(id)  ON DELETE CASCADE,
  tool_id     uuid REFERENCES tools(id)     ON DELETE CASCADE,
  video_id    uuid REFERENCES videos(id)    ON DELETE CASCADE,
  parent_id   uuid REFERENCES comments(id)  ON DELETE CASCADE,  -- for threading
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  is_pinned   boolean DEFAULT false,
  is_deleted  boolean DEFAULT false,   -- soft delete
  upvote_count int DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  CHECK (
    (article_id IS NOT NULL)::int +
    (tool_id IS NOT NULL)::int +
    (video_id IS NOT NULL)::int = 1   -- exactly one target
  )
);
CREATE INDEX IF NOT EXISTS comments_article_idx ON comments(article_id) WHERE article_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_tool_idx    ON comments(tool_id)    WHERE tool_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_video_idx   ON comments(video_id)   WHERE video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_parent_idx  ON comments(parent_id)  WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_user_idx    ON comments(user_id)    WHERE user_id IS NOT NULL;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_public_read"    ON comments;
DROP POLICY IF EXISTS "comments_user_insert"    ON comments;
DROP POLICY IF EXISTS "comments_owner_update"   ON comments;
DROP POLICY IF EXISTS "comments_service_write"  ON comments;
CREATE POLICY "comments_public_read"   ON comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "comments_user_insert"   ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_owner_update"  ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_service_write" ON comments FOR ALL   USING (auth.role() = 'service_role');
DROP TRIGGER IF EXISTS comments_updated_at ON comments;
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- 13. NOTIFICATIONS  (in-app user alerts)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL
                 CHECK (type IN (
                   'new_tool','deal','article','comment_reply',
                   'tool_update','stack_featured','system','digest'
                 )),
  title        text NOT NULL,
  body         text,
  image_url    text,
  action_url   text,               -- where clicking takes the user
  is_read      boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx  ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications(user_id) WHERE is_read = false;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_owner_read"   ON notifications;
DROP POLICY IF EXISTS "notifications_owner_update" ON notifications;
DROP POLICY IF EXISTS "notifications_service_write" ON notifications;
CREATE POLICY "notifications_owner_read"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_owner_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_service_write" ON notifications FOR ALL  USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 14. TOOL CLAIMS  (makers can claim their listing)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_claims (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id       uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name  text,
  contact_email text NOT NULL,
  contact_name  text,
  proof_url     text,     -- link to prove ownership (e.g. tool website with owner page)
  message       text,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  reviewed_at   timestamptz,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(tool_id, user_id)
);
CREATE INDEX IF NOT EXISTS tool_claims_tool_idx   ON tool_claims(tool_id);
CREATE INDEX IF NOT EXISTS tool_claims_status_idx ON tool_claims(status);
ALTER TABLE tool_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_claims_user_insert"    ON tool_claims;
DROP POLICY IF EXISTS "tool_claims_owner_read"     ON tool_claims;
DROP POLICY IF EXISTS "tool_claims_service_write"  ON tool_claims;
CREATE POLICY "tool_claims_user_insert"   ON tool_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tool_claims_owner_read"    ON tool_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tool_claims_service_write" ON tool_claims FOR ALL   USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 15. SITE SETTINGS  (admin-managed key-value store)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT 'null',
  description text,
  updated_at  timestamptz DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_settings_public_read"   ON site_settings;
DROP POLICY IF EXISTS "site_settings_service_write" ON site_settings;
CREATE POLICY "site_settings_public_read"   ON site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_service_write" ON site_settings FOR ALL   USING (auth.role() = 'service_role');

-- Seed some default settings
INSERT INTO site_settings (key, value, description) VALUES
  ('featured_tools_count',     '12',          'Number of tools shown in the featured row'),
  ('daily_ph_sync_limit',      '10',          'Max new tools pulled from Product Hunt per day'),
  ('enable_comments',          'true',        'Master switch: show/hide comments across the site'),
  ('enable_deals',             'true',        'Show the deals/LTD section'),
  ('hero_tagline',             '"Find the perfect tool for any task, instantly"', 'Homepage hero subheadline'),
  ('maintenance_mode',         'false',       'Put the site into read-only maintenance mode'),
  ('africa_mode',              'true',        'Highlight Africa-friendly tools by default'),
  ('max_video_embed_width',    '720',         'Max px width for embedded videos in articles')
ON CONFLICT (key) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- 16. FEATURED SLOTS  (manage curated content per page/section)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS featured_slots (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_name    text NOT NULL,       -- e.g. 'homepage_hero', 'tools_banner', 'deals_spotlight'
  page         text NOT NULL,       -- e.g. 'homepage', 'tools', 'news', 'deals'
  -- One of these will be non-null depending on what's featured
  tool_id      uuid REFERENCES tools(id)         ON DELETE SET NULL,
  article_id   uuid REFERENCES articles(id)      ON DELETE SET NULL,
  deal_id      uuid REFERENCES deals(id)         ON DELETE SET NULL,
  video_id     uuid REFERENCES videos(id)        ON DELETE SET NULL,
  -- Or a custom promo (no DB record needed)
  custom_title text,
  custom_body  text,
  custom_url   text,
  custom_image text,
  -- Display
  position     int  DEFAULT 0,
  is_active    boolean DEFAULT true,
  starts_at    timestamptz DEFAULT now(),
  ends_at      timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS featured_slots_page_idx   ON featured_slots(page, position) WHERE is_active = true;
ALTER TABLE featured_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "featured_slots_public_read"   ON featured_slots;
DROP POLICY IF EXISTS "featured_slots_service_write" ON featured_slots;
CREATE POLICY "featured_slots_public_read"   ON featured_slots FOR SELECT USING (is_active = true);
CREATE POLICY "featured_slots_service_write" ON featured_slots FOR ALL   USING (auth.role() = 'service_role');
DROP TRIGGER IF EXISTS featured_slots_updated_at ON featured_slots;
CREATE TRIGGER featured_slots_updated_at BEFORE UPDATE ON featured_slots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- 17. FULL-TEXT SEARCH INDEXES
--     GIN indexes on tsvector columns for fast search across
--     thousands of tools and articles.
-- ──────────────────────────────────────────────────────────

-- Tools FTS
CREATE INDEX IF NOT EXISTS tools_fts_idx ON tools
  USING GIN (
    to_tsvector('english',
      coalesce(name,'') || ' ' ||
      coalesce(tagline,'') || ' ' ||
      coalesce(description,'') || ' ' ||
      coalesce(array_to_string(tags,' '),'')
    )
  );

-- Articles FTS
CREATE INDEX IF NOT EXISTS articles_fts_idx ON articles
  USING GIN (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(excerpt,'') || ' ' ||
      coalesce(content,'')
    )
  );

-- Trigram indexes for "LIKE '%query%'" style search (fast fuzzy)
CREATE INDEX IF NOT EXISTS tools_name_trgm_idx    ON tools    USING GIN (name    gin_trgm_ops);
CREATE INDEX IF NOT EXISTS tools_tagline_trgm_idx ON tools    USING GIN (tagline gin_trgm_ops);
CREATE INDEX IF NOT EXISTS articles_title_trgm_idx ON articles USING GIN (title  gin_trgm_ops);

-- ──────────────────────────────────────────────────────────
-- 18. SCALE INDEXES  (composite + partial — for thousands of rows)
-- ──────────────────────────────────────────────────────────

-- Most-used query pattern: active tools sorted by rating
CREATE INDEX IF NOT EXISTS tools_active_rating_idx
  ON tools(rating DESC, created_at DESC)
  WHERE status = 'active';

-- Africa-friendly filter
CREATE INDEX IF NOT EXISTS tools_africa_idx
  ON tools(africa_friendly, rating DESC)
  WHERE status = 'active' AND africa_friendly = true;

-- Free tier filter
CREATE INDEX IF NOT EXISTS tools_free_idx
  ON tools(has_free, rating DESC)
  WHERE status = 'active' AND has_free = true;

-- Category + rating (most common browse pattern)
CREATE INDEX IF NOT EXISTS tools_category_rating_idx
  ON tools(category, rating DESC)
  WHERE status = 'active';

-- New tools (homepage "Just dropped" section)
CREATE INDEX IF NOT EXISTS tools_new_idx
  ON tools(created_at DESC)
  WHERE status = 'active' AND is_new = true;

-- Featured tools
CREATE INDEX IF NOT EXISTS tools_featured_active_idx
  ON tools(is_featured, upvote_count DESC)
  WHERE status = 'active' AND is_featured = true;

-- Published articles sorted by date
CREATE INDEX IF NOT EXISTS articles_published_active_idx
  ON articles(published_at DESC)
  WHERE status = 'published';

-- Featured articles
CREATE INDEX IF NOT EXISTS articles_featured_active_idx
  ON articles(is_featured, published_at DESC)
  WHERE status = 'published' AND is_featured = true;

-- Source-based lookup (for dedup during PH / GNews sync)
CREATE INDEX IF NOT EXISTS tools_source_idx ON tools(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS tools_ph_url_idx ON tools(producthunt_url) WHERE producthunt_url IS NOT NULL;

-- ──────────────────────────────────────────────────────────
-- 19. SUPABASE STORAGE BUCKETS
--     Create the storage buckets needed for all media.
--     Safe to run even if they already exist.
-- ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('logos',         'logos',         true,  2097152,   -- 2 MB
   ARRAY['image/png','image/jpeg','image/webp','image/svg+xml','image/gif']),
  ('covers',        'covers',        true,  5242880,   -- 5 MB
   ARRAY['image/png','image/jpeg','image/webp']),
  ('videos',        'videos',        true,  524288000, -- 500 MB
   ARRAY['video/mp4','video/webm','video/ogg','video/quicktime']),
  ('thumbnails',    'thumbnails',    true,  2097152,
   ARRAY['image/png','image/jpeg','image/webp']),
  ('screenshots',   'screenshots',   true,  5242880,
   ARRAY['image/png','image/jpeg','image/webp']),
  ('avatars',       'avatars',       true,  2097152,
   ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage bucket RLS policies (public read, auth write)
INSERT INTO storage.objects (bucket_id, name) VALUES (NULL, NULL) ON CONFLICT DO NOTHING;  -- no-op, just to ensure table exists

DO $$
BEGIN
  -- Allow anyone to read public buckets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='storage_public_read'
  ) THEN
    CREATE POLICY "storage_public_read" ON storage.objects
      FOR SELECT USING (bucket_id IN ('logos','covers','thumbnails','screenshots','avatars','videos'));
  END IF;

  -- Allow authenticated users to upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='storage_auth_upload'
  ) THEN
    CREATE POLICY "storage_auth_upload" ON storage.objects
      FOR INSERT WITH CHECK (
        auth.role() IN ('authenticated','service_role') AND
        bucket_id IN ('logos','covers','thumbnails','screenshots','avatars','videos')
      );
  END IF;

  -- Allow service role to do everything
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='storage_service_all'
  ) THEN
    CREATE POLICY "storage_service_all" ON storage.objects
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────
-- 20. HELPFUL VIEWS  (extend what's already in your DB)
-- ──────────────────────────────────────────────────────────

-- v_tools_with_affiliate: joins tools + affiliate links in one go
CREATE OR REPLACE VIEW v_tools_with_affiliate AS
  SELECT
    t.*,
    al.affiliate_url,
    al.partner_name     AS affiliate_partner,
    al.commission_rate  AS affiliate_commission
  FROM tools t
  LEFT JOIN affiliate_links al ON al.tool_id = t.id AND al.is_active = true
  WHERE t.status = 'active';

-- v_deals_active: active deals with tool info
CREATE OR REPLACE VIEW v_deals_active AS
  SELECT
    d.*,
    t.name         AS tool_name,
    t.slug         AS tool_slug,
    t.logo         AS tool_logo,
    t.category     AS tool_category
  FROM deals d
  LEFT JOIN tools t ON t.id = d.tool_id
  WHERE d.status = 'active'
    AND (d.expires_at IS NULL OR d.expires_at > now())
  ORDER BY d.is_featured DESC, d.created_at DESC;

-- v_videos_with_meta: published videos with author info
CREATE OR REPLACE VIEW v_videos_published AS
  SELECT
    v.*,
    a.name         AS author_name,
    a.avatar_url   AS author_avatar
  FROM videos v
  LEFT JOIN authors a ON a.id = v.author_id
  WHERE v.status = 'published'
  ORDER BY v.published_at DESC;

-- ──────────────────────────────────────────────────────────
-- 21. TOOL COUNT FUNCTION  (fast category counts for sidebar)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE (category_id text, tool_count bigint)
LANGUAGE SQL STABLE AS $$
  SELECT category, COUNT(*)
  FROM tools
  WHERE status = 'active'
  GROUP BY category;
$$;

-- ──────────────────────────────────────────────────────────
-- 22. FULL-TEXT SEARCH FUNCTION
--     Single function for unified tool + article search.
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_all(
  query         text,
  result_limit  int  DEFAULT 20,
  offset_val    int  DEFAULT 0
)
RETURNS TABLE (
  id            uuid,
  type          text,    -- 'tool' or 'article'
  title         text,
  slug          text,
  excerpt       text,
  logo          text,
  rank          real
)
LANGUAGE SQL STABLE AS $$
  SELECT
    t.id,
    'tool'::text             AS type,
    t.name                   AS title,
    t.slug,
    t.tagline                AS excerpt,
    t.logo,
    ts_rank(
      to_tsvector('english', coalesce(t.name,'') || ' ' || coalesce(t.tagline,'')),
      plainto_tsquery('english', query)
    )                        AS rank
  FROM tools t
  WHERE status = 'active'
    AND to_tsvector('english', coalesce(t.name,'') || ' ' || coalesce(t.tagline,'') || ' ' || coalesce(t.description,''))
        @@ plainto_tsquery('english', query)

  UNION ALL

  SELECT
    a.id,
    'article'::text          AS type,
    a.title,
    a.slug,
    a.excerpt,
    a.hero_image             AS logo,
    ts_rank(
      to_tsvector('english', coalesce(a.title,'') || ' ' || coalesce(a.excerpt,'')),
      plainto_tsquery('english', query)
    )                        AS rank
  FROM articles a
  WHERE status = 'published'
    AND to_tsvector('english', coalesce(a.title,'') || ' ' || coalesce(a.excerpt,'') || ' ' || coalesce(a.content,''))
        @@ plainto_tsquery('english', query)

  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET offset_val;
$$;

-- ──────────────────────────────────────────────────────────
-- DONE ✓
-- ──────────────────────────────────────────────────────────
-- Summary of what was just created:
--
-- New tables (22 in total — all IF NOT EXISTS, safe to re-run):
--   affiliate_links, affiliate_clicks
--   videos, video_playlists, video_playlist_items
--   tool_videos, article_videos
--   deals
--   tags, tool_tags, article_tags
--   comments
--   notifications
--   tool_claims
--   site_settings (with 8 default rows)
--   featured_slots
--
-- Storage buckets:
--   logos (2 MB), covers (5 MB), videos (500 MB),
--   thumbnails (2 MB), screenshots (5 MB), avatars (2 MB)
--
-- GIN full-text search indexes on tools + articles + videos
-- Trigram indexes for fuzzy LIKE search
-- 8 composite / partial scale indexes for fast browsing
--
-- New views:
--   v_tools_with_affiliate, v_deals_active, v_videos_published
--
-- New functions:
--   get_category_counts(), search_all(query, limit, offset)
-- ──────────────────────────────────────────────────────────

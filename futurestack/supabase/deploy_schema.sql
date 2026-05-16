-- ============================================================
-- FutureStack News — DEFINITIVE DATABASE SCHEMA
-- Matches actual app column names (lib/queries, app/api)
-- Idempotent — safe to run multiple times
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ──────────────────────────────────────────────────────────
-- TOOL CATEGORIES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_categories (
  id    text PRIMARY KEY,
  name  text NOT NULL,
  icon  text,
  count int  DEFAULT 0
);

INSERT INTO tool_categories (id, name, icon, count) VALUES
  ('writing',      'Writing',        'pen-tool',  0),
  ('design',       'Design',         'palette',   0),
  ('code',         'Code',           'code',      0),
  ('video',        'Video',          'video',     0),
  ('audio',        'Audio',          'mic',       0),
  ('data',         'Data & Research','database',  0),
  ('automation',   'Automation',     'zap',       0),
  ('productivity', 'Productivity',   'layout',    0),
  ('marketing',    'Marketing',      'bar-chart', 0),
  ('analytics',    'Analytics',      'activity',  0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE tool_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read" ON tool_categories;
CREATE POLICY "categories_public_read" ON tool_categories FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- TOOLS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tools (
  id            uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text    NOT NULL,
  slug          text    NOT NULL UNIQUE,
  tagline       text,
  description   text,
  logo          text,
  website       text,
  website_url   text,
  category      text    REFERENCES tool_categories(id),
  subcategory   text,
  tags          text[]  DEFAULT '{}',
  pricing_model text    DEFAULT 'freemium' CHECK (pricing_model IN ('free','freemium','paid','enterprise')),
  pricing_details jsonb DEFAULT '[]',
  has_free      boolean DEFAULT false,
  africa_friendly boolean DEFAULT false,
  rating        numeric(3,2) DEFAULT 0,
  review_count  int     DEFAULT 0,
  is_featured   boolean DEFAULT false,
  is_verified   boolean DEFAULT false,
  is_new        boolean DEFAULT false,
  has_api       boolean DEFAULT false,
  status        text    DEFAULT 'active' CHECK (status IN ('active','inactive','pending','pending_review','rejected')),
  upvote_count  int     DEFAULT 0,
  save_count    int     DEFAULT 0,
  view_count    int     DEFAULT 0,
  last_updated  date    DEFAULT CURRENT_DATE,
  created_at    timestamptz DEFAULT now(),
  -- Auto-discovery fields
  new_until     timestamptz,
  source        text    DEFAULT 'manual',
  producthunt_url text
);

CREATE INDEX IF NOT EXISTS tools_category_idx  ON tools(category);
CREATE INDEX IF NOT EXISTS tools_slug_idx      ON tools(slug);
CREATE INDEX IF NOT EXISTS tools_rating_idx    ON tools(rating DESC);
CREATE INDEX IF NOT EXISTS tools_status_idx    ON tools(status);
CREATE INDEX IF NOT EXISTS tools_featured_idx  ON tools(is_featured);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tools_public_read" ON tools;
CREATE POLICY "tools_public_read" ON tools FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- TOOL SCORES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_scores (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id              uuid UNIQUE NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  ease_of_use          numeric(3,1) DEFAULT 0 CHECK (ease_of_use BETWEEN 0 AND 10),
  value_for_money      numeric(3,1) DEFAULT 0 CHECK (value_for_money BETWEEN 0 AND 10),
  feature_depth        numeric(3,1) DEFAULT 0 CHECK (feature_depth BETWEEN 0 AND 10),
  support_quality      numeric(3,1) DEFAULT 0 CHECK (support_quality BETWEEN 0 AND 10),
  integration_richness numeric(3,1) DEFAULT 0 CHECK (integration_richness BETWEEN 0 AND 10),
  ai_capability        numeric(3,1) DEFAULT 0 CHECK (ai_capability BETWEEN 0 AND 10),
  futurestack_score    numeric(4,1) GENERATED ALWAYS AS (
    ROUND((ease_of_use + value_for_money + feature_depth + support_quality + integration_richness + ai_capability) / 6.0, 1)
  ) STORED,
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_scores_tool_idx  ON tool_scores(tool_id);
CREATE INDEX IF NOT EXISTS tool_scores_score_idx ON tool_scores(futurestack_score DESC);

ALTER TABLE tool_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_scores_public_read" ON tool_scores;
CREATE POLICY "tool_scores_public_read" ON tool_scores FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- TOOL PRICING
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_pricing (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id       uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tier_name     text NOT NULL,
  price_monthly numeric(10,2),
  price_annual  numeric(10,2),
  currency      text    DEFAULT 'USD',
  features      jsonb   DEFAULT '[]',
  is_popular    boolean DEFAULT false,
  is_free_tier  boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_pricing_tool_idx ON tool_pricing(tool_id);

ALTER TABLE tool_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_pricing_public_read" ON tool_pricing;
CREATE POLICY "tool_pricing_public_read" ON tool_pricing FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- TOOL ALTERNATIVES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_alternatives (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id          uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  alternative_id   uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  similarity_score numeric(3,2) DEFAULT 0.5 CHECK (similarity_score BETWEEN 0 AND 1),
  UNIQUE(tool_id, alternative_id),
  CHECK (tool_id <> alternative_id)
);

CREATE INDEX IF NOT EXISTS tool_alternatives_tool_idx ON tool_alternatives(tool_id);
CREATE INDEX IF NOT EXISTS tool_alternatives_alt_idx  ON tool_alternatives(alternative_id);

ALTER TABLE tool_alternatives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_alternatives_public_read" ON tool_alternatives;
CREATE POLICY "tool_alternatives_public_read" ON tool_alternatives FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- TOOL CHANGELOGS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_changelogs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id      uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  version      text,
  title        text NOT NULL,
  description  text NOT NULL,
  type         text NOT NULL CHECK (type IN ('feature','improvement','fix','breaking','pricing')),
  published_at timestamptz DEFAULT now(),
  is_major     boolean DEFAULT false,
  source_url   text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_changelogs_tool_idx      ON tool_changelogs(tool_id);
CREATE INDEX IF NOT EXISTS tool_changelogs_published_idx ON tool_changelogs(published_at DESC);

ALTER TABLE tool_changelogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_changelogs_public_read" ON tool_changelogs;
CREATE POLICY "tool_changelogs_public_read" ON tool_changelogs FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- AUTHORS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authors (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  slug       text UNIQUE,
  avatar     text,
  role       text,
  bio        text,
  twitter    text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authors_public_read" ON authors;
CREATE POLICY "authors_public_read" ON authors FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- ARTICLE CATEGORIES  (separate from tool_categories)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

INSERT INTO categories (name, slug) VALUES
  ('AI Tools',        'ai-tools'),
  ('Comparisons',     'comparisons'),
  ('Tutorials',       'tutorials'),
  ('Industry Trends', 'industry-trends'),
  ('SaaS',            'saas'),
  ('Africa Tech',     'africa-tech'),
  ('Automation',      'automation'),
  ('Design',          'design'),
  ('Development',     'development'),
  ('Marketing',       'marketing')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read_articles" ON categories;
CREATE POLICY "categories_public_read_articles" ON categories FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- ARTICLES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug             text NOT NULL UNIQUE,
  title            text NOT NULL,
  excerpt          text,
  content          text,
  hero_image       text,
  cover_image_url  text,
  meta_description text,
  seo_title        text,
  seo_description  text,
  author_id        uuid REFERENCES authors(id),
  category_id      uuid REFERENCES categories(id),
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at     timestamptz,
  updated_at       timestamptz DEFAULT now(),
  reading_time     int  DEFAULT 5,
  word_count       int  DEFAULT 0,
  view_count       int  DEFAULT 0,
  like_count       int  DEFAULT 0,
  share_count      int  DEFAULT 0,
  comment_count    int  DEFAULT 0,
  tags             text[] DEFAULT '{}',
  is_featured      boolean DEFAULT false,
  is_ai_generated  boolean DEFAULT false,
  is_premium       boolean DEFAULT false,
  is_breaking      boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS articles_slug_idx      ON articles(slug);
CREATE INDEX IF NOT EXISTS articles_status_idx    ON articles(status);
CREATE INDEX IF NOT EXISTS articles_published_idx ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS articles_featured_idx  ON articles(is_featured);
CREATE INDEX IF NOT EXISTS articles_category_idx  ON articles(category_id);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "articles_public_read" ON articles;
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (status = 'published');

-- ──────────────────────────────────────────────────────────
-- STACKS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stacks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text UNIQUE,
  name        text NOT NULL,
  description text,
  creator_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_role text,
  category    text,
  clone_count int  DEFAULT 0,
  rating      numeric(3,2) DEFAULT 0,
  featured    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stack_tools (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id uuid REFERENCES stacks(id) ON DELETE CASCADE,
  tool_id  uuid REFERENCES tools(id)  ON DELETE CASCADE,
  position int  DEFAULT 0,
  UNIQUE(stack_id, tool_id)
);

CREATE INDEX IF NOT EXISTS stack_tools_stack_idx ON stack_tools(stack_id);

ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stacks_public_read"  ON stacks;
DROP POLICY IF EXISTS "stacks_owner_insert" ON stacks;
DROP POLICY IF EXISTS "stacks_owner_update" ON stacks;
DROP POLICY IF EXISTS "stacks_owner_delete" ON stacks;
CREATE POLICY "stacks_public_read"  ON stacks FOR SELECT USING (true);
CREATE POLICY "stacks_owner_insert" ON stacks FOR INSERT WITH CHECK (auth.uid() = creator_id OR creator_id IS NULL);
CREATE POLICY "stacks_owner_update" ON stacks FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "stacks_owner_delete" ON stacks FOR DELETE USING (auth.uid() = creator_id);

ALTER TABLE stack_tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stack_tools_public_read" ON stack_tools;
DROP POLICY IF EXISTS "stack_tools_owner_write" ON stack_tools;
CREATE POLICY "stack_tools_public_read" ON stack_tools FOR SELECT USING (true);
CREATE POLICY "stack_tools_owner_write" ON stack_tools FOR ALL USING (
  auth.uid() = (SELECT creator_id FROM stacks WHERE id = stack_id)
);

-- ──────────────────────────────────────────────────────────
-- REVIEWS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id    uuid REFERENCES tools(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name  text,
  verified   boolean DEFAULT false,
  rating     int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content    text,
  upvotes    int DEFAULT 0,
  downvotes  int DEFAULT 0,
  location   text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_tool_idx ON reviews(tool_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
DROP POLICY IF EXISTS "reviews_auth_insert" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_auth_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- SAVED TOOLS / STACKS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_tools (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id  uuid REFERENCES tools(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

CREATE TABLE IF NOT EXISTS saved_stacks (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stack_id uuid REFERENCES stacks(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, stack_id)
);

ALTER TABLE saved_tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_tools_owner" ON saved_tools;
CREATE POLICY "saved_tools_owner" ON saved_tools FOR ALL USING (auth.uid() = user_id);

ALTER TABLE saved_stacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_stacks_owner" ON saved_stacks;
CREATE POLICY "saved_stacks_owner" ON saved_stacks FOR ALL USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                text,
  avatar_url               text,
  role                     text,
  bio                      text,
  website                  text,
  twitter                  text,
  ai_tool_score            int     DEFAULT 0,
  primary_goals            text[]  DEFAULT '{}',
  monthly_tool_budget      int,
  team_size                text,
  onboarding_completed     boolean DEFAULT false,
  plan                     text    DEFAULT 'free',
  stripe_customer_id       text,
  stripe_subscription_id   text,
  plan_expires_at          timestamptz,
  notification_preferences jsonb   DEFAULT '{"email_digest":true,"push":true,"tool_updates":true}',
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'role'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_owner_write" ON profiles;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_write" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ──────────────────────────────────────────────────────────
-- NEWSLETTER SUBSCRIBERS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         text NOT NULL UNIQUE,
  role          text,
  subscribed_at timestamptz DEFAULT now(),
  confirmed     boolean DEFAULT false,
  unsubscribed  boolean DEFAULT false
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "newsletter_service_only" ON newsletter_subscribers;
CREATE POLICY "newsletter_service_only" ON newsletter_subscribers FOR ALL USING (false);

-- ──────────────────────────────────────────────────────────
-- RADAR ITEMS (Weekly AI Digest)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS radar_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number     int  NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  year            int  NOT NULL,
  tool_id         uuid REFERENCES tools(id) ON DELETE SET NULL,
  category        text NOT NULL CHECK (category IN ('rising_star','watch_out','underrated_gem','price_drop','new_release')),
  ai_summary      text NOT NULL,
  signal_strength int  NOT NULL CHECK (signal_strength BETWEEN 1 AND 5),
  data_points     jsonb DEFAULT '[]',
  published_at    timestamptz DEFAULT now(),
  UNIQUE(week_number, year, tool_id)
);

CREATE INDEX IF NOT EXISTS radar_items_week_idx ON radar_items(year, week_number);
CREATE INDEX IF NOT EXISTS radar_items_tool_idx ON radar_items(tool_id);

ALTER TABLE radar_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "radar_items_public_read" ON radar_items;
CREATE POLICY "radar_items_public_read" ON radar_items FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- SEMANTIC SEARCH (pgvector)
-- ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tools' AND column_name='embedding') THEN
    ALTER TABLE tools ADD COLUMN embedding vector(1536);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='embedding') THEN
    ALTER TABLE articles ADD COLUMN embedding vector(1536);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION search_tools_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (id uuid, name text, slug text, tagline text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, name, slug, tagline,
    1 - (embedding <=> query_embedding) AS similarity
  FROM tools
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ──────────────────────────────────────────────────────────
-- HELPER: auto-update updated_at
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS tool_scores_updated_at ON tool_scores;
CREATE TRIGGER tool_scores_updated_at
  BEFORE UPDATE ON tool_scores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS stacks_updated_at ON stacks;
CREATE TRIGGER stacks_updated_at
  BEFORE UPDATE ON stacks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- AFFILIATE LINKS
-- ──────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS affiliate_links_tool_idx ON affiliate_links(tool_id);
CREATE INDEX IF NOT EXISTS affiliate_links_active_idx ON affiliate_links(is_active);

DROP TRIGGER IF EXISTS affiliate_links_updated_at ON affiliate_links;
CREATE TRIGGER affiliate_links_updated_at
  BEFORE UPDATE ON affiliate_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- AFFILIATE CLICKS  (immutable event log — no updates)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id     uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  clicked_at  timestamptz DEFAULT now(),
  referrer    text,
  country     text,
  user_agent  text,
  ip_hash     text
);

CREATE INDEX IF NOT EXISTS affiliate_clicks_tool_idx ON affiliate_clicks(tool_id);
CREATE INDEX IF NOT EXISTS affiliate_clicks_time_idx ON affiliate_clicks(clicked_at DESC);

-- ──────────────────────────────────────────────────────────
-- OPPORTUNITIES  (jobs, grants, scholarships, gigs, etc.)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL CHECK (type IN ('jobs','grants','scholarships','gigs','fellowships','accelerators')),
  title       text        NOT NULL,
  company     text        NOT NULL,
  location    text,
  salary      text,
  skills      text[]      DEFAULT '{}',
  deadline    text,
  url         text        NOT NULL,
  featured    boolean     DEFAULT false,
  africa      boolean     DEFAULT true,
  status      text        DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS opportunities_type_idx     ON opportunities(type);
CREATE INDEX IF NOT EXISTS opportunities_status_idx   ON opportunities(status);
CREATE INDEX IF NOT EXISTS opportunities_featured_idx ON opportunities(featured);
CREATE INDEX IF NOT EXISTS opportunities_created_idx  ON opportunities(created_at DESC);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "opportunities_public_read" ON opportunities;
CREATE POLICY "opportunities_public_read" ON opportunities FOR SELECT USING (true);

DROP TRIGGER IF EXISTS opportunities_updated_at ON opportunities;
CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- DEALS  (discounts, free tiers, student offers, etc.)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  tagline        text,
  discount       text        NOT NULL,
  original_price text,
  deal_price     text        NOT NULL,
  category       text,
  expiry         text        DEFAULT 'Ongoing',
  badge          text,
  badge_color    text,
  hot            boolean     DEFAULT false,
  africa         boolean     DEFAULT true,
  type           text        DEFAULT 'free' CHECK (type IN ('free','student','discount','lifetime')),
  url            text        NOT NULL,
  status         text        DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deals_type_idx     ON deals(type);
CREATE INDEX IF NOT EXISTS deals_status_idx   ON deals(status);
CREATE INDEX IF NOT EXISTS deals_hot_idx      ON deals(hot);
CREATE INDEX IF NOT EXISTS deals_created_idx  ON deals(created_at DESC);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deals_public_read" ON deals;
CREATE POLICY "deals_public_read" ON deals FOR SELECT USING (true);

DROP TRIGGER IF EXISTS deals_updated_at ON deals;
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

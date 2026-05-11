-- ============================================================
-- FutureStack News — COMPLETE DATABASE SCHEMA
-- Combined schema.sql + migration_002
-- Fully idempotent — safe to run multiple times
-- Paste this entire file into Supabase SQL Editor and click Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- AUTHORS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authors (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  avatar     text,
  role       text,
  bio        text,
  created_at timestamptz DEFAULT now()
);

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
  ('writing',      'Writing',      'pen-tool',  24),
  ('design',       'Design',       'palette',   18),
  ('code',         'Code',         'code',      15),
  ('video',        'Video',        'video',     12),
  ('audio',        'Audio',        'mic',        8),
  ('data',         'Data',         'database',  10),
  ('automation',   'Automation',   'zap',       14),
  ('productivity', 'Productivity', 'layout',    20),
  ('marketing',    'Marketing',    'bar-chart', 11),
  ('analytics',    'Analytics',    'bar-chart',  9)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- TOOLS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tools (
  id                uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              text    NOT NULL,
  slug              text    NOT NULL UNIQUE,
  description       text,
  short_description text,
  logo              text,
  category          text    REFERENCES tool_categories(id),
  subcategories     text[]  DEFAULT '{}',
  has_free          boolean DEFAULT false,
  free_description  text,
  pricing_plans     jsonb   DEFAULT '[]',
  rating            numeric(3,2) DEFAULT 0,
  review_count      int     DEFAULT 0,
  badges            text[]  DEFAULT '{}',
  integrations      text[]  DEFAULT '{}',
  platforms         text[]  DEFAULT '{}',
  website           text,
  africa_friendly   boolean DEFAULT false,
  best_for          text[]  DEFAULT '{}',
  pros              text[]  DEFAULT '{}',
  cons              text[]  DEFAULT '{}',
  featured          boolean DEFAULT false,
  last_updated      date    DEFAULT CURRENT_DATE,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tools_category_idx ON tools(category);
CREATE INDEX IF NOT EXISTS tools_slug_idx      ON tools(slug);
CREATE INDEX IF NOT EXISTS tools_rating_idx    ON tools(rating DESC);

-- ──────────────────────────────────────────────────────────
-- ARTICLES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           text NOT NULL UNIQUE,
  title          text NOT NULL,
  excerpt        text,
  content        text,
  featured_image text,
  author_id      uuid REFERENCES authors(id),
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at   timestamptz,
  updated_at     timestamptz DEFAULT now(),
  read_time      int     DEFAULT 5,
  category       text    NOT NULL,
  tags           text[]  DEFAULT '{}',
  target_roles   text[]  DEFAULT '{}',
  view_count     int     DEFAULT 0,
  featured       boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS articles_slug_idx      ON articles(slug);
CREATE INDEX IF NOT EXISTS articles_status_idx    ON articles(status);
CREATE INDEX IF NOT EXISTS articles_published_idx ON articles(published_at DESC);

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

-- ──────────────────────────────────────────────────────────
-- USER SAVED ITEMS
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

-- ──────────────────────────────────────────────────────────
-- USER PROFILES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text,
  avatar_url    text,
  role          text,
  bio           text,
  website       text,
  twitter       text,
  ai_tool_score int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'role'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ──────────────────────────────────────────────────────────
-- EXTENDED SCHEMA (migration_002)
-- ──────────────────────────────────────────────────────────

-- Extend profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS primary_goals            text[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS monthly_tool_budget      int,
  ADD COLUMN IF NOT EXISTS team_size                text,
  ADD COLUMN IF NOT EXISTS onboarding_completed     boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan                     text        DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id       text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id   text,
  ADD COLUMN IF NOT EXISTS plan_expires_at          timestamptz,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb       DEFAULT '{"email_digest":true,"push":true,"tool_updates":true}';

-- tool_changelogs
CREATE TABLE IF NOT EXISTS tool_changelogs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- tool_comparisons
CREATE TABLE IF NOT EXISTS tool_comparisons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_a_id      uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tool_b_id      uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  winner_tool_id uuid REFERENCES tools(id),
  summary        text,
  use_case_votes jsonb DEFAULT '{}',
  view_count     int   DEFAULT 0,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(tool_a_id, tool_b_id),
  CHECK (tool_a_id <> tool_b_id)
);
CREATE INDEX IF NOT EXISTS tool_comparisons_tool_a_idx ON tool_comparisons(tool_a_id);
CREATE INDEX IF NOT EXISTS tool_comparisons_tool_b_idx ON tool_comparisons(tool_b_id);

-- tool_scores (with generated futurestack_score)
CREATE TABLE IF NOT EXISTS tool_scores (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  last_calculated_at   timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tool_scores_tool_idx  ON tool_scores(tool_id);
CREATE INDEX IF NOT EXISTS tool_scores_score_idx ON tool_scores(futurestack_score DESC);

-- tool_pricing
CREATE TABLE IF NOT EXISTS tool_pricing (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id       uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tier_name     text NOT NULL,
  price_monthly numeric(10,2),
  price_annual  numeric(10,2),
  currency      text    DEFAULT 'USD',
  features      jsonb   DEFAULT '[]',
  is_popular    boolean DEFAULT false,
  is_free_tier  boolean DEFAULT false,
  limits        jsonb   DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tool_pricing_tool_idx ON tool_pricing(tool_id);

-- user_activity
CREATE TABLE IF NOT EXISTS user_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_activity_user_idx    ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS user_activity_entity_idx  ON user_activity(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS user_activity_created_idx ON user_activity(created_at DESC);

-- radar_items
CREATE TABLE IF NOT EXISTS radar_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX IF NOT EXISTS radar_items_week_idx     ON radar_items(year, week_number);
CREATE INDEX IF NOT EXISTS radar_items_tool_idx     ON radar_items(tool_id);
CREATE INDEX IF NOT EXISTS radar_items_category_idx ON radar_items(category);

-- tool_alternatives
CREATE TABLE IF NOT EXISTS tool_alternatives (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id          uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  alternative_id   uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  similarity_score numeric(3,2) DEFAULT 0.5 CHECK (similarity_score BETWEEN 0 AND 1),
  ai_reasoning     text,
  UNIQUE(tool_id, alternative_id),
  CHECK (tool_id <> alternative_id)
);
CREATE INDEX IF NOT EXISTS tool_alternatives_tool_idx ON tool_alternatives(tool_id);
CREATE INDEX IF NOT EXISTS tool_alternatives_alt_idx  ON tool_alternatives(alternative_id);

-- email_campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject         text NOT NULL,
  preview_text    text,
  template_id     text,
  content         jsonb NOT NULL,
  segment         text  DEFAULT 'all' CHECK (segment IN ('all','pro','free')),
  sent_at         timestamptz,
  open_rate       numeric(5,2),
  click_rate      numeric(5,2),
  recipient_count int   DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_campaigns_sent_idx    ON email_campaigns(sent_at DESC);
CREATE INDEX IF NOT EXISTS email_campaigns_segment_idx ON email_campaigns(segment);

-- auto updated_at trigger for tool_scores
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS tool_scores_updated_at ON tool_scores;
CREATE TRIGGER tool_scores_updated_at
  BEFORE UPDATE ON tool_scores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — all policies idempotent
-- ──────────────────────────────────────────────────────────

-- tools
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tools_public_read" ON tools;
CREATE POLICY "tools_public_read" ON tools FOR SELECT USING (true);

-- articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "articles_public_read" ON articles;
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (status = 'published');

-- stacks
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stacks_public_read"  ON stacks;
DROP POLICY IF EXISTS "stacks_owner_insert" ON stacks;
DROP POLICY IF EXISTS "stacks_owner_update" ON stacks;
DROP POLICY IF EXISTS "stacks_owner_delete" ON stacks;
CREATE POLICY "stacks_public_read"  ON stacks FOR SELECT USING (true);
CREATE POLICY "stacks_owner_insert" ON stacks FOR INSERT WITH CHECK (auth.uid() = creator_id OR creator_id IS NULL);
CREATE POLICY "stacks_owner_update" ON stacks FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "stacks_owner_delete" ON stacks FOR DELETE USING (auth.uid() = creator_id);

-- stack_tools
ALTER TABLE stack_tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stack_tools_public_read"  ON stack_tools;
DROP POLICY IF EXISTS "stack_tools_owner_write"  ON stack_tools;
CREATE POLICY "stack_tools_public_read" ON stack_tools FOR SELECT USING (true);
CREATE POLICY "stack_tools_owner_write" ON stack_tools FOR ALL USING (
  auth.uid() = (SELECT creator_id FROM stacks WHERE id = stack_id)
);

-- reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
DROP POLICY IF EXISTS "reviews_auth_insert" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_auth_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- saved_tools
ALTER TABLE saved_tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_tools_owner" ON saved_tools;
CREATE POLICY "saved_tools_owner" ON saved_tools FOR ALL USING (auth.uid() = user_id);

-- saved_stacks
ALTER TABLE saved_stacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_stacks_owner" ON saved_stacks;
CREATE POLICY "saved_stacks_owner" ON saved_stacks FOR ALL USING (auth.uid() = user_id);

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_owner_write" ON profiles;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_write" ON profiles FOR UPDATE USING (auth.uid() = id);

-- newsletter_subscribers
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "newsletter_service_only" ON newsletter_subscribers;
CREATE POLICY "newsletter_service_only" ON newsletter_subscribers FOR ALL USING (false);

-- tool_categories
ALTER TABLE tool_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read" ON tool_categories;
CREATE POLICY "categories_public_read" ON tool_categories FOR SELECT USING (true);

-- tool_changelogs
ALTER TABLE tool_changelogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_changelogs" ON tool_changelogs;
CREATE POLICY "Public read tool_changelogs" ON tool_changelogs FOR SELECT USING (true);

-- tool_comparisons
ALTER TABLE tool_comparisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_comparisons" ON tool_comparisons;
CREATE POLICY "Public read tool_comparisons" ON tool_comparisons FOR SELECT USING (true);

-- tool_scores
ALTER TABLE tool_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_scores" ON tool_scores;
CREATE POLICY "Public read tool_scores" ON tool_scores FOR SELECT USING (true);

-- tool_pricing
ALTER TABLE tool_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_pricing" ON tool_pricing;
CREATE POLICY "Public read tool_pricing" ON tool_pricing FOR SELECT USING (true);

-- user_activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User own activity" ON user_activity;
CREATE POLICY "User own activity" ON user_activity FOR ALL USING (auth.uid() = user_id);

-- radar_items
ALTER TABLE radar_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read radar_items" ON radar_items;
CREATE POLICY "Public read radar_items" ON radar_items FOR SELECT USING (true);

-- tool_alternatives
ALTER TABLE tool_alternatives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_alternatives" ON tool_alternatives;
CREATE POLICY "Public read tool_alternatives" ON tool_alternatives FOR SELECT USING (true);

-- email_campaigns
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin email_campaigns" ON email_campaigns;
CREATE POLICY "Admin email_campaigns" ON email_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- authors (public read, service role write)
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authors_public_read" ON authors;
CREATE POLICY "authors_public_read" ON authors FOR SELECT USING (true);

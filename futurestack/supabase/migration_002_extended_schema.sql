-- ============================================================
-- FutureStack News — Migration 002: Extended Schema
-- Idempotent — safe to run multiple times
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- EXTEND PROFILES TABLE
-- (role, ai_tool_score already exist in schema.sql — skipped)
-- ──────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS primary_goals            text[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS monthly_tool_budget      int,
  ADD COLUMN IF NOT EXISTS team_size                text,
  ADD COLUMN IF NOT EXISTS onboarding_completed     boolean      DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan                     text         DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id       text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id   text,
  ADD COLUMN IF NOT EXISTS plan_expires_at          timestamptz,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb        DEFAULT '{"email_digest": true, "push": true, "tool_updates": true}';


-- ──────────────────────────────────────────────────────────
-- 1. TOOL CHANGELOGS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_changelogs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id      uuid        NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  version      text,
  title        text        NOT NULL,
  description  text        NOT NULL,
  type         text        NOT NULL CHECK (type IN ('feature', 'improvement', 'fix', 'breaking', 'pricing')),
  published_at timestamptz DEFAULT now(),
  is_major     boolean     DEFAULT false,
  source_url   text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_changelogs_tool_idx ON tool_changelogs(tool_id);
CREATE INDEX IF NOT EXISTS tool_changelogs_published_idx ON tool_changelogs(published_at DESC);

ALTER TABLE tool_changelogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_changelogs" ON tool_changelogs;
CREATE POLICY "Public read tool_changelogs" ON tool_changelogs FOR SELECT USING (true);


-- ──────────────────────────────────────────────────────────
-- 2. TOOL COMPARISONS
-- ──────────────────────────────────────────────────────────
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

ALTER TABLE tool_comparisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_comparisons" ON tool_comparisons;
CREATE POLICY "Public read tool_comparisons" ON tool_comparisons FOR SELECT USING (true);


-- ──────────────────────────────────────────────────────────
-- 3. TOOL SCORES (FutureStack Score)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_scores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id               uuid UNIQUE NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  ease_of_use           numeric(3,1) DEFAULT 0 CHECK (ease_of_use BETWEEN 0 AND 10),
  value_for_money       numeric(3,1) DEFAULT 0 CHECK (value_for_money BETWEEN 0 AND 10),
  feature_depth         numeric(3,1) DEFAULT 0 CHECK (feature_depth BETWEEN 0 AND 10),
  support_quality       numeric(3,1) DEFAULT 0 CHECK (support_quality BETWEEN 0 AND 10),
  integration_richness  numeric(3,1) DEFAULT 0 CHECK (integration_richness BETWEEN 0 AND 10),
  ai_capability         numeric(3,1) DEFAULT 0 CHECK (ai_capability BETWEEN 0 AND 10),
  futurestack_score     numeric(4,1) GENERATED ALWAYS AS (
    ROUND(
      (ease_of_use + value_for_money + feature_depth + support_quality + integration_richness + ai_capability) / 6.0,
      1
    )
  ) STORED,
  last_calculated_at    timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_scores_tool_idx ON tool_scores(tool_id);
CREATE INDEX IF NOT EXISTS tool_scores_score_idx ON tool_scores(futurestack_score DESC);

ALTER TABLE tool_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_scores" ON tool_scores;
CREATE POLICY "Public read tool_scores" ON tool_scores FOR SELECT USING (true);


-- ──────────────────────────────────────────────────────────
-- 4. TOOL PRICING (structured tiers)
-- ──────────────────────────────────────────────────────────
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

ALTER TABLE tool_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_pricing" ON tool_pricing;
CREATE POLICY "Public read tool_pricing" ON tool_pricing FOR SELECT USING (true);


-- ──────────────────────────────────────────────────────────
-- 5. USER ACTIVITY FEED
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      text NOT NULL, -- 'saved_tool', 'wrote_review', 'built_stack', 'upvoted_article'
  entity_type text NOT NULL, -- 'tool', 'article', 'stack'
  entity_id   uuid NOT NULL,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_activity_user_idx    ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS user_activity_entity_idx  ON user_activity(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS user_activity_created_idx ON user_activity(created_at DESC);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
-- Users can read & write only their own activity
DROP POLICY IF EXISTS "User own activity" ON user_activity;
CREATE POLICY "User own activity" ON user_activity FOR ALL USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────
-- 6. RADAR ITEMS (Weekly AI Digest)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS radar_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number     int  NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  year            int  NOT NULL,
  tool_id         uuid REFERENCES tools(id) ON DELETE SET NULL,
  category        text NOT NULL CHECK (category IN ('rising_star', 'watch_out', 'underrated_gem', 'price_drop', 'new_release')),
  ai_summary      text NOT NULL,
  signal_strength int  NOT NULL CHECK (signal_strength BETWEEN 1 AND 5),
  data_points     jsonb DEFAULT '[]',
  published_at    timestamptz DEFAULT now(),
  UNIQUE(week_number, year, tool_id)
);

CREATE INDEX IF NOT EXISTS radar_items_week_idx     ON radar_items(year, week_number);
CREATE INDEX IF NOT EXISTS radar_items_tool_idx     ON radar_items(tool_id);
CREATE INDEX IF NOT EXISTS radar_items_category_idx ON radar_items(category);

ALTER TABLE radar_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read radar_items" ON radar_items;
CREATE POLICY "Public read radar_items" ON radar_items FOR SELECT USING (true);


-- ──────────────────────────────────────────────────────────
-- 7. TOOL ALTERNATIVES (bidirectional similarity map)
-- ──────────────────────────────────────────────────────────
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

ALTER TABLE tool_alternatives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tool_alternatives" ON tool_alternatives;
CREATE POLICY "Public read tool_alternatives" ON tool_alternatives FOR SELECT USING (true);


-- ──────────────────────────────────────────────────────────
-- 8. EMAIL CAMPAIGNS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          text NOT NULL,
  preview_text     text,
  template_id      text,
  content          jsonb NOT NULL,
  segment          text  DEFAULT 'all' CHECK (segment IN ('all', 'pro', 'free')),
  sent_at          timestamptz,
  open_rate        numeric(5,2),
  click_rate       numeric(5,2),
  recipient_count  int   DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_campaigns_sent_idx     ON email_campaigns(sent_at DESC);
CREATE INDEX IF NOT EXISTS email_campaigns_segment_idx  ON email_campaigns(segment);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
-- Only admin profiles can manage campaigns
CREATE POLICY "Admin email_campaigns" ON email_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);


-- ──────────────────────────────────────────────────────────
-- HELPER: auto-update updated_at on tool_scores
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tool_scores_updated_at ON tool_scores;
CREATE TRIGGER tool_scores_updated_at
  BEFORE UPDATE ON tool_scores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

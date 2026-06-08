-- ============================================================
-- DISCOVA Migration 003: Clerk profiles + performance indexes
-- Idempotent — safe to run multiple times
-- ============================================================

-- Clerk identity bridge (extends existing profiles — no duplicate table)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS clerk_user_id text,
  ADD COLUMN IF NOT EXISTS email text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_clerk_user_id
  ON profiles (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles (email)
  WHERE email IS NOT NULL;

-- Allow Clerk-only profiles without Supabase auth.users row
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Tool query performance (existing tables only)
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools (slug);
CREATE INDEX IF NOT EXISTS idx_tools_category_status ON tools (category, status);
CREATE INDEX IF NOT EXISTS idx_tools_featured ON tools (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_saved_tools_user_id ON saved_tools (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tool_id ON reviews (tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_alternatives_tool_id ON tool_alternatives (tool_id);

-- Service role can upsert Clerk profiles
DROP POLICY IF EXISTS "profiles_service_role_write" ON profiles;
CREATE POLICY "profiles_service_role_write" ON profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

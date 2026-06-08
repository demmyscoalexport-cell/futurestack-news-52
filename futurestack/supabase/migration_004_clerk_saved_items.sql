-- ============================================================
-- DISCOVA Migration 004: Clerk-compatible saved items
-- Links saved_tools / saved_stacks to profiles.id (not auth.users)
-- Idempotent — safe to run multiple times
-- ============================================================

ALTER TABLE saved_tools DROP CONSTRAINT IF EXISTS saved_tools_user_id_fkey;
ALTER TABLE saved_stacks DROP CONSTRAINT IF EXISTS saved_stacks_user_id_fkey;

ALTER TABLE saved_tools
  ADD CONSTRAINT saved_tools_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE saved_stacks
  ADD CONSTRAINT saved_stacks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "saved_tools_service_role" ON saved_tools;
CREATE POLICY "saved_tools_service_role" ON saved_tools
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "saved_stacks_service_role" ON saved_stacks;
CREATE POLICY "saved_stacks_service_role" ON saved_stacks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

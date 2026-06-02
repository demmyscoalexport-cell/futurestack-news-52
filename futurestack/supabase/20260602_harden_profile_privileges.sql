-- Harden profile authorization and billing fields against self-service updates.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  requested_role text := NEW.raw_user_meta_data->>'role';
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN requested_role IN ('founder','developer','designer','marketer','student','agency','freelancer','creator')
      THEN requested_role
      ELSE NULL
    END
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_profile_protected_field_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(auth.role(), '') IN ('anon', 'authenticated')
    AND (
      NEW.role IS DISTINCT FROM OLD.role OR
      NEW.plan IS DISTINCT FROM OLD.plan OR
      NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id OR
      NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id OR
      NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
    )
  THEN
    RAISE EXCEPTION 'Protected profile fields cannot be updated directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protected_fields ON profiles;
CREATE TRIGGER profiles_protected_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_protected_field_update();

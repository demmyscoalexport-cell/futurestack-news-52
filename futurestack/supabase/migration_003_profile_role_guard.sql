-- Prevent profile persona fields from escalating authorization.
-- profiles.role is an authorization role only: 'user', 'editor', or 'admin'.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

CREATE OR REPLACE FUNCTION prevent_profile_role_self_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'profile role can only be changed by service role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_self_update ON profiles;
CREATE TRIGGER profiles_prevent_role_self_update
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_role_self_update();

COMMENT ON COLUMN profiles.role IS 'Authorization role only. Do not store user persona preferences here.';

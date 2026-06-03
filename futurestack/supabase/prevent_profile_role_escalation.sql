-- Prevent self-service privilege escalation through profiles.role.
-- Admin APIs use the Supabase service role, so ordinary user sessions should
-- never be able to create or change this authorization column directly.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF TG_OP = 'INSERT' AND NEW.role IS NOT NULL THEN
      RAISE EXCEPTION 'profiles.role cannot be set by user sessions';
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
      RAISE EXCEPTION 'profiles.role cannot be changed by user sessions';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation_insert ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_escalation();

DROP TRIGGER IF EXISTS prevent_profile_role_escalation_update ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation_update
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_escalation();

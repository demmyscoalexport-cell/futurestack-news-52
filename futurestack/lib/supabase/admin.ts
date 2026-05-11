import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

export function createAdminClient() {
  const url = config.supabase.url;
  const key = config.supabase.serviceRoleKey;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

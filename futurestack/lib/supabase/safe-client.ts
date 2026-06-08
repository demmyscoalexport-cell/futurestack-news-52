import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/** Returns a browser Supabase client, or null when env vars are missing. */
export function tryCreateClient() {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient();
  } catch {
    return null;
  }
}

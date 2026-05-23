import { createBrowserClient } from "@supabase/ssr";
import { getEnv, isSupabaseConfigured } from "@/lib/env";

export { isSupabaseConfigured };

/**
 * Browser-side Supabase client.
 * Use this in Client Components ('use client').
 */
export function createClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !key) {
    throw new Error(
      "@supabase/ssr: Your project's URL and API key are required to create a Supabase client!",
    );
  }

  return createBrowserClient(url, key);
}

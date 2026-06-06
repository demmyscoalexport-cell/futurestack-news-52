/** True when direct Postgres URL is configured (SUPABASE_DB_URL or DATABASE_URL). */
export function isPostgresConfigured(): boolean {
  if (process.env.SUPABASE_USE_REST === "true") return false;

  const url =
    (process.env.SUPABASE_DB_URL?.startsWith("postgresql://")
      ? process.env.SUPABASE_DB_URL
      : undefined) || process.env.DATABASE_URL;
  return Boolean(url);
}

/** Use Supabase REST for reads/writes when Postgres is unavailable or explicitly disabled. */
export function shouldUseSupabaseRest(): boolean {
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  if (!hasSupabase) return false;
  if (process.env.SUPABASE_USE_REST === "true") return true;
  return !isPostgresConfigured();
}

/** True when direct Postgres URL is configured (SUPABASE_DB_URL or DATABASE_URL). */
export function isPostgresConfigured(): boolean {
  const url =
    (process.env.SUPABASE_DB_URL?.startsWith("postgresql://")
      ? process.env.SUPABASE_DB_URL
      : undefined) || process.env.DATABASE_URL;
  return Boolean(url);
}

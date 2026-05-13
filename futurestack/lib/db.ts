import { Pool } from "pg";

const globalForPg = globalThis as unknown as { _pgPool: Pool };

/**
 * Connection priority:
 *   1. SUPABASE_DB_URL  — full postgres URI (e.g. postgresql://postgres:pass@host:5432/postgres)
 *   2. SUPABASE_DB_PASSWORD + NEXT_PUBLIC_SUPABASE_URL — auto-constructs the Supabase URI
 *   3. DATABASE_URL     — Replit PostgreSQL (default fallback)
 */
function resolveConnectionString(): string | undefined {
  const dbUrl = process.env.SUPABASE_DB_URL;

  if (dbUrl && dbUrl.startsWith("postgresql://")) {
    return dbUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (supabaseUrl && dbPassword) {
    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "").split(".")[0];
    const encodedPassword = encodeURIComponent(dbPassword);
    return `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
  }

  return process.env.DATABASE_URL;
}

const connectionString = resolveConnectionString();

function buildSsl(url: string | undefined): false | { rejectUnauthorized: boolean } {
  if (!url) return false;
  if (url.includes("supabase.com") || url.includes("supabase.co")) {
    return { rejectUnauthorized: false };
  }
  if (url.includes("localhost") || url.includes("helium")) return false;
  return { rejectUnauthorized: false };
}

export const db =
  globalForPg._pgPool ??
  new Pool({
    connectionString,
    ssl: buildSsl(connectionString),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") globalForPg._pgPool = db;

/** Current DB source — useful for health checks and admin display */
export const DB_SOURCE = connectionString?.includes("supabase") ? "supabase" : "replit-pg";

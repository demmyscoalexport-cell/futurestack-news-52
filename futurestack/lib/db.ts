import { Pool } from "pg";

const globalForPg = globalThis as unknown as { _pgPool: Pool };

/**
 * Connection priority:
 *   1. SUPABASE_DB_URL  — Supabase direct / pooler connection (set this to migrate)
 *   2. DATABASE_URL     — Replit PostgreSQL (current default)
 *
 * To switch to Supabase: add SUPABASE_DB_URL to your secrets.
 * Get it from: Supabase Dashboard → Settings → Database → Connection string (URI).
 * Use the "Transaction" pooler URL (port 6543) for serverless / edge environments.
 */
const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

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
export const DB_SOURCE = process.env.SUPABASE_DB_URL ? "supabase" : "replit-pg";

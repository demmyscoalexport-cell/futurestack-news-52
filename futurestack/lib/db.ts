import { Pool } from "pg";

const globalForPg = globalThis as unknown as { _pgPool: Pool };

/**
 * Connection priority:
 *   1. SUPABASE_DB_URL  — full postgres URI (must be IPv4-reachable)
 *   2. DATABASE_URL     — Replit PostgreSQL (default)
 *
 * Note: Supabase direct connections from Replit require IPv4 (use the
 * Transaction pooler URL on port 6543, not the direct connection).
 * Projects in af-south-1 currently have no pooler, so Replit PG is used.
 */
const connectionString =
  (process.env.SUPABASE_DB_URL?.startsWith("postgresql://") ? process.env.SUPABASE_DB_URL : undefined) ||
  process.env.DATABASE_URL;

function resolveDbSource(url: string | undefined): "supabase" | "local" | "unconfigured" {
  if (!url) return "unconfigured";
  if (url.includes("supabase.com") || url.includes("supabase.co")) return "supabase";
  if (url.includes("localhost") || url.includes("127.0.0.1")) return "local";
  return "local";
}

const dbSource = resolveDbSource(connectionString);
if (dbSource === "unconfigured") {
  console.warn("[db] no SUPABASE_DB_URL or DATABASE_URL — Postgres pool unavailable");
} else {
  const host = connectionString?.match(/@([^:/]+)/)?.[1] ?? "unknown";
  console.log(`[db] pool → ${dbSource} (${host})`);
}

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
export const DB_SOURCE = dbSource;

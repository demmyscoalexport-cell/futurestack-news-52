/**
 * Supabase Admin DB client — for server-side operations that benefit from
 * the Supabase JS API (RLS bypass, realtime, storage, auth admin).
 *
 * Use this alongside lib/db.ts (raw pg) for complex SQL joins.
 * Use this directly for simple CRUD where Supabase's JS API is cleaner.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Set these secrets to enable Supabase features.",
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}

/** True when Supabase credentials are available */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Helper: upsert a single row into any Supabase table.
 * Returns the upserted row or throws on error.
 */
export async function supabaseUpsert<T extends Record<string, unknown>>(
  table: string,
  row: T,
  onConflict = "slug",
): Promise<T> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from(table)
    .upsert(row, { onConflict })
    .select()
    .single();
  if (error) throw new Error(`[supabase] upsert ${table}: ${error.message}`);
  return data as T;
}

/**
 * Helper: fetch rows from a Supabase table with optional filters.
 */
export async function supabaseSelect<T>(
  table: string,
  opts: {
    columns?: string;
    filter?: Record<string, unknown>;
    limit?: number;
    order?: { column: string; ascending?: boolean };
  } = {},
): Promise<T[]> {
  const supa = getSupabaseAdmin();
  let q = supa.from(table).select(opts.columns ?? "*");
  if (opts.filter) {
    for (const [key, val] of Object.entries(opts.filter)) {
      q = q.eq(key, val);
    }
  }
  if (opts.order) {
    q = q.order(opts.order.column, { ascending: opts.order.ascending ?? false });
  }
  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw new Error(`[supabase] select ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

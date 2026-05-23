/** Strip BOM / stray whitespace from env values (common when piping into Vercel CLI). */
export function cleanEnv(value: string | undefined | null): string | undefined {
  if (value == null) return undefined;
  const cleaned = value.replace(/^\uFEFF/, "").trim();
  return cleaned || undefined;
}

export function getEnv(key: string, fallback = ""): string {
  return cleanEnv(process.env[key]) ?? fallback;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    getEnv("NEXT_PUBLIC_SUPABASE_URL") && getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

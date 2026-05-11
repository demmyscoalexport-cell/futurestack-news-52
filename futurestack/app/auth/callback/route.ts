import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Use the configured site URL in production to avoid redirecting
  // to a Vercel preview URL instead of your custom domain.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_failed`);
}

import { createServerClient } from "@supabase/ssr";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/lib/env";

const CLERK_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const PROTECTED_ROUTES = ["/dashboard", "/admin", "/account", "/onboarding"];

function redirectApex(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? "";
  if (host === "www.getdiscova.com") {
    const apex = new URL(request.url);
    apex.host = "getdiscova.com";
    apex.protocol = "https:";
    return NextResponse.redirect(apex, 308);
  }
  return null;
}

async function handleClerkProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  if (pathname === "/signup") {
    return NextResponse.redirect(new URL("/sign-up", request.url));
  }

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtected) {
    const { userId } = await clerkAuth();
    if (!userId) {
      const signIn = request.nextUrl.clone();
      signIn.pathname = "/sign-in";
      signIn.searchParams.set("redirect_url", pathname);
      return NextResponse.redirect(signIn);
    }
  }

  if (
    pathname === "/sign-in" ||
    pathname === "/sign-up"
  ) {
    const { userId } = await clerkAuth();
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next({ request });
}

async function handleSupabaseProxy(request: NextRequest): Promise<NextResponse> {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const apexRedirect = redirectApex(request);
  if (apexRedirect) return apexRedirect;

  if (CLERK_CONFIGURED) {
    return handleClerkProxy(request);
  }

  return handleSupabaseProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

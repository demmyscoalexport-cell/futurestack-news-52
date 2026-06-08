import { createServerClient } from "@supabase/ssr";
import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/lib/env";

const CLERK_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/account(.*)",
  "/onboarding(.*)",
]);

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

const clerkProxy = clerkMiddleware(async (auth, request) => {
  const apexRedirect = redirectApex(request);
  if (apexRedirect) return apexRedirect;

  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  if (pathname === "/signup") {
    return NextResponse.redirect(new URL("/sign-up", request.url));
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  const { userId } = await auth();
  if (userId && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
});

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
  const isProtected = ["/dashboard", "/admin", "/account", "/onboarding"].some(
    (route) => pathname.startsWith(route),
  );

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

async function supabaseProxy(
  request: NextRequest,
  event: Parameters<typeof clerkProxy>[1],
): Promise<NextResponse> {
  const apexRedirect = redirectApex(request);
  if (apexRedirect) return apexRedirect;
  return handleSupabaseProxy(request);
}

export default CLERK_CONFIGURED ? clerkProxy : supabaseProxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/webhooks|api/contentful/sync|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/__clerk/(.*)",
  ],
};

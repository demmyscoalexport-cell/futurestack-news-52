import { config } from "@/lib/config";

export type AuthMode = "clerk" | "supabase";

/** Server-safe: Clerk is active only when publishable + secret keys are set. */
export function getAuthMode(): AuthMode {
  return config.clerk.isConfigured ? "clerk" : "supabase";
}

export function isClerkAuth(): boolean {
  return getAuthMode() === "clerk";
}

export const authRoutes = {
  signIn: (mode: AuthMode = getAuthMode()) =>
    mode === "clerk" ? "/sign-in" : "/login",
  signUp: (mode: AuthMode = getAuthMode()) =>
    mode === "clerk" ? "/sign-up" : "/signup",
} as const;

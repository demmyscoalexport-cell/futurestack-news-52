"use client";

import { createContext, useContext } from "react";
import type { AuthMode } from "@/lib/auth/mode";

const AuthModeContext = createContext<AuthMode>("supabase");

export function AuthModeProvider({
  mode,
  children,
}: {
  mode: AuthMode;
  children: React.ReactNode;
}) {
  return (
    <AuthModeContext.Provider value={mode}>{children}</AuthModeContext.Provider>
  );
}

export function useAuthMode(): AuthMode {
  return useContext(AuthModeContext);
}

export function useAuthRoutes() {
  const mode = useAuthMode();
  return {
    signIn: mode === "clerk" ? "/sign-in" : "/login",
    signUp: mode === "clerk" ? "/sign-up" : "/signup",
  } as const;
}

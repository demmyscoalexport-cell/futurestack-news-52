"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthProviderName = "clerk" | "supabase";

export interface UnifiedAuthUser {
  id: string;
  profileId: string | null;
  email: string | null;
  fullName: string | null;
  provider: AuthProviderName;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

interface UnifiedAuthContextValue {
  user: UnifiedAuthUser | null;
  isLoading: boolean;
  signOut: (() => Promise<void>) | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

const UnifiedAuthContext = createContext<UnifiedAuthContextValue>({
  user: null,
  isLoading: true,
  signOut: null,
});

export function UnifiedAuthProvider({
  children,
  user,
  isLoading,
  signOut,
}: {
  children: React.ReactNode;
  user: UnifiedAuthUser | null;
  isLoading: boolean;
  signOut?: () => Promise<void>;
}) {
  return (
    <UnifiedAuthContext.Provider value={{ user, isLoading, signOut: signOut ?? null }}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const unified = useContext(UnifiedAuthContext);
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const [supabase] = useState<SupabaseClient | null>(() => {
    if (!isSupabaseConfigured()) return null;
    try {
      return createClient();
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!clerkConfigured);

  useEffect(() => {
    if (clerkConfigured) {
      setIsLoading(unified.isLoading);
      return;
    }

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [clerkConfigured, supabase, unified.isLoading]);

  const signOut = useCallback(async () => {
    if (clerkConfigured && unified.signOut) {
      await unified.signOut();
      return;
    }
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }, [clerkConfigured, supabase, unified.isLoading]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const supabaseAuth = useContext(AuthContext);
  const unified = useContext(UnifiedAuthContext);
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (clerkConfigured && unified.user) {
    return {
      user: {
        id: unified.user.profileId ?? unified.user.id,
        email: unified.user.email ?? undefined,
        user_metadata: { full_name: unified.user.fullName },
      } as unknown as User,
      session: null,
      isLoading: unified.isLoading,
      signOut: supabaseAuth.signOut,
    };
  }

  return supabaseAuth;
}

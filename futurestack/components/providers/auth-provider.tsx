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
import { useAuthMode } from "@/components/providers/auth-mode-provider";

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
  const authMode = useAuthMode();
  const unified = useContext(UnifiedAuthContext);

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
  const [isLoading, setIsLoading] = useState(authMode !== "clerk");

  useEffect(() => {
    if (authMode === "clerk") {
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
  }, [authMode, supabase, unified.isLoading]);

  const signOut = useCallback(async () => {
    if (authMode === "clerk" && unified.signOut) {
      await unified.signOut();
      return;
    }
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }, [authMode, supabase, unified.signOut]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const supabaseAuth = useContext(AuthContext);
  const unified = useContext(UnifiedAuthContext);
  const authMode = useAuthMode();

  if (authMode === "clerk") {
    const signOut = async () => {
      if (unified.signOut) await unified.signOut();
    };

    if (unified.user) {
      return {
        user: {
          id: unified.user.profileId ?? unified.user.id,
          email: unified.user.email ?? undefined,
          user_metadata: { full_name: unified.user.fullName },
        } as unknown as User,
        session: null,
        isLoading: unified.isLoading,
        signOut,
      };
    }

    return {
      user: null,
      session: null,
      isLoading: unified.isLoading,
      signOut,
    };
  }

  return supabaseAuth;
}

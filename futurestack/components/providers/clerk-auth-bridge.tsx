"use client";

import { useEffect, useState } from "react";
import { ClerkProvider, useAuth as useClerkAuth, useClerk, useUser } from "@clerk/nextjs";
import {
  UnifiedAuthProvider,
  type UnifiedAuthUser,
} from "@/components/providers/auth-provider";

interface ClerkAuthBridgeProps {
  children: React.ReactNode;
  publishableKey: string;
  signInUrl: string;
  signUpUrl: string;
  afterSignInUrl: string;
  afterSignUpUrl: string;
}

function ClerkSessionBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      setProfileId(null);
      return;
    }

    void fetch("/api/auth/sync-profile", { method: "POST" })
      .then((res) => res.json())
      .then((data: { success?: boolean; profile?: { id: string } }) => {
        if (data.success && data.profile?.id) {
          setProfileId(data.profile.id);
        }
      })
      .catch(() => setProfileId(null));
  }, [isLoaded, isSignedIn, userId]);

  const unifiedUser: UnifiedAuthUser | null =
    isLoaded && isSignedIn && user
      ? {
          id: userId ?? user.id,
          profileId,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          fullName: user.fullName,
          provider: "clerk",
        }
      : null;

  return (
    <UnifiedAuthProvider
      user={unifiedUser}
      isLoading={!isLoaded}
      signOut={async () => {
        await signOut({ redirectUrl: "/" });
      }}
    >
      {children}
    </UnifiedAuthProvider>
  );
}

export function ClerkAuthBridge({
  children,
  publishableKey,
  signInUrl,
  signUpUrl,
  afterSignInUrl,
  afterSignUpUrl,
}: ClerkAuthBridgeProps) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      afterSignInUrl={afterSignInUrl}
      afterSignUpUrl={afterSignUpUrl}
    >
      <ClerkSessionBridge>{children}</ClerkSessionBridge>
    </ClerkProvider>
  );
}

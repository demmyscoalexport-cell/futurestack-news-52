"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/components/providers/auth-provider";

interface ClerkAuthBridgeProps {
  children: React.ReactNode;
  publishableKey: string;
  signInUrl: string;
  signUpUrl: string;
  afterSignInUrl: string;
  afterSignUpUrl: string;
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
      <AuthProvider>{children}</AuthProvider>
    </ClerkProvider>
  );
}

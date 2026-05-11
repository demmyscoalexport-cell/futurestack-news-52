"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    if (error) toast.error(error.message);
    else toast.success("A new link has been sent!");
  }

  return (
    <div className="text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
      <p className="mt-3 text-muted-foreground">
        We sent a magic link to{" "}
        {email ? (
          <span className="font-medium text-foreground">{email}</span>
        ) : (
          "your email address"
        )}
        . Click it to sign in — no password needed.
      </p>

      <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span>Check your spam folder if you don&apos;t see it</span>
      </div>

      {email && (
        <Button
          variant="outline"
          className="mt-8 w-full"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Resend link
        </Button>
      )}

      <div className="mt-4 flex justify-center">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Layers, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await forgotPassword(formData);
      if (result?.error) setError(result.error);
      else if (result?.success) setSuccess(true);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Blobs */}
      <div className="pointer-events-none fixed -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">
            FutureStack<span className="text-primary">News</span>
          </span>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Check your email
            </h1>
            <p className="mt-3 text-muted-foreground">
              If an account exists for that email, we&apos;ve sent a password
              reset link.
            </p>
            <Button asChild className="mt-8 w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                Reset your password
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="pl-9"
                    disabled={isPending}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            <div className="mt-6 flex justify-center">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

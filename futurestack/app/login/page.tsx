"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Compass,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Chrome,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  magicLinkSchema,
  signInSchema,
  type MagicLinkInput,
  type SignInInput,
} from "@/lib/validations/auth";

const FEATURES = [
  "Curated AI & SaaS tool reviews",
  "Build & share custom tool stacks",
  "Weekly expert insights & tutorials",
  "Africa-friendly tool filtering",
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const callbackError = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const magicForm = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
  });
  const passForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  async function onMagicLink(data: MagicLinkInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Magic link sent!");
      router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
    }
  }

  async function onPassword(data: SignInInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Welcome back!");
      router.push(redirectTo);
      router.refresh();
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden bg-linear-to-br from-primary/10 via-background to-accent/10 border-r border-border p-12">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 flex justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Compass className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="self-center text-2xl font-black tracking-tight">
              DIS<span className="text-primary">COVA</span>
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Africa Discovers. Africa Decides.
          </h2>
          <p className="mt-4 text-muted-foreground">
            The digital discovery operating system for Africa and emerging markets.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-left">
            {FEATURES.map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3 backdrop-blur"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-6 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-black tracking-tight">
            DIS<span className="text-primary">COVA</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Sign in to continue to your account
          </p>

          {callbackError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Authentication failed. Please try again.
            </div>
          )}

          {/* Google */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="magic">
            <TabsList className="w-full">
              <TabsTrigger value="magic" className="flex-1">
                Magic Link
              </TabsTrigger>
              <TabsTrigger value="password" className="flex-1">
                Password
              </TabsTrigger>
            </TabsList>

            {/* Magic Link tab */}
            <TabsContent value="magic" className="mt-4">
              <form
                onSubmit={magicForm.handleSubmit(onMagicLink)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="ml-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ml-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      {...magicForm.register("email")}
                    />
                  </div>
                  {magicForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {magicForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={magicForm.formState.isSubmitting}
                >
                  {magicForm.formState.isSubmitting ? (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : null}
                  Send Magic Link <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            {/* Password tab */}
            <TabsContent value="password" className="mt-4">
              <form
                onSubmit={passForm.handleSubmit(onPassword)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="pw-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="pw-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      {...passForm.register("email")}
                    />
                  </div>
                  {passForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {passForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pw-password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="pw-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9"
                      {...passForm.register("password")}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passForm.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {passForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={passForm.formState.isSubmitting}
                >
                  {passForm.formState.isSubmitting ? (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : null}
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

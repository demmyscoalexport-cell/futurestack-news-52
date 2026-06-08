"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Compass,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Chrome,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelector } from "@/components/ui/role-selector";
import { AuthUnavailable } from "@/components/auth/auth-unavailable";
import { tryCreateClient } from "@/lib/supabase/safe-client";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import type { UserRole } from "@/lib/types";

const PERKS = [
  "Save & organise your favourite tools",
  "Build and share custom stacks",
  "Get personalised recommendations",
  "Early access to new features",
];

export default function SignupPage() {
  const router = useRouter();
  const supabaseClient = tryCreateClient();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
      role: undefined,
    },
  });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const selectedRole = watch("role");

  if (!supabaseClient) {
    return <AuthUnavailable action="create an account" />;
  }

  const supabase = supabaseClient;

  async function onSubmit(data: SignUpInput) {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, role: data.role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Account created! Check your inbox.");
      router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Branding */}
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
            Join the Community
          </h2>
          <p className="mt-4 text-muted-foreground">
            Free forever — no credit card required.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-left">
            {PERKS.map((p) => (
              <div
                key={p}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3 backdrop-blur"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm font-medium">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-6 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-black tracking-tight">
            DIS<span className="text-primary">COVA</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Free forever — no credit card needed
          </p>

          {/* Google */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={googleLoading || isSubmitting}
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
            <span className="text-xs text-muted-foreground">
              or sign up with email
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="full_name"
                  placeholder="Ada Lovelace"
                  className="pl-9"
                  {...register("full_name")}
                />
              </div>
              {errors.full_name && (
                <p className="text-xs text-destructive">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="pl-9 pr-9"
                  {...register("password")}
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
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  className="pl-9"
                  {...register("confirm_password")}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-destructive">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            {/* Role selector */}
            <div className="space-y-2 pt-1">
              <Label>I am a…</Label>
              <RoleSelector
                variant="compact"
                value={selectedRole as UserRole | undefined}
                onChange={(role) =>
                  setValue("role", role, { shouldValidate: true })
                }
              />
              {errors.role && (
                <p className="text-xs text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              By signing up you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              &amp;{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || googleLoading}
            >
              {isSubmitting ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              Create account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

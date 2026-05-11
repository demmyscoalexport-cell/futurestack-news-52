"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleSelector } from "@/components/ui/role-selector";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { signOut } from "@/lib/actions/auth";
import type { UserRole } from "@/lib/types";
import { User, Lock, Bell, LogOut, Save, Shield } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(80),
  bio: z.string().max(200, "Bio must be 200 characters or less").optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  twitter: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Required"),
    new_password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Needs uppercase")
      .regex(/[0-9]/, "Needs a number"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

export default function AccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(
    user?.user_metadata?.role as UserRole | undefined,
  );
  const [, startTransition] = useTransition();

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name ?? "",
      bio: "",
      website: "",
      twitter: "",
    },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  async function onProfileSave(data: ProfileInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: data.full_name, role: selectedRole },
    });
    if (error) {
      toast.error(error.message);
      return;
    }

    // Also update profiles table
    await supabase.from("profiles").upsert({
      id: user!.id,
      full_name: data.full_name,
      role: selectedRole,
      bio: data.bio,
      website: data.website,
      twitter: data.twitter,
      updated_at: new Date().toISOString(),
    });

    toast.success("Profile updated!");
    router.refresh();
  }

  async function onPasswordChange(data: PasswordInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: data.new_password,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated!");
    passwordForm.reset();
  }

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <section className="border-b border-border bg-background py-8 lg:py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-2xl font-bold lg:text-3xl">Account Settings</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your profile and preferences
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-12">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Avatar + email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={profileForm.handleSubmit(onProfileSave)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name">Full name</Label>
                    <Input
                      id="full_name"
                      {...profileForm.register("full_name")}
                    />
                    {profileForm.formState.errors.full_name && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bio">
                      Bio{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself…"
                      {...profileForm.register("bio")}
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.bio.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yoursite.com"
                      {...profileForm.register("website")}
                    />
                    {profileForm.formState.errors.website && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.website.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <Label>My role</Label>
                    <RoleSelector
                      variant="compact"
                      value={selectedRole}
                      onChange={setSelectedRole}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={profileForm.formState.isSubmitting}
                  >
                    {profileForm.formState.isSubmitting ? (
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Profile
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change password — only for email users */}
            {user?.app_metadata?.provider === "email" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordChange)}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="new_password">New password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        {...passwordForm.register("new_password")}
                      />
                      {passwordForm.formState.errors.new_password && (
                        <p className="text-xs text-destructive">
                          {passwordForm.formState.errors.new_password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm_password">
                        Confirm new password
                      </Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        {...passwordForm.register("confirm_password")}
                      />
                      {passwordForm.formState.errors.confirm_password && (
                        <p className="text-xs text-destructive">
                          {
                            passwordForm.formState.errors.confirm_password
                              .message
                          }
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={passwordForm.formState.isSubmitting}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Danger zone */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  You&apos;ll be signed out of all devices.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => startTransition(() => signOut())}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookmarkCheck, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useAuthMode, useAuthRoutes } from "@/components/providers/auth-mode-provider";

function SupabaseAuthMenu() {
  const { user, isLoading, signOut } = useAuth();
  const { signIn, signUp } = useAuthRoutes();

  if (isLoading) return null;

  if (user) {
    const initials =
      user.user_metadata?.full_name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ??
      user.email?.slice(0, 2).toUpperCase() ??
      "?";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex rounded-full">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary text-white">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <p className="font-medium text-sm truncate">
              {user.user_metadata?.full_name || "My Account"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account"><Settings className="mr-2 h-4 w-4" />Account</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/collections"><BookmarkCheck className="mr-2 h-4 w-4" />Saved Tools</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <Button variant="outline" size="sm" className="h-8 text-xs border-border/60" asChild>
        <Link href={signIn}>Sign In</Link>
      </Button>
      <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90" asChild>
        <Link href={signUp}>Join Free</Link>
      </Button>
    </div>
  );
}

function ClerkAuthMenu() {
  const { isLoaded, isSignedIn } = useUser();
  const { signIn, signUp } = useAuthRoutes();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <div className="hidden sm:flex">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <Button variant="outline" size="sm" className="h-8 text-xs border-border/60" asChild>
        <Link href={signIn}>Sign In</Link>
      </Button>
      <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90" asChild>
        <Link href={signUp}>Join Free</Link>
      </Button>
    </div>
  );
}

export function AuthMenu() {
  const authMode = useAuthMode();
  return authMode === "clerk" ? <ClerkAuthMenu /> : <SupabaseAuthMenu />;
}

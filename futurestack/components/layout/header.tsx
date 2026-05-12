"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Search,
  Menu,
  X,
  Layers,
  Moon,
  Sun,
  LogOut,
  Settings,
  BookmarkCheck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/providers/auth-provider";

const navigation = [
  { name: "Tools", href: "/tools" },
  { name: "Stacks", href: "/stacks" },
  { name: "Categories", href: "/tools" },
  { name: "Comparisons", href: "/tools" },
  { name: "News", href: "/news" },
  { name: "Deals", href: "/tools" },
];

export function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isLoading, signOut } = useAuth();

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.slice(0, 2).toUpperCase() ?? "?");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground text-sm">FutureStack</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors rounded-md hover:text-foreground",
                pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-white/5",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden sm:flex text-muted-foreground hover:text-foreground"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {!isLoading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex rounded-full">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xs bg-primary text-white">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="font-medium text-sm truncate">{user.user_metadata?.full_name || "My Account"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account"><Settings className="mr-2 h-4 w-4" />Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/saved"><BookmarkCheck className="mr-2 h-4 w-4" />Saved Tools</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs border-border/60" asChild>
                  <Link href="/submit-tool">Submit Tool</Link>
                </Button>
                <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            )
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 bg-background border-border/40">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border/40 p-4">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                      <Layers className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-sm">FutureStack</span>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="border-b border-border/40 p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search tools, articles..." className="pl-9 h-9 text-sm" />
                  </div>
                </div>
                <nav className="flex-1 space-y-0.5 p-3">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname === item.href ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="border-t border-border/40 p-4 space-y-2">
                  <Button variant="outline" className="w-full h-9 text-sm" asChild>
                    <Link href="/submit-tool" onClick={() => setIsMobileMenuOpen(false)}>Submit Tool</Link>
                  </Button>
                  <Button className="w-full h-9 text-sm bg-primary" asChild>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isSearchOpen && (
        <div className="absolute left-0 right-0 top-full border-b border-border/40 bg-background p-3 shadow-lg">
          <div className="container mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search AI tools, stacks, articles..." className="pl-9" autoFocus />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

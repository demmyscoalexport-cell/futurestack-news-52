"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { buildToolsSearchUrl, parseSmartSearch } from "@/lib/smart-search";
import {
  Search, Menu, X, Compass, Moon, Sun,
  ChevronDown, Zap, Globe, Layers, Rocket,
} from "lucide-react";
import { useTheme } from "next-themes";
import { SearchBar } from "@/components/search/search-bar";
import { AuthMenu } from "@/components/layout/auth-menu";

const navigation = [
  { name: "Discover", href: "/discover" },
  { name: "Tools", href: "/tools" },
  { name: "Compare", href: "/compare" },
  { name: "Stacks", href: "/stacks" },
  { name: "Blog", href: "/blog" },
  { name: "News", href: "/news" },
  { name: "Learn", href: "/learn" },
];

const moreNav = [
  { name: "Workflows", href: "/workflows" },
  { name: "Deals", href: "/deals" },
  { name: "Community", href: "/community" },
  { name: "Africa", href: "/africa" },
  { name: "Enterprise", href: "/enterprise" },
  { name: "Opportunities", href: "/opportunities" },
];

const mobileNav = [
  { name: "Discover", href: "/discover", icon: Compass, desc: "AI-powered discovery" },
  { name: "Tools & Apps", href: "/tools", icon: Zap, desc: "Browse 409+ tools" },
  { name: "Stacks", href: "/stacks", icon: Layers, desc: "Curated tool bundles" },
  { name: "Workflows", href: "/workflows", icon: Layers, desc: "How tools work together" },
  { name: "Community", href: "/community", icon: Globe, desc: "Reviews & discussions" },
  { name: "Opportunities", href: "/opportunities", icon: Globe, desc: "Jobs, grants & gigs" },
  { name: "Blog", href: "/blog", icon: Globe, desc: "Guides, comparisons & insights" },
  { name: "News", href: "/news", icon: Globe, desc: "News & analysis" },
  { name: "Africa Hub", href: "/africa", icon: Globe, desc: "Made for Africa" },
  { name: "Enterprise", href: "/enterprise", icon: Globe, desc: "For teams & orgs" },
  { name: "Submit Your Tool", href: "/submit-tool", icon: Rocket, desc: "Get listed on DISCOVA" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();

  const primaryNav = navigation;
  const signInHref = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "/sign-in" : "/login";
  const signUpHref = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "/sign-up" : "/signup";

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(buildToolsSearchUrl(parseSmartSearch(trimmed)));
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-stroke/50 bg-neutral-deep/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-elevated ring-1 ring-white/10">
            <span className="text-sm font-bold gradient-text">D</span>
          </div>
          <span className="font-heading text-[17px] font-semibold tracking-tight text-foreground">
            DISCOVA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 xl:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-micro whitespace-nowrap",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-white/[0.06] text-foreground"
                  : "text-neutral-muted hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              {item.name}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-0.5 px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors">
                More <ChevronDown className="h-3 w-3 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {moreNav.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href}>{item.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-1.5">
          {/* Submit CTA — desktop only */}
          <Button
            size="sm"
            className="hidden lg:flex h-8 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white gap-1.5 mr-1"
            asChild
          >
            <Link href="/submit-tool">
              <Rocket className="h-3 w-3" />
              Submit a Tool
            </Link>
          </Button>

          <SearchBar />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <AuthMenu />

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 xl:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 bg-background border-border/40">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border/40 p-4">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="h-9 w-9 rounded-xl bg-[#080f1c] ring-2 ring-amber-400/70 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.35)]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 4h7c4.418 0 8 3.582 8 8s-3.582 8-8 8H5V4z" fill="url(#dgrad2)" />
                        <path d="M8.5 7.5h3.2c2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5H8.5V7.5z" fill="#0a1628" />
                        <defs>
                          <linearGradient id="dgrad2" x1="5" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FCD34D" />
                            <stop offset="1" stopColor="#F59E0B" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <span className="font-black tracking-tight text-[17px] leading-none">
                      <span className="text-white">DIS</span><span style={{background:"linear-gradient(90deg,#a78bfa,#c084fc,#e879f9)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>COVA</span>
                    </span>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border-b border-border/40 p-4">
                  <form
                    className="relative"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitSearch(mobileSearchQuery);
                    }}
                  >
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={mobileSearchQuery}
                      onChange={(event) => setMobileSearchQuery(event.target.value)}
                      placeholder="Search tools, stacks, workflows..."
                      className="pl-9 h-9 text-sm"
                    />
                  </form>
                </div>

                <div className="p-3 flex-1 overflow-y-auto">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Navigate</p>
                  <nav className="space-y-0.5">
                    {mobileNav.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-start rounded-lg px-3 py-2.5 transition-colors",
                          pathname === item.href ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>

                <div className="border-t border-border/40 p-4 space-y-2">
                  <Button variant="outline" className="w-full h-9 text-sm" asChild>
                    <Link href={signInHref} onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button className="w-full h-9 text-sm bg-primary btn-press" asChild>
                    <Link href={signUpHref} onClick={() => setIsMobileMenuOpen(false)}>Join Free</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

    </header>
  );
}

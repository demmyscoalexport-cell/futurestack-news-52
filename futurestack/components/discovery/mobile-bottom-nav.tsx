"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Layers, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/tools", icon: Search, label: "Tools" },
  { href: "/stacks", icon: Layers, label: "Stacks" },
  { href: "/dashboard", icon: User, label: "Profile" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-stroke/60 bg-neutral-deep/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-lg transition-colors",
                active ? "text-brand-primary" : "text-neutral-dim hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_rgba(124,102,255,0.5)]")} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

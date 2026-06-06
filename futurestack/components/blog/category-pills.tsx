"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCategoryStyle, BLOG_CATEGORIES } from "@/lib/blog/utils";

interface CategoryPillsProps {
  className?: string;
  selected?: string;
  counts?: Record<string, number>;
  linkMode?: boolean;
}

export function CategoryPills({
  className,
  selected,
  counts,
  linkMode = true,
}: CategoryPillsProps) {
  const categories = [
    { slug: "all", name: "All Posts" },
    ...BLOG_CATEGORIES,
  ] as const;

  if (linkMode) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {categories.map((cat) => {
          const isActive = !selected ? cat.slug === "all" : cat.slug === selected;
          const href = cat.slug === "all" ? "/blog" : `/blog/category/${cat.slug}`;
          return (
            <Link
              key={cat.slug}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-pill text-xs font-medium border transition-all duration-200",
                isActive
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "border-border/60 text-muted-foreground hover:border-brand-primary/40 hover:text-foreground bg-secondary/50"
              )}
            >
              {cat.name}
              {counts && counts[cat.slug] !== undefined && (
                <span className="ml-1.5 opacity-60">{counts[cat.slug]}</span>
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((cat) => {
        const isActive = !selected ? cat.slug === "all" : cat.slug === selected;
        return (
          <button
            key={cat.slug}
            className={cn(
              "px-3 py-1.5 rounded-pill text-xs font-medium border transition-all duration-200",
              isActive
                ? "bg-brand-primary text-white border-brand-primary"
                : "border-border/60 text-muted-foreground hover:border-brand-primary/40 hover:text-foreground bg-secondary/50"
            )}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const DEFAULT_TAGS = [
  { label: "AIToolsForStartupFounders", href: "/best/ai-tools-for-startups", variant: "purple" as const },
  { label: "FreeAIVideoEditors", href: "/best/ai-video-editors", variant: "blue" as const },
  { label: "AIForNigerianSMEs", href: "/best/ai-tools-for-nigerian-businesses", variant: "gold" as const },
  { label: "ToolsLikeChatGPT", href: "/best/chatgpt-alternatives", variant: "lilac" as const },
  { label: "BestAIForStudents", href: "/best/ai-tools-for-students", variant: "purple" as const },
];

const variantStyles = {
  purple: "border-brand-primary/40 bg-gradient-to-r from-brand-primary/20 to-brand-primary/5 text-brand-lilac",
  blue: "border-blue-500/30 bg-gradient-to-r from-blue-500/15 to-brand-primary/10 text-blue-200",
  gold: "border-brand-gold/40 bg-gradient-to-r from-brand-gold/20 to-brand-gold/5 text-brand-gold",
  lilac: "border-brand-lilac/30 bg-gradient-to-r from-brand-lilac/15 to-brand-primary/10 text-brand-lilac",
};

interface TrendingTagsProps {
  tags?: { label: string; href: string; variant?: keyof typeof variantStyles }[];
}

export function TrendingTags({ tags = DEFAULT_TAGS }: TrendingTagsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto lg:mx-0">
      <h2 className="text-sm font-semibold text-foreground mb-3">
        Trending Locally &amp; Globally
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {tags.map(({ label, href, variant = "purple" }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "shrink-0 rounded-pill border px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02]",
              variantStyles[variant],
            )}
          >
            #{label}
          </Link>
        ))}
      </div>
    </div>
  );
}

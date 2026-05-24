"use client";

import { Mic, SlidersHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  className?: string;
}

export function CommandBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
}: CommandBarProps) {
  return (
    <div className={cn("w-full max-w-2xl mx-auto lg:mx-0", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-dim mb-2.5">
        Live AI Command Bar
      </p>
      <div
        className={cn(
          "glass-panel rounded-discova-lg border border-brand-primary/40 p-2 sm:p-2.5",
          "shadow-[0_0_32px_rgba(124,102,255,0.22),0_0_64px_rgba(124,102,255,0.08)]",
        )}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/25">
            <Mic className="h-4 w-4 text-brand-primary" />
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-neutral-dim focus:outline-none"
            aria-label="Search AI tools"
          />

          <button
            type="button"
            onClick={() => {
              window.location.href = "/tools";
            }}
            className="flex shrink-0 items-center justify-center gap-1 rounded-pill border border-brand-gold/40 bg-brand-gold px-2.5 py-2 text-xs font-semibold text-neutral-deep sm:px-3.5 sm:text-sm"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="flex shrink-0 items-center justify-center gap-1 rounded-pill bg-brand-primary px-3 py-2 text-xs font-semibold text-neutral-white shadow-[0_0_16px_rgba(124,102,255,0.45)] hover:bg-brand-primary/90 sm:gap-1.5 sm:px-4 sm:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Discover
          </button>
        </div>
      </div>
    </div>
  );
}

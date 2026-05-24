"use client";

import { useState, useCallback } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { isToolSaved, toggleSavedTool } from "@/lib/collections";

interface BookmarkButtonProps {
  toolSlug: string;
  className?: string;
  size?: "sm" | "md";
}

export function BookmarkButton({ toolSlug, className, size = "sm" }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(() => isToolSaved(toolSlug));

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSaved(toggleSavedTool(toolSlug));
    },
    [toolSlug],
  );

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Remove from collection" : "Save to collection"}
      className={cn(
        "inline-flex items-center justify-center rounded-input border transition-all",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        saved
          ? "border-brand-primary/50 bg-brand-primary/15 text-brand-lilac"
          : "border-neutral-stroke/60 bg-neutral-surface/50 text-muted-foreground hover:border-brand-primary/40 hover:text-brand-lilac",
        className,
      )}
    >
      <Bookmark className={cn(iconSize, saved && "fill-current")} />
    </button>
  );
}

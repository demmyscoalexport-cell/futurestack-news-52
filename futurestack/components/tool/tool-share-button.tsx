"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolShareButtonProps {
  toolName: string;
  slug: string;
  className?: string;
  variant?: "icon" | "button";
}

export function ToolShareButton({ toolName, slug, className, variant = "button" }: ToolShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const share = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const url = `${window.location.origin}/tools/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: toolName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={share}
        aria-label={`Share ${toolName}`}
        className={cn(
          "inline-flex items-center justify-center rounded-input border border-neutral-stroke text-muted-foreground hover:text-foreground",
          className,
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "inline-flex items-center gap-2 rounded-input border border-neutral-stroke px-5 py-3 text-sm font-semibold text-foreground hover:border-brand-primary/40",
        className,
      )}
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      Share
    </button>
  );
}

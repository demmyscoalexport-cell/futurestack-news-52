"use client";

import { useState } from "react";
import {
  Twitter,
  Linkedin,
  Link2,
  Facebook,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
  variant?: "row" | "column";
}

export function ShareButtons({ url, title, className, variant = "row" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buttons = [
    {
      label: "Share on X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
      color: "hover:bg-black/30 hover:text-white hover:border-white/20",
    },
    {
      label: "Share on LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      color: "hover:bg-[#0077b5]/20 hover:text-[#0077b5] hover:border-[#0077b5]/30",
    },
    {
      label: "Share on Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      color: "hover:bg-[#1877f2]/20 hover:text-[#1877f2] hover:border-[#1877f2]/30",
    },
  ];

  return (
    <div
      className={cn(
        "flex gap-2",
        variant === "column" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
    >
      {buttons.map((btn) => (
        <a
          key={btn.label}
          href={btn.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={btn.label}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg border border-border/60",
            "text-muted-foreground bg-secondary/50 transition-all duration-200",
            btn.color
          )}
        >
          <btn.icon className="h-4 w-4" />
        </a>
      ))}

      <button
        onClick={copyLink}
        aria-label="Copy link"
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg border border-border/60",
          "text-muted-foreground bg-secondary/50 transition-all duration-200",
          copied
            ? "bg-green-500/20 text-green-400 border-green-500/30"
            : "hover:bg-brand-primary/20 hover:text-brand-primary hover:border-brand-primary/30"
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function StickyShareButtons({ url, title }: { url: string; title: string }) {
  return (
    <div className="hidden xl:flex flex-col items-center gap-2 sticky top-28">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Share</span>
      <ShareButtons url={url} title={title} variant="column" />
    </div>
  );
}

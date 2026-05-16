"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Twitter, Linkedin, Link as LinkIcon, Bookmark, Share2, Check } from "lucide-react";

interface GuideActionsProps {
  title: string;
  slug: string;
  variant?: "inline" | "sidebar";
}

export function GuideActions({ title, slug, variant = "inline" }: GuideActionsProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/learn/${slug}`
    : `/learn/${slug}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSave = () => {
    setSaved((prev) => !prev);
  };

  if (variant === "sidebar") {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start h-9 text-sm"
          size="sm"
          onClick={() => window.open(twitterUrl, "_blank", "noopener,noreferrer,width=600,height=400")}
        >
          <Share2 className="mr-2 h-3.5 w-3.5" />Share Guide
        </Button>
        <Button
          variant="outline"
          className={`w-full justify-start h-9 text-sm ${saved ? "text-primary border-primary/40" : ""}`}
          size="sm"
          onClick={handleSave}
        >
          {saved ? <Check className="mr-2 h-3.5 w-3.5 text-primary" /> : <Bookmark className="mr-2 h-3.5 w-3.5" />}
          {saved ? "Saved!" : "Save for Later"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-5 flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => window.open(twitterUrl, "_blank", "noopener,noreferrer,width=600,height=400")}
      >
        <Twitter className="mr-1.5 h-3.5 w-3.5" />Share
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => window.open(linkedinUrl, "_blank", "noopener,noreferrer,width=600,height=400")}
      >
        <Linkedin className="mr-1.5 h-3.5 w-3.5" />Share
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`h-8 text-xs ${copied ? "text-primary border-primary/40" : ""}`}
        onClick={handleCopy}
      >
        {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-primary" /> : <LinkIcon className="mr-1.5 h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy Link"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`h-8 text-xs ${saved ? "text-primary border-primary/40" : ""}`}
        onClick={handleSave}
      >
        {saved ? <Check className="mr-1.5 h-3.5 w-3.5 text-primary" /> : <Bookmark className="mr-1.5 h-3.5 w-3.5" />}
        {saved ? "Saved!" : "Save"}
      </Button>
    </div>
  );
}

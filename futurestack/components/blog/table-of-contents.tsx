"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
  className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY + 120;
    let current = headings[0]?.id ?? "";

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el && el.offsetTop <= scrollY) current = h.id;
    }
    setActiveId(current);
  }, [headings]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (headings.length < 2) return null;

  return (
    <nav
      className={cn(
        "rounded-discova-lg border border-neutral-stroke/60 bg-neutral-surface overflow-hidden",
        className
      )}
    >
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <List className="h-4 w-4 text-brand-primary" />
          On this page
        </span>
        <span className="text-muted-foreground text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="pb-3 px-3">
          {headings.map((h) => (
            <button
              key={h.id}
              onClick={() => scrollTo(h.id)}
              className={cn(
                "block w-full text-left py-1.5 text-xs transition-colors rounded-md px-2 hover:bg-white/5",
                h.level === 2 && "font-medium",
                h.level === 3 && "pl-4 text-muted-foreground",
                h.level === 4 && "pl-6 text-muted-foreground",
                activeId === h.id
                  ? "text-brand-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {h.text}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

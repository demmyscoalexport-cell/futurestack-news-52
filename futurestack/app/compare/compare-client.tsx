"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/discovery/page-hero";
import { CommandBar } from "@/components/discovery/command-bar";
import { buildToolsSearchUrl, parseSmartSearch } from "@/lib/smart-search";
import type { Tool } from "@/lib/types";
import { ArrowRight, Scale, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparePickerClientProps {
  tools: Tool[];
}

export function ComparePickerClient({ tools }: ComparePickerClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Tool[]>([]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tools.slice(0, 20);
    const q = search.toLowerCase();
    return tools
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.tagline ?? "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [tools, search]);

  const toggle = (tool: Tool) => {
    setSelected((prev) => {
      if (prev.find((t) => t.id === tool.id)) {
        return prev.filter((t) => t.id !== tool.id);
      }
      if (prev.length >= 2) return [prev[1], tool];
      return [...prev, tool];
    });
  };

  const runCompare = () => {
    if (selected.length !== 2) return;
    router.push(`/compare/${selected[0].slug}-vs-${selected[1].slug}`);
  };

  const handleDiscover = () => {
    const intent = parseSmartSearch(search);
    router.push(buildToolsSearchUrl(intent));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-mobile-nav">
        <PageHero
          title={
            <>
              Compare <span className="gradient-text">AI Tools</span>
            </>
          }
          subtitle="Pick any two tools — see pricing, scores, and features side by side."
        />

        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
          <CommandBar
            value={search}
            onChange={setSearch}
            onSubmit={handleDiscover}
            placeholder='Try "ChatGPT vs Claude" or search a tool name'
          />

          {selected.length > 0 && (
            <div className="mt-6 glass-panel border border-brand-primary/30 rounded-discova-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Selected ({selected.length}/2)
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selected.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 rounded-pill border border-brand-primary/40 bg-brand-primary/10 px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    {t.name}
                    <button type="button" onClick={() => toggle(t)} aria-label={`Remove ${t.name}`}>
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={selected.length !== 2}
                onClick={runCompare}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-input bg-brand-primary text-neutral-white font-bold text-sm disabled:opacity-40 hover:bg-brand-primary/90 transition-colors"
              >
                <Scale className="h-4 w-4" />
                Compare tools
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-8 space-y-2">
            <p className="text-sm font-semibold text-foreground mb-3">Select tools</p>
            {filtered.map((tool) => {
              const isSelected = selected.some((t) => t.id === tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => toggle(tool)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-discova-lg border text-left transition-all card-lift",
                    isSelected
                      ? "border-brand-primary/50 bg-brand-primary/10"
                      : "border-neutral-stroke/60 glass-panel hover:border-brand-primary/30",
                  )}
                >
                  {tool.logo ? (
                    <img src={tool.logo} alt="" className="h-10 w-10 rounded-input object-contain bg-neutral-surface p-1" />
                  ) : (
                    <div className="h-10 w-10 rounded-input bg-brand-primary/15 flex items-center justify-center font-bold text-brand-primary">
                      {tool.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{tool.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tool.tagline}</p>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-bold text-brand-lilac shrink-0">Selected</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link href="/tools" className="text-sm text-brand-primary hover:text-brand-lilac">
              Browse all tools →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

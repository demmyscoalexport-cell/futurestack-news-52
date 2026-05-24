"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/discovery/page-hero";
import { ToolProfileCard } from "@/components/cards/tool-profile-card";
import { getSavedToolSlugs, removeSavedTool } from "@/lib/collections";
import type { Tool } from "@/lib/types";
import { Bookmark, ArrowRight } from "lucide-react";

export function CollectionsClient({ allTools }: { allTools: Tool[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(getSavedToolSlugs());
  }, []);

  const savedTools = slugs
    .map((slug) => allTools.find((t) => t.slug === slug))
    .filter(Boolean) as Tool[];

  const handleRemove = (slug: string) => {
    removeSavedTool(slug);
    setSlugs(getSavedToolSlugs());
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-mobile-nav">
        <PageHero
          title="My Collections"
          subtitle="Tools you've bookmarked — build your stack from saved picks."
        />

        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          {savedTools.length === 0 ? (
            <div className="glass-panel border border-neutral-stroke/60 rounded-discova-lg p-10 text-center max-w-md mx-auto">
              <Bookmark className="h-10 w-10 text-brand-primary mx-auto mb-4" />
              <h2 className="text-lg font-bold text-foreground mb-2">No saved tools yet</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Tap the bookmark icon on any tool card to save it here.
              </p>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-input bg-brand-primary text-neutral-white font-bold text-sm"
              >
                Explore tools <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">{savedTools.length} saved</p>
                <Link href="/stack-builder" className="text-sm text-brand-primary hover:text-brand-lilac">
                  Build a stack from these →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedTools.map((tool) => (
                  <div key={tool.id} className="relative">
                    <ToolProfileCard tool={tool} />
                    <button
                      type="button"
                      onClick={() => handleRemove(tool.slug)}
                      className="absolute top-3 right-3 text-[10px] font-semibold text-muted-foreground hover:text-destructive bg-neutral-surface/90 px-2 py-1 rounded-input border border-neutral-stroke/60"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

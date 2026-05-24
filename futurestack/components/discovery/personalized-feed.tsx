"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { ToolProfileCard } from "@/components/cards/tool-profile-card";
import type { Tool } from "@/lib/types";
import {
  loadPreferences,
  buildPersonalizedSearchQuery,
  getRecommendedCategories,
  type UserPreferences,
} from "@/lib/personalization";

export function PersonalizedFeed({ fallbackTools }: { fallbackTools: Tool[] }) {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = loadPreferences();
    if (!p.onboardingCompleted) return;
    setPrefs(p);
    setLoading(true);
    const q = buildPersonalizedSearchQuery(p);
    const cats = getRecommendedCategories(p).slice(0, 2).join(",");
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`)
      .then((r) => r.json())
      .then((data) => {
        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        setTools(data.tools ?? []);
      })
      .catch(() => setTools(fallbackTools.slice(0, 6)))
      .finally(() => setLoading(false));
  }, [fallbackTools]);

  if (!prefs?.onboardingCompleted) return null;

  const displayTools = tools.length > 0 ? tools : fallbackTools.slice(0, 6);
  const roleLabel = prefs.role ? prefs.role.charAt(0).toUpperCase() + prefs.role.slice(1) : "You";

  return (
    <section className="py-10 sm:py-12 border-t border-neutral-stroke/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-brand-gold" />
              <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider">For you</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Picked for {roleLabel}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Based on your role, goals, and budget preferences
            </p>
          </div>
          <Link
            href={`/tools?search=${encodeURIComponent(buildPersonalizedSearchQuery(prefs))}`}
            className="text-sm text-brand-primary hover:text-brand-lilac flex items-center gap-1 shrink-0"
          >
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-discova-lg bg-neutral-surface/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayTools.map((tool) => (
              <ToolProfileCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

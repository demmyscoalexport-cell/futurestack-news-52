"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Star,
  Heart,
  Activity,
  Settings,
  ArrowRight,
  Plus,
  Compass,
  Sparkles,
  Bookmark,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToolProfileCard } from "@/components/cards/tool-profile-card";
import type { Tool } from "@/lib/types";
import {
  loadPreferences,
  buildPersonalizedSearchQuery,
  ROLE_OPTIONS,
  type UserPreferences,
} from "@/lib/personalization";
import { getSavedToolSlugs, removeSavedTool } from "@/lib/collections";

interface DashboardClientProps {
  allTools: Tool[];
  trendingTools: Tool[];
  userName: string;
}

export function DashboardClient({ allTools, trendingTools, userName }: DashboardClientProps) {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Tool[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    const p = loadPreferences();
    setPrefs(p);
    setSavedSlugs(getSavedToolSlugs());

    if (p.onboardingCompleted) {
      setLoadingRecs(true);
      const q = buildPersonalizedSearchQuery(p);
      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`)
        .then((r) => r.json())
        .then((data) => setRecommendations(data.tools ?? []))
        .catch(() => setRecommendations(trendingTools.slice(0, 6)))
        .finally(() => setLoadingRecs(false));
    } else {
      setRecommendations(trendingTools.slice(0, 6));
    }
  }, [trendingTools]);

  const savedTools = savedSlugs
    .map((slug) => allTools.find((t) => t.slug === slug))
    .filter(Boolean) as Tool[];

  const roleLabel =
    prefs?.role
      ? ROLE_OPTIONS.find((r) => r.id === prefs.role)?.label ?? prefs.role
      : "Builders";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const displayRecs = recommendations.length > 0 ? recommendations : trendingTools.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-mobile-nav">
        {/* Welcome header */}
        <section className="relative overflow-hidden hero-glow border-b border-neutral-stroke/40">
          <div className="orb-glow top-0 right-1/4 h-[280px] w-[360px] bg-brand-primary/10" />
          <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:py-14">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-pill border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs text-brand-lilac mb-4">
                  <Sparkles className="h-3 w-3" />
                  Your command center
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-foreground">
                  {greeting}, {userName}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-lg">
                  {prefs?.onboardingCompleted
                    ? `Personalized picks for ${roleLabel.toLowerCase()} — based on your goals and budget.`
                    : "Complete onboarding to unlock personalized tool recommendations."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-pill border border-brand-primary/40 bg-brand-primary/15 px-4 py-2 text-sm font-semibold text-brand-lilac hover:bg-brand-primary/25 transition-colors"
                >
                  {prefs?.onboardingCompleted ? "Update preferences" : "Personalize feed"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/collections"
                  className="inline-flex items-center gap-2 rounded-pill border border-neutral-stroke/60 bg-neutral-surface/80 px-4 py-2 text-sm font-semibold text-foreground hover:border-brand-primary/40 transition-colors"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Collections
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 lg:py-10">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
            {[
              { label: "Tools Saved", val: savedTools.length, icon: Heart, color: "text-rose-400" },
              { label: "Interests", val: prefs?.interests.length ?? 0, icon: Compass, color: "text-brand-primary" },
              { label: "Goals Set", val: prefs?.goals.length ?? 0, icon: Star, color: "text-brand-gold" },
              { label: "Trending Now", val: trendingTools.length, icon: Activity, color: "text-emerald-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-panel rounded-discova-lg border border-neutral-stroke/60 p-4 sm:p-5 flex items-start justify-between"
              >
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    {stat.label}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-foreground">{stat.val}</div>
                </div>
                <stat.icon className={`h-5 w-5 ${stat.color} opacity-80 shrink-0`} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recommendations */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-brand-primary" />
                    For {roleLabel}
                  </h2>
                  <Link
                    href={`/tools?search=${encodeURIComponent(prefs ? buildPersonalizedSearchQuery(prefs) : "trending AI")}`}
                    className="text-sm font-semibold text-brand-primary hover:text-brand-lilac flex items-center gap-1"
                  >
                    See all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {loadingRecs ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-44 rounded-discova-lg bg-neutral-surface/50 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayRecs.map((tool) => (
                      <ToolProfileCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                )}
              </section>

              {/* Radar */}
              <section className="glass-panel rounded-discova-lg border border-brand-primary/20 p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 h-48 w-48 bg-brand-primary/15 blur-[64px] rounded-full" />
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground mb-1">This Week&apos;s Radar</h2>
                    <p className="text-sm text-muted-foreground">Top signals from the catalog right now.</p>
                  </div>
                  <Link
                    href="/radar"
                    className="text-sm font-bold text-brand-primary hover:text-brand-lilac flex items-center gap-1 bg-brand-primary/10 px-4 py-2 rounded-pill"
                  >
                    Full radar <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-2 relative z-10">
                  {trendingTools.slice(0, 5).map((tool, i) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="flex justify-between items-center p-3 sm:p-4 rounded-discova-lg border border-neutral-stroke/50 bg-neutral-surface/50 hover:border-brand-primary/30 transition-colors group"
                    >
                      <span className="font-semibold text-sm text-foreground group-hover:text-brand-lilac truncate pr-4">
                        {tool.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-pill shrink-0">
                        {i === 0 ? "Top Rated" : i < 3 ? "Rising" : "Watch"}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {!prefs?.onboardingCompleted && (
                <div className="glass-panel rounded-discova-lg border border-brand-primary/30 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-brand-primary/20 blur-2xl rounded-full translate-x-8 -translate-y-8" />
                  <h3 className="text-lg font-black text-foreground mb-2 relative z-10">Unlock your feed</h3>
                  <p className="text-sm text-muted-foreground mb-4 relative z-10">
                    Tell us your role, goals, and budget — we&apos;ll surface the best AI tools for you.
                  </p>
                  <Link
                    href="/onboarding"
                    className="w-full flex items-center justify-center gap-2 rounded-pill bg-brand-primary text-neutral-white font-bold px-4 py-3 text-sm hover:bg-brand-primary/90 transition-colors relative z-10"
                  >
                    Start onboarding <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Saved tools */}
              <div className="glass-panel rounded-discova-lg border border-neutral-stroke/60 p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-foreground">Saved Tools</h3>
                  <Link href="/collections" className="text-xs font-semibold text-brand-primary hover:text-brand-lilac">
                    View all
                  </Link>
                </div>
                {savedTools.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No bookmarks yet.{" "}
                    <Link href="/tools" className="text-brand-primary hover:underline">
                      Explore tools
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-1">
                    {savedTools.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        className="flex justify-between items-center p-2.5 hover:bg-neutral-surface/80 rounded-discova-lg transition-colors group"
                      >
                        <Link href={`/tools/${t.slug}`} className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-brand-primary/15 rounded-lg flex items-center justify-center text-sm font-bold text-brand-lilac shrink-0">
                            {t.name[0]}
                          </div>
                          <span className="font-semibold text-sm text-foreground truncate">{t.name}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            removeSavedTool(t.slug);
                            setSavedSlugs(getSavedToolSlugs());
                          }}
                          className="text-xs text-rose-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="glass-panel rounded-discova-lg border border-neutral-stroke/60 p-5 sm:p-6">
                <h3 className="font-bold text-lg text-foreground mb-4">Quick actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Compare tools", href: "/compare", icon: Settings },
                    { label: "Build a stack", href: "/stack-builder", icon: Plus },
                    { label: "Browse deals", href: "/deals", icon: Star },
                    { label: "Join community", href: "/community", icon: Activity },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center gap-3 p-3 rounded-discova-lg border border-neutral-stroke/40 hover:border-brand-primary/30 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <action.icon className="h-4 w-4 text-brand-primary shrink-0" />
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

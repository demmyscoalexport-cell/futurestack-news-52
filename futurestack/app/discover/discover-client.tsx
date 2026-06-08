"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CommandBar } from "@/components/discovery/command-bar";
import { PageHero } from "@/components/discovery/page-hero";
import { SectionHeader } from "@/components/discovery/section-header";
import { TrendingTags } from "@/components/discovery/trending-tags";
import {
  TrendingUp, Wifi, Smartphone, DollarSign,
  Star, ArrowRight, Zap, Globe, Users, Sparkles,
} from "lucide-react";
import { ToolProfileCard } from "@/components/cards/tool-profile-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Tool } from "@/lib/types";
import type { ToolRecord } from "@/lib/tool-intelligence";
import { buildToolsSearchUrl, parseSmartSearch } from "@/lib/smart-search";

interface DiscoverClientProps {
  tools: Tool[];
  initialSection?: string;
}

const DISCOVERY_SECTIONS = [
  { id: "trending-nigeria", label: "🇳🇬 Trending in Nigeria", icon: TrendingUp, color: "text-green-400" },
  { id: "trending-kenya",   label: "🇰🇪 Trending in Kenya",   icon: TrendingUp, color: "text-red-400" },
  { id: "trending-sa",      label: "🇿🇦 Trending in South Africa", icon: TrendingUp, color: "text-yellow-400" },
  { id: "trending-ghana",   label: "🇬🇭 Trending in Ghana",   icon: TrendingUp, color: "text-amber-400" },
  { id: "works-3g",         label: "📶 Works on 3G",         icon: Wifi,        color: "text-blue-400" },
  { id: "android",          label: "📱 Android Optimized",   icon: Smartphone,  color: "text-emerald-400" },
  { id: "free-tools",       label: "💚 Best Free AI Tools",  icon: Zap,         color: "text-violet-400" },
  { id: "startup",          label: "🚀 Startup Essentials",  icon: Globe,       color: "text-orange-400" },
  { id: "creators",         label: "🎨 Best for Creators",   icon: Sparkles,    color: "text-pink-400" },
  { id: "students",         label: "🎓 Best for Students",   icon: Users,       color: "text-cyan-400" },
  { id: "naira",            label: "💵 No USD Card Needed",  icon: DollarSign,  color: "text-amber-400" },
  { id: "viral",            label: "🔥 AI Apps Going Viral", icon: TrendingUp,  color: "text-rose-400" },
  { id: "hidden",           label: "💎 Hidden Gems",         icon: Star,        color: "text-indigo-400" },
];

const QUICK_FILTERS = [
  { label: "Free tools only",     section: "free-tools", count: "120+" },
  { label: "Works on 3G",         section: "works-3g",   count: "80+"  },
  { label: "Android optimized",   section: "android",    count: "95+"  },
  { label: "No USD card needed",  section: "naira",      count: "60+"  },
  { label: "Hidden gems",         section: "hidden",     count: "35+"  },
  { label: "Best for students",   section: "students",   count: "70+"  },
];

/** Return a filtered + sorted list of tools for the active section */
function getToolsForSection(tools: Tool[], section: string, search: string): Tool[] {
  const searched = search
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.tagline ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (t.tags ?? []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      )
    : tools;

  const byRating   = [...searched].sort((a, b) => (Number(b.rating)        || 0) - (Number(a.rating)        || 0));
  const byUpvotes  = [...searched].sort((a, b) => (Number(b.upvote_count)  || 0) - (Number(a.upvote_count)  || 0));
  const byReviews  = [...searched].sort((a, b) => (Number(b.review_count)  || 0) - (Number(a.review_count)  || 0));
  const byNewest   = [...searched].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());

  const africa  = (list: Tool[]) => list.filter((t) => t.africa_friendly || t.africaFriendly);
  const hasFree = (list: Tool[]) => list.filter((t) => t.has_free || t.pricing_model === "free" || t.pricing_model === "freemium");
  const byCat   = (cats: string[]) => searched.filter((t) => cats.includes(t.category as string));

  switch (section) {
    case "trending-nigeria":
      return africa(byRating).slice(0, 12);

    case "trending-kenya":
      return [...africa(byUpvotes).slice(4, 16), ...africa(byRating).slice(0, 4)]
        .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
        .slice(0, 12);

    case "trending-sa":
      return africa(byReviews).slice(0, 12);

    case "trending-ghana":
      return [...africa(byNewest).slice(0, 6), ...africa(byRating).slice(6, 12)]
        .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
        .slice(0, 12);

    case "works-3g":
      return africa(byRating).concat(hasFree(byRating))
        .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
        .slice(0, 12);

    case "android":
      return africa(byRating)
        .filter((t) => t.pricing_model !== "enterprise")
        .slice(0, 12);

    case "free-tools":
      return hasFree(byRating).slice(0, 12);

    case "startup":
      return byCat(["code", "productivity", "automation", "marketing", "analytics"])
        .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
        .slice(0, 12);

    case "creators":
      return byCat(["design", "video", "audio", "writing"])
        .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
        .slice(0, 12);

    case "students":
      return hasFree(byRating)
        .filter((t) => ["writing", "productivity", "data", "design"].includes(t.category as string))
        .slice(0, 12);

    case "naira":
      return hasFree(africa(byRating)).slice(0, 12);

    case "viral":
      return byUpvotes.filter((t) => t.is_new || (Number(t.upvote_count) || 0) > 0)
        .concat(byNewest.slice(0, 6))
        .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
        .slice(0, 12);

    case "hidden":
      return byRating
        .filter((t) => !t.is_featured && (Number(t.rating) || 0) >= 4)
        .slice(0, 12);

    default:
      return byRating.slice(0, 12);
  }
}

const VALID_SECTIONS = new Set(DISCOVERY_SECTIONS.map((s) => s.id));

export function DiscoverClient({ tools, initialSection }: DiscoverClientProps) {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState(
    initialSection && VALID_SECTIONS.has(initialSection) ? initialSection : "trending-nigeria"
  );

  const sectionTools = useMemo(
    () => getToolsForSection(tools, activeSection, search),
    [tools, activeSection, search]
  );

  const activeLabel = DISCOVERY_SECTIONS.find((s) => s.id === activeSection)?.label ?? "";
  const otherSections = DISCOVERY_SECTIONS.filter((s) => s.id !== activeSection).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <PageHero
          compact
          title={
            <>
              Discover tools that actually{" "}
              <span className="gradient-text">work in Africa</span>
            </>
          }
          subtitle={`Rated for real life — 3G speed, Android devices, local budgets, and startup realities. ${tools.length}+ tools indexed.`}
        >
          <CommandBar
            value={search}
            onChange={setSearch}
            onSubmit={() => {
              const q = search.trim();
              if (!q) {
                window.location.href = "/tools";
                return;
              }
              window.location.href = buildToolsSearchUrl(parseSmartSearch(q));
            }}
            placeholder="Search tools, workflows, stacks..."
          />
          <div className="mt-6">
            <TrendingTags />
          </div>
        </PageHero>

        {/* Discovery sections nav */}
        <section className="border-b border-neutral-stroke/40 bg-neutral-surface/50 sticky top-14 z-20 backdrop-blur-xl">
          <div className="container mx-auto px-4 sm:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {DISCOVERY_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
                    activeSection === s.id
                      ? "bg-brand-primary text-neutral-white shadow-[0_0_16px_rgba(124,102,255,0.3)]"
                      : "bg-white/[0.05] text-muted-foreground border border-neutral-stroke/50 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">

            {/* Left: Tool feed */}
            <div className="lg:col-span-3">
              <SectionHeader
                title={activeLabel}
                subtitle={
                  sectionTools.length > 0
                    ? `${sectionTools.length} tools in this category`
                    : "No tools found — try a different filter"
                }
              />

              {sectionTools.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 mb-8 xl:grid-cols-2">
                  {sectionTools.map((tool) => (
                    <ToolProfileCard key={tool.id} tool={tool as ToolRecord} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 bg-card/50 p-12 text-center mb-8">
                  <p className="text-muted-foreground text-sm">No tools match this filter yet.</p>
                  <button
                    onClick={() => { setSearch(""); setActiveSection("trending-nigeria"); }}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              )}

              {/* View more */}
              <div className="text-center mb-12">
                <Button variant="outline" asChild>
                  <Link href="/tools">View All Tools <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>

              {/* Other sections preview */}
              <div className="space-y-10">
                {otherSections.map((section) => {
                  const previewTools = getToolsForSection(tools, section.id, "").slice(0, 6);
                  return (
                    <div key={section.id}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-foreground">{section.label}</h3>
                        <button
                          onClick={() => { setActiveSection(section.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                        >
                          See all <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {previewTools.map((tool) => (
                          <ToolProfileCard key={tool.id + section.id} tool={tool as ToolRecord} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">

              {/* Africa score explainer */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🌍</span>
                  <h3 className="font-bold text-sm text-foreground">Africa Score™</h3>
                  <Badge className="text-[10px] bg-emerald-500/20 text-emerald-300 border-0">NEW</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Every tool is scored for African usability — 3G speed, Android support, Naira pricing, and offline access.
                </p>
                <Link href="/methodology" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Learn how it works <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Quick filters — actually change section */}
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Quick Filters</h3>
                <div className="space-y-1">
                  {QUICK_FILTERS.map((f) => (
                    <button
                      key={f.label}
                      onClick={() => { setActiveSection(f.section); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                        activeSection === f.section
                          ? "bg-primary/15 text-primary font-semibold"
                          : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className="bg-secondary/80 px-1.5 py-0.5 rounded text-[10px]">{f.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Country trending — click to switch */}
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">📍 Trending by Country</h3>
                <div className="space-y-1">
                  {[
                    { flag: "🇳🇬", label: "Nigeria",      section: "trending-nigeria" },
                    { flag: "🇰🇪", label: "Kenya",        section: "trending-kenya"   },
                    { flag: "🇿🇦", label: "South Africa", section: "trending-sa"      },
                    { flag: "🇬🇭", label: "Ghana",        section: "trending-ghana"   },
                  ].map((c) => (
                    <button
                      key={c.label}
                      onClick={() => { setActiveSection(c.section); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                        activeSection === c.section
                          ? "bg-primary/15 text-primary font-semibold"
                          : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.label}</span>
                      {activeSection === c.section && <span className="ml-auto text-[10px] text-primary">● Active</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending stacks */}
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">🔥 Trending Stacks</h3>
                <div className="space-y-1">
                  {[
                    { name: "Nigerian Creator Stack",      href: "/stacks" },
                    { name: "WhatsApp Vendor Stack",       href: "/stacks" },
                    { name: "Lagos Startup Stack",         href: "/stacks" },
                    { name: "AI Freelancer Stack",         href: "/stacks" },
                    { name: "Student Productivity Stack",  href: "/stacks" },
                  ].map((stack) => (
                    <Link
                      key={stack.name}
                      href={stack.href}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {stack.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

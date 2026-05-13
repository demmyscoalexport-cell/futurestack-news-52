"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Tool, Article, Stack } from "@/lib/types";
import {
  ArrowRight,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  Mail,
  PenTool,
  Video,
  Zap,
  Code2,
  Palette,
  FlaskConical,
  LayoutGrid,
  Monitor,
  Clock,
  Globe,
  TrendingUp,
  Package,
  Users,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

/* ─── Category icon map ──────────────────────────────────────────── */
const categoryMeta: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  writing:      { icon: PenTool,      color: "text-violet-400",  bg: "bg-violet-500/15", label: "Writing AI"   },
  video:        { icon: Video,         color: "text-red-400",     bg: "bg-red-500/15",    label: "Video AI"     },
  automation:   { icon: Zap,           color: "text-green-400",   bg: "bg-green-500/15",  label: "Automation"   },
  code:         { icon: Code2,         color: "text-blue-400",    bg: "bg-blue-500/15",   label: "Coding AI"    },
  design:       { icon: Palette,       color: "text-pink-400",    bg: "bg-pink-500/15",   label: "Design AI"    },
  research:     { icon: FlaskConical,  color: "text-amber-400",   bg: "bg-amber-500/15",  label: "Research AI"  },
  productivity: { icon: LayoutGrid,    color: "text-cyan-400",    bg: "bg-cyan-500/15",   label: "Productivity" },
  marketing:    { icon: Monitor,       color: "text-orange-400",  bg: "bg-orange-500/15", label: "Marketing"    },
  analytics:    { icon: FlaskConical,  color: "text-yellow-400",  bg: "bg-yellow-500/15", label: "Analytics"    },
  audio:        { icon: Monitor,       color: "text-emerald-400", bg: "bg-emerald-500/15",label: "Audio AI"     },
};

const tagColors: Record<string, string> = {
  writing:      "bg-violet-500/15 text-violet-300 border-violet-500/20",
  video:        "bg-red-500/15 text-red-300 border-red-500/20",
  automation:   "bg-green-500/15 text-green-300 border-green-500/20",
  code:         "bg-blue-500/15 text-blue-300 border-blue-500/20",
  design:       "bg-pink-500/15 text-pink-300 border-pink-500/20",
  research:     "bg-amber-500/15 text-amber-300 border-amber-500/20",
  productivity: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  marketing:    "bg-orange-500/15 text-orange-300 border-orange-500/20",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ─── Animated counter ───────────────────────────────────────────── */
function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = Math.ceil(target / 40);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(start);
      }, 30);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

interface HomeClientProps {
  featuredArticles: Article[];
  topTools: Tool[];
  featuredStacks: Stack[];
  toolCategories: { id: string; name: string; count?: number }[];
  recentTools: Tool[];
}

export function HomeClient({
  topTools,
  featuredStacks,
  toolCategories,
  recentTools,
}: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -360, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 360, behavior: "smooth" });

  const popularTags = ["Writing", "Video", "Automation", "Coding", "Design", "Research", "Productivity"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          {/* Gradient mesh background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[130px]" />
            <div className="absolute top-20 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-700/8 blur-[110px]" />
            <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-emerald-700/6 blur-[100px]" />
            {/* Subtle grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <div className="container relative mx-auto px-4 lg:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
            <div className="grid lg:grid-cols-2 gap-14 items-center">

              {/* ── Left copy ── */}
              <div>
                {/* Pill badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/8 px-4 py-1.5 text-xs text-emerald-300 mb-7">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  🌍 Built for Africa's Digital Builders
                </div>

                {/* Headline */}
                <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white lg:text-6xl xl:text-7xl">
                  Discover the<br />
                  <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                    right tools
                  </span>
                  <br />
                  <span className="text-white/90">for your stack</span>
                </h1>

                <p className="mt-6 text-base text-muted-foreground lg:text-lg max-w-md leading-relaxed">
                  Africa&apos;s operating system for finding and comparing SaaS & AI tools — rated for 3G networks, Naira budgets, and real startup realities.
                </p>

                {/* Search bar */}
                <div className="mt-9 flex gap-2 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim())
                          window.location.href = `/tools?search=${encodeURIComponent(searchQuery)}`;
                      }}
                      placeholder="Search 400+ tools, workflows, stacks..."
                      className="w-full rounded-xl border border-border/60 bg-secondary/50 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 backdrop-blur-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (searchQuery.trim())
                        window.location.href = `/tools?search=${encodeURIComponent(searchQuery)}`;
                    }}
                    className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Search
                  </button>
                </div>

                {/* Popular tags */}
                <div className="mt-5 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">Popular:</span>
                  {popularTags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tools?category=${tag.toLowerCase()}`}
                      className="rounded-lg border border-border/40 bg-secondary/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border/70 hover:bg-secondary/60 transition-all"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>

                {/* Trust signals */}
                <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Africa-rated tools</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Free to use</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Updated daily</span>
                  </div>
                </div>
              </div>

              {/* ── Right: UI mockup ── */}
              <div className="hidden lg:block">
                <div className="relative">
                  {/* Outer glow */}
                  <div className="absolute -inset-6 rounded-3xl bg-violet-600/8 blur-3xl -z-10" />

                  {/* Main card */}
                  <div className="rounded-2xl border border-border/50 bg-card/90 shadow-2xl shadow-black/40 backdrop-blur-md overflow-hidden">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/40 bg-secondary/30">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                      <div className="ml-3 flex-1 rounded-md bg-background/60 h-5 flex items-center px-2.5">
                        <Globe className="h-2.5 w-2.5 text-muted-foreground mr-1.5" />
                        <span className="text-[9px] text-muted-foreground">discova.africa</span>
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Trending label */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <TrendingUp className="h-3 w-3 text-violet-400" />
                        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Trending Now</span>
                      </div>

                      {/* Tool grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {topTools.slice(0, 4).map((tool, i) => (
                          <div key={i} className="rounded-xl border border-border/40 bg-background/50 p-2.5 flex items-center gap-2.5 hover:border-primary/30 transition-colors">
                            {tool.logo ? (
                              <img src={tool.logo} alt={tool.name} className="h-7 w-7 rounded-lg object-contain bg-secondary/60 p-0.5 shrink-0" />
                            ) : (
                              <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-primary">{tool.name[0]}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-foreground truncate">{tool.name}</p>
                              <p className="text-[9px] text-muted-foreground truncate">{tool.tagline?.slice(0, 18) || "AI Tool"}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Stack showcase */}
                      <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-900/30 via-purple-900/20 to-slate-900/30 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Package className="h-3 w-3 text-violet-400" />
                            <span className="text-[9px] font-semibold text-violet-300 uppercase tracking-wider">Featured Stack</span>
                          </div>
                          <span className="text-[9px] text-violet-400/70 bg-violet-500/10 px-1.5 py-0.5 rounded-full">🔥 Popular</span>
                        </div>
                        <p className="text-xs font-bold text-white mb-2.5">
                          {featuredStacks[0]?.name || "AI Creator Stack"}
                        </p>
                        <div className="flex items-center gap-1 mb-2.5">
                          {topTools.slice(0, 5).map((tool, i) => (
                            <div key={i} className="h-5 w-5 rounded-full border border-border/60 bg-secondary overflow-hidden -ml-1 first:ml-0">
                              {tool.logo ? (
                                <img src={tool.logo} alt={tool.name} className="h-full w-full object-contain" />
                              ) : (
                                <div className="h-full w-full bg-primary/30 flex items-center justify-center">
                                  <span className="text-[7px] text-primary font-bold">{tool.name[0]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                          <span className="text-[9px] text-muted-foreground ml-2">+8 tools</span>
                        </div>
                        <Link href="/stacks" className="block w-full rounded-lg bg-violet-600/90 hover:bg-violet-600 py-1.5 text-[10px] font-semibold text-white text-center transition-colors">
                          View All Stacks →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            STATS BAR
        ══════════════════════════════════════════════════════ */}
        <section className="border-t border-b border-border/30 bg-secondary/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 lg:px-6 py-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x divide-border/30">
              {[
                { icon: Package,    label: "AI Tools",        value: topTools.length > 100 ? 400 : 100, suffix: "+" },
                { icon: LayoutGrid, label: "Categories",      value: toolCategories.length || 10, suffix: "" },
                { icon: Users,      label: "Curated Stacks",  value: featuredStacks.length > 5 ? featuredStacks.length : 20, suffix: "+" },
                { icon: Globe,      label: "Africa-Ready",    value: 100, suffix: "%" },
              ].map(({ icon: Icon, label, value, suffix }) => (
                <div key={label} className="flex items-center gap-3 lg:px-8 first:lg:pl-0 last:lg:pr-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground leading-none">
                      <AnimatedCount target={value} suffix={suffix} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            TRENDING AI TOOLS
        ══════════════════════════════════════════════════════ */}
        {topTools.length > 0 && (
          <section className="py-14 lg:py-18">
            <div className="container mx-auto px-4 lg:px-6">
              <div className="flex items-center justify-between mb-7">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Hot right now</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Trending AI Tools</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mr-2 transition-colors">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button onClick={scrollLeft}  className="h-8 w-8 rounded-full border border-border/50 bg-card/50 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={scrollRight} className="h-8 w-8 rounded-full border border-border/50 bg-card/50 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {topTools.map((tool) => {
                  const tagColor = tagColors[tool.category] ?? "bg-secondary/60 text-muted-foreground border-border/40";
                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="group flex-none w-[195px] rounded-xl border border-border/40 bg-card p-3.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="mb-3">
                        {tool.logo ? (
                          <img src={tool.logo} alt={tool.name} className="h-10 w-10 rounded-xl object-contain bg-secondary/60 p-1" />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {tool.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {tool.tagline || "AI-powered tool"}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tagColor}`}>
                          {tool.category_name || tool.category || "AI"}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] text-muted-foreground">
                            {tool.rating ? Number(tool.rating).toFixed(1) : "4.5"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            WHY DISCOVA — VALUE PROPS
        ══════════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-18 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-4 py-1.5 text-xs text-violet-300 mb-5">
                <Sparkles className="h-3 w-3" />
                Why DISCOVA
              </div>
              <h2 className="text-3xl font-bold text-white lg:text-4xl">
                Built for how Africa actually works
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Most tool directories are built for Silicon Valley. We&apos;re built for Lagos, Nairobi, Accra, and everywhere in between.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: Globe,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-500/20",
                  title: "Africa-First Ratings",
                  desc: "Every tool scored for 3G performance, local payment support, and African market fit — not just US benchmarks.",
                },
                {
                  icon: TrendingUp,
                  color: "text-violet-400",
                  bg: "bg-violet-500/10 border-violet-500/20",
                  title: "Daily Discovery",
                  desc: "Auto-synced from Product Hunt, TechCabal, Techpoint Africa and 20+ curated sources every single day.",
                },
                {
                  icon: Package,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10 border-blue-500/20",
                  title: "Ready-Made Stacks",
                  desc: "Curated tool combinations for freelancers, agencies, and SaaS founders — skip the research, start building.",
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="rounded-2xl border border-border/40 bg-card/50 p-6 hover:border-border/70 transition-colors">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${bg} mb-5`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURED CATEGORIES
        ══════════════════════════════════════════════════════ */}
        {toolCategories.length > 0 && (
          <section className="py-14 lg:py-18 border-t border-border/30">
            <div className="container mx-auto px-4 lg:px-6">
              <div className="flex items-center justify-between mb-7">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Browse by Category</h2>
                  <p className="text-sm text-muted-foreground mt-1">Find tools for every part of your workflow</p>
                </div>
                <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  All tools <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-2.5">
                {toolCategories.slice(0, 8).map((cat) => {
                  const meta = categoryMeta[cat.id] ?? { icon: LayoutGrid, color: "text-primary", bg: "bg-primary/10", label: cat.name };
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={cat.id}
                      href={`/tools?category=${cat.id}`}
                      className="group flex flex-col items-center rounded-xl border border-border/40 bg-card p-3.5 lg:p-4 text-center hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.bg} mb-2.5 group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-foreground leading-tight">{meta.label}</span>
                      {cat.count != null && (
                        <span className="mt-1 text-[10px] text-muted-foreground">{cat.count}+</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            POPULAR STACKS  +  LATEST LAUNCHES
        ══════════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-18 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid lg:grid-cols-2 gap-10">

              {/* Popular Stacks */}
              {featuredStacks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Package className="h-3.5 w-3.5 text-violet-400" />
                        <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Ready to use</span>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Popular Stacks</h2>
                    </div>
                    <Link href="/stacks" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {featuredStacks.slice(0, 4).map((stack) => {
                      const toolIcons = (stack as unknown as { tools?: Tool[] }).tools?.slice(0, 6) ?? [];
                      return (
                        <Link
                          key={stack.id}
                          href={`/stacks/${stack.slug ?? stack.id}`}
                          className="group rounded-xl border border-border/40 bg-card p-4 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all"
                        >
                          <div className="grid grid-cols-3 gap-1.5 mb-3">
                            {[0, 1, 2, 3, 4, 5].map((i) => {
                              const tool = toolIcons[i];
                              return (
                                <div key={i} className="h-8 w-8 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center overflow-hidden">
                                  {tool?.logo ? (
                                    <img src={tool.logo} alt={tool.name} className="h-full w-full object-contain p-0.5" />
                                  ) : (
                                    <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                                      {tool && <span className="text-[8px] font-bold text-primary">{tool.name?.[0]}</span>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {stack.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {(stack as unknown as { tool_count?: number }).tool_count ?? "12"} tools
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Latest Launches */}
              {recentTools.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Just dropped</span>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Latest Launches</h2>
                    </div>
                    <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {recentTools.slice(0, 6).map((tool) => {
                      const tagColor = tagColors[tool.category] ?? "bg-secondary/60 text-muted-foreground border-border/40";
                      return (
                        <Link
                          key={tool.id}
                          href={`/tools/${tool.slug}`}
                          className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3 hover:border-primary/40 hover:bg-primary/3 transition-all"
                        >
                          {tool.logo ? (
                            <img src={tool.logo} alt={tool.name} className="h-9 w-9 rounded-lg object-contain bg-secondary/60 p-0.5 shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {tool.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{tool.tagline || "AI-powered tool"}</p>
                          </div>
                          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${tagColor}`}>
                            {tool.category_name || tool.category || "AI"}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            {timeAgo(tool.created_at ?? new Date().toISOString())}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            NEWSLETTER CTA
        ══════════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-18 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-900/25 via-purple-900/15 to-slate-900/20 p-8 lg:p-12">
              {/* Background glow */}
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-purple-600/8 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <Mail className="h-7 w-7 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Stay ahead of the curve</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      Weekly digest of the best new AI tools, Africa tech news, and exclusive deals — straight to your inbox.
                    </p>
                  </div>
                </div>
                <NewsletterInline />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

/* ─── Inline newsletter form ─────────────────────────────────────── */
function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-300 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        You&apos;re subscribed!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full lg:w-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 lg:w-60 rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 backdrop-blur-sm"
        required
      />
      <button
        type="submit"
        className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        Subscribe
      </button>
    </form>
  );
}

"use client";

import { useState, useRef } from "react";
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
} from "lucide-react";

/* ─── Category icon map ──────────────────────────────────────────── */
const categoryMeta: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  writing:      { icon: PenTool,      color: "text-violet-400",  label: "Writing AI"   },
  video:        { icon: Video,         color: "text-red-400",     label: "Video AI"     },
  automation:   { icon: Zap,           color: "text-green-400",   label: "Automation"   },
  code:         { icon: Code2,         color: "text-blue-400",    label: "Coding AI"    },
  design:       { icon: Palette,       color: "text-pink-400",    label: "Design AI"    },
  research:     { icon: FlaskConical,  color: "text-amber-400",   label: "Research AI"  },
  productivity: { icon: LayoutGrid,    color: "text-cyan-400",    label: "Productivity" },
  marketing:    { icon: Monitor,       color: "text-orange-400",  label: "Marketing"    },
  analytics:    { icon: FlaskConical,  color: "text-yellow-400",  label: "Analytics"    },
  audio:        { icon: Monitor,       color: "text-emerald-400", label: "Audio AI"     },
};

/* ─── Desk setups (static showcase) ─────────────────────────────── */
const deskSetups = [
  { title: "AI Developer Setup",    subtitle: "Build, code and ship faster",  gradient: "from-violet-900/80 via-slate-900/60 to-slate-900/90", accent: "bg-violet-500/20" },
  { title: "Creator Studio Setup",  subtitle: "Create content like a pro",    gradient: "from-pink-900/80 via-slate-900/60 to-slate-900/90",   accent: "bg-pink-500/20"   },
  { title: "Automation Workspace",  subtitle: "Smart tools for smart work",   gradient: "from-emerald-900/80 via-slate-900/60 to-slate-900/90", accent: "bg-emerald-500/20"},
  { title: "Minimal Productivity Desk", subtitle: "Less clutter, more focus", gradient: "from-blue-900/80 via-slate-900/60 to-slate-900/90",   accent: "bg-blue-500/20"   },
];

/* ─── Category tag colors for tool cards ────────────────────────── */
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
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
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
        <section className="relative overflow-hidden hero-glow">
          {/* Background glow blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
            <div className="absolute top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-700/6 blur-[100px]" />
          </div>

          <div className="container relative mx-auto px-4 lg:px-6 pt-14 pb-16 lg:pt-20 lg:pb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left copy */}
              <div>
                {/* Pill */}
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-3.5 py-1.5 text-xs text-violet-300 mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Discover. Evaluate. Build Your Future.
                </div>

                {/* Heading */}
                <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white lg:text-5xl xl:text-6xl">
                  Discover the Best<br />
                  <span className="gradient-text">AI Tools</span> and<br />
                  <span className="gradient-text">Smart Desk Setups</span>
                </h1>

                <p className="mt-5 text-base text-muted-foreground lg:text-lg max-w-lg leading-relaxed">
                  Explore 5000+ AI tools, compare features, build powerful stacks and create your ideal AI-powered workspace.
                </p>

                {/* Search */}
                <div className="mt-8 flex gap-2 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim())
                          window.location.href = `/tools?search=${encodeURIComponent(searchQuery)}`;
                      }}
                      placeholder="Search AI tools, categories, stacks..."
                      className="w-full rounded-lg border border-border/60 bg-secondary/60 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (searchQuery.trim())
                        window.location.href = `/tools?search=${encodeURIComponent(searchQuery)}`;
                    }}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                  >
                    Search
                  </button>
                </div>

                {/* Popular tags */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Popular:</span>
                  {popularTags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tools?category=${tag.toLowerCase()}`}
                      className="rounded-md border border-border/50 bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right: UI Mockup */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="rounded-2xl border border-border/50 bg-card/80 p-4 shadow-2xl backdrop-blur-sm">
                    {/* Mini browser chrome */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                      <div className="ml-3 flex-1 rounded bg-secondary/60 h-4 flex items-center px-2">
                        <span className="text-[9px] text-muted-foreground">futurestack.ai</span>
                      </div>
                    </div>
                    {/* Mock tool grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {(topTools.slice(0, 4)).map((tool, i) => (
                        <div key={i} className="rounded-lg border border-border/40 bg-background/60 p-2.5 flex items-center gap-2">
                          {tool.logo ? (
                            <img src={tool.logo} alt={tool.name} className="h-7 w-7 rounded-md object-contain bg-secondary/60 p-0.5 shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{tool.name[0]}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium text-foreground truncate">{tool.name}</p>
                            <p className="text-[9px] text-muted-foreground truncate">{tool.tagline?.slice(0, 20) || "AI Tool"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Mock Popular Stack card */}
                    <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-900/30 to-purple-900/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-semibold text-violet-300 uppercase tracking-wider">⭐ Popular Stack</span>
                      </div>
                      <p className="text-xs font-bold text-white mb-2">AI Creator Stack</p>
                      <div className="flex items-center gap-1.5 mb-2">
                        {topTools.slice(0, 5).map((tool, i) => (
                          <div key={i} className="h-5 w-5 rounded-full border border-border/60 bg-secondary overflow-hidden">
                            {tool.logo ? (
                              <img src={tool.logo} alt={tool.name} className="h-full w-full object-contain" />
                            ) : (
                              <div className="h-full w-full bg-primary/30 flex items-center justify-center">
                                <span className="text-[7px] text-primary font-bold">{tool.name[0]}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        <span className="text-[9px] text-muted-foreground ml-1">+12 tools</span>
                      </div>
                      <button className="w-full rounded-lg bg-primary/90 py-1.5 text-[10px] font-medium text-white">
                        View Stack →
                      </button>
                    </div>
                  </div>
                  {/* Floating glow */}
                  <div className="absolute -inset-4 rounded-3xl bg-violet-600/5 blur-2xl -z-10" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            TRENDING AI TOOLS
        ══════════════════════════════════════════════════════ */}
        {topTools.length > 0 && (
          <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4 lg:px-6">
              {/* Section header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground lg:text-2xl">Trending AI Tools</h2>
                <div className="flex items-center gap-2">
                  <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mr-2">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button onClick={scrollLeft}  className="h-8 w-8 rounded-full border border-border/60 bg-card flex items-center justify-center hover:border-primary/50 transition-colors">
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={scrollRight} className="h-8 w-8 rounded-full border border-border/60 bg-card flex items-center justify-center hover:border-primary/50 transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Horizontal scroll */}
              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {topTools.map((tool) => {
                  const tagColor = tagColors[tool.category] ?? "bg-secondary/60 text-muted-foreground border-border/40";
                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="group flex-none w-[200px] rounded-xl border border-border/50 bg-card p-3.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
                    >
                      {/* Logo */}
                      <div className="mb-2.5">
                        {tool.logo ? (
                          <img
                            src={tool.logo}
                            alt={tool.name}
                            className="h-10 w-10 rounded-xl object-contain bg-secondary/60 p-1"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
                          </div>
                        )}
                      </div>
                      {/* Name */}
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {tool.name}
                      </p>
                      {/* Tagline */}
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {tool.tagline || "AI-powered tool"}
                      </p>
                      {/* Category + Rating */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tagColor}`}>
                          {tool.category_name || tool.category || "AI Tool"}
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
            TRENDING DESK SETUPS
        ══════════════════════════════════════════════════════ */}
        <section className="py-12 lg:py-16 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground lg:text-2xl">Trending Desk Setups</h2>
              <Link href="/tools?category=productivity" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {deskSetups.map((setup) => (
                <div
                  key={setup.title}
                  className="group relative overflow-hidden rounded-xl border border-border/40 bg-card cursor-pointer hover:border-primary/30 transition-all"
                >
                  {/* Simulated desk photo with gradient */}
                  <div className={`aspect-[4/3] bg-gradient-to-br ${setup.accent} relative`}>
                    <div className={`absolute inset-0 bg-gradient-to-t ${setup.gradient}`} />
                    {/* Decorative monitor shape */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Monitor className="h-16 w-16 text-white" />
                    </div>
                    {/* Overlay text */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-semibold text-white leading-tight">{setup.title}</p>
                      <p className="text-xs text-white/70 mt-0.5">{setup.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURED CATEGORIES
        ══════════════════════════════════════════════════════ */}
        {toolCategories.length > 0 && (
          <section className="py-12 lg:py-16 border-t border-border/30">
            <div className="container mx-auto px-4 lg:px-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground lg:text-2xl">Featured Categories</h2>
                <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3">
                {toolCategories.slice(0, 8).map((cat) => {
                  const meta = categoryMeta[cat.id] ?? { icon: LayoutGrid, color: "text-primary", label: cat.name };
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={cat.id}
                      href={`/tools?category=${cat.id}`}
                      className="group flex flex-col items-center rounded-xl border border-border/40 bg-card p-3 lg:p-4 text-center hover:border-primary/40 hover:bg-card/80 transition-all"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/60 group-hover:bg-primary/10 transition-colors mb-2">
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight">{meta.label}</span>
                      {cat.count != null && (
                        <span className="mt-0.5 text-[10px] text-muted-foreground">{cat.count}+ tools</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            POPULAR STACKS  +  LATEST AI LAUNCHES
        ══════════════════════════════════════════════════════ */}
        <section className="py-12 lg:py-16 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid lg:grid-cols-2 gap-8">

              {/* Popular Stacks */}
              {featuredStacks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-foreground">Popular Stacks</h2>
                    <Link href="/stacks" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
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
                          className="group rounded-xl border border-border/40 bg-card p-3.5 hover:border-primary/40 transition-all"
                        >
                          {/* Tool icon grid */}
                          <div className="grid grid-cols-3 gap-1 mb-2.5">
                            {[0, 1, 2, 3, 4, 5].map((i) => {
                              const tool = toolIcons[i];
                              return (
                                <div key={i} className="h-7 w-7 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center overflow-hidden">
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
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {stack.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {(stack as unknown as { tool_count?: number }).tool_count ?? "12"} tools
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Latest AI Launches */}
              {recentTools.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-foreground">Latest AI Launches</h2>
                    <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                      View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {recentTools.map((tool) => {
                      const tagColor = tagColors[tool.category] ?? "bg-secondary/60 text-muted-foreground border-border/40";
                      return (
                        <Link
                          key={tool.id}
                          href={`/tools/${tool.slug}`}
                          className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3 hover:border-primary/40 transition-all"
                        >
                          {tool.logo ? (
                            <img src={tool.logo} alt={tool.name} className="h-8 w-8 rounded-lg object-contain bg-secondary/60 p-0.5 shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {tool.name}
                            </p>
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
        <section className="py-12 lg:py-16 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-900/20 via-purple-900/10 to-violet-900/20 p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <Mail className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Stay ahead in the AI revolution</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Get weekly updates on the best AI tools, productivity tips, and exclusive deals.
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
      <div className="text-sm text-violet-300 font-medium">
        ✓ You&apos;re subscribed! Check your inbox.
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
        className="flex-1 lg:w-56 rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        required
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        Subscribe
      </button>
    </form>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Tool, Article, Stack } from "@/lib/types";
import {
  ArrowRight, Search, Star, ChevronLeft, ChevronRight, Mail,
  PenTool, Video, Zap, Code2, Palette, FlaskConical, LayoutGrid,
  Monitor, Clock, Globe, TrendingUp, Package, Users, Sparkles,
  CheckCircle2, ShoppingCart, GraduationCap, Shield, MessageSquare,
  DollarSign, Cpu, BarChart3, Mic,
} from "lucide-react";

/* ─── Category grid (50+ vision, show 16) ───────────────────────── */
const allCategories = [
  { id: "writing",      label: "Writing AI",       icon: PenTool,      color: "text-violet-400",  bg: "bg-violet-500/12"  },
  { id: "code",         label: "Dev Tools",         icon: Code2,         color: "text-blue-400",    bg: "bg-blue-500/12"    },
  { id: "design",       label: "Design & UI",       icon: Palette,       color: "text-pink-400",    bg: "bg-pink-500/12"    },
  { id: "automation",   label: "Automation",        icon: Zap,           color: "text-green-400",   bg: "bg-green-500/12"   },
  { id: "marketing",    label: "Marketing",         icon: BarChart3,     color: "text-orange-400",  bg: "bg-orange-500/12"  },
  { id: "video",        label: "Video & Media",     icon: Video,         color: "text-red-400",     bg: "bg-red-500/12"     },
  { id: "productivity", label: "Productivity",      icon: LayoutGrid,    color: "text-cyan-400",    bg: "bg-cyan-500/12"    },
  { id: "analytics",   label: "Analytics",         icon: FlaskConical,  color: "text-amber-400",   bg: "bg-amber-500/12"   },
  { id: "finance",      label: "Finance & Ops",     icon: DollarSign,    color: "text-emerald-400", bg: "bg-emerald-500/12" },
  { id: "ecommerce",    label: "Ecommerce",         icon: ShoppingCart,  color: "text-yellow-400",  bg: "bg-yellow-500/12"  },
  { id: "education",    label: "Education",         icon: GraduationCap, color: "text-indigo-400",  bg: "bg-indigo-500/12"  },
  { id: "security",     label: "Security",          icon: Shield,        color: "text-rose-400",    bg: "bg-rose-500/12"    },
  { id: "communication",label: "Communication",     icon: MessageSquare, color: "text-teal-400",    bg: "bg-teal-500/12"    },
  { id: "audio",        label: "Audio AI",          icon: Mic,           color: "text-purple-400",  bg: "bg-purple-500/12"  },
  { id: "data",         label: "Data & Research",   icon: FlaskConical,  color: "text-lime-400",    bg: "bg-lime-500/12"    },
  { id: "africa",       label: "Africa Tech",       icon: Globe,         color: "text-emerald-400", bg: "bg-emerald-500/12" },
];

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

export function HomeClient({ topTools, featuredStacks, toolCategories, recentTools }: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -360, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 360, behavior: "smooth" });

  const exampleSearches = ["logo design tool", "AI coding assistant", "Mpesa integration", "social media scheduler", "invoice generator"];
  const [exampleIdx, setExampleIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setExampleIdx(i => (i + 1) % exampleSearches.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/4 h-[700px] w-[700px] rounded-full bg-violet-600/10 blur-[140px]" />
            <div className="absolute top-20 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-700/8 blur-[120px]" />
            <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-emerald-700/6 blur-[100px]" />
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
          </div>

          <div className="container relative mx-auto px-4 lg:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
            <div className="max-w-3xl mx-auto text-center">

              {/* Headline */}
              <h1 className="text-5xl font-bold leading-[1.06] tracking-tight text-white lg:text-6xl xl:text-7xl mb-6">
                Discover tools that<br />
                <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                  move your work forward
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
                Find, compare, and build stacks from 400+ AI tools, SaaS products, and apps — curated and rated for founders, freelancers, and builders.
              </p>

              {/* Search — full width, centred */}
              <div className="flex gap-2 max-w-2xl mx-auto mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim())
                        window.location.href = `/tools?search=${encodeURIComponent(searchQuery)}`;
                    }}
                    placeholder={`Try "${exampleSearches[exampleIdx]}"`}
                    className="w-full rounded-xl border border-border/60 bg-secondary/50 pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 backdrop-blur-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    if (searchQuery.trim())
                      window.location.href = `/tools?search=${encodeURIComponent(searchQuery)}`;
                  }}
                  className="rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>

              {/* Quick links */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                <span className="text-xs text-muted-foreground">Explore:</span>
                {["AI Writing", "Dev Tools", "Automation", "Design", "Africa Tech", "Finance"].map((tag) => (
                  <Link
                    key={tag}
                    href={`/tools?category=${tag.toLowerCase().replace(" ", "-")}`}
                    className="rounded-lg border border-border/40 bg-secondary/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border/70 hover:bg-secondary/60 transition-all"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Trust bar */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
                {[
                  { icon: CheckCircle2, text: "400+ curated tools" },
                  { icon: Globe,        text: "Africa-rated & tested" },
                  { icon: Sparkles,     text: "AI-powered discovery" },
                  { icon: CheckCircle2, text: "Free to use" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            STATS BAR
        ══════════════════════════════════════════════════════ */}
        <section className="border-t border-b border-border/30 bg-secondary/20">
          <div className="container mx-auto px-4 lg:px-6 py-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x divide-border/30">
              {[
                { icon: Package,    label: "Tools & Apps",    value: 400,  suffix: "+" },
                { icon: LayoutGrid, label: "Categories",      value: 16,   suffix: "+" },
                { icon: Users,      label: "Curated Stacks",  value: featuredStacks.length > 5 ? featuredStacks.length : 20, suffix: "+" },
                { icon: Globe,      label: "Africa-Ready",    value: 100,  suffix: "%" },
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
            TRENDING TOOLS
        ══════════════════════════════════════════════════════ */}
        {topTools.length > 0 && (
          <section className="py-14 lg:py-16">
            <div className="container mx-auto px-4 lg:px-6">
              <div className="flex items-center justify-between mb-7">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Hot right now</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Trending Tools</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mr-2 transition-colors">
                    All tools <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button onClick={scrollLeft}  className="h-8 w-8 rounded-full border border-border/50 bg-card/50 flex items-center justify-center hover:border-primary/50 transition-all">
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={scrollRight} className="h-8 w-8 rounded-full border border-border/50 bg-card/50 flex items-center justify-center hover:border-primary/50 transition-all">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
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
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{tool.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{tool.tagline || "AI-powered tool"}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tagColor}`}>
                          {tool.category_name || tool.category || "AI"}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] text-muted-foreground">{tool.rating ? Number(tool.rating).toFixed(1) : "4.5"}</span>
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
            PLATFORM POSITIONING — 4 PILLARS
        ══════════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-16 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-4 py-1.5 text-xs text-violet-300 mb-5">
                <Cpu className="h-3 w-3" />
                One platform. Every tool you need.
              </div>
              <h2 className="text-3xl font-bold text-white lg:text-4xl">
                The operating system for<br />digital discovery
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Part search engine, part marketplace, part intelligence layer — Discova is how modern builders find and use software.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Search, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
                  title: "Google for Tools",
                  desc: "Search by intent — \"What tool helps me design logos fast?\" — and get smart, ranked results instantly.",
                },
                {
                  icon: TrendingUp, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20",
                  title: "Product Hunt on Steroids",
                  desc: "Not just launches. Continuous, structured discovery of 400+ tools across 50+ categories, updated daily.",
                },
                {
                  icon: Package, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
                  title: "Notion for Stacks",
                  desc: "Build, save, and share your perfect tool stack — organised by role, workflow, or industry.",
                },
                {
                  icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
                  title: "Africa-First by Design",
                  desc: "Every tool rated for 3G, Naira/Cedi budgets, Mpesa compatibility, and real African startup realities.",
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="rounded-2xl border border-border/40 bg-card/50 p-6 hover:border-border/70 transition-colors">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${bg} mb-5`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            BROWSE ALL CATEGORIES — 16 shown
        ══════════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-16 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Browse by Category</h2>
                <p className="text-sm text-muted-foreground mt-1">50+ categories covering every type of digital tool</p>
              </div>
              <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {allCategories.map((cat) => {
                const Icon = cat.icon;
                const dbCat = toolCategories.find(c => c.id === cat.id);
                return (
                  <Link
                    key={cat.id}
                    href={`/tools?category=${cat.id}`}
                    className="group flex flex-col items-center rounded-xl border border-border/40 bg-card p-3 lg:p-4 text-center hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.bg} mb-2 group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-4 w-4 ${cat.color}`} />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground leading-tight">{cat.label}</span>
                    {dbCat?.count != null && (
                      <span className="mt-0.5 text-[9px] text-muted-foreground">{dbCat.count}+</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            POPULAR STACKS + LATEST LAUNCHES — 2-col
        ══════════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-16 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid lg:grid-cols-2 gap-10">

              {featuredStacks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Package className="h-3.5 w-3.5 text-violet-400" />
                        <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Ready-made stacks</span>
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
                            {[0,1,2,3,4,5].map((i) => {
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
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{stack.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {(stack as unknown as { tool_count?: number }).tool_count ?? "12"} tools
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

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
                          className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3 hover:border-primary/40 transition-all"
                        >
                          {tool.logo ? (
                            <img src={tool.logo} alt={tool.name} className="h-9 w-9 rounded-lg object-contain bg-secondary/60 p-0.5 shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{tool.name}</p>
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
            WHO DISCOVA IS FOR — PERSONAS
        ══════════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-16 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white lg:text-3xl">Built for every kind of builder</h2>
              <p className="mt-3 text-muted-foreground">Whether you&apos;re shipping a startup or running a hustle, Discova has your stack.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { emoji: "🚀", label: "Founders",       desc: "Find your MVP stack" },
                { emoji: "👨‍💻", label: "Developers",     desc: "Tools that ship faster" },
                { emoji: "🎨", label: "Designers",       desc: "Create without limits" },
                { emoji: "📢", label: "Marketers",       desc: "Grow with the right stack" },
                { emoji: "🎓", label: "Students",        desc: "Learn & build smarter" },
                { emoji: "🏢", label: "Agencies",        desc: "Scale client work" },
              ].map(({ emoji, label, desc }) => (
                <div key={label} className="rounded-xl border border-border/40 bg-card/50 p-4 text-center hover:border-border/70 transition-colors">
                  <div className="text-2xl mb-2">{emoji}</div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            NEWSLETTER CTA
        ══════════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-16 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-900/25 via-purple-900/15 to-slate-900/20 p-8 lg:p-12">
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
                      Weekly digest of the best new AI tools, Africa tech launches, and exclusive deals — straight to your inbox.
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

function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
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
        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 lg:w-60 rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 backdrop-blur-sm"
        required
      />
      <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors whitespace-nowrap">
        Subscribe
      </button>
    </form>
  );
}

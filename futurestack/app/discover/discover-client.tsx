"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Search, TrendingUp, Wifi, Smartphone, DollarSign,
  Star, ArrowRight, Zap, Globe, Users, Sparkles, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Tool } from "@/lib/types";

interface DiscoverClientProps {
  tools: Tool[];
}

const DISCOVERY_SECTIONS = [
  { id: "trending-nigeria", label: "🇳🇬 Trending in Nigeria", icon: TrendingUp, color: "text-green-400" },
  { id: "trending-kenya", label: "🇰🇪 Trending in Kenya", icon: TrendingUp, color: "text-red-400" },
  { id: "trending-sa", label: "🇿🇦 Trending in South Africa", icon: TrendingUp, color: "text-yellow-400" },
  { id: "works-3g", label: "📶 Works on 3G", icon: Wifi, color: "text-blue-400" },
  { id: "android", label: "📱 Android Optimized", icon: Smartphone, color: "text-emerald-400" },
  { id: "free-tools", label: "💚 Best Free AI Tools", icon: Zap, color: "text-violet-400" },
  { id: "startup", label: "🚀 Startup Essentials", icon: Globe, color: "text-orange-400" },
  { id: "creators", label: "🎨 Best for Creators", icon: Sparkles, color: "text-pink-400" },
  { id: "students", label: "🎓 Best for Students", icon: Users, color: "text-cyan-400" },
  { id: "naira", label: "💵 No USD Card Needed", icon: DollarSign, color: "text-amber-400" },
  { id: "viral", label: "🔥 AI Apps Going Viral", icon: TrendingUp, color: "text-rose-400" },
  { id: "hidden", label: "💎 Hidden Gems", icon: Star, color: "text-indigo-400" },
];

const NAIJA_BADGES = [
  { label: "Works on 3G", color: "bg-blue-500/15 text-blue-300 border-blue-500/20" },
  { label: "Naira Friendly", color: "bg-green-500/15 text-green-300 border-green-500/20" },
  { label: "Android Ready", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
  { label: "Startup Friendly", color: "bg-violet-500/15 text-violet-300 border-violet-500/20" },
  { label: "Student Friendly", color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20" },
  { label: "Offline Support", color: "bg-amber-500/15 text-amber-300 border-amber-500/20" },
  { label: "Africa Ready", color: "bg-orange-500/15 text-orange-300 border-orange-500/20" },
  { label: "Creator Approved", color: "bg-pink-500/15 text-pink-300 border-pink-500/20" },
];

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex gap-3 rounded-xl border border-border/50 bg-card p-3.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      <div className="shrink-0">
        {tool.logo ? (
          <img src={tool.logo} alt={tool.name} className="h-10 w-10 rounded-xl object-contain bg-secondary/60 p-1" />
        ) : (
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{tool.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tool.tagline || "AI-powered tool"}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[10px] bg-secondary/60 text-muted-foreground px-1.5 py-0.5 rounded">
            {tool.pricing_model === "free" ? "Free" : tool.pricing_model === "freemium" ? "Freemium" : "Paid"}
          </span>
          <div className="flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] text-muted-foreground">{tool.rating ? Number(tool.rating).toFixed(1) : "4.5"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function DiscoverClient({ tools }: DiscoverClientProps) {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("trending-nigeria");

  const filteredTools = tools.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.tagline ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const sectionTools = filteredTools.slice(0, 12);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
            <div className="absolute top-20 right-1/4 h-[300px] w-[300px] rounded-full bg-emerald-600/6 blur-[80px]" />
          </div>

          <div className="container relative mx-auto px-4 lg:px-6 pt-12 pb-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3.5 py-1.5 text-xs text-emerald-300 mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                🌍 Africa&apos;s Discovery Engine — Live Now
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white lg:text-5xl mb-4">
                Discover tools that actually<br />
                <span className="gradient-text">work in Africa</span>
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-xl mx-auto mb-8">
                Rated for real life — 3G speed, Android devices, Naira budgets, and startup realities.
              </p>

              {/* Search */}
              <div className="flex gap-2 max-w-lg mx-auto mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search 400+ tools, apps, workflows..."
                    className="pl-10 h-11"
                  />
                </div>
                <Button className="h-11 px-6">Search</Button>
              </div>

              {/* Naija badges */}
              <div className="flex flex-wrap justify-center gap-2">
                {NAIJA_BADGES.map((b) => (
                  <span key={b.label} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${b.color}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Discovery sections nav */}
        <section className="border-t border-border/30 bg-card/40">
          <div className="container mx-auto px-4 lg:px-6 py-3">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
              {DISCOVERY_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                    activeSection === s.id
                      ? "bg-primary text-white"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="container mx-auto px-4 lg:px-6 py-10">
          <div className="grid lg:grid-cols-4 gap-8">

            {/* Left: Tool feed */}
            <div className="lg:col-span-3">
              {/* Active section header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {DISCOVERY_SECTIONS.find(s => s.id === activeSection)?.label}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{filteredTools.length} tools matching your discovery feed</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1.5" />Filter
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3 mb-8">
                {sectionTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>

              {/* View more */}
              <div className="text-center">
                <Button variant="outline" asChild>
                  <Link href="/tools">View All Tools <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>

              {/* More discovery sections */}
              <div className="mt-12 space-y-10">
                {DISCOVERY_SECTIONS.filter(s => s.id !== activeSection).slice(0, 4).map((section) => (
                  <div key={section.id}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-foreground">{section.label}</h3>
                      <Link href="/tools" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        View all <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tools.slice(0, 6).map((tool) => (
                        <ToolCard key={tool.id + section.id} tool={tool} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">

              {/* Naija Score explainer */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🌍</span>
                  <h3 className="font-bold text-sm text-foreground">Naija Score™</h3>
                  <Badge className="text-[10px] bg-emerald-500/20 text-emerald-300 border-0">NEW</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Every tool is scored for African usability — 3G speed, Android support, Naira pricing, and offline access.
                </p>
                <Link href="/methodology" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Learn how it works <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Quick filters */}
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Quick Filters</h3>
                <div className="space-y-2">
                  {[
                    { label: "Free tools only", count: "120+" },
                    { label: "Works on 3G", count: "80+" },
                    { label: "Android optimized", count: "95+" },
                    { label: "No USD card needed", count: "60+" },
                    { label: "Offline support", count: "35+" },
                    { label: "Student-friendly", count: "70+" },
                  ].map((f) => (
                    <button
                      key={f.label}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <span>{f.label}</span>
                      <span className="bg-secondary/80 px-1.5 py-0.5 rounded text-[10px]">{f.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending stacks */}
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">🔥 Trending Stacks</h3>
                <div className="space-y-2">
                  {[
                    "Nigerian Creator Stack",
                    "WhatsApp Vendor Stack",
                    "Lagos Startup Stack",
                    "AI Freelancer Stack",
                    "Student Productivity Stack",
                  ].map((stack) => (
                    <Link
                      key={stack}
                      href="/stacks"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {stack}
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

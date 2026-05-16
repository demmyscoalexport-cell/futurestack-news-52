"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe, Wifi, Smartphone, DollarSign, Zap,
  ArrowRight, Star,
} from "lucide-react";

const AFRICA_FILTERS = [
  { id: "3g", icon: Wifi, label: "Works on 3G", count: "80+ tools", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "android", icon: Smartphone, label: "Android Optimized", count: "95+ tools", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "naira", icon: DollarSign, label: "Naira Friendly", count: "70+ tools", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  { id: "free", icon: Zap, label: "Free Plan Available", count: "120+ tools", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "novpn", icon: Globe, label: "No VPN Required", count: "110+ tools", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { id: "paystack", icon: Star, label: "Paystack Compatible", count: "45+ tools", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
];

const COUNTRIES = [
  { id: "ng", flag: "🇳🇬", name: "Nigeria", city: "Lagos", users: "4.2K", trend: "↑ 32%" },
  { id: "ke", flag: "🇰🇪", name: "Kenya", city: "Nairobi", users: "2.8K", trend: "↑ 28%" },
  { id: "gh", flag: "🇬🇭", name: "Ghana", city: "Accra", users: "1.9K", trend: "↑ 41%" },
  { id: "za", flag: "🇿🇦", name: "South Africa", city: "Cape Town", users: "3.1K", trend: "↑ 19%" },
  { id: "eg", flag: "🇪🇬", name: "Egypt", city: "Cairo", users: "1.4K", trend: "↑ 24%" },
  { id: "tz", flag: "🇹🇿", name: "Tanzania", city: "Dar es Salaam", users: "890", trend: "↑ 35%" },
  { id: "rw", flag: "🇷🇼", name: "Rwanda", city: "Kigali", users: "720", trend: "↑ 52%" },
  { id: "ug", flag: "🇺🇬", name: "Uganda", city: "Kampala", users: "650", trend: "↑ 38%" },
];

const AFRICA_STACKS = [
  {
    title: "Nigerian Creator Stack",
    tools: ["CapCut", "Canva", "ChatGPT", "TubeBuddy"],
    cost: "Free – $10/mo",
    badge: "Nigeria",
  },
  {
    title: "WhatsApp Vendor Stack",
    tools: ["WhatsApp Business", "Paystack", "Notion", "Google Sheets"],
    cost: "Free",
    badge: "Pan-Africa",
  },
  {
    title: "Lagos Startup Stack",
    tools: ["Supabase", "Vercel", "Paystack", "Slack"],
    cost: "$0 – $25/mo",
    badge: "Startup",
  },
  {
    title: "African Student Toolkit",
    tools: ["Notion", "ChatGPT", "Grammarly", "Canva"],
    cost: "Free",
    badge: "Students",
  },
];

const PAYMENTS = [
  { name: "Paystack", desc: "Most popular for Nigerian & Ghanaian businesses", tools: "45+ tools", dot: "bg-emerald-400" },
  { name: "Flutterwave", desc: "Pan-African payments, 30+ currencies", tools: "38+ tools", dot: "bg-blue-400" },
  { name: "OPay", desc: "Mobile money for Nigeria", tools: "12+ tools", dot: "bg-orange-400" },
  { name: "MTN MoMo", desc: "Mobile money across 17 African countries", tools: "20+ tools", dot: "bg-yellow-400" },
  { name: "Chipper Cash", desc: "Cross-border transfers in Africa", tools: "8+ tools", dot: "bg-violet-400" },
];

interface Tool {
  id: unknown;
  name: unknown;
  slug: unknown;
  tagline?: unknown;
  logo?: unknown;
}

interface AfricaClientProps {
  tools: Tool[];
}

export function AfricaClient({ tools }: AfricaClientProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  // Deterministically vary tools shown per country/filter using offset
  const getToolOffset = () => {
    if (activeCountry) {
      const idx = COUNTRIES.findIndex(c => c.id === activeCountry);
      return idx * 2;
    }
    if (activeFilter) {
      const idx = AFRICA_FILTERS.findIndex(f => f.id === activeFilter);
      return idx * 3;
    }
    return 0;
  };

  const offset = getToolOffset();
  const displayTools = tools.length > 0
    ? [...tools.slice(offset), ...tools.slice(0, offset)].slice(0, 8)
    : [];

  const toggleFilter = (id: string) => {
    setActiveFilter(prev => prev === id ? null : id);
    setActiveCountry(null);
  };

  const toggleCountry = (id: string) => {
    setActiveCountry(prev => prev === id ? null : id);
    setActiveFilter(null);
  };

  const activeFilterLabel = activeFilter
    ? AFRICA_FILTERS.find(f => f.id === activeFilter)?.label
    : activeCountry
      ? `${COUNTRIES.find(c => c.id === activeCountry)?.flag} ${COUNTRIES.find(c => c.id === activeCountry)?.name}`
      : null;

  return (
    <div className="space-y-12">

      {/* Africa filters */}
      <section>
        <h2 className="font-bold text-foreground mb-5">Filter by African Reality</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {AFRICA_FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                className={`rounded-xl border ${f.border} ${f.bg} p-4 text-center hover:opacity-90 transition-all group ring-offset-background ${
                  isActive ? "ring-2 ring-primary/60 ring-offset-1" : ""
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/40 mx-auto mb-2">
                  <Icon className={`h-4 w-4 ${f.color}`} />
                </div>
                <p className={`text-xs font-medium ${isActive ? "text-foreground" : "text-foreground"}`}>{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.count}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Trending by country */}
      <section>
        <h2 className="font-bold text-foreground mb-5">Trending by Country</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {COUNTRIES.map((c) => {
            const isActive = activeCountry === c.id;
            return (
              <button
                key={c.id}
                onClick={() => toggleCountry(c.id)}
                className={`rounded-xl border bg-card p-3 text-center transition-all ${
                  isActive
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/50 hover:border-primary/40"
                }`}
              >
                <span className="text-2xl">{c.flag}</span>
                <p className="text-xs font-medium text-foreground mt-1">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.users} users</p>
                <p className="text-[10px] text-emerald-400">{c.trend}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Africa stacks */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground">Africa Power Stacks</h2>
          <Link href="/stacks" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {AFRICA_STACKS.map((stack) => (
            <Link
              key={stack.title}
              href="/stacks"
              className="rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 transition-all block"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded">{stack.badge}</span>
                <span className="text-[10px] text-muted-foreground">{stack.cost}</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mb-3">{stack.title}</h3>
              <div className="flex flex-wrap gap-1">
                {stack.tools.map((t) => (
                  <span key={t} className="text-[10px] bg-secondary/50 text-muted-foreground px-1.5 py-0.5 rounded border border-border/30">{t}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Payment compatibility */}
      <section>
        <h2 className="font-bold text-foreground mb-5">African Payment Compatibility</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PAYMENTS.map((p) => (
            <div key={p.name} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4">
              <div className={`h-4 w-4 rounded-full ${p.dot} mt-0.5 shrink-0`} />
              <div>
                <p className="text-sm font-bold text-foreground mb-0.5">{p.name}</p>
                <p className="text-xs text-muted-foreground mb-1">{p.desc}</p>
                <p className="text-[10px] text-primary">{p.tools} compatible</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured tools */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground">
            Africa-Approved Tools
            {activeFilterLabel && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {activeFilterLabel}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            {activeFilterLabel && (
              <button
                onClick={() => { setActiveFilter(null); setActiveCountry(null); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filter
              </button>
            )}
            <Link href="/tools" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayTools.map((tool) => (
            <Link
              key={String(tool.id)}
              href={`/tools/${String(tool.slug)}`}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3.5 hover:border-primary/40 transition-all group"
            >
              <div className="shrink-0">
                {tool.logo ? (
                  <img
                    src={tool.logo as string}
                    alt={String(tool.name)}
                    className="h-9 w-9 rounded-lg object-contain bg-secondary/60 p-1"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{String(tool.name)[0]}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {String(tool.name)}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {String(tool.tagline || "AI-powered tool")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Tag, Clock, ExternalLink, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const DEALS = [
  {
    id: 1,
    name: "Notion",
    tagline: "All-in-one workspace for teams",
    discount: "Free for Students",
    originalPrice: "$16/mo",
    dealPrice: "$0",
    category: "Productivity",
    expiry: "Ongoing",
    badge: "🎓 Student",
    badgeColor: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    filterType: "Student",
    hot: true,
    africa: true,
    href: "https://www.notion.so/product/notion-for-education",
  },
  {
    id: 2,
    name: "Canva Pro",
    tagline: "Professional design made easy",
    discount: "50% off for Nonprofits",
    originalPrice: "$15/mo",
    dealPrice: "$7.50/mo",
    category: "Design",
    expiry: "Jun 30, 2026",
    badge: "🌍 Africa",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    filterType: "Discount",
    hot: true,
    africa: true,
    href: "https://www.canva.com/canva-for-nonprofits/",
  },
  {
    id: 3,
    name: "Figma",
    tagline: "Collaborative interface design",
    discount: "Free for Students & Educators",
    originalPrice: "$15/mo",
    dealPrice: "$0",
    category: "Design",
    expiry: "Ongoing",
    badge: "🎓 Student",
    badgeColor: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    filterType: "Student",
    hot: false,
    africa: true,
    href: "https://www.figma.com/education/",
  },
  {
    id: 4,
    name: "CapCut",
    tagline: "Video editing for creators",
    discount: "Completely Free",
    originalPrice: "—",
    dealPrice: "$0",
    category: "Video",
    expiry: "Ongoing",
    badge: "🆓 Free",
    badgeColor: "bg-green-500/15 text-green-300 border-green-500/20",
    filterType: "Free",
    hot: true,
    africa: true,
    href: "https://www.capcut.com/",
  },
  {
    id: 5,
    name: "GitHub Copilot",
    tagline: "AI pair programmer",
    discount: "Free for Students",
    originalPrice: "$10/mo",
    dealPrice: "$0",
    category: "Developer",
    expiry: "Ongoing",
    badge: "🎓 Student",
    badgeColor: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    filterType: "Student",
    hot: false,
    africa: true,
    href: "https://education.github.com/pack",
  },
  {
    id: 6,
    name: "Grammarly",
    tagline: "AI writing assistant",
    discount: "Free tier available",
    originalPrice: "$12/mo",
    dealPrice: "$0 (Free plan)",
    category: "Writing",
    expiry: "Ongoing",
    badge: "🆓 Free",
    badgeColor: "bg-green-500/15 text-green-300 border-green-500/20",
    filterType: "Free",
    hot: false,
    africa: true,
    href: "https://www.grammarly.com/",
  },
  {
    id: 7,
    name: "Supabase",
    tagline: "Open source Firebase alternative",
    discount: "Free up to 50K rows",
    originalPrice: "$25/mo",
    dealPrice: "$0 (Free plan)",
    category: "Developer",
    expiry: "Ongoing",
    badge: "🆓 Free",
    badgeColor: "bg-green-500/15 text-green-300 border-green-500/20",
    filterType: "Free",
    hot: true,
    africa: true,
    href: "https://supabase.com/pricing",
  },
  {
    id: 8,
    name: "Vercel",
    tagline: "Deploy web apps instantly",
    discount: "Free hobby plan",
    originalPrice: "$20/mo",
    dealPrice: "$0 (Hobby)",
    category: "Developer",
    expiry: "Ongoing",
    badge: "🆓 Free",
    badgeColor: "bg-green-500/15 text-green-300 border-green-500/20",
    filterType: "Free",
    hot: false,
    africa: true,
    href: "https://vercel.com/pricing",
  },
];

const SIDEBAR_CATEGORIES = ["All Tools", "AI Tools", "Design", "Developer", "Productivity", "Video", "Writing"];

const CATEGORY_MAP: Record<string, string> = {
  "All Tools": "",
  "AI Tools": "AI",
  "Design": "Design",
  "Developer": "Developer",
  "Productivity": "Productivity",
  "Video": "Video",
  "Writing": "Writing",
};

export function DealsClient() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All Tools");

  const visible = DEALS.filter((d) => {
    const matchesFilter = activeFilter === "All" || d.filterType === activeFilter;
    const matchesCategory = activeCategory === "All Tools" || d.category === CATEGORY_MAP[activeCategory];
    return matchesFilter && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/3 h-[300px] w-[300px] rounded-full bg-rose-600/8 blur-[80px]" />
          </div>
          <div className="container relative mx-auto px-4 lg:px-6 py-12 lg:py-14">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/25 bg-rose-500/8 px-3.5 py-1.5 text-xs text-rose-300 mb-5">
                <Tag className="h-3 w-3" />
                Deals & Discounts — Updated Weekly
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-5xl mb-4">
                Best tool deals for<br />
                <span className="gradient-text">African builders</span>
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-xl mb-6">
                Exclusive discounts, free tiers, student offers, and lifetime deals on the tools African creators, founders, and businesses use most.
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>{DEALS.length} active deals right now</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-6 py-10">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-foreground">
                  {activeFilter === "All" && activeCategory === "All Tools" ? "All" : activeFilter !== "All" ? activeFilter : activeCategory} Deals{" "}
                  <span className="text-muted-foreground font-normal text-sm">({visible.length})</span>
                </h2>
                <div className="flex gap-2">
                  {["All", "Free", "Student", "Discount"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        activeFilter === f
                          ? "bg-primary text-white"
                          : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {visible.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <p className="mb-3">No deals match this filter.</p>
                  <button
                    onClick={() => { setActiveFilter("All"); setActiveCategory("All Tools"); }}
                    className="text-primary hover:underline text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {visible.map((deal) => (
                    <div
                      key={deal.id}
                      className={`rounded-xl border bg-card p-4 hover:border-primary/40 transition-all ${deal.hot ? "border-primary/30" : "border-border/50"}`}
                    >
                      {deal.hot && (
                        <div className="text-[10px] text-rose-400 font-semibold mb-2">🔥 HOT DEAL</div>
                      )}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-foreground">{deal.name}</h3>
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${deal.badgeColor}`}>{deal.badge}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{deal.tagline}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-foreground">{deal.dealPrice}</p>
                          {deal.originalPrice !== "—" && (
                            <p className="text-[10px] text-muted-foreground line-through">{deal.originalPrice}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-primary">{deal.discount}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{deal.expiry}</span>
                          </div>
                        </div>
                        <Button size="sm" className="h-8 text-xs" asChild>
                          <a href={deal.href} target="_blank" rel="noopener noreferrer">
                            Get Deal <ExternalLink className="ml-1.5 h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <h3 className="font-bold text-sm text-foreground mb-2">📬 Deal Alerts</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Get notified about new deals and discounts for African builders every week.
                </p>
                <Button className="w-full" size="sm" asChild>
                  <Link href="/signup">Subscribe Free</Link>
                </Button>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Browse by Category</h3>
                {SIDEBAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setActiveFilter("All"); }}
                    className={`w-full flex items-center justify-between py-2 text-xs transition-colors rounded px-1 ${
                      activeCategory === cat
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{cat}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-2">💡 Submit a Deal</h3>
                <p className="text-xs text-muted-foreground mb-3">Found a great deal for African builders? Share it!</p>
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <Link href="/submit-tool">Submit Deal</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

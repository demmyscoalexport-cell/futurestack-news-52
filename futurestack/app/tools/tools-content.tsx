"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolProfileCard } from "@/components/cards/tool-profile-card";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Flame,
  Globe2,
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
  subcategories?: Subcategory[];
}

interface RawTool {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logo?: string | null;
  website?: string;
  website_url?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  has_free?: boolean;
  africa_friendly?: boolean;
  rating?: number;
  review_count?: number;
  is_featured?: boolean;
  is_new?: boolean;
  is_verified?: boolean;
  pricing_model?: string;
  futurestack_score?: number;
}

interface ToolsContentProps {
  initialTools: RawTool[];
  initialCategories: Category[];
}

const CATEGORY_ICONS: Record<string, string> = {
  writing: "✍️",
  code: "💻",
  design: "🎨",
  video: "🎬",
  audio: "🎵",
  automation: "⚙️",
  productivity: "⚡",
  data: "📊",
  marketing: "📢",
  analytics: "📈",
};

const CATEGORY_IMAGES: Record<string, string> = {
  writing:      "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549339/futurestack/categories/writing.jpg",
  code:         "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549337/futurestack/categories/code.jpg",
  design:       "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549337/futurestack/categories/design.jpg",
  video:        "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549347/futurestack/categories/video.jpg",
  audio:        "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549347/futurestack/categories/audio.jpg",
  automation:   "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549347/futurestack/categories/automation.jpg",
  productivity: "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549353/futurestack/categories/productivity.jpg",
  data:         "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549353/futurestack/categories/data.jpg",
  marketing:    "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549353/futurestack/categories/marketing.jpg",
  analytics:    "https://res.cloudinary.com/dxizihlmo/image/upload/v1778549362/futurestack/categories/analytics.jpg",
};


export function ToolsContent({ initialTools, initialCategories }: ToolsContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hasFreeOnly, setHasFreeOnly] = useState(false);
  const [africaFriendlyOnly, setAfricaFriendlyOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest" | "name">("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleCategory = (catId: string) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
      setActiveSubcategory(null);
    } else {
      setActiveCategory(catId);
      setActiveSubcategory(null);
      setExpandedCategories((prev) => { const n = new Set(prev); n.add(catId); return n; });
    }
  };

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories((prev) => {
      const n = new Set(prev);
      n.has(catId) ? n.delete(catId) : n.add(catId);
      return n;
    });
  };

  const clearAll = () => {
    setActiveCategory(null); setActiveSubcategory(null);
    setSearchQuery(""); setHasFreeOnly(false); setAfricaFriendlyOnly(false); setNewOnly(false);
  };

  const filtered = useMemo(() => {
    let tools = initialTools;
    if (activeCategory) tools = tools.filter((t) => t.category === activeCategory);
    if (activeSubcategory) tools = tools.filter((t) => t.subcategory === activeSubcategory);
    if (hasFreeOnly) tools = tools.filter((t) => t.has_free);
    if (africaFriendlyOnly) tools = tools.filter((t) => t.africa_friendly);
    if (newOnly) tools = tools.filter((t) => t.is_new);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tools = tools.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        (t.tagline || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return [...tools].sort((a, b) => {
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "newest") return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if ((b.is_featured ? 1 : 0) !== (a.is_featured ? 1 : 0))
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      return (b.review_count ?? 0) - (a.review_count ?? 0);
    });
  }, [initialTools, activeCategory, activeSubcategory, hasFreeOnly, africaFriendlyOnly, newOnly, searchQuery, sortBy]);

  const featured = filtered.filter((t) => t.is_featured);
  const rest = filtered.filter((t) => !t.is_featured);
  const hasFilters = !!(activeCategory || activeSubcategory || searchQuery || hasFreeOnly || africaFriendlyOnly || newOnly);

  const Sidebar = () => (
    <div className="space-y-1">
      <button
        onClick={() => { setActiveCategory(null); setActiveSubcategory(null); }}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          !activeCategory ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="flex items-center gap-2"><Globe2 className="h-4 w-4" />All Tools</span>
        <span className="text-xs opacity-70">{initialTools.length}</span>
      </button>

      <div className="pt-3 pb-1">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</p>
      </div>

      {initialCategories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const isExpanded = expandedCategories.has(cat.id);
        const subs = cat.subcategories ?? [];
        const catImg = CATEGORY_IMAGES[cat.id];
        const fallbackIcon = cat.icon || CATEGORY_ICONS[cat.id] || "🔧";
        return (
          <div key={cat.id}>
            <button
              onClick={() => toggleCategory(cat.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                isActive ? "bg-primary/10 text-primary font-medium border border-primary/20" : "hover:bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                {catImg ? (
                  <img
                    src={catImg}
                    alt={cat.name}
                    width={22}
                    height={22}
                    className="rounded-md object-cover flex-shrink-0"
                    style={{ width: 22, height: 22 }}
                  />
                ) : (
                  <span className="text-base">{fallbackIcon}</span>
                )}
                <span className="capitalize">{cat.name}</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs opacity-60">{cat.count ?? 0}</span>
                {subs.length > 0 && (
                  <span onClick={(e) => toggleExpand(cat.id, e)} className="p-0.5 rounded hover:bg-white/10">
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </span>
                )}
              </div>
            </button>
            {isExpanded && subs.length > 0 && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                {subs.map((sub) => (
                  <button
                    key={sub.slug}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveSubcategory(activeSubcategory === sub.slug ? null : sub.slug);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors",
                      activeSubcategory === sub.slug ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    )}
                  >
                    <span className="flex items-center gap-1.5"><span>{sub.icon}</span><span>{sub.name}</span></span>
                    <span className="opacity-50">{sub.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-4 space-y-2 border-t border-border mt-3">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Filters</p>
        {[
          { key: "free", label: "Free / Freemium", state: hasFreeOnly, set: setHasFreeOnly },
          { key: "africa", label: "🌍 Africa-Friendly", state: africaFriendlyOnly, set: setAfricaFriendlyOnly },
          { key: "new", label: "✨ New Tools", state: newOnly, set: setNewOnly },
        ].map(({ key, label, state, set }) => (
          <button key={key} onClick={() => set(!state)}
            className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
              state ? "bg-primary/10 text-primary border border-primary/20 font-medium" : "hover:bg-secondary text-muted-foreground hover:text-foreground",
            )}>
            <span className={cn("h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0",
              state ? "border-primary bg-primary" : "border-muted-foreground")}>
              {state && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
            </span>
            {label}
          </button>
        ))}
      </div>

      {hasFilters && (
        <button onClick={clearAll} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary mt-2 transition-colors">
          <X className="h-3 w-3" /> Clear all filters
        </button>
      )}
    </div>
  );

  const activeCategoryData = initialCategories.find((c) => c.id === activeCategory);
  const pageTitle = activeSubcategory
    ? activeCategoryData?.subcategories?.find((s) => s.slug === activeSubcategory)?.name ?? "AI Tools"
    : activeCategory ? activeCategoryData?.name ?? "AI Tools" : "All AI Tools";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold capitalize">{pageTitle}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {filtered.length} tool{filtered.length !== 1 ? "s" : ""} found
                  {activeCategory ? ` in ${activeCategoryData?.name ?? activeCategory}` : ""}
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search AI tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {hasFilters && (
              <div className="flex flex-wrap gap-2 mt-4">
                {activeCategory && (
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                    {CATEGORY_ICONS[activeCategory]} {activeCategoryData?.name ?? activeCategory}
                    <button onClick={() => { setActiveCategory(null); setActiveSubcategory(null); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {activeSubcategory && (
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary text-foreground border border-border font-medium">
                    {activeCategoryData?.subcategories?.find(s => s.slug === activeSubcategory)?.name ?? activeSubcategory}
                    <button onClick={() => setActiveSubcategory(null)}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {hasFreeOnly && (
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                    Free/Freemium <button onClick={() => setHasFreeOnly(false)}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {africaFriendlyOnly && (
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
                    🌍 Africa-Friendly <button onClick={() => setAfricaFriendlyOnly(false)}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {newOnly && (
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">
                    ✨ New <button onClick={() => setNewOnly(false)}><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
          <div className="flex gap-8">
            <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                <Sidebar />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowMobileFilters(!showMobileFilters)} className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />Filters
                    {hasFilters && (
                      <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
                        {[activeCategory, activeSubcategory, hasFreeOnly, africaFriendlyOnly, newOnly].filter(Boolean).length}
                      </span>
                    )}
                  </Button>
                  <span className="hidden sm:inline text-sm text-muted-foreground">{filtered.length} tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="text-sm bg-card border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="rating">Top Rated</option>
                    <option value="newest">Newest</option>
                    <option value="name">Name A-Z</option>
                  </select>
                  <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode("grid")} className={cn("p-1.5", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={cn("p-1.5", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {showMobileFilters && (
                <div className="lg:hidden mb-5 rounded-xl border border-border bg-card p-4">
                  <Sidebar />
                </div>
              )}

              {featured.length > 0 && !searchQuery && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-4 w-4 text-amber-400" />
                    <h2 className="text-sm font-semibold">Featured</h2>
                    <span className="text-xs text-muted-foreground">({featured.length})</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {featured.map((tool) => <ToolProfileCard key={tool.id} tool={tool} />)}
                  </div>
                  {rest.length > 0 && (
                    <div className="flex items-center gap-3 my-6">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">All Tools</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No tools found</h3>
                  <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or filters.</p>
                  <Button variant="outline" onClick={clearAll}>Clear filters</Button>
                </div>
              ) : viewMode === "list" ? (
                <div className="space-y-3">
                  {(searchQuery ? filtered : rest).map((tool) => <ToolProfileCard key={tool.id} tool={tool} />)}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {(searchQuery ? filtered : rest).map((tool) => <ToolProfileCard key={tool.id} tool={tool} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

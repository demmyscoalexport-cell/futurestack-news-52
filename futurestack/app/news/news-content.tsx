"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/discovery/page-hero";
import { CommandBar } from "@/components/discovery/command-bar";
import { FilterSheet } from "@/components/discovery/filter-sheet";
import { SectionHeader } from "@/components/discovery/section-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArticleCard } from "@/components/cards/article-card";
import type { ArticleCategory, UserRole, Article } from "@/lib/types";
import { Search, X } from "lucide-react";

const categories: { id: ArticleCategory; label: string }[] = [
  { id: "ai-tools", label: "AI Tools" },
  { id: "saas-news", label: "SaaS News" },
  { id: "tutorials", label: "Tutorials" },
  { id: "case-studies", label: "Case Studies" },
  { id: "comparisons", label: "Comparisons" },
  { id: "industry-trends", label: "Industry Trends" },
];

const audiences: { id: UserRole; label: string }[] = [
  { id: "freelancer", label: "Freelancer" },
  { id: "agency", label: "Agency" },
  { id: "saas-founder", label: "SaaS Founder" },
];

interface NewsContentProps {
  initialArticles: Article[];
}

const PAGE_SIZE = 12;

export function NewsContent({ initialArticles }: NewsContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    ArticleCategory[]
  >([]);
  const [selectedAudiences, setSelectedAudiences] = useState<UserRole[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const toggle = <T,>(arr: T[], item: T) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const filteredArticles = initialArticles.filter((a) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !a.title.toLowerCase().includes(q) &&
        !a.excerpt.toLowerCase().includes(q)
      )
        return false;
    }
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(a.category)
    )
      return false;
    if (
      selectedAudiences.length > 0 &&
      !a.targetRoles.some((r) => selectedAudiences.includes(r))
    )
      return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedAudiences([]);
    setSearchQuery("");
    setVisibleCount(PAGE_SIZE);
  };
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedAudiences.length > 0 ||
    !!searchQuery;

  const filterSidebarContent = (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 font-semibold text-foreground">Topics</h3>
        <div className="space-y-3">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${c.id}`}
                checked={selectedCategories.includes(c.id)}
                onCheckedChange={() =>
                  setSelectedCategories(toggle(selectedCategories, c.id))
                }
              />
              <Label htmlFor={`cat-${c.id}`} className="cursor-pointer text-sm">
                {c.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-4 font-semibold text-foreground">Audience</h3>
        <div className="space-y-3">
          {audiences.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <Checkbox
                id={`aud-${a.id}`}
                checked={selectedAudiences.includes(a.id)}
                onCheckedChange={() =>
                  setSelectedAudiences(toggle(selectedAudiences, a.id))
                }
              />
              <Label
                htmlFor={`aud-${a.id}`}
                className="cursor-pointer text-sm capitalize"
              >
                {a.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" /> Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <PageHero
          compact
          title={
            <>
              News &amp; <span className="gradient-text">Insights</span>
            </>
          }
          subtitle="Stay ahead with AI tools, SaaS trends, tutorials, and automation strategies for creators and builders."
        >
          <CommandBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={() => setVisibleCount(PAGE_SIZE)}
            placeholder="Search articles, guides, comparisons..."
          />
        </PageHero>

        <section className="py-6 sm:py-10 lg:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-6 lg:gap-8">
              <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
                <div className="sticky top-24 glass-panel rounded-discova-lg border border-neutral-stroke/60 p-5">
                  <SectionHeader title="Filters" className="mb-0" />
                  <div className="mt-4">{filterSidebarContent}</div>
                </div>
              </aside>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6 flex-wrap">
                  <p className="text-sm text-muted-foreground">
                    {Math.min(visibleCount, filteredArticles.length)} of {filteredArticles.length}{" "}
                    {filteredArticles.length === 1 ? "article" : "articles"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden border-neutral-stroke"
                  >
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] text-neutral-white font-bold">
                        {selectedCategories.length + selectedAudiences.length}
                      </span>
                    )}
                  </Button>
                </div>

                <FilterSheet open={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)} title="Filter Articles">
                  {filterSidebarContent}
                </FilterSheet>

                {filteredArticles.length > 0 ? (
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredArticles.slice(0, visibleCount).map((a) => (
                      <ArticleCard key={a.id} article={a} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                      No articles found
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Try adjusting your search or filters.
                    </p>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}

                {filteredArticles.length > visibleCount && (
                  <div className="mt-12 flex justify-center">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    >
                      Load More Articles
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

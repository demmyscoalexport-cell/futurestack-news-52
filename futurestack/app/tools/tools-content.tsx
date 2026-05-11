"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToolCard } from "@/components/cards/tool-card";
import type { Tool } from "@/lib/types";
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pricingFilters = [
  { id: "free", label: "Free tier available" },
  { id: "under-20", label: "Under $20/mo" },
  { id: "under-50", label: "Under $50/mo" },
  { id: "enterprise", label: "Enterprise" },
];

const sortOptions = [
  { id: "popularity", label: "Popularity" },
  { id: "rating", label: "Rating" },
  { id: "newest", label: "Newest" },
  { id: "name", label: "Name A-Z" },
];

interface Category {
  id: string;
  name: string;
  count?: number;
}
interface ToolsContentProps {
  initialTools: Tool[];
  initialCategories: Category[];
}

export function ToolsContent({
  initialTools,
  initialCategories,
}: ToolsContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPricing, setSelectedPricing] = useState<string[]>([]);
  const [africaFriendlyOnly, setAfricaFriendly] = useState(false);
  const [sortBy, setSortBy] = useState("popularity");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const toggleArr = <T,>(arr: T[], item: T) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const filteredTools = initialTools.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !t.name.toLowerCase().includes(q) &&
        !t.shortDescription.toLowerCase().includes(q) &&
        !t.category.toLowerCase().includes(q)
      )
        return false;
    }
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(t.category)
    )
      return false;
    if (selectedPricing.includes("free") && !t.pricing.hasFree) return false;
    if (africaFriendlyOnly && !t.africaFriendly) return false;
    return true;
  });

  const sorted = [...filteredTools].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "newest")
      return (
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return b.reviewCount - a.reviewCount;
  });

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPricing([]);
    setAfricaFriendly(false);
    setSearchQuery("");
  };
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedPricing.length > 0 ||
    africaFriendlyOnly ||
    !!searchQuery;
  const activeFilterCount =
    selectedCategories.length +
    selectedPricing.length +
    (africaFriendlyOnly ? 1 : 0);

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 font-semibold">Category</h3>
        <div className="space-y-3">
          {initialCategories.map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`cat-${c.id}`}
                  checked={selectedCategories.includes(c.id)}
                  onCheckedChange={() =>
                    setSelectedCategories(toggleArr(selectedCategories, c.id))
                  }
                />
                <Label
                  htmlFor={`cat-${c.id}`}
                  className="cursor-pointer text-sm capitalize"
                >
                  {c.name}
                </Label>
              </div>
              {c.count != null && (
                <span className="text-xs text-muted-foreground">{c.count}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-4 font-semibold">Pricing</h3>
        <div className="space-y-3">
          {pricingFilters.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <Checkbox
                id={`price-${f.id}`}
                checked={selectedPricing.includes(f.id)}
                onCheckedChange={() =>
                  setSelectedPricing(toggleArr(selectedPricing, f.id))
                }
              />
              <Label
                htmlFor={`price-${f.id}`}
                className="cursor-pointer text-sm"
              >
                {f.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-4 font-semibold">Region</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="africa-friendly"
            checked={africaFriendlyOnly}
            onCheckedChange={(c) => setAfricaFriendly(c === true)}
          />
          <Label htmlFor="africa-friendly" className="cursor-pointer text-sm">
            Africa-Friendly Only
          </Label>
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border bg-card py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-3xl font-bold lg:text-4xl">
              AI Tools Directory
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Discover {initialTools.length}+ AI tools for every workflow.
            </p>
            <div className="mt-6 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tools by name, feature, or use case..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 lg:py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex gap-8">
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-24">
                  <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
                    <Filter className="h-5 w-5" />
                    Filters
                  </h2>
                  <FilterSidebar />
                </div>
              </aside>
              <div className="flex-1">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {sorted.length} tools
                    </p>
                    <Sheet
                      open={isMobileFilterOpen}
                      onOpenChange={setIsMobileFilterOpen}
                    >
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="lg:hidden"
                        >
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          Filters
                          {activeFilterCount > 0 && (
                            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                              {activeFilterCount}
                            </span>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80">
                        <SheetHeader>
                          <SheetTitle>Filter Tools</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6">
                          <FilterSidebar />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Sort:{" "}
                          {sortOptions.find((s) => s.id === sortBy)?.label}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {sortOptions.map((o) => (
                          <DropdownMenuItem
                            key={o.id}
                            onClick={() => setSortBy(o.id)}
                            className={sortBy === o.id ? "bg-secondary" : ""}
                          >
                            {o.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="hidden sm:flex items-center border border-border rounded-lg">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon-sm"
                        onClick={() => setViewMode("grid")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon-sm"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {sorted.length > 0 ? (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                        : "space-y-4"
                    }
                  >
                    {sorted.map((t) => (
                      <ToolCard
                        key={t.id}
                        tool={t}
                        variant={viewMode === "list" ? "horizontal" : "default"}
                        onAddToStack={() => {}}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                      No tools found
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
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

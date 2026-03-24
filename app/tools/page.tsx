'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ToolCard } from '@/components/cards/tool-card'
import { tools, toolCategories } from '@/lib/data'
import type { ToolCategory, Tool } from '@/lib/types'
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  LayoutGrid, 
  List,
  ChevronDown
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const pricingFilters = [
  { id: 'free', label: 'Free tier available' },
  { id: 'under-20', label: 'Under $20/mo' },
  { id: 'under-50', label: 'Under $50/mo' },
  { id: 'enterprise', label: 'Enterprise' },
]

const regionFilters = [
  { id: 'global', label: 'Global' },
  { id: 'africa-friendly', label: 'Africa-Friendly' },
]

const sortOptions = [
  { id: 'popularity', label: 'Popularity' },
  { id: 'rating', label: 'Rating' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Name A-Z' },
]

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPricing, setSelectedPricing] = useState<string[]>([])
  const [africaFriendlyOnly, setAfricaFriendlyOnly] = useState(false)
  const [sortBy, setSortBy] = useState('popularity')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const togglePricing = (pricing: string) => {
    setSelectedPricing(prev =>
      prev.includes(pricing)
        ? prev.filter(p => p !== pricing)
        : [...prev, pricing]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedPricing([])
    setAfricaFriendlyOnly(false)
    setSearchQuery('')
  }

  const filteredTools = tools.filter(tool => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!tool.name.toLowerCase().includes(query) && 
          !tool.shortDescription.toLowerCase().includes(query) &&
          !tool.category.toLowerCase().includes(query)) {
        return false
      }
    }

    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(tool.category)) {
      return false
    }

    // Pricing filter
    if (selectedPricing.length > 0) {
      if (selectedPricing.includes('free') && !tool.pricing.hasFree) return false
    }

    // Africa-friendly filter
    if (africaFriendlyOnly && !tool.africaFriendly) {
      return false
    }

    return true
  })

  // Sort tools
  const sortedTools = [...filteredTools].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      default: // popularity - by review count
        return b.reviewCount - a.reviewCount
    }
  })

  const hasActiveFilters = selectedCategories.length > 0 || selectedPricing.length > 0 || africaFriendlyOnly || searchQuery
  const activeFilterCount = selectedCategories.length + selectedPricing.length + (africaFriendlyOnly ? 1 : 0)

  const handleAddToStack = (tool: Tool) => {
    console.log('Adding to stack:', tool.name)
  }

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Category</h3>
        <div className="space-y-3">
          {toolCategories.map(category => (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`cat-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <Label htmlFor={`cat-${category.id}`} className="text-sm cursor-pointer capitalize">
                  {category.name}
                </Label>
              </div>
              <span className="text-xs text-muted-foreground">{category.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Pricing</h3>
        <div className="space-y-3">
          {pricingFilters.map(filter => (
            <div key={filter.id} className="flex items-center gap-2">
              <Checkbox
                id={`price-${filter.id}`}
                checked={selectedPricing.includes(filter.id)}
                onCheckedChange={() => togglePricing(filter.id)}
              />
              <Label htmlFor={`price-${filter.id}`} className="text-sm cursor-pointer">
                {filter.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Region */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Region</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="africa-friendly"
              checked={africaFriendlyOnly}
              onCheckedChange={(checked) => setAfricaFriendlyOnly(checked === true)}
            />
            <Label htmlFor="africa-friendly" className="text-sm cursor-pointer">
              Africa-Friendly Only
            </Label>
          </div>
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="border-b border-border bg-card py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-3xl font-bold text-foreground lg:text-4xl">AI Tools Directory</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Discover {tools.length}+ AI tools for every workflow.
            </p>

            {/* Search */}
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

        {/* Main Content */}
        <section className="py-8 lg:py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex gap-8">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-24">
                  <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </h2>
                  <FilterSidebar />
                </div>
              </aside>

              {/* Tools Grid */}
              <div className="flex-1">
                {/* Toolbar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {sortedTools.length} tools
                    </p>

                    {/* Mobile Filter Button */}
                    <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="lg:hidden">
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
                    {/* Sort */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Sort: {sortOptions.find(s => s.id === sortBy)?.label}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {sortOptions.map(option => (
                          <DropdownMenuItem
                            key={option.id}
                            onClick={() => setSortBy(option.id)}
                            className={sortBy === option.id ? 'bg-secondary' : ''}
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View Mode */}
                    <div className="hidden sm:flex items-center border border-border rounded-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon-sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon-sm"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tools */}
                {sortedTools.length > 0 ? (
                  <div className={
                    viewMode === 'grid'
                      ? 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3'
                      : 'space-y-4'
                  }>
                    {sortedTools.map(tool => (
                      <ToolCard 
                        key={tool.id} 
                        tool={tool}
                        variant={viewMode === 'list' ? 'horizontal' : 'default'}
                        onAddToStack={handleAddToStack}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No tools found</h3>
                    <p className="mt-2 text-muted-foreground">
                      Try adjusting your search or filters.
                    </p>
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      Clear Filters
                    </Button>
                  </div>
                )}

                {/* Pagination */}
                {sortedTools.length > 0 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="secondary" size="sm">1</Button>
                      <Button variant="ghost" size="sm">2</Button>
                      <Button variant="ghost" size="sm">3</Button>
                      <span className="px-2 text-muted-foreground">...</span>
                      <Button variant="ghost" size="sm">12</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

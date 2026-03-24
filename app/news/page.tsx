'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ArticleCard } from '@/components/cards/article-card'
import { articles } from '@/lib/data'
import type { ArticleCategory, UserRole } from '@/lib/types'
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const categories: { id: ArticleCategory; label: string }[] = [
  { id: 'ai-tools', label: 'AI Tools' },
  { id: 'saas-news', label: 'SaaS News' },
  { id: 'tutorials', label: 'Tutorials' },
  { id: 'case-studies', label: 'Case Studies' },
  { id: 'comparisons', label: 'Comparisons' },
  { id: 'industry-trends', label: 'Industry Trends' },
]

const audiences: { id: UserRole; label: string }[] = [
  { id: 'freelancer', label: 'Freelancer' },
  { id: 'agency', label: 'Agency' },
  { id: 'saas-founder', label: 'SaaS Founder' },
]

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<ArticleCategory[]>([])
  const [selectedAudiences, setSelectedAudiences] = useState<UserRole[]>([])
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const toggleCategory = (category: ArticleCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleAudience = (audience: UserRole) => {
    setSelectedAudiences(prev =>
      prev.includes(audience)
        ? prev.filter(a => a !== audience)
        : [...prev, audience]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedAudiences([])
    setSearchQuery('')
  }

  const filteredArticles = articles.filter(article => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!article.title.toLowerCase().includes(query) && 
          !article.excerpt.toLowerCase().includes(query)) {
        return false
      }
    }

    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(article.category)) {
      return false
    }

    // Audience filter
    if (selectedAudiences.length > 0) {
      const hasMatchingAudience = article.targetRoles.some(role => selectedAudiences.includes(role))
      if (!hasMatchingAudience) return false
    }

    return true
  })

  const hasActiveFilters = selectedCategories.length > 0 || selectedAudiences.length > 0 || searchQuery

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Topics</h3>
        <div className="space-y-3">
          {categories.map(category => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <Label htmlFor={`cat-${category.id}`} className="text-sm cursor-pointer">
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Audience */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Audience</h3>
        <div className="space-y-3">
          {audiences.map(audience => (
            <div key={audience.id} className="flex items-center gap-2">
              <Checkbox
                id={`aud-${audience.id}`}
                checked={selectedAudiences.includes(audience.id)}
                onCheckedChange={() => toggleAudience(audience.id)}
              />
              <Label htmlFor={`aud-${audience.id}`} className="text-sm cursor-pointer capitalize">
                {audience.label}
              </Label>
            </div>
          ))}
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
            <h1 className="text-3xl font-bold text-foreground lg:text-4xl">News & Insights</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Stay ahead with AI tools, SaaS trends, and automation strategies.
            </p>

            {/* Search */}
            <div className="mt-6 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
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

              {/* Articles Grid */}
              <div className="flex-1">
                {/* Mobile Filter Button */}
                <div className="lg:hidden mb-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredArticles.length} articles
                  </p>
                  <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filters
                        {hasActiveFilters && (
                          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {selectedCategories.length + selectedAudiences.length}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Filter Articles</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterSidebar />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Results count - desktop */}
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
                  </p>
                </div>

                {/* Articles */}
                {filteredArticles.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredArticles.map(article => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No articles found</h3>
                    <p className="mt-2 text-muted-foreground">
                      Try adjusting your search or filters.
                    </p>
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      Clear Filters
                    </Button>
                  </div>
                )}

                {/* Load More */}
                {filteredArticles.length > 0 && (
                  <div className="mt-12 flex justify-center">
                    <Button variant="outline" size="lg">
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
  )
}

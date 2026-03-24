'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoleSelector } from '@/components/ui/role-selector'
import { ToolBadge } from '@/components/ui/tool-badge'
import { tools, toolCategories } from '@/lib/data'
import type { UserRole, Tool } from '@/lib/types'
import { 
  Search, 
  Plus, 
  X, 
  ArrowUp, 
  ArrowDown,
  Save,
  Share2,
  Download,
  Trash2,
  Sparkles,
  DollarSign,
  Layers,
  ChevronRight,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StackBuilderPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [stackTools, setStackTools] = useState<Tool[]>([])
  const [stackName, setStackName] = useState('My Custom Stack')
  const [isEditingName, setIsEditingName] = useState(false)

  // Get recommended tools based on role
  const recommendedTools = useMemo(() => {
    if (!selectedRole) return []
    
    return tools
      .filter(tool => {
        if (selectedRole === 'freelancer') {
          return tool.pricing.hasFree || tool.badges.includes('no-code')
        }
        if (selectedRole === 'agency') {
          return tool.integrations.length > 2
        }
        if (selectedRole === 'saas-founder') {
          return tool.category === 'code' || tool.category === 'automation' || tool.category === 'analytics'
        }
        return true
      })
      .slice(0, 6)
  }, [selectedRole])

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      // Already in stack
      if (stackTools.some(t => t.id === tool.id)) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!tool.name.toLowerCase().includes(query) && 
            !tool.shortDescription.toLowerCase().includes(query)) {
          return false
        }
      }

      // Category filter
      if (selectedCategory && tool.category !== selectedCategory) {
        return false
      }

      return true
    })
  }, [searchQuery, selectedCategory, stackTools])

  const addToStack = (tool: Tool) => {
    if (!stackTools.some(t => t.id === tool.id)) {
      setStackTools([...stackTools, tool])
    }
  }

  const removeFromStack = (toolId: string) => {
    setStackTools(stackTools.filter(t => t.id !== toolId))
  }

  const moveToolUp = (index: number) => {
    if (index === 0) return
    const newStack = [...stackTools]
    ;[newStack[index - 1], newStack[index]] = [newStack[index], newStack[index - 1]]
    setStackTools(newStack)
  }

  const moveToolDown = (index: number) => {
    if (index === stackTools.length - 1) return
    const newStack = [...stackTools]
    ;[newStack[index], newStack[index + 1]] = [newStack[index + 1], newStack[index]]
    setStackTools(newStack)
  }

  const clearStack = () => {
    setStackTools([])
  }

  // Calculate stack stats
  const stackStats = useMemo(() => {
    const categories = new Set(stackTools.map(t => t.category))
    const monthlyCost = stackTools.reduce((sum, tool) => {
      const proPlan = tool.pricing.plans.find(p => p.name.toLowerCase().includes('pro') || p.name.toLowerCase().includes('standard'))
      if (proPlan) {
        const price = parseFloat(proPlan.price.replace('$', ''))
        return sum + (isNaN(price) ? 0 : price)
      }
      return sum
    }, 0)

    return {
      toolCount: stackTools.length,
      categoryCount: categories.size,
      estimatedCost: monthlyCost,
      hasFreeTier: stackTools.some(t => t.pricing.hasFree),
    }
  }, [stackTools])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-secondary/30">
        {/* Page Header */}
        <section className="border-b border-border bg-background py-8 lg:py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-3xl font-bold text-foreground lg:text-4xl">Stack Builder</h1>
            <p className="mt-2 text-muted-foreground">
              Select your role and add tools to create a custom workflow.
            </p>
          </div>
        </section>

        {/* Role Selection */}
        {!selectedRole && (
          <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                  <Sparkles className="h-4 w-4" />
                  Step 1 of 2
                </div>
                <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
                  Select Your Role
                </h2>
                <p className="mt-2 text-muted-foreground">
                  We&apos;ll recommend tools based on your workflow.
                </p>

                <div className="mt-8">
                  <RoleSelector 
                    value={selectedRole} 
                    onChange={setSelectedRole}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Builder Interface */}
        {selectedRole && (
          <section className="py-8 lg:py-12">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Tool Selection Panel */}
                <div className="flex-1">
                  {/* Role Badge & Change */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {selectedRole.replace('-', ' ')}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedRole(undefined)}
                      >
                        Change
                      </Button>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-primary">
                      <Sparkles className="h-4 w-4" />
                      Step 2: Add Tools
                    </div>
                  </div>

                  {/* Recommended Tools */}
                  {recommendedTools.length > 0 && stackTools.length === 0 && (
                    <Card className="mb-6 bg-primary/5 border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Recommended for {selectedRole.replace('-', ' ')}s
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {recommendedTools.map(tool => (
                            <button
                              key={tool.id}
                              onClick={() => addToStack(tool)}
                              className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-primary hover:bg-primary/5"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{tool.category}</p>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Search & Filter */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                      <Button
                        variant={selectedCategory === null ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                      >
                        All
                      </Button>
                      {toolCategories.slice(0, 5).map(cat => (
                        <Button
                          key={cat.id}
                          variant={selectedCategory === cat.id ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(cat.id)}
                          className="whitespace-nowrap"
                        >
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Tool Grid */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredTools.map(tool => (
                      <Card 
                        key={tool.id} 
                        className="group cursor-pointer transition-all hover:border-primary hover:shadow-md"
                        onClick={() => addToStack(tool)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                              <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">{tool.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {tool.shortDescription}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground capitalize">{tool.category}</span>
                                {tool.pricing.hasFree && (
                                  <ToolBadge badge="free" size="sm" />
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredTools.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No more tools to add.</p>
                    </div>
                  )}
                </div>

                {/* Stack Preview Panel */}
                <div className="lg:w-96 shrink-0">
                  <div className="lg:sticky lg:top-24">
                    <Card>
                      <CardHeader className="border-b border-border">
                        <div className="flex items-center justify-between">
                          {isEditingName ? (
                            <Input
                              value={stackName}
                              onChange={(e) => setStackName(e.target.value)}
                              onBlur={() => setIsEditingName(false)}
                              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                              className="text-lg font-semibold"
                              autoFocus
                            />
                          ) : (
                            <CardTitle 
                              className="cursor-pointer hover:text-primary transition-colors"
                              onClick={() => setIsEditingName(true)}
                            >
                              {stackName}
                            </CardTitle>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsEditingName(!isEditingName)}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4">
                        {/* Stack Tools */}
                        {stackTools.length > 0 ? (
                          <div className="space-y-2">
                            {stackTools.map((tool, index) => (
                              <div
                                key={tool.id}
                                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3"
                              >
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                                  {index + 1}
                                </span>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                                  <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{tool.category}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => moveToolUp(index)}
                                    disabled={index === 0}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => moveToolDown(index)}
                                    disabled={index === stackTools.length - 1}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => removeFromStack(tool.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                              <Layers className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">
                              Your stack is empty. Add tools from the left panel.
                            </p>
                          </div>
                        )}

                        {/* Stack Stats */}
                        {stackTools.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Tools
                              </span>
                              <span className="font-medium text-foreground">{stackStats.toolCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Categories
                              </span>
                              <span className="font-medium text-foreground">{stackStats.categoryCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Est. Cost
                              </span>
                              <span className="font-medium text-foreground">
                                ~${stackStats.estimatedCost}/mo
                              </span>
                            </div>
                            {stackStats.hasFreeTier && (
                              <div className="flex items-center gap-2 text-sm text-success">
                                <CheckCircle className="h-4 w-4" />
                                Some tools have free tiers
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-6 space-y-2">
                          <Button className="w-full" disabled={stackTools.length === 0}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Stack
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" disabled={stackTools.length === 0}>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </Button>
                            <Button variant="outline" disabled={stackTools.length === 0}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </Button>
                          </div>
                          {stackTools.length > 0 && (
                            <Button 
                              variant="ghost" 
                              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={clearStack}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Clear Stack
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Browse Existing Stacks */}
                    <Card className="mt-4">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          Need inspiration? Browse pre-built stacks.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/stacks">
                            Browse Stacks
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StackCard, StackLeaderboardRow } from '@/components/cards/stack-card'
import { stacks } from '@/lib/data'
import type { UserRole, Stack } from '@/lib/types'
import { Plus, Trophy, ArrowRight } from 'lucide-react'

const roleFilters: { id: UserRole | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'freelancer', label: 'Freelancer' },
  { id: 'agency', label: 'Agency' },
  { id: 'saas-founder', label: 'SaaS Founder' },
]

export default function StacksPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all')

  const filteredStacks = selectedRole === 'all'
    ? stacks
    : stacks.filter(stack => stack.targetRole === selectedRole)

  const topStacks = [...stacks].sort((a, b) => b.cloneCount - a.cloneCount).slice(0, 3)

  const handleClone = (stack: Stack) => {
    console.log('Cloning stack:', stack.name)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="border-b border-border bg-card py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground lg:text-4xl">Curated AI Stacks</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  Pre-built tool combinations for every workflow. Clone and customize.
                </p>
              </div>
              <Button size="lg" asChild>
                <Link href="/stack-builder">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Stack
                </Link>
              </Button>
            </div>

            {/* Role Filter */}
            <div className="mt-8">
              <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole | 'all')}>
                <TabsList>
                  {roleFilters.map(role => (
                    <TabsTrigger key={role.id} value={role.id}>
                      {role.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Top Stacks Leaderboard */}
        <section className="border-b border-border bg-gradient-to-b from-background to-secondary/20 py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                <Trophy className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Top Stacks This Month</h2>
                <p className="text-muted-foreground">Most cloned stacks by the community</p>
              </div>
            </div>

            <div className="space-y-3">
              {topStacks.map((stack, index) => (
                <StackLeaderboardRow
                  key={stack.id}
                  stack={stack}
                  rank={index + 1}
                  onClone={handleClone}
                />
              ))}
            </div>
          </div>
        </section>

        {/* All Stacks */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                {selectedRole === 'all' ? 'All Stacks' : `${roleFilters.find(r => r.id === selectedRole)?.label} Stacks`}
              </h2>
              <p className="text-muted-foreground">
                {filteredStacks.length} {filteredStacks.length === 1 ? 'stack' : 'stacks'}
              </p>
            </div>

            {filteredStacks.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStacks.map(stack => (
                  <StackCard
                    key={stack.id}
                    stack={stack}
                    onClone={handleClone}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">No stacks found</h3>
                <p className="mt-2 text-muted-foreground">
                  Be the first to create a stack for this role!
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/stack-builder">
                    Create Stack
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Load More */}
            {filteredStacks.length > 0 && (
              <div className="mt-12 flex justify-center">
                <Button variant="outline" size="lg">
                  Load More Stacks
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="container mx-auto px-4 text-center lg:px-8">
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
              Can&apos;t find what you need?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Build your own custom stack with our interactive builder.
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link href="/stack-builder">
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

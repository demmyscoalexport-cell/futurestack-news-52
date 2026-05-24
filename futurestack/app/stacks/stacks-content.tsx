"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/discovery/page-hero";
import { SectionHeader } from "@/components/discovery/section-header";
import { Button } from "@/components/ui/button";
import { StackCard, StackLeaderboardRow } from "@/components/cards/stack-card";
import type { UserRole, Stack } from "@/lib/types";
import { Plus, ArrowRight } from "lucide-react";

const roleFilters: { id: UserRole | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "freelancer", label: "Freelancer" },
  { id: "agency", label: "Agency" },
  { id: "saas-founder", label: "SaaS Founder" },
];

interface StacksContentProps {
  initialStacks: Stack[];
}

export function StacksContent({ initialStacks }: StacksContentProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");

  const filteredStacks =
    selectedRole === "all"
      ? initialStacks
      : initialStacks.filter((s) => s.targetRole === selectedRole);

  const topStacks = [...initialStacks]
    .sort((a, b) => b.cloneCount - a.cloneCount)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <PageHero
          compact
          title={
            <>
              Curated AI <span className="gradient-text">Stacks</span>
            </>
          }
          subtitle="Pre-built tool combinations for every workflow. Clone, customize, and share with your team."
        >
          <Button size="lg" className="bg-brand-primary hover:bg-brand-primary/90" asChild>
            <Link href="/stack-builder">
              <Plus className="mr-2 h-4 w-4" />
              Create Stack
            </Link>
          </Button>
        </PageHero>

        {/* Role filters — mobile scroll */}
        <div className="border-b border-neutral-stroke/40 bg-neutral-surface/50 sticky top-14 z-20">
          <div className="container mx-auto px-4 sm:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {roleFilters.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`shrink-0 rounded-pill px-4 py-1.5 text-xs font-medium transition-colors ${
                    selectedRole === r.id
                      ? "bg-brand-primary text-neutral-white"
                      : "bg-white/[0.05] text-muted-foreground border border-neutral-stroke/50 hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {topStacks.length > 0 && (
          <section className="border-b border-neutral-stroke/30 py-10 sm:py-14">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeader
                title="Top Stacks This Month"
                subtitle="Most cloned stacks by the community"
                badge="Leaderboard"
              />
              <div className="space-y-3">
                {topStacks.map((stack, i) => (
                  <StackLeaderboardRow key={stack.id} stack={stack} rank={i + 1} onClone={() => {}} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Stacks */}
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title={
                selectedRole === "all"
                  ? "All Stacks"
                  : `${roleFilters.find((r) => r.id === selectedRole)?.label} Stacks`
              }
              subtitle={`${filteredStacks.length} ${filteredStacks.length === 1 ? "stack" : "stacks"} available`}
            />

            {filteredStacks.length > 0 ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStacks.map((stack) => (
                  <StackCard key={stack.id} stack={stack} onClone={() => {}} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No stacks found</h3>
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

            {filteredStacks.length > 0 && (
              <div className="mt-12 flex justify-center">
                <Button variant="outline" size="lg">
                  Load More Stacks
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-neutral-stroke/30 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 text-center lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold lg:text-3xl text-foreground">
              Can&apos;t find what you need?
            </h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              Build your own custom stack with our interactive builder.
            </p>
            <Button size="lg" className="mt-6 bg-brand-primary hover:bg-brand-primary/90" asChild>
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
  );
}

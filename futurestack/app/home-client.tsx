"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { RoleSelector } from "@/components/ui/role-selector";
import { NewsletterForm } from "@/components/ui/newsletter-form";
import { ArticleCard } from "@/components/cards/article-card";
import { ToolLeaderboardRow } from "@/components/cards/tool-card";
import { StackCard } from "@/components/cards/stack-card";
import type { UserRole, Tool, Article, Stack } from "@/lib/types";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Zap,
  PenTool,
  Palette,
  Code,
  Video,
  Mic,
  Database,
  Layout,
  BarChart3,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  writing: PenTool,
  design: Palette,
  code: Code,
  video: Video,
  audio: Mic,
  data: Database,
  automation: Zap,
  productivity: Layout,
  marketing: BarChart3,
  analytics: BarChart3,
};

const roleHeadlines: Record<
  UserRole,
  { headline: string; subheadline: string; cta: string }
> = {
  freelancer: {
    headline: "AI Tools That Help Freelancers Win More Clients",
    subheadline:
      "Discover tools that boost your productivity and help you deliver better work, faster.",
    cta: "Explore Freelancer Tools",
  },
  agency: {
    headline: "Scale Your Agency with AI-Powered Workflows",
    subheadline:
      "Build efficient operations and deliver exceptional results for your clients.",
    cta: "Explore Agency Tools",
  },
  "saas-founder": {
    headline: "Ship Faster with the Right AI Stack",
    subheadline:
      "Tools and strategies to build, launch, and grow your SaaS product.",
    cta: "Explore Founder Tools",
  },
};

interface HomeClientProps {
  featuredArticles: Article[];
  topTools: Tool[];
  featuredStacks: Stack[];
  toolCategories: { id: string; name: string; count?: number }[];
}

export function HomeClient({
  featuredArticles,
  topTools,
  featuredStacks,
  toolCategories,
}: HomeClientProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>();

  const currentHeadline = selectedRole
    ? roleHeadlines[selectedRole]
    : {
        headline: "Build Your AI-Powered Stack",
        subheadline:
          "Discover, compare, and combine the best AI tools for freelancers, agencies, and SaaS founders.",
        cta: "Explore Tools",
      };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-background via-background to-secondary/30">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 h-[600px] w-[600px] rounded-full bg-accent/5 blur-3xl" />
          </div>
          <div className="container relative mx-auto px-4 py-16 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Your AI-Powered Edge in SaaS &amp; Automation</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                {currentHeadline.headline}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground lg:text-xl text-balance">
                {currentHeadline.subheadline}
              </p>
              <div className="mt-10">
                <p className="mb-4 text-sm font-medium text-muted-foreground">
                  Who are you?
                </p>
                <RoleSelector
                  value={selectedRole}
                  onChange={setSelectedRole}
                  className="mx-auto max-w-2xl"
                />
              </div>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/tools">
                    {currentHeadline.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/stack-builder">Build Your Stack</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Latest News */}
        {featuredArticles.length > 0 && (
          <section className="py-16 lg:py-20">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
                    Latest News
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Stay ahead with AI tools and SaaS insights
                  </p>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/news">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredArticles.map((article, i) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant={i === 0 ? "featured" : "default"}
                    className={
                      i === 0 ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : ""
                    }
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Top Tools */}
        {topTools.length > 0 && (
          <section className="border-y border-border bg-card py-16 lg:py-20">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
                      Top-Rated AI Tools This Week
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      Based on user reviews and engagement
                    </p>
                  </div>
                </div>
                <Button variant="outline" asChild className="hidden sm:flex">
                  <Link href="/tools">
                    Full Rankings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 space-y-3">
                {topTools.map((tool, i) => (
                  <ToolLeaderboardRow
                    key={tool.id}
                    tool={tool}
                    rank={i + 1}
                    onAddToStack={() => {}}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <NewsletterForm variant="hero" />
            </div>
          </div>
        </section>

        {/* Featured Stacks */}
        {featuredStacks.length > 0 && (
          <section className="border-t border-border bg-secondary/30 py-16 lg:py-20">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
                      Popular Stacks
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      Pre-built tool combinations to get started fast
                    </p>
                  </div>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/stacks">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredStacks.map((stack) => (
                  <StackCard key={stack.id} stack={stack} variant="featured" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories */}
        {toolCategories.length > 0 && (
          <section className="py-16 lg:py-20">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
                  Browse by Category
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Find the perfect AI tools for your workflow
                </p>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
                {toolCategories.map((cat) => {
                  const Icon = categoryIcons[cat.id] || Layout;
                  return (
                    <Link
                      key={cat.id}
                      href={`/tools?category=${cat.id}`}
                      className="group flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/50 hover:bg-secondary/50 hover:shadow-md"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary/10">
                        <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>
                      <span className="mt-3 text-sm font-medium text-foreground">
                        {cat.name}
                      </span>
                      {cat.count != null && (
                        <span className="mt-1 text-xs text-muted-foreground">
                          {cat.count} tools
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="border-t border-border bg-linear-to-b from-background to-primary/5 py-16 lg:py-24">
          <div className="container mx-auto px-4 text-center lg:px-8">
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl text-balance">
              Ready to Build Your Perfect AI Stack?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-balance">
              Join thousands of freelancers, agencies, and founders who use
              FutureStack News to discover and organize their tools.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/stack-builder">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/tools">Explore Tools</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

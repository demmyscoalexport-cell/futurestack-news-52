import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  ArrowRight, Zap, Video, ShoppingBag, Code2,
  MessageCircle, BookOpen, Briefcase, TrendingUp, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Workflows — How Tools Work Together | DISCOVA",
  description:
    "Step-by-step workflow guides for creators, founders, and businesses in Africa. Learn how to combine tools for maximum impact.",
};

const WORKFLOWS = [
  {
    id: "youtube-ai",
    icon: Video,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    title: "How To Start YouTube With AI",
    description: "Go from zero to consistent YouTube creator using AI tools — script, edit, and grow without a big team.",
    tools: ["ChatGPT", "Canva", "CapCut", "TubeBuddy"],
    steps: 8,
    cost: "Free – $15/mo",
    difficulty: "Beginner",
    category: "Creator",
    naijaSuitable: true,
  },
  {
    id: "whatsapp-commerce",
    icon: MessageCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    title: "How To Run WhatsApp Commerce",
    description: "Build a full WhatsApp business system — catalog, orders, payments, and customer management.",
    tools: ["WhatsApp Business", "Paystack", "Notion", "Tidio"],
    steps: 6,
    cost: "Free – $10/mo",
    difficulty: "Beginner",
    category: "Business",
    naijaSuitable: true,
  },
  {
    id: "shopify-brand",
    icon: ShoppingBag,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    title: "How To Launch A Shopify Brand",
    description: "Launch an ecommerce brand from scratch — product research, store setup, AI marketing, and growth.",
    tools: ["Shopify", "Canva", "ChatGPT", "Klaviyo"],
    steps: 10,
    cost: "$29 – $79/mo",
    difficulty: "Intermediate",
    category: "Ecommerce",
    naijaSuitable: false,
  },
  {
    id: "saas-with-ai",
    icon: Code2,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "How To Build SaaS With AI",
    description: "Go from idea to launched SaaS product using AI coding tools, no-code platforms, and automation.",
    tools: ["Cursor", "Vercel", "Supabase", "Stripe"],
    steps: 12,
    cost: "$0 – $50/mo",
    difficulty: "Advanced",
    category: "Developer",
    naijaSuitable: true,
  },
  {
    id: "freelance-agency",
    icon: Briefcase,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    title: "How To Start Freelancing",
    description: "Go from zero to first client using AI tools for portfolio building, pitching, and project management.",
    tools: ["ChatGPT", "Canva", "Notion", "Calendly"],
    steps: 7,
    cost: "Free – $20/mo",
    difficulty: "Beginner",
    category: "Freelancer",
    naijaSuitable: true,
  },
  {
    id: "online-courses",
    icon: BookOpen,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    title: "How To Launch Online Courses",
    description: "Create, launch, and sell an online course — from content creation to marketing and payment collection.",
    tools: ["Teachable", "Loom", "ChatGPT", "Paystack"],
    steps: 9,
    cost: "$0 – $39/mo",
    difficulty: "Intermediate",
    category: "Educator",
    naijaSuitable: true,
  },
  {
    id: "tiktok-growth",
    icon: TrendingUp,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    title: "How To Create Viral TikTok Videos",
    description: "Build a TikTok content machine — AI scripts, editing, captions, and posting schedule optimization.",
    tools: ["CapCut", "ChatGPT", "Canva", "Later"],
    steps: 6,
    cost: "Free",
    difficulty: "Beginner",
    category: "Creator",
    naijaSuitable: true,
  },
  {
    id: "agency-automation",
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    title: "How Agencies Automate Work",
    description: "Automate your agency's workflows — client onboarding, reporting, content delivery, and billing.",
    tools: ["Make", "Notion", "Slack", "Stripe"],
    steps: 8,
    cost: "$10 – $50/mo",
    difficulty: "Intermediate",
    category: "Agency",
    naijaSuitable: true,
  },
];

const CATEGORIES = ["All", "Creator", "Business", "Developer", "Freelancer", "Ecommerce", "Educator", "Agency"];

const difficultyColor: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Advanced: "bg-rose-500/15 text-rose-300 border-rose-500/20",
};

export default function WorkflowsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/4 h-[300px] w-[300px] rounded-full bg-amber-600/8 blur-[80px]" />
          </div>
          <div className="container relative mx-auto px-4 lg:px-6 py-12 lg:py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/8 px-3.5 py-1.5 text-xs text-amber-300 mb-5">
                <Zap className="h-3 w-3" />
                Workflow Ecosystem
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-5xl mb-4">
                How tools work<br />
                <span className="gradient-text">together</span>
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-xl mb-6">
                Step-by-step workflow guides built for African realities. Each workflow includes pricing breakdowns, African compatibility ratings, and mobile-first setup guides.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  All workflows Africa-rated
                </div>
                <div className="text-xs text-muted-foreground">{WORKFLOWS.length} workflows available</div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="container mx-auto px-4 lg:px-6 py-10">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  cat === "All"
                    ? "bg-primary text-white"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Workflow grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORKFLOWS.map((wf) => {
              const Icon = wf.icon;
              return (
                <div
                  key={wf.id}
                  className={`rounded-xl border ${wf.border} bg-card p-5 hover:border-primary/40 transition-all group cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${wf.bg}`}>
                      <Icon className={`h-5 w-5 ${wf.color}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      {wf.naijaSuitable && (
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded px-1.5 py-0.5">
                          🌍 Africa Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {wf.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{wf.description}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${difficultyColor[wf.difficulty]}`}>
                      {wf.difficulty}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                      {wf.steps} steps
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                      {wf.cost}
                    </span>
                  </div>

                  {/* Tools */}
                  <div className="flex items-center gap-1 flex-wrap mb-4">
                    {wf.tools.map((tool) => (
                      <span key={tool} className="text-[10px] bg-secondary/40 text-muted-foreground px-1.5 py-0.5 rounded border border-border/30">
                        {tool}
                      </span>
                    ))}
                  </div>

                  <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                    View Workflow <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Have a workflow to share?</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Help the DISCOVA community by sharing your proven workflows and tool combinations.
            </p>
            <Button asChild>
              <Link href="/submit-tool">Submit a Workflow <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

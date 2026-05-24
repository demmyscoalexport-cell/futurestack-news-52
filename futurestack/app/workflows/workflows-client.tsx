"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Zap, Video, ShoppingBag, Code2,
  MessageCircle, BookOpen, Briefcase, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/discovery/page-hero";
import { WorkflowCard, type WorkflowItem } from "@/components/discovery/workflow-card";

const WORKFLOWS: WorkflowItem[] = [
  {
    id: "youtube-ai",
    icon: Video,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    title: "How To Start YouTube With AI",
    description: "Go from zero to consistent YouTube creator using AI tools — script, edit, and grow without a big team.",
    tools: ["ChatGPT", "Canva", "CapCut", "TubeBuddy"],
    steps: ["Research your niche with ChatGPT prompts", "Write scripts using AI templates", "Record with your phone", "Edit with CapCut auto-captions", "Design thumbnails in Canva", "Optimise titles & tags with TubeBuddy", "Schedule & batch 4 videos at once", "Analyse first 30 days, double down on what works"],
    cost: "Free – $15/mo",
    difficulty: "Beginner",
    category: "Creator",
    naijaSuitable: true,
    learnHref: "/learn",
    discoverHref: "/discover?section=trending",
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
    steps: ["Set up WhatsApp Business profile with catalog", "Create product listings with photos & prices", "Set up Paystack payment links", "Use Notion to track orders & customers", "Add Tidio chatbot for 24/7 FAQs", "Create broadcast lists for promotions"],
    cost: "Free – $10/mo",
    difficulty: "Beginner",
    category: "Business",
    naijaSuitable: true,
    learnHref: "/learn",
    discoverHref: "/discover?section=africa",
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
    steps: ["Research profitable niches with ChatGPT", "Source products via AliExpress or local suppliers", "Set up Shopify store with free theme", "Design brand assets in Canva", "Write product descriptions with AI", "Launch email flows with Klaviyo", "Run Meta ads — start with $5/day", "Analyse & scale winning products"],
    cost: "$29 – $79/mo",
    difficulty: "Intermediate",
    category: "Ecommerce",
    naijaSuitable: false,
    learnHref: "/learn",
    discoverHref: "/discover",
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
    steps: ["Validate idea with 10 customer interviews", "Sketch wireframes in v0.dev or Figma", "Code MVP with Cursor AI", "Set up Supabase for auth + database", "Deploy on Vercel", "Integrate Stripe for payments", "Launch on Product Hunt", "Iterate on feedback weekly"],
    cost: "$0 – $50/mo",
    difficulty: "Advanced",
    category: "Developer",
    naijaSuitable: true,
    learnHref: "/learn",
    discoverHref: "/discover?section=trending",
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
    steps: ["Pick one skill to monetise first", "Build 3 portfolio samples", "Create a one-page website with Carrd", "Write proposals using ChatGPT templates", "Apply to 5 jobs per day on Upwork/Fiverr", "Set up Calendly for booking calls"],
    cost: "Free – $20/mo",
    difficulty: "Beginner",
    category: "Freelancer",
    naijaSuitable: true,
    learnHref: "/learn",
    discoverHref: "/discover?section=africa",
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
    steps: ["Outline your course with ChatGPT", "Record lessons with Loom", "Upload to Teachable or Selar", "Set pricing & create a sales page", "Add Paystack for African payments", "Build an email list pre-launch", "Launch with a 5-day promotion"],
    cost: "$0 – $39/mo",
    difficulty: "Intermediate",
    category: "Educator",
    naijaSuitable: true,
    learnHref: "/learn",
    discoverHref: "/discover",
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
    steps: ["Research trends with TikTok search", "Write hook + script using ChatGPT", "Film in 1 take", "Edit with CapCut auto-captions", "Add trending audio", "Schedule batch with Later"],
    cost: "Free",
    difficulty: "Beginner",
    category: "Creator",
    naijaSuitable: true,
    learnHref: "/learn",
    discoverHref: "/discover",
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
    steps: ["Map every repetitive task in your agency", "Set up Notion as central client hub", "Build onboarding automation in Make", "Auto-generate reports with Make + Google Sheets", "Send Slack alerts for key events", "Automate invoicing via Stripe"],
    cost: "$10 – $50/mo",
    difficulty: "Intermediate",
    category: "Agency",
    naijaSuitable: true,
    learnHref: "/learn",
    discoverHref: "/discover",
  },
];

const CATEGORIES = ["All", "Creator", "Business", "Developer", "Freelancer", "Ecommerce", "Educator", "Agency"];

export function WorkflowsClient() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = activeCategory === "All"
    ? WORKFLOWS
    : WORKFLOWS.filter((wf) => wf.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <PageHero
          compact
          title={
            <>
              How tools work <span className="gradient-text">together</span>
            </>
          }
          subtitle="Step-by-step workflow guides built for African realities — pricing breakdowns, compatibility ratings, and mobile-first setup."
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 rounded-pill bg-brand-gold/10 border border-brand-gold/30 px-3 py-1 text-xs text-brand-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold animate-pulse" />
              All workflows Africa-rated
            </div>
            <div className="text-xs text-muted-foreground">{WORKFLOWS.length} workflows available</div>
          </div>
        </PageHero>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6 sm:mb-8 sticky top-14 z-10 bg-background/80 backdrop-blur-xl py-2 -mx-1 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-pill px-4 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-brand-primary text-neutral-white"
                    : "bg-white/[0.05] text-muted-foreground border border-neutral-stroke/50 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((wf) => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                expanded={expandedId === wf.id}
                onToggle={() => setExpandedId(expandedId === wf.id ? null : wf.id)}
              />
            ))}
          </div>

          <div className="mt-10 sm:mt-12 rounded-discova-lg bg-brand-primary/5 border border-brand-primary/20 p-6 sm:p-8 text-center">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Have a workflow to share?</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Help the DISCOVA community by sharing your proven workflows and tool combinations.
            </p>
            <Button className="bg-brand-primary hover:bg-brand-primary/90" asChild>
              <Link href="/submit-tool">Submit a Workflow <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

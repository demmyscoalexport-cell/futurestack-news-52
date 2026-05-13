import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  BookOpen, Play, Clock, Users, Star, ArrowRight,
  GraduationCap, Zap, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Learn — Digital Skills for Africa | DISCOVA",
  description:
    "Free tutorials, guides, and courses on AI tools, no-code, digital marketing, and modern workflows — built for African learners.",
};

const FEATURED_GUIDES = [
  {
    id: 1,
    title: "Complete Guide to AI Tools for African Creators",
    desc: "Everything a Nigerian, Ghanaian, or Kenyan creator needs to know about using AI tools effectively in 2026.",
    readTime: "15 min read",
    level: "Beginner",
    category: "AI Tools",
    emoji: "🤖",
    featured: true,
  },
  {
    id: 2,
    title: "How to Build a WhatsApp Business System From Scratch",
    desc: "Step-by-step guide to setting up a complete WhatsApp commerce system — catalog, orders, payments, and customer follow-up.",
    readTime: "12 min read",
    level: "Beginner",
    category: "Business",
    emoji: "💬",
    featured: true,
  },
  {
    id: 3,
    title: "No-Code SaaS in 2026: Build Your First Product",
    desc: "How African founders are launching software businesses without writing a single line of code.",
    readTime: "20 min read",
    level: "Intermediate",
    category: "No-Code",
    emoji: "🚀",
    featured: false,
  },
  {
    id: 4,
    title: "Freelancing with AI: Double Your Income in 90 Days",
    desc: "How to use AI tools to dramatically increase your freelancing output and attract international clients.",
    readTime: "18 min read",
    level: "Intermediate",
    category: "Freelancing",
    emoji: "💼",
    featured: false,
  },
  {
    id: 5,
    title: "Best Free Design Tools for African SMBs",
    desc: "Design professional materials without paying for Adobe. A complete guide to free and freemium design tools.",
    readTime: "10 min read",
    level: "Beginner",
    category: "Design",
    emoji: "🎨",
    featured: false,
  },
  {
    id: 6,
    title: "Understanding Paystack + Flutterwave: A Developer's Guide",
    desc: "Integrate African payment gateways into your web and mobile applications with step-by-step code examples.",
    readTime: "25 min read",
    level: "Advanced",
    category: "Developer",
    emoji: "💳",
    featured: false,
  },
];

const CATEGORIES = [
  { name: "AI Tools", count: 24, icon: "🤖" },
  { name: "No-Code", count: 18, icon: "⚡" },
  { name: "Design", count: 15, icon: "🎨" },
  { name: "Business", count: 22, icon: "💼" },
  { name: "Developer", count: 30, icon: "💻" },
  { name: "Freelancing", count: 12, icon: "🌐" },
  { name: "Social Media", count: 19, icon: "📱" },
  { name: "Finance", count: 11, icon: "💰" },
];

const difficultyColor: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Advanced: "bg-rose-500/15 text-rose-300 border-rose-500/20",
};

export default function LearnPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-1/3 h-[300px] w-[300px] rounded-full bg-cyan-600/8 blur-[80px]" />
          </div>
          <div className="container relative mx-auto px-4 lg:px-6 py-12 lg:py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/8 px-3.5 py-1.5 text-xs text-cyan-300 mb-5">
                <GraduationCap className="h-3 w-3" />
                Free Learning Resources
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-5xl mb-4">
                Learn digital skills<br />
                <span className="gradient-text">built for Africa</span>
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-xl mb-6">
                Free tutorials, guides, and workflows on AI tools, no-code development, digital business, and modern workflows — all optimized for African learners.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />150+ guides</span>
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />12,000+ learners</span>
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Always free</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-6 py-10">
          <div className="grid lg:grid-cols-4 gap-8">

            {/* Main */}
            <div className="lg:col-span-3 space-y-8">

              {/* Featured */}
              <div>
                <h2 className="font-bold text-foreground mb-4">⭐ Featured Guides</h2>
                <div className="space-y-3">
                  {FEATURED_GUIDES.filter(g => g.featured).map((guide) => (
                    <div
                      key={guide.id}
                      className="rounded-xl border border-primary/20 bg-primary/5 p-5 hover:border-primary/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">{guide.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 rounded px-1.5 py-0.5">{guide.category}</span>
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] ${difficultyColor[guide.level]}`}>{guide.level}</span>
                          </div>
                          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1.5">{guide.title}</h3>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{guide.desc}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{guide.readTime}</span>
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />Featured</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All guides */}
              <div>
                <h2 className="font-bold text-foreground mb-4">All Guides</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {FEATURED_GUIDES.map((guide) => (
                    <div
                      key={guide.id}
                      className="rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{guide.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className="text-[10px] bg-secondary/60 text-muted-foreground px-1.5 py-0.5 rounded">{guide.category}</span>
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] ${difficultyColor[guide.level]}`}>{guide.level}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">{guide.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />{guide.readTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <h3 className="font-bold text-sm text-foreground mb-2">📧 Learning Newsletter</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Get 1 actionable tutorial and 1 tool deep-dive every week, free.
                </p>
                <Button className="w-full" size="sm" asChild>
                  <Link href="/signup">Subscribe Free</Link>
                </Button>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Browse Topics</h3>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button key={cat.name} className="w-full flex items-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <span>{cat.icon}</span>
                      <span className="flex-1 text-left">{cat.name}</span>
                      <span className="bg-secondary/60 px-1.5 py-0.5 rounded text-[10px]">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

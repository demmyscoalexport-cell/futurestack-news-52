import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  Users, MessageCircle, Star, TrendingUp, Trophy,
  ArrowRight, Globe, Heart, Zap, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Community — Africa's Digital Builder Network | DISCOVA",
  description:
    "Join 15,000+ African creators, founders, and builders. Share reviews, discover stacks, and grow together on DISCOVA.",
};

const DISCUSSIONS = [
  {
    id: 1,
    title: "What's the best AI tool that works on slow internet in Nigeria?",
    author: "Chidi Okonkwo",
    location: "Lagos, Nigeria",
    replies: 47,
    upvotes: 203,
    tags: ["3G", "Nigeria", "AI Tools"],
    timeAgo: "2h ago",
    hot: true,
  },
  {
    id: 2,
    title: "Built my entire agency stack for under $50/month — here's how",
    author: "Amara Mensah",
    location: "Accra, Ghana",
    replies: 31,
    upvotes: 178,
    tags: ["Agency", "Budget", "Stack"],
    timeAgo: "5h ago",
    hot: true,
  },
  {
    id: 3,
    title: "Is Paystack still the best option for African SaaS founders?",
    author: "Fatima Al-Rashid",
    location: "Nairobi, Kenya",
    replies: 89,
    upvotes: 312,
    tags: ["Payments", "Paystack", "SaaS"],
    timeAgo: "1d ago",
    hot: false,
  },
  {
    id: 4,
    title: "WhatsApp Commerce vs Shopify for Nigerian small businesses",
    author: "Tunde Adeleke",
    location: "Abuja, Nigeria",
    replies: 55,
    upvotes: 145,
    tags: ["Ecommerce", "WhatsApp", "Nigeria"],
    timeAgo: "1d ago",
    hot: false,
  },
  {
    id: 5,
    title: "ChatGPT is too expensive — what are the best alternatives for students?",
    author: "Precious Osei",
    location: "Kumasi, Ghana",
    replies: 72,
    upvotes: 289,
    tags: ["Students", "AI", "Budget"],
    timeAgo: "2d ago",
    hot: false,
  },
  {
    id: 6,
    title: "How I scaled my YouTube channel to 50K using only free AI tools",
    author: "Zainab Hassan",
    location: "Kano, Nigeria",
    replies: 38,
    upvotes: 221,
    tags: ["YouTube", "Creator", "Free Tools"],
    timeAgo: "3d ago",
    hot: false,
  },
];

const CONTRIBUTORS = [
  { name: "Chidi Okonkwo", location: "Lagos", badge: "Top Reviewer", reviews: 47, avatar: "CO" },
  { name: "Amara Mensah", location: "Accra", badge: "Stack Builder", reviews: 31, avatar: "AM" },
  { name: "Fatima Al-Rashid", location: "Nairobi", badge: "Expert", reviews: 89, avatar: "FA" },
  { name: "Tunde Adeleke", location: "Abuja", badge: "Community Lead", reviews: 55, avatar: "TA" },
];

const COMMUNITIES = [
  { name: "Nigerian Tech Builders", members: "4.2K", icon: "🇳🇬" },
  { name: "Kenyan Founders", members: "2.8K", icon: "🇰🇪" },
  { name: "Ghana Creators", members: "1.9K", icon: "🇬🇭" },
  { name: "African AI Enthusiasts", members: "6.1K", icon: "🤖" },
  { name: "WhatsApp Commerce Guild", members: "3.4K", icon: "💬" },
  { name: "African Freelancers", members: "5.7K", icon: "💼" },
  { name: "Student Tech Africa", members: "8.2K", icon: "🎓" },
  { name: "Africa SaaS Founders", members: "2.1K", icon: "🚀" },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/3 h-[300px] w-[300px] rounded-full bg-violet-600/8 blur-[80px]" />
          </div>
          <div className="container relative mx-auto px-4 lg:px-6 py-12 lg:py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-3.5 py-1.5 text-xs text-violet-300 mb-5">
                <Users className="h-3 w-3" />
                15,000+ African builders
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-5xl mb-4">
                Africa&apos;s digital<br />
                <span className="gradient-text">builder network</span>
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-xl mb-6">
                Share reviews, discover stacks, ask questions, and grow alongside the most ambitious builders across Africa and emerging markets.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Button asChild>
                  <Link href="/signup">Join the Community Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span>30+ countries active</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-6 py-10">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Main: Discussions */}
            <div className="lg:col-span-2 space-y-10">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Users, label: "Members", value: "15,000+" },
                  { icon: MessageCircle, label: "Discussions", value: "8,400+" },
                  { icon: Star, label: "Tool Reviews", value: "32,000+" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-4 text-center">
                    <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-xl font-black text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Discussions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-foreground">🔥 Hot Discussions</h2>
                  <Button variant="outline" size="sm" className="h-8 text-xs">Start Discussion</Button>
                </div>
                <div className="space-y-3">
                  {DISCUSSIONS.map((d) => (
                    <div key={d.id} className="rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {d.hot && (
                            <span className="text-xs bg-rose-500/15 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded">🔥 Hot</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                            {d.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="font-medium text-foreground/70">{d.author}</span>
                            <span>·</span>
                            <span>{d.location}</span>
                            <span>·</span>
                            <span>{d.timeAgo}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Heart className="h-3 w-3" />{d.upvotes}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageCircle className="h-3 w-3" />{d.replies} replies
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {d.tags.map((t) => (
                                <span key={t} className="text-[10px] bg-secondary/60 text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Contributors */}
              <div>
                <h2 className="font-bold text-foreground mb-4">🏆 Top Contributors</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {CONTRIBUTORS.map((c) => (
                    <div key={c.name} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3.5">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {c.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.location}</p>
                      </div>
                      <div className="ml-auto shrink-0">
                        <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 rounded px-1.5 py-0.5">{c.badge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Join CTA */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-2">Join the community</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Share reviews, get tool recommendations, and connect with builders across Africa.
                </p>
                <Button className="w-full" size="sm" asChild>
                  <Link href="/signup">Join Free</Link>
                </Button>
              </div>

              {/* Local communities */}
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">🌍 Local Communities</h3>
                <div className="space-y-2">
                  {COMMUNITIES.map((c) => (
                    <div key={c.name} className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-secondary/40 cursor-pointer transition-colors">
                      <span className="text-base">{c.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.members} members</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
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

import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  Globe, Wifi, Smartphone, DollarSign, Zap,
  ArrowRight, TrendingUp, Users, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTools } from "@/lib/queries/tools";
import { resolveToolLogo } from "@/lib/logo-resolver";

export const metadata: Metadata = {
  title: "Africa Hub — Tools Built for African Realities | DISCOVA",
  description:
    "Discover digital tools rated for African users — works on 3G, Android-optimized, Naira-friendly, and Paystack-compatible.",
};

const AFRICA_FILTERS = [
  { icon: Wifi,        label: "Works on 3G",       count: "80+ tools",  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   section: "works-3g"    },
  { icon: Smartphone,  label: "Android Optimized",  count: "95+ tools",  color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20", section: "android"     },
  { icon: DollarSign,  label: "Naira Friendly",     count: "70+ tools",  color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20",  section: "naira"       },
  { icon: Zap,         label: "Free Plan Available",count: "120+ tools", color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  section: "free-tools"  },
  { icon: Globe,       label: "No VPN Required",    count: "110+ tools", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", section: "trending-nigeria" },
  { icon: Star,        label: "Paystack Compatible",count: "45+ tools",  color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/20",   section: "naira"       },
];

const COUNTRIES = [
  { flag: "🇳🇬", name: "Nigeria",      city: "Lagos",          users: "4.2K", trend: "↑ 32%", section: "trending-nigeria" },
  { flag: "🇰🇪", name: "Kenya",        city: "Nairobi",        users: "2.8K", trend: "↑ 28%", section: "trending-kenya"   },
  { flag: "🇬🇭", name: "Ghana",        city: "Accra",          users: "1.9K", trend: "↑ 41%", section: "trending-ghana"   },
  { flag: "🇿🇦", name: "South Africa", city: "Cape Town",      users: "3.1K", trend: "↑ 19%", section: "trending-sa"      },
  { flag: "🇪🇬", name: "Egypt",        city: "Cairo",          users: "1.4K", trend: "↑ 24%", section: "trending-nigeria" },
  { flag: "🇹🇿", name: "Tanzania",     city: "Dar es Salaam",  users: "890",  trend: "↑ 35%", section: "trending-kenya"   },
  { flag: "🇷🇼", name: "Rwanda",       city: "Kigali",         users: "720",  trend: "↑ 52%", section: "trending-kenya"   },
  { flag: "🇺🇬", name: "Uganda",       city: "Kampala",        users: "650",  trend: "↑ 38%", section: "trending-kenya"   },
];

const AFRICA_STACKS = [
  {
    title: "Nigerian Creator Stack",
    tools: ["CapCut", "Canva", "ChatGPT", "TubeBuddy"],
    cost: "Free – $10/mo",
    badge: "🇳🇬 Nigeria",
  },
  {
    title: "WhatsApp Vendor Stack",
    tools: ["WhatsApp Business", "Paystack", "Notion", "Google Sheets"],
    cost: "Free",
    badge: "🌍 Pan-Africa",
  },
  {
    title: "Lagos Startup Stack",
    tools: ["Supabase", "Vercel", "Paystack", "Slack"],
    cost: "$0 – $25/mo",
    badge: "🚀 Startup",
  },
  {
    title: "African Student Toolkit",
    tools: ["Notion", "ChatGPT", "Grammarly", "Canva"],
    cost: "Free",
    badge: "🎓 Students",
  },
];

const PAYMENTS = [
  { name: "Paystack",      desc: "Most popular for Nigerian & Ghanaian businesses", tools: "45+ tools", logo: "🟢" },
  { name: "Flutterwave",   desc: "Pan-African payments, 30+ currencies",            tools: "38+ tools", logo: "🔵" },
  { name: "OPay",          desc: "Mobile money for Nigeria",                         tools: "12+ tools", logo: "🟠" },
  { name: "MTN MoMo",      desc: "Mobile money across 17 African countries",         tools: "20+ tools", logo: "🟡" },
  { name: "Chipper Cash",  desc: "Cross-border transfers in Africa",                 tools: "8+ tools",  logo: "🟣" },
];

export default async function AfricaPage() {
  const rawTools = await getTools({ limit: 12 });
  const tools = rawTools.map((row: Record<string, unknown>) => ({
    ...row,
    logo: resolveToolLogo(String(row.name ?? ""), row.logo as string | null, row.website as string),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-600/10 blur-[100px]" />
            <div className="absolute top-10 right-1/3 h-[300px] w-[300px] rounded-full bg-green-600/6 blur-[80px]" />
          </div>
          <div className="container relative mx-auto px-4 lg:px-6 py-14 lg:py-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-5xl mb-4">🌍</div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 mb-6 font-semibold">
                Africa Hub
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-5xl mb-4">
                Tools built for<br />
                <span className="gradient-text">African realities</span>
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto mb-6">
                Does it work on MTN? Can Nigerians pay for it? Does it run on Android? Does it need VPN? We answer these questions so you don&apos;t have to.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400 font-medium">
                Africa Discovers. Africa Decides.
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-6 py-10 space-y-12">

          {/* Africa filters — each links to Discover with the right section pre-selected */}
          <section>
            <h2 className="font-bold text-foreground mb-2">Filter by African Reality</h2>
            <p className="text-xs text-muted-foreground mb-5">Click any card to browse matching tools on the Discover page.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {AFRICA_FILTERS.map((f) => {
                const Icon = f.icon;
                return (
                  <Link
                    key={f.label}
                    href={`/discover?section=${f.section}`}
                    className={`rounded-xl border ${f.border} ${f.bg} p-4 text-center hover:opacity-90 hover:scale-[1.02] transition-all group`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/40 mx-auto mb-2">
                      <Icon className={`h-4 w-4 ${f.color}`} />
                    </div>
                    <p className="text-xs font-medium text-foreground">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground">{f.count}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Trending by country — each links to Discover with that country pre-selected */}
          <section>
            <h2 className="font-bold text-foreground mb-2">🔥 Trending by Country</h2>
            <p className="text-xs text-muted-foreground mb-5">Click a country to see the tools trending there.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {COUNTRIES.map((c) => (
                <Link
                  key={c.name}
                  href={`/discover?section=${c.section}`}
                  className="rounded-xl border border-border/50 bg-card p-3 text-center hover:border-primary/40 hover:scale-[1.02] transition-all"
                >
                  <span className="text-2xl">{c.flag}</span>
                  <p className="text-xs font-medium text-foreground mt-1">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.users} users</p>
                  <p className="text-[10px] text-emerald-400">{c.trend}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Africa stacks */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">🧱 Africa Power Stacks™</h2>
              <Link href="/stacks" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {AFRICA_STACKS.map((stack) => (
                <Link key={stack.title} href="/stacks" className="rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 transition-all block">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded">{stack.badge}</span>
                    <span className="text-[10px] text-muted-foreground">{stack.cost}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-3">{stack.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    {stack.tools.map((t) => (
                      <span key={t} className="text-[10px] bg-secondary/50 text-muted-foreground px-1.5 py-0.5 rounded border border-border/30">{t}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Payment compatibility */}
          <section>
            <h2 className="font-bold text-foreground mb-5">💳 African Payment Compatibility</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PAYMENTS.map((p) => (
                <div key={p.name} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4">
                  <span className="text-xl">{p.logo}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-0.5">{p.name}</p>
                    <p className="text-xs text-muted-foreground mb-1">{p.desc}</p>
                    <p className="text-[10px] text-primary">{p.tools} compatible</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Featured tools */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">⭐ Africa-Approved Tools</h2>
              <Link href="/tools" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tools.slice(0, 8).map((tool) => (
                <Link
                  key={String(tool.id)}
                  href={`/tools/${tool.slug}`}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3.5 hover:border-primary/40 transition-all group"
                >
                  <div className="shrink-0">
                    {tool.logo ? (
                      <img src={tool.logo as string} alt={String(tool.name)} className="h-9 w-9 rounded-lg object-contain bg-secondary/60 p-1" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{String(tool.name)[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{String(tool.name)}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{String(tool.tagline || "AI-powered tool")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

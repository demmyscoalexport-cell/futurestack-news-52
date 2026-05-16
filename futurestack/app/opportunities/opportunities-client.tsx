"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Briefcase, GraduationCap, Zap, Globe,
  ArrowRight, DollarSign, Clock, MapPin, Star, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const OPPORTUNITY_TYPES = [
  { id: "all",          label: "All",          icon: Globe,          count: "530+", color: "text-foreground",  bg: "bg-secondary/60"   },
  { id: "jobs",         label: "Remote Jobs",  icon: Briefcase,      count: "240+", color: "text-blue-400",   bg: "bg-blue-500/10"    },
  { id: "grants",       label: "Grants",       icon: DollarSign,     count: "45+",  color: "text-green-400",  bg: "bg-green-500/10"   },
  { id: "scholarships", label: "Scholarships", icon: GraduationCap,  count: "30+",  color: "text-violet-400", bg: "bg-violet-500/10"  },
  { id: "gigs",         label: "AI Gigs",      icon: Zap,            count: "180+", color: "text-amber-400",  bg: "bg-amber-500/10"   },
  { id: "fellowships",  label: "Fellowships",  icon: Star,           count: "20+",  color: "text-pink-400",   bg: "bg-pink-500/10"    },
  { id: "accelerators", label: "Accelerators", icon: Globe,          count: "15+",  color: "text-orange-400", bg: "bg-orange-500/10"  },
];

const OPPORTUNITIES = [
  {
    id: 1,
    type: "jobs",
    typeLabel: "Remote Job",
    typeColor: "bg-blue-500/15 text-blue-300 border-blue-500/20",
    title: "AI Content Writer — Remote",
    company: "TechStart Africa",
    location: "Remote (Africa)",
    salary: "$800 – $1,500/mo",
    skills: ["ChatGPT", "Content Strategy", "SEO"],
    deadline: "Jun 30, 2026",
    featured: true,
    africa: true,
    url: "https://techstartafrica.com/jobs",
  },
  {
    id: 2,
    type: "grants",
    typeLabel: "Grant",
    typeColor: "bg-green-500/15 text-green-300 border-green-500/20",
    title: "Tony Elumelu Foundation Grant 2026",
    company: "Tony Elumelu Foundation",
    location: "Pan-Africa",
    salary: "$5,000 grant",
    skills: ["Business Plan", "Entrepreneurship", "SME"],
    deadline: "Jul 15, 2026",
    featured: true,
    africa: true,
    url: "https://www.tonyelumelufoundation.org",
  },
  {
    id: 3,
    type: "jobs",
    typeLabel: "Remote Job",
    typeColor: "bg-blue-500/15 text-blue-300 border-blue-500/20",
    title: "No-Code Developer (Bubble/Webflow)",
    company: "Andela",
    location: "Remote (Global)",
    salary: "$1,200 – $2,500/mo",
    skills: ["Bubble", "Webflow", "No-Code"],
    deadline: "Ongoing",
    featured: false,
    africa: true,
    url: "https://andela.com/hiring/",
  },
  {
    id: 4,
    type: "scholarships",
    typeLabel: "Scholarship",
    typeColor: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    title: "ALX Africa AI & Tech Scholarship",
    company: "ALX Africa",
    location: "Pan-Africa",
    salary: "Full scholarship",
    skills: ["AI/ML", "Data Science", "Programming"],
    deadline: "Aug 1, 2026",
    featured: false,
    africa: true,
    url: "https://www.alxafrica.com",
  },
  {
    id: 5,
    type: "gigs",
    typeLabel: "AI Gig",
    typeColor: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    title: "AI Prompt Engineer — Freelance",
    company: "Upwork Africa",
    location: "Remote",
    salary: "$25 – $80/hr",
    skills: ["Prompt Engineering", "ChatGPT", "Claude"],
    deadline: "Ongoing",
    featured: false,
    africa: true,
    url: "https://upwork.com",
  },
  {
    id: 6,
    type: "fellowships",
    typeLabel: "Fellowship",
    typeColor: "bg-pink-500/15 text-pink-300 border-pink-500/20",
    title: "Founder Fellowship — African Startup Ecosystem",
    company: "Ventures Platform",
    location: "Nigeria",
    salary: "$3,000 + mentorship",
    skills: ["Startup", "Tech", "Innovation"],
    deadline: "Sep 1, 2026",
    featured: false,
    africa: true,
    url: "https://venturesplatform.com",
  },
  {
    id: 7,
    type: "jobs",
    typeLabel: "Remote Job",
    typeColor: "bg-blue-500/15 text-blue-300 border-blue-500/20",
    title: "Social Media Manager (Africa Markets)",
    company: "Flutterwave",
    location: "Lagos / Remote",
    salary: "₦350,000 – ₦550,000/mo",
    skills: ["Social Media", "Canva", "Content"],
    deadline: "Jun 25, 2026",
    featured: false,
    africa: true,
    url: "https://flutterwave.com/ng/careers",
  },
  {
    id: 8,
    type: "accelerators",
    typeLabel: "Accelerator",
    typeColor: "bg-orange-500/15 text-orange-300 border-orange-500/20",
    title: "YC Africa Cohort Application",
    company: "Y Combinator",
    location: "Global",
    salary: "$500K investment",
    skills: ["Startup", "Tech", "Growth"],
    deadline: "Rolling",
    featured: true,
    africa: false,
    url: "https://ycombinator.com/apply",
  },
];

export function OpportunitiesClient() {
  const [activeType, setActiveType] = useState("all");

  const filtered = activeType === "all"
    ? OPPORTUNITIES
    : OPPORTUNITIES.filter((o) => o.type === activeType);

  const activeLabel = OPPORTUNITY_TYPES.find((t) => t.id === activeType)?.label ?? "All";
  const sidebarTypes = OPPORTUNITY_TYPES.filter((t) => t.id !== "all");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-1/3 h-[300px] w-[300px] rounded-full bg-green-600/8 blur-[80px]" />
          </div>
          <div className="container relative mx-auto px-4 lg:px-6 py-12 lg:py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/8 px-3.5 py-1.5 text-xs text-green-300 mb-5">
                <Zap className="h-3 w-3" />
                Live Opportunities — Updated Daily
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-5xl mb-4">
                Opportunities built<br />
                <span className="gradient-text">for Africa</span>
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-xl mb-6">
                Remote jobs, startup grants, scholarships, AI gigs, accelerators, and fellowships — all curated for African creators, founders, and builders.
              </p>
              <Button asChild>
                <Link href="/signup">Get Opportunity Alerts Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-6 py-10">

          {/* Type filter cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
            {OPPORTUNITY_TYPES.map((t) => {
              const Icon = t.icon;
              const isActive = activeType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveType(t.id)}
                  className={`rounded-xl border p-4 text-center transition-all group ${
                    isActive
                      ? "border-primary bg-primary/10 scale-[1.02]"
                      : "border-border/50 bg-card hover:border-primary/40"
                  }`}
                >
                  <div className={`h-10 w-10 ${t.bg} rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform`}>
                    <Icon className={`h-5 w-5 ${t.color}`} />
                  </div>
                  <p className={`text-xs font-medium ${isActive ? "text-primary" : "text-foreground"}`}>{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.count}</p>
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Listings */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-foreground">
                  {activeLabel}{" "}
                  <span className="text-muted-foreground font-normal text-sm">({filtered.length})</span>
                </h2>
                {activeType !== "all" && (
                  <button
                    onClick={() => setActiveType("all")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" /> Clear filter
                  </button>
                )}
              </div>

              {filtered.length === 0 && (
                <div className="rounded-xl border border-border/50 bg-card/50 p-12 text-center">
                  <p className="text-muted-foreground text-sm">No {activeLabel.toLowerCase()} listed yet.</p>
                  <button onClick={() => setActiveType("all")} className="mt-3 text-xs text-primary hover:underline">
                    See all opportunities
                  </button>
                </div>
              )}

              {filtered.map((opp) => (
                <div
                  key={opp.id}
                  className={`rounded-xl border bg-card p-4 hover:border-primary/40 transition-all group ${opp.featured ? "border-primary/30 bg-primary/5" : "border-border/50"}`}
                >
                  {opp.featured && (
                    <div className="text-[10px] text-primary font-semibold mb-2 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-primary" />FEATURED
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${opp.typeColor}`}>{opp.typeLabel}</span>
                        {opp.africa && (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded px-1.5 py-0.5">🌍 Africa</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-0.5">{opp.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{opp.company}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.location}</span>
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{opp.salary}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{opp.deadline}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
                      <a href={opp.url} target="_blank" rel="noopener noreferrer">Apply</a>
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-1 flex-wrap">
                    {opp.skills.map((s) => (
                      <span key={s} className="text-[10px] bg-secondary/60 text-muted-foreground px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <h3 className="font-bold text-sm text-foreground mb-2">Get Opportunity Alerts</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Get notified when new jobs, grants, and gigs are posted for Africa.
                </p>
                <Button className="w-full" size="sm" asChild>
                  <Link href="/signup">Set Up Alerts Free</Link>
                </Button>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Browse by Type</h3>
                {sidebarTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveType(t.id)}
                    className={`w-full flex items-center justify-between py-2 text-xs transition-colors rounded px-2 ${
                      activeType === t.id ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="bg-secondary/60 px-1.5 py-0.5 rounded">{t.count}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Submit an Opportunity</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Know of a grant, job, or fellowship for African builders? Share it with the community.
                </p>
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <Link href="/submit-tool">Submit Opportunity</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

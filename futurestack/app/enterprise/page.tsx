import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  Building2, Shield, Users, BarChart3, Layers,
  CheckCircle2, ArrowRight, Globe, Zap, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Enterprise — DISCOVA for Organizations | DISCOVA",
  description:
    "DISCOVA Enterprise gives teams and organizations a centralized platform to discover, manage, and optimize their digital tools and SaaS spend.",
};

const FEATURES = [
  {
    icon: Users,
    title: "Team Workspaces",
    desc: "Centralized workspace for your entire team. Manage tool access, organize stacks, and onboard employees faster.",
  },
  {
    icon: BarChart3,
    title: "SaaS Spend Analytics",
    desc: "Track every tool subscription, identify redundancies, and cut costs with AI-powered spend intelligence.",
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    desc: "Enterprise-grade access controls, SSO, audit logs, and compliance tooling for regulated industries.",
  },
  {
    icon: Layers,
    title: "Internal Stacks",
    desc: "Build and share approved tool stacks across departments. Standardize your digital infrastructure.",
  },
  {
    icon: Globe,
    title: "Africa-Aware Procurement",
    desc: "Get AI recommendations that factor in African payment rails, bandwidth, and mobile constraints.",
  },
  {
    icon: Zap,
    title: "Workflow Templates",
    desc: "Pre-built workflow templates for teams across marketing, engineering, operations, and finance.",
  },
];

const PLANS = [
  {
    name: "Startup",
    price: "$49",
    period: "/month",
    desc: "For small teams and growing startups",
    features: [
      "Up to 10 team members",
      "Shared tool stacks",
      "Basic spend tracking",
      "Community access",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Business",
    price: "$149",
    period: "/month",
    desc: "For established businesses and agencies",
    features: [
      "Up to 50 team members",
      "Advanced workspace management",
      "Full spend analytics",
      "Procurement recommendations",
      "Priority support",
      "API access",
      "Custom stacks",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large organizations and governments",
    features: [
      "Unlimited team members",
      "Dedicated account manager",
      "SSO & advanced security",
      "Custom integrations",
      "SLA guarantee",
      "On-site training",
      "Custom Africa procurement",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const USE_CASES = [
  { emoji: "🏢", name: "Corporate Enterprises", desc: "Manage tools across departments and locations" },
  { emoji: "🏛️", name: "Government Agencies", desc: "Digitize operations with Africa-vetted tools" },
  { emoji: "🎓", name: "Universities", desc: "Equip students and faculty with AI tools" },
  { emoji: "📱", name: "Tech Agencies", desc: "Standardize client delivery stacks" },
  { emoji: "🏥", name: "Healthcare", desc: "HIPAA-aware tool procurement" },
  { emoji: "⛪", name: "Churches & NGOs", desc: "Free and low-cost tool stacks" },
];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/8 blur-[100px]" />
          </div>
          <div className="container relative mx-auto px-4 lg:px-6 py-16 lg:py-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/8 px-3.5 py-1.5 text-xs text-blue-300 mb-5">
                <Building2 className="h-3 w-3" />
                DISCOVA Enterprise
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-5xl mb-5">
                The operating system for<br />
                <span className="gradient-text">your organization&apos;s tools</span>
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-xl mx-auto mb-8">
                Discover, manage, and optimize every digital tool your organization uses — with Africa-aware procurement intelligence built in.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button size="lg" asChild>
                  <Link href="/signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">Talk to Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border/30 py-14 lg:py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-3">Everything your team needs</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                Built for African enterprises that need practical, cost-effective digital infrastructure.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="rounded-xl border border-border/50 bg-card p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground mb-2">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-b border-border/30 py-14 lg:py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-3">Simple, transparent pricing</h2>
              <p className="text-muted-foreground text-sm">All plans include a 14-day free trial. No credit card required.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border p-6 flex flex-col ${
                    plan.highlighted
                      ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border/50 bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="text-xs text-primary font-semibold mb-3 flex items-center gap-1">
                      <Zap className="h-3 w-3 fill-primary" />MOST POPULAR
                    </div>
                  )}
                  <h3 className="font-bold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="mb-5">
                    <span className="text-3xl font-black text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href={plan.cta === "Contact Sales" ? "/contact" : "/signup"}>
                      {plan.cta}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-14 lg:py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-3">Built for every African organization</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {USE_CASES.map((u) => (
                <div key={u.name} className="rounded-xl border border-border/50 bg-card p-4 text-center">
                  <div className="text-3xl mb-2">{u.emoji}</div>
                  <p className="text-xs font-medium text-foreground mb-1">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/30 py-14 bg-card/40">
          <div className="container mx-auto px-4 lg:px-6 text-center max-w-xl">
            <Lock className="h-8 w-8 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-3">Ready to transform your organization?</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Join forward-thinking African organizations already using DISCOVA Enterprise.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button size="lg" asChild>
                <Link href="/signup">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

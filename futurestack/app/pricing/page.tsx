"use client";

import { useState } from "react";
import {
  Check,
  Zap,
  Users,
  Shield,
  HelpCircle,
  ChevronDown,
  Star,
  CreditCard,
} from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

const PRICE_IDS = {
  pro_monthly:  process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY  || "price_pro_mo",
  pro_annual:   process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL   || "price_pro_yr",
  team_monthly: process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY || "price_team_mo",
  team_annual:  process.env.NEXT_PUBLIC_STRIPE_TEAM_ANNUAL  || "price_team_yr",
};

const PAYSTACK_PLAN_IDS = {
  pro_monthly:  "pro_monthly",
  pro_annual:   "pro_annual",
  team_monthly: "team_monthly",
  team_annual:  "team_annual",
};

const NGN_PRICES: Record<string, { monthly: number; annual: number }> = {
  pro:  { monthly: 14400, annual: 118800 },
  team: { monthly: 58800, annual: 478800 },
};

interface PaidTier {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  cta: string;
  highlight: boolean;
  features: string[];
  missing: string[];
  priceIdMonthly?: string;
  priceIdAnnual?: string;
  paystackMonthly?: string;
  paystackAnnual?: string;
  ctaHref?: string;
  badge?: string;
}

type UpgradeTier = PaidTier & { priceIdMonthly: string };

const tiers: PaidTier[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    description: "Perfect for exploring the AI landscape.",
    cta: "Get Started Free",
    ctaHref: "/signup",
    highlight: false,
    features: [
      "Unlimited tool discovery",
      "Save up to 10 tools",
      "1 stack",
      "Latest radar (current week)",
      "Compare 2 tools at once",
      "5 Ask AI questions/day",
      "Community reviews",
    ],
    missing: ["Ad-free", "Pro newsletter", "Full radar archive", "Unlimited comparisons", "API access"],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 12,
    priceAnnual: 99,
    description: "For serious builders and power users.",
    cta: "Start Free Trial",
    priceIdMonthly: PRICE_IDS.pro_monthly,
    priceIdAnnual:  PRICE_IDS.pro_annual,
    paystackMonthly: PAYSTACK_PLAN_IDS.pro_monthly,
    paystackAnnual:  PAYSTACK_PLAN_IDS.pro_annual,
    highlight: true,
    badge: "Most Popular",
    features: [
      "Everything in Free",
      "Unlimited saved tools",
      "Unlimited stacks",
      "Full radar archive (all history)",
      "Unlimited comparisons",
      "Unlimited Ask AI",
      "Ad-free experience",
      "Pro weekly newsletter",
    ],
    missing: ["Team sharing", "API access"],
  },
  {
    id: "team",
    name: "Team",
    priceMonthly: 49,
    priceAnnual: 399,
    description: "For agencies and engineering teams.",
    cta: "Start Free Trial",
    priceIdMonthly: PRICE_IDS.team_monthly,
    priceIdAnnual:  PRICE_IDS.team_annual,
    paystackMonthly: PAYSTACK_PLAN_IDS.team_monthly,
    paystackAnnual:  PAYSTACK_PLAN_IDS.team_annual,
    highlight: false,
    features: [
      "Everything in Pro",
      "Team stack sharing",
      "Up to 15 seats",
      "API access",
      "Slack radar alerts",
      "Priority support",
      "Custom integrations",
    ],
    missing: [],
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes — cancel in one click from your billing portal. No hoops, no retention flows. Your access continues until the end of the billing period.",
  },
  {
    q: "How does the 14-day free trial work?",
    a: "You get full Pro (or Team) access for 14 days without entering a card upfront. We'll remind you 3 days before the trial ends.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "All your saved tools, stacks, and reviews are preserved forever. You'll lose access to Pro features, but no data is deleted.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Absolutely — if you're not satisfied within 30 days of your first payment, email us and we'll refund in full. No questions asked.",
  },
  {
    q: "Can I pay in Naira (NGN)?",
    a: "Yes! Select Paystack as your payment method and choose NGN currency. We accept NGN, USD, GHS, ZAR, and KES through Paystack.",
  },
  {
    q: "Can I switch between monthly and annual billing?",
    a: "Yes, you can switch at any time from your billing portal. Switching to annual is prorated so you're never double-charged.",
  },
];

type PaymentMethod = "stripe" | "paystack";
type Currency = "USD" | "NGN";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [currency, setCurrency] = useState<Currency>("USD");
  const { plan: currentPlan, startUpgrade, startPaystackUpgrade } = useSubscription();

  const handleUpgrade = async (tier: UpgradeTier) => {
    setLoading(tier.id);
    try {
      if (paymentMethod === "paystack") {
        const planId = annual
          ? (tier.paystackAnnual ?? tier.paystackMonthly)
          : tier.paystackMonthly;
        if (!planId) throw new Error("Paystack plan not configured");
        await startPaystackUpgrade(planId, "pricing_page", currency);
      } else {
        const priceId = annual
          ? (tier.priceIdAnnual ?? tier.priceIdMonthly)
          : tier.priceIdMonthly;
        await startUpgrade(priceId!, "pricing_page");
      }
    } catch {
      setLoading(null);
      alert("Something went wrong. Please try again.");
    }
  };

  const displayPrice = (tier: (typeof tiers)[0]) => {
    if (tier.id === "free") return "0";
    if (paymentMethod === "paystack" && currency === "NGN") {
      const ngn = NGN_PRICES[tier.id];
      if (!ngn) return "0";
      const val = annual ? ngn.annual : ngn.monthly;
      return `₦${val.toLocaleString()}`;
    }
    const usdVal = annual
      ? (tier.id === "pro" ? 99 : tier.id === "team" ? 399 : 0)
      : tier.priceMonthly;
    return `$${usdVal}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 text-sm font-bold px-4 py-2 rounded-full border border-indigo-500/20 mb-6">
          <Zap className="w-4 h-4" /> Trusted by 15,000+ engineers
        </div>
        <h1 className="text-5xl font-black mb-4 leading-tight">
          Invest in your stack.
          <br />
          <span className="text-indigo-400">Stay ahead of the curve.</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
          14-day free trial on all paid plans. No credit card required upfront.
        </p>

        {/* Payment Method Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setPaymentMethod("paystack")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                paymentMethod === "paystack"
                  ? "bg-[#00C3F7] text-slate-900 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-base">🌍</span> Paystack
              <span className="text-xs font-normal opacity-75">(Africa & more)</span>
            </button>
            <button
              onClick={() => setPaymentMethod("stripe")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                paymentMethod === "stripe"
                  ? "bg-[#635BFF] text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CreditCard className="w-4 h-4" /> Stripe
              <span className="text-xs font-normal opacity-75">(International)</span>
            </button>
          </div>

          {/* NGN/USD toggle — only when Paystack is selected */}
          {paymentMethod === "paystack" && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setCurrency("USD")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  currency === "USD" ? "bg-white text-slate-900" : "text-slate-400"
                }`}
              >
                USD $
              </button>
              <button
                onClick={() => setCurrency("NGN")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  currency === "NGN" ? "bg-white text-slate-900" : "text-slate-400"
                }`}
              >
                NGN ₦
              </button>
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-3 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${!annual ? "bg-white text-slate-900" : "text-slate-400"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${annual ? "bg-white text-slate-900" : "text-slate-400"}`}
          >
            Annual
            <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Save 31%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative rounded-3xl p-8 border transition-all ${
              tier.highlight
                ? "bg-indigo-600 border-indigo-500 shadow-[0_0_60px_rgba(99,102,241,0.25)]"
                : "bg-slate-900 border-slate-800 hover:border-slate-700"
            }`}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3 h-3" /> {tier.badge}
              </div>
            )}

            <h3 className="text-xl font-black mb-1">{tier.name}</h3>
            <p className={`text-sm mb-6 ${tier.highlight ? "text-indigo-200" : "text-slate-400"}`}>
              {tier.description}
            </p>

            <div className="mb-8">
              <span className="text-4xl font-black">{displayPrice(tier)}</span>
              {tier.priceMonthly > 0 && (
                <span className={`text-sm ml-2 ${tier.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                  /{annual ? "year" : "month"}
                </span>
              )}
            </div>

            {tier.id === "free" ? (
              <a
                href={tier.ctaHref}
                className="block w-full text-center py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors mb-8"
              >
                {currentPlan !== "free" ? "Current Plan" : tier.cta}
              </a>
            ) : (
              <button
                onClick={() => handleUpgrade(tier as UpgradeTier)}
                disabled={loading === tier.id || currentPlan === tier.id}
                className={`w-full py-3 rounded-xl font-bold transition-all mb-8 disabled:opacity-60 ${
                  tier.highlight
                    ? "bg-white text-indigo-700 hover:bg-slate-100"
                    : paymentMethod === "paystack"
                      ? "bg-[#00C3F7] hover:bg-[#00afd9] text-slate-900"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {loading === tier.id
                  ? "Redirecting…"
                  : currentPlan === tier.id
                    ? "✓ Current Plan"
                    : paymentMethod === "paystack"
                      ? `Pay with Paystack`
                      : tier.cta}
              </button>
            )}

            <ul className="space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check
                    className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlight ? "text-indigo-200" : "text-emerald-400"}`}
                  />
                  <span className={tier.highlight ? "text-indigo-100" : "text-slate-300"}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Payment Methods Banner */}
      <div className="max-w-5xl mx-auto px-4 mb-12">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white text-sm">Accepted payment methods</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Paystack supports cards, bank transfers, USSD, M-Pesa, and mobile money across Africa.
            </p>
          </div>
          <div className="flex items-center gap-3 text-slate-300 text-sm flex-wrap justify-center">
            {["Visa", "Mastercard", "Verve", "Bank Transfer", "USSD", "M-Pesa"].map((m) => (
              <span
                key={m}
                className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Money-back Badge */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="font-bold text-white">30-Day Money-Back Guarantee</div>
            <div className="text-sm text-slate-400 mt-0.5">
              Not happy? Email us within 30 days of your first payment for a full refund — no questions asked.
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-black text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-6 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-semibold text-white">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

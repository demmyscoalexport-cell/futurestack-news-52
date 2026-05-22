import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Naija Score™ & DISCOVA Score™ Methodology",
  description:
    "How we calculate the Naija Score™ and DISCOVA Score™ — Africa's most trusted tool rating system built for real African realities.",
  openGraph: {
    title: "Naija Score™ Methodology | DISCOVA",
    description:
      "Transparent, multi-signal scoring for every tool. Rated for 3G performance, Android support, Naira pricing, and African payment compatibility.",
  },
};

const signals = [
  {
    weight: 30,
    label: "Community Reviews",
    icon: "⭐",
    color: "text-amber-400",
    bar: "bg-amber-500",
    description:
      "Verified reviews from real users, weighted by account age, review count, and specificity. One-line reviews count less than detailed breakdowns.",
    sub: [
      "Average rating (1–5 stars)",
      "Review volume (log-scaled)",
      "Recency decay — older reviews matter less",
      "Verified user weighting",
    ],
  },
  {
    weight: 25,
    label: "Usage & Momentum",
    icon: "🚀",
    color: "text-indigo-400",
    bar: "bg-indigo-500",
    description:
      "How much are engineers actually saving, building stacks with, and returning to this tool? We measure saves, stack inclusions, and 30-day trending.",
    sub: [
      "Saves to user libraries",
      "Stack Builder inclusions",
      "30-day save velocity",
      "Comparison page click-throughs",
    ],
  },
  {
    weight: 20,
    label: "Pricing Value",
    icon: "💰",
    color: "text-emerald-400",
    bar: "bg-emerald-500",
    description:
      'Tools with free tiers, transparent pricing, and strong free-to-paid ratios score higher. Opaque "contact us" enterprise pricing is penalized.',
    sub: [
      "Free tier availability",
      "Self-serve signup",
      "Pricing transparency",
      "Value per dollar (feature density)",
    ],
  },
  {
    weight: 15,
    label: "Product Velocity",
    icon: "⚡",
    color: "text-cyan-400",
    bar: "bg-cyan-500",
    description:
      "Active development and frequent updates signal a healthy, invested team. We track changelog frequency and feature release cadence.",
    sub: [
      "Changelog update frequency",
      "Feature release velocity (90 days)",
      "Public roadmap availability",
      "Response to user feedback",
    ],
  },
  {
    weight: 10,
    label: "Trust & Compliance",
    icon: "🛡️",
    color: "text-purple-400",
    bar: "bg-purple-500",
    description:
      "GDPR compliance, API access, data export, and SOC 2 certification give tools a professional edge — especially for freelancers and agencies in regulated industries.",
    sub: [
      "GDPR / CCPA compliance",
      "API access available",
      "Data export support",
      "SOC 2 / ISO certification",
    ],
  },
];

const faqs = [
  {
    q: "Can a tool pay to increase its score?",
    a: "No. The DISCOVA Score™ is 100% algorithmic. We do offer paid Featured Listings for visibility, but those placements are always clearly labelled and have zero effect on the score.",
  },
  {
    q: "How often is the score updated?",
    a: "Scores recalculate weekly via our automated Inngest pipeline. Tools that ship updates, gain reviews, or trend on the radar will see score changes within 7 days.",
  },
  {
    q: "What is the score range?",
    a: "The score runs from 0.0 to 10.0. A score of 8.5+ is considered excellent. Most established tools sit between 6.0 and 8.5. New tools start with limited data at 5.0.",
  },
  {
    q: "Can I dispute my tool's score?",
    a: "Yes — email us at scores@getdiscova.com with evidence of incorrect data. We audit all score disputes within 5 business days.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-sm font-bold px-4 py-2 rounded-full border border-emerald-500/20 mb-6">
          Methodology v2.1 — Updated April 2026
        </div>
        <h1 className="text-5xl font-black mb-6 leading-tight tracking-tight">
          The DISCOVA Score™
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A transparent, multi-signal rating system designed to be the most
          defensible and objective AI tool score on the internet. No
          pay-to-play. No black boxes.
        </p>
      </div>

      {/* Score Visual Example */}
      <div className="max-w-4xl mx-auto px-4 mb-20">
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-3xl p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="text-center shrink-0">
            <div className="text-8xl font-black text-emerald-400 leading-none">
              9.2
            </div>
            <div className="text-slate-500 text-sm font-bold mt-2 uppercase tracking-widest">
              DISCOVA Score™
            </div>
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-lg mb-3">
              What a 9.2 means:
            </div>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Top 5% of all tools
                reviewed on DISCOVA
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> 4.7+ average star
                rating from 100+ verified reviews
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Strong free tier +
                transparent pricing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Shipping product
                updates every 2–3 weeks
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> GDPR compliant with
                public API access
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Signal Breakdown */}
      <div className="max-w-4xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-black mb-3">The 5 Scoring Signals</h2>
        <p className="text-slate-400 mb-10">
          Each signal is independently calculated and combined into the final
          0–10 score.
        </p>

        <div className="space-y-6">
          {signals.map((s) => (
            <div
              key={s.label}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-7"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <h3 className={`text-lg font-black ${s.color}`}>
                      {s.label}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed max-w-xl">
                      {s.description}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-6">
                  <div className={`text-3xl font-black ${s.color}`}>
                    {s.weight}%
                  </div>
                  <div className="text-slate-600 text-xs font-bold">
                    of total score
                  </div>
                </div>
              </div>

              {/* Weight bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 mb-5">
                <div
                  className={`${s.bar} h-2 rounded-full transition-all`}
                  style={{ width: `${s.weight * 3.33}%` }}
                />
              </div>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {s.sub.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-slate-400 text-sm"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${s.bar} shrink-0`}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Formula */}
      <div className="max-w-4xl mx-auto px-4 mb-20">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 font-mono text-sm">
          <div className="text-slate-500 mb-4 text-xs uppercase tracking-wider font-sans font-bold">
            Simplified Formula
          </div>
          <div className="text-emerald-400 text-base leading-loose">
            Score = (<span className="text-amber-400">Reviews × 0.30</span>) + (
            <span className="text-indigo-400">Momentum × 0.25</span>) + (
            <span className="text-emerald-400">Pricing × 0.20</span>) + (
            <span className="text-cyan-400">Velocity × 0.15</span>) + (
            <span className="text-purple-400">Trust × 0.10</span>)
          </div>
          <div className="text-slate-500 mt-4 text-xs font-sans">
            Normalised to 0.0–10.0 scale. Recalculated weekly.
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-black mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <div className="font-bold text-white mb-2">{f.q}</div>
              <div className="text-slate-400 text-sm leading-relaxed">
                {f.a}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-24 text-center">
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/40 rounded-3xl p-12">
          <h2 className="text-2xl font-black mb-4">
            Browse tools by their DISCOVA Score™
          </h2>
          <p className="text-slate-400 mb-8">
            Sort the entire AI tool library by score to find the best tools for
            your stack.
          </p>
          <Link
            href="/tools?sort=futurestack_score"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg"
          >
            Browse Top-Rated Tools →
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, Search } from "lucide-react";

// Dummy data mirroring getLatestRadar from lib/queries/radar.ts to support client page directly
const latestRadar = {
  week: "Week 28",
  year: 2026,
  items: [
    {
      id: 1,
      tool: { name: "Devin", slug: "devin", logo: null },
      category: "rising_stars",
      ai_summary:
        "Devin has dominated developer workflows this week with major updates. It is trending highly across all AI tracking metrics.",
      signal_strength: 5,
    },
    {
      id: 2,
      tool: { name: "Cursor", slug: "cursor", logo: null },
      category: "watch_closely",
      ai_summary:
        "Usage appears to be fracturing following server outages. Monitor for stability in the upcoming week.",
      signal_strength: 4,
    },
    {
      id: 3,
      tool: { name: "v0.dev", slug: "v0", logo: null },
      category: "underrated_gems",
      ai_summary:
        "Their new prompt caching drastically reduces costs but few have realized it. An absolute steal right now.",
      signal_strength: 4,
    },
    {
      id: 4,
      tool: { name: "Perplexity", slug: "perplexity", logo: null },
      category: "new_features",
      ai_summary:
        'Launched "Pages" allowing entire dynamic articles to be built automatically. Massive SEO implications.',
      signal_strength: 5,
    },
    {
      id: 5,
      tool: { name: "Midjourney", slug: "midjourney", logo: null },
      category: "price_drops",
      ai_summary:
        "They have fundamentally altered their API tiers to attract enterprise developers.",
      signal_strength: 3,
    },
  ],
};

const previousRadars = [
  { week: "Week 27", year: 2026 },
  { week: "Week 26", year: 2026 },
  { week: "Week 25", year: 2026 },
  { week: "Week 24", year: 2026 },
];

const categories = [
  { id: "all", label: "All" },
  { id: "rising_stars", label: "Rising Stars" },
  { id: "watch_closely", label: "Watch Closely" },
  { id: "underrated_gems", label: "Underrated Gems" },
  { id: "price_drops", label: "Price Drops" },
  { id: "new_features", label: "New Features" },
];

export default function RadarPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const filteredItems = latestRadar.items.filter(
    (item) => activeTab === "all" || item.category === activeTab,
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-32 pt-20 font-sans">
      <div className="max-w-5xl mx-auto px-4">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            {latestRadar.week}{" "}
            <span className="text-slate-600 font-light">· AI Tool Radar</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Curated AI intelligence digest for July 8 – July 14,{" "}
            {latestRadar.year}
          </p>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide border-b border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${
                activeTab === cat.id
                  ? "bg-white text-slate-900"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Radar Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors"
              >
                <div className="absolute top-4 right-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < item.signal_strength ? "bg-indigo-500" : "bg-slate-800"}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-xl text-white">
                    {item.tool.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {item.tool.name}
                    </h3>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                      {categories.find((c) => c.id === item.category)?.label}
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">
                  {item.ai_summary}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No items in this category this week.
            </div>
          )}
        </div>

        {/* Subscribe CTA */}
        <div className="bg-indigo-600 rounded-3xl p-8 mb-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <h2 className="text-2xl font-bold text-white mb-4 relative z-10">
            Get this radar in your inbox every Monday
          </h2>
          <p className="text-indigo-200 mb-6 relative z-10">
            Join 15,000+ engineers receiving our weekly AI intelligence signals.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative z-10"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-white text-indigo-600 font-bold hover:bg-slate-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Previous Radars Accordion */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50">
          <button
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          >
            <h3 className="font-bold text-white">Previous Radars</h3>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${isAccordionOpen ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {isAccordionOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 pt-2 border-t border-slate-800 space-y-2">
                  {previousRadars.map((pr, idx) => (
                    <a
                      key={idx}
                      href="#"
                      className="flex justify-between items-center py-2 text-slate-400 hover:text-white group"
                    >
                      <span className="group-hover:underline">
                        {pr.week}, {pr.year}
                      </span>
                      <Search className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const TRENDING = [
  "Best AI tools 2026",
  "ChatGPT vs Claude",
  "AI coding tools",
  "AI SEO guide",
  "Cursor review",
];

export function BlogHero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/blog?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="relative overflow-hidden border-b border-neutral-stroke/40 bg-neutral-deep">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-40 top-0 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl" />
        <div className="absolute -right-20 bottom-0 w-80 h-80 rounded-full bg-violet-900/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,rgba(6,3,14,0.8))]" />
      </div>

      <div className="relative container mx-auto px-4 py-16 sm:py-20 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-xs font-medium mb-6">
            <Sparkles className="h-3 w-3" />
            AI Tools Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-[1.08] mb-4">
            <span className="text-foreground">Expert guides on </span>
            <span
              className="gradient-text"
              style={{
                background: "linear-gradient(135deg, #7c66ff 0%, #c0b3ff 50%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              the best AI tools
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Practical comparisons, in-depth reviews, and actionable guides to help you
            find and use the right AI tools for your work.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-lg mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guides, comparisons, tutorials…"
                className="w-full h-12 pl-11 pr-28 rounded-input border border-neutral-stroke/80 bg-neutral-surface text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/60 transition-all shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 h-8 px-4 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition-all"
              >
                Search
              </button>
            </div>
          </form>

          {/* Trending */}
          <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Trending:
            </span>
            {TRENDING.map((t) => (
              <button
                key={t}
                onClick={() => router.push(`/blog?q=${encodeURIComponent(t)}`)}
                className="text-xs text-muted-foreground hover:text-brand-lilac transition-colors hover:underline"
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

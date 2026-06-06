"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsletterSignupProps {
  className?: string;
  variant?: "inline" | "card" | "minimal";
  title?: string;
  description?: string;
}

export function NewsletterSignup({
  className,
  variant = "card",
  title = "Stay ahead of AI",
  description = "Get weekly roundups of the best new AI tools, expert comparisons, and practical guides delivered to your inbox.",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "blog" }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("You're in! Check your inbox for a welcome email.");
        setEmail("");
      } else {
        throw new Error("Failed");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (variant === "minimal") {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="flex-1 h-9 px-3 text-sm rounded-input border border-border/60 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/60 transition-all"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="h-9 px-4 rounded-input bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-all disabled:opacity-60"
        >
          {status === "loading" ? "…" : status === "success" ? "✓" : "Subscribe"}
        </button>
      </form>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("rounded-discova-lg border border-brand-primary/20 bg-brand-primary/5 p-6", className)}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-green-400"
              >
                <CheckCircle className="h-4 w-4" />
                {message}
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 h-9 px-3 text-sm rounded-input border border-border/60 bg-secondary/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/60 transition-all"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-9 px-4 rounded-input bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  {status === "loading" ? "…" : <>Subscribe <ArrowRight className="h-3.5 w-3.5" /></>}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="text-xs text-destructive mt-2">{message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Card (full-width section) ──────────────────────────────────── */
  return (
    <section className={cn("relative overflow-hidden rounded-discova-lg border border-neutral-stroke/60", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-violet-900/5 to-neutral-surface" />
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-brand-primary/5 blur-3xl" />
      <div className="relative px-6 py-10 sm:px-10 sm:py-12 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-xs font-medium mb-5">
          <Sparkles className="h-3 w-3" />
          Weekly AI Intelligence
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-heading text-foreground mb-3">
          {title}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {description}
        </p>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-green-400 font-medium"
          >
            <CheckCircle className="h-5 w-5" />
            {message}
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 h-11 px-4 text-sm rounded-input border border-neutral-stroke/80 bg-neutral-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/60 transition-all"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="h-11 px-6 rounded-input bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shrink-0"
            >
              {status === "loading" ? (
                "Subscribing…"
              ) : (
                <>
                  Get updates
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="text-xs text-destructive mt-3">{message}</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          No spam. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}

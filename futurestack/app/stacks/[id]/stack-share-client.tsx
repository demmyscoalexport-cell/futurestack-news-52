"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Twitter,
  Linkedin,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface Tool {
  id: string;
  name: string;
  slug: string;
  logo: string;
  tagline: string;
  tool_scores: { futurestack_score: number }[];
}

interface StackShareClientProps {
  stack: any;
  tools: Tool[];
  stackId: string;
}

export function StackShareClient({
  stack,
  tools,
  stackId,
}: StackShareClientProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://getdiscova.com/stacks/${stackId}`;
  const shareText = `My power stack: ${stack.name} — built with ${tools.length} hand-picked tools on DISCOVA 🌍`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    );

  const shareLinkedIn = () =>
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    );

  const author = stack.profiles?.full_name || "DISCOVA User";
  const avgScore = tools.length
    ? (
        tools.reduce(
          (sum, t) => sum + (t.tool_scores?.[0]?.futurestack_score || 0),
          0,
        ) / tools.length
      ).toFixed(1)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        <div className="relative overflow-hidden hero-glow border-b border-neutral-stroke/40">
          <div className="orb-glow top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] bg-brand-primary/12" />

          <div className="relative container mx-auto px-4 sm:px-6 py-10 sm:py-14 max-w-4xl">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-neutral-white font-black text-sm shrink-0">
                {author.charAt(0)}
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">Stack by</div>
                <div className="font-bold text-foreground">{author}</div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 leading-tight">
              {stack.name}
            </h1>
            {stack.description && (
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl leading-relaxed">
                {stack.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
              <div className="glass-panel border border-neutral-stroke/60 px-4 py-2 rounded-input text-sm">
                <span className="text-muted-foreground mr-1">Tools:</span>
                <span className="font-bold text-foreground">{tools.length}</span>
              </div>
              {avgScore && (
                <div className="bg-brand-gold/10 border border-brand-gold/30 px-4 py-2 rounded-input text-sm flex items-center gap-1.5">
                  <span className="text-muted-foreground">Avg Score:</span>
                  <span className="font-black text-brand-gold">{avgScore}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-brand-primary text-neutral-white font-bold rounded-input hover:bg-brand-primary/90 transition-colors text-xs sm:text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button type="button" onClick={shareTwitter} className="flex items-center gap-2 px-4 py-2.5 bg-sky-500/90 hover:bg-sky-500 text-white font-bold rounded-input transition-colors text-xs sm:text-sm">
                <Twitter className="w-4 h-4" /> Share on X
              </button>
              <button type="button" onClick={shareLinkedIn} className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-input transition-colors text-xs sm:text-sm">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </button>
              <Link href="/stack-builder" className="flex items-center gap-2 px-4 py-2.5 border border-brand-primary/40 bg-brand-primary/10 text-brand-lilac font-bold rounded-input hover:bg-brand-primary/20 transition-colors text-xs sm:text-sm">
                <Zap className="w-4 h-4" /> Build My Own
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 max-w-4xl">
          <h2 className="text-xs sm:text-sm font-black mb-5 sm:mb-6 text-muted-foreground uppercase tracking-wider">
            {tools.length} Tools in this Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {tools.map((tool, i) => {
              const score = tool.tool_scores?.[0]?.futurestack_score;
              return (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="group flex items-center gap-3 sm:gap-4 glass-panel border border-neutral-stroke/60 hover:border-brand-primary/40 rounded-discova-lg p-4 sm:p-5 card-lift transition-all"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-input bg-neutral-surface flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {tool.logo ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-input overflow-hidden bg-neutral-surface shrink-0">
                      <img src={tool.logo} alt={tool.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-input bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-black text-lg shrink-0">
                      {tool.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm sm:text-base text-foreground group-hover:text-brand-lilac transition-colors truncate">
                      {tool.name}
                    </div>
                    <div className="text-muted-foreground text-xs sm:text-sm truncate">{tool.tagline}</div>
                  </div>
                  {score && (
                    <div className="shrink-0 text-right">
                      <div className="text-brand-gold font-black text-base sm:text-lg leading-none">{Number(score).toFixed(1)}</div>
                      <div className="text-muted-foreground text-[10px]">Score</div>
                    </div>
                  )}
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-brand-primary shrink-0 transition-colors hidden sm:block" />
                </Link>
              );
            })}
          </div>

          <div className="mt-10 sm:mt-12 glass-panel border border-brand-primary/20 rounded-discova-lg p-6 sm:p-10 text-center">
            <div className="text-xl sm:text-2xl font-black mb-3 text-foreground">Build your own stack</div>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Tell our AI your role and goals — get a personalised stack of tools in seconds.
            </p>
            <Link
              href="/stack-builder"
              className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-neutral-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-input transition-colors text-sm"
            >
              <Zap className="w-4 h-4" /> Open Stack Builder →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

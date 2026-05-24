"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Stack, Tool } from "@/lib/types";

interface EditorPickCarouselProps {
  stacks: Stack[];
  tools: Tool[];
}

export function EditorPickCarousel({ stacks, tools }: EditorPickCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const picks = [
    ...stacks.slice(0, 2).map((stack) => ({
      type: "stack" as const,
      id: stack.id,
      href: `/stacks/${stack.slug ?? stack.id}`,
      title: stack.name,
      subtitle: stack.description ?? "Curated tool stack",
      tools: (stack as Stack & { tools?: Tool[] }).tools?.slice(0, 4) ?? tools.slice(0, 4),
      rating: "4.9",
      votes: "2k+",
      badge: stack.name.toLowerCase().includes("africa") ? "Africa Verified" : null,
    })),
    ...tools.slice(0, 2).map((tool) => ({
      type: "tool" as const,
      id: tool.id,
      href: `/tools/${tool.slug}`,
      title: tool.name,
      subtitle: tool.tagline ?? "AI-powered tool",
      tools: [tool],
      rating: tool.rating ? Number(tool.rating).toFixed(1) : "4.8",
      votes: "1k+",
      badge: tool.africa_friendly || tool.africaFriendly ? "Africa Verified" : null,
    })),
  ].slice(0, 4);

  if (picks.length === 0) return null;

  return (
    <section className="py-8 lg:py-12">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Editor&apos;s Pick &amp; Stacks</h2>
          <Link
            href="/discover"
            className="text-xs font-medium text-brand-primary hover:text-brand-lilac flex items-center gap-1 transition-colors"
          >
            Swipe Discovery <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {picks.map((pick) => (
              <Link
                key={`${pick.type}-${pick.id}`}
                href={pick.href}
                className="group snap-start flex-none w-[280px] sm:w-[300px] rounded-discova-lg border border-neutral-stroke/60 bg-neutral-surface/80 p-4 hover:border-brand-primary/40 hover:shadow-[0_8px_32px_rgba(124,102,255,0.12)] transition-all duration-300 card-lift"
              >
                {pick.badge && (
                  <div className="inline-flex items-center gap-1 rounded-pill border border-brand-gold/40 bg-brand-gold/10 px-2 py-0.5 text-[10px] font-semibold text-brand-gold mb-3">
                    <BadgeCheck className="h-3 w-3" />
                    {pick.badge}
                  </div>
                )}
                <h3 className="text-sm font-bold text-foreground group-hover:text-brand-lilac transition-colors line-clamp-2 mb-1">
                  {pick.title}
                </h3>
                <p className="text-xs text-neutral-dim line-clamp-2 mb-4">{pick.subtitle}</p>

                <div className="flex items-center gap-1.5 mb-4">
                  {pick.tools.slice(0, 4).map((t, i) => (
                    <div
                      key={t.id ?? i}
                      className="h-8 w-8 rounded-lg border border-neutral-stroke/50 bg-white/[0.04] flex items-center justify-center overflow-hidden"
                    >
                      {t.logo ? (
                        <img src={t.logo} alt="" className="h-full w-full object-contain p-0.5" />
                      ) : (
                        <span className="text-[10px] font-bold text-brand-primary">{t.name?.[0]}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-brand-gold">
                    <Star className="h-3.5 w-3.5 fill-brand-gold" />
                    <span className="font-semibold">{pick.rating}/5</span>
                  </div>
                  <span className="text-neutral-dim">{pick.votes} votes</span>
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full border border-neutral-stroke bg-neutral-surface/90 backdrop-blur-sm hover:border-brand-primary/50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full border border-neutral-stroke bg-neutral-surface/90 backdrop-blur-sm hover:border-brand-primary/50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

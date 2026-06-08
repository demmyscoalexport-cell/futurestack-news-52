"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getFeatures,
  getHeroCarouselImages,
  getToolName,
  type ToolRecord,
} from "@/lib/tool-intelligence";

interface HeroVisualCarouselProps {
  tool: ToolRecord;
  large?: boolean;
  className?: string;
}

export function HeroVisualCarousel({ tool, large = false, className }: HeroVisualCarouselProps) {
  const images = getHeroCarouselImages(tool);
  const name = getToolName(tool);
  const [activeIndex, setActiveIndex] = useState(0);
  const [errored, setErrored] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  const currentImage = images[activeIndex];
  const showImage = currentImage && !errored[activeIndex];
  const features = getFeatures(tool).slice(0, 3);

  const goTo = (index: number) => {
    if (images.length === 0) return;
    setActiveIndex((index + images.length) % images.length);
  };

  if (showImage) {
    return (
      <div
        className={cn(
          "group/visual relative overflow-hidden bg-neutral-deep",
          large ? "h-72 lg:h-[520px]" : "h-56 lg:h-72",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt={`${name} product preview`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover/visual:scale-[1.03]"
          loading="lazy"
          onError={() => setErrored((prev) => ({ ...prev, [activeIndex]: true }))}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-deep/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-neutral-white" />
          <span className="text-xs font-semibold text-neutral-white">Product preview</span>
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous screenshot"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white opacity-0 backdrop-blur transition-opacity group-hover/visual:opacity-100 md:inline-flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next screenshot"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white opacity-0 backdrop-blur transition-opacity group-hover/visual:opacity-100 md:inline-flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-4 right-4 flex gap-1.5">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  aria-label={`Show screenshot ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-1.5 rounded-pill transition-all",
                    index === activeIndex ? "w-6 bg-brand-lilac" : "w-1.5 bg-white/40",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-neutral-deep p-5", large ? "h-72 lg:h-[520px]" : "h-56", className)}>
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-primary/30 blur-3xl" />
      <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl">
        <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-white/40">Discova preview</span>
        </div>
        <p className="text-lg font-bold text-neutral-white">{name}</p>
        <div className="mt-5 grid gap-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl bg-white/[0.06] px-3 py-2 text-xs text-white/75">
              {feature.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

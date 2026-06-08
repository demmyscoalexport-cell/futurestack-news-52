"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  Flame,
  GitCompare,
  Layers3,
  PlayCircle,
  Sparkles,
  X,
} from "lucide-react";
import { BookmarkButton } from "@/components/discovery/bookmark-button";
import { HeroVisualCarousel } from "@/components/tool/hero-visual-carousel";
import { ToolMetadataRow } from "@/components/tool/tool-metadata-row";
import { ToolShareButton } from "@/components/tool/tool-share-button";
import { cn } from "@/lib/utils";
import {
  getAiSummaries,
  getCategoryLabel,
  getCons,
  getGalleryItems,
  getIsVerified,
  getPros,
  getSubcategoryLabel,
  getToolDescription,
  getToolName,
  getToolSlug,
  getToolSummary,
  getVideos,
  type ToolRecord,
  youtubeEmbedUrl,
} from "@/lib/tool-intelligence";

interface ToolProfileCardProps {
  tool: ToolRecord;
  className?: string;
}

function ProfileLogo({ tool, compact = false }: { tool: ToolRecord; compact?: boolean }) {
  const [errored, setErrored] = useState(false);
  const name = getToolName(tool);
  const logo = typeof tool.logo === "string" ? tool.logo : "";

  if (logo && !errored) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/90 flex items-center justify-center p-1.5 shadow-xl shadow-black/20",
          compact ? "h-12 w-12" : "h-16 w-16",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={`${name} logo`}
          width={64}
          height={64}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-lilac border border-white/10 shadow-xl shadow-brand-primary/20",
        compact ? "h-12 w-12" : "h-16 w-16",
      )}
    >
      <span className={cn("font-bold text-neutral-white", compact ? "text-lg" : "text-2xl")}>
        {name[0]}
      </span>
    </div>
  );
}

function QuickViewDrawer({
  tool,
  open,
  onClose,
}: {
  tool: ToolRecord;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const name = getToolName(tool);
  const slug = getToolSlug(tool);
  const video = getVideos(tool)[0];
  const pros = getPros(tool).slice(0, 4);
  const cons = getCons(tool).slice(0, 4);
  const gallery = getGalleryItems(tool).slice(0, 3);
  const summary = getAiSummaries(tool);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close quick view"
        className="absolute inset-0 bg-neutral-deep/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-neutral-stroke bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-stroke bg-background/90 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Quick View</p>
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-neutral-stroke p-2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <HeroVisualCarousel tool={tool} large />
        <div className="space-y-6 p-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Overview</h3>
            <p className="text-sm leading-7 text-muted-foreground">{getToolDescription(tool)}</p>
          </section>
          <section className="rounded-discova-lg border border-brand-primary/20 bg-brand-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-lilac">
              <Sparkles className="h-4 w-4" />
              AI generated summary
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{summary.short}</p>
          </section>
          <div className="grid gap-4 sm:grid-cols-2">
            <SignalList title="Pros" items={pros} tone="positive" />
            <SignalList title="Cons" items={cons} tone="neutral" />
          </div>
          {video && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Video Preview</h3>
              <iframe
                src={youtubeEmbedUrl(video.youtubeUrl)}
                title={video.title}
                className="aspect-video w-full rounded-discova-lg border border-neutral-stroke"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </section>
          )}
          {gallery.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Gallery</h3>
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={image} src={image} alt={`${name} screenshot`} className="h-24 rounded-xl object-cover" />
                ))}
              </div>
            </section>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href={`/tools/${slug}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-input border border-neutral-stroke px-4 py-2 text-sm font-semibold text-foreground hover:border-brand-primary/40">
              Full product page
            </Link>
            <a href={`/api/affiliate/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-input bg-brand-primary px-4 py-2 text-sm font-semibold text-neutral-white hover:bg-brand-primary/90">
              Visit Website <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SignalList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "neutral" }) {
  return (
    <section className="rounded-discova-lg border border-neutral-stroke bg-neutral-surface/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "positive" ? "text-emerald-400" : "text-brand-lilac")} />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ToolProfileCard({ tool, className }: ToolProfileCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const name = getToolName(tool);
  const slug = getToolSlug(tool);
  const summary = getToolSummary(tool);
  const isFeatured = Boolean(tool.is_featured ?? tool.featured);
  const isNew = Boolean(tool.is_new);
  const videos = getVideos(tool);

  return (
    <>
      <article
        className={cn(
          "group flex min-h-[520px] flex-col overflow-hidden rounded-[20px] border border-neutral-stroke/80 bg-neutral-surface shadow-xl card-lift",
          "hover:border-brand-primary/40 hover:shadow-[0_20px_60px_rgba(124,58,237,0.12)]",
          className,
        )}
      >
        <HeroVisualCarousel tool={tool} />
        <div className="flex flex-1 flex-col gap-5 p-5">
          <div className="flex items-start gap-4">
            <ProfileLogo tool={tool} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-pill border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                    <Flame className="h-3 w-3" />
                    Featured
                  </span>
                )}
                {isNew && (
                  <span className="inline-flex items-center gap-1 rounded-pill border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    Trending
                  </span>
                )}
                {getIsVerified(tool) && (
                  <span className="rounded-pill border border-brand-primary/30 bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-lilac">
                    Verified
                  </span>
                )}
              </div>
              <Link href={`/tools/${slug}`} className="line-clamp-1 text-xl font-bold text-foreground transition-colors hover:text-brand-lilac">
                {name}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs capitalize text-muted-foreground">
                <span>{getCategoryLabel(tool)}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>{getSubcategoryLabel(tool)}</span>
              </div>
            </div>
            <BookmarkButton toolSlug={slug} size="md" />
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{summary}</p>
          <ToolMetadataRow tool={tool} compact />
          <div className="mt-auto grid grid-cols-2 gap-2">
            <a href={`/api/affiliate/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-input bg-brand-primary px-3 py-2.5 text-sm font-semibold text-neutral-white transition-colors duration-micro hover:bg-brand-primary/90 btn-press">
              Visit Tool <ExternalLink className="h-4 w-4" />
            </a>
            <button type="button" onClick={() => setQuickViewOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-input border border-neutral-stroke bg-neutral-elevated/50 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors duration-micro hover:border-brand-primary/40 btn-press">
              Quick View <Layers3 className="h-4 w-4" />
            </button>
            <Link href={videos.length > 0 ? `/tools/${slug}#videos` : `/tools/${slug}`} className="inline-flex items-center justify-center gap-2 rounded-input border border-neutral-stroke px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              Watch Tutorial <PlayCircle className="h-3.5 w-3.5" />
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/compare?tools=${slug}`} aria-label={`Compare ${name}`} className="inline-flex items-center justify-center gap-2 rounded-input border border-neutral-stroke px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                Compare <GitCompare className="h-3.5 w-3.5" />
              </Link>
              <ToolShareButton toolName={name} slug={slug} variant="icon" className="h-full w-full px-3 py-2" />
            </div>
          </div>
        </div>
      </article>
      <QuickViewDrawer tool={tool} open={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
    </>
  );
}

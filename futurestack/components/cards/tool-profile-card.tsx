"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  Flame,
  Layers3,
  PlayCircle,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { VerifiedBadge } from "@/components/discovery/verified-badge";
import { BookmarkButton } from "@/components/discovery/bookmark-button";
import { cn } from "@/lib/utils";
import {
  getAiSummaries,
  getCategoryLabel,
  getCons,
  getFeatures,
  getGallery,
  getHeroVisual,
  getInsightChips,
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

function ProductVisual({ tool, large = false }: { tool: ToolRecord; large?: boolean }) {
  const [errored, setErrored] = useState(false);
  const visual = getHeroVisual(tool);
  const name = getToolName(tool);
  const features = getFeatures(tool).slice(0, 3);

  if (visual && !errored) {
    return (
      <div className={cn("relative overflow-hidden bg-neutral-deep", large ? "h-72" : "h-56")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visual}
          alt={`${name} product preview`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          onError={() => setErrored(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-deep/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-neutral-white" />
          <span className="text-xs font-semibold text-neutral-white">Product preview</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-neutral-deep p-5", large ? "h-72" : "h-56")}>
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-primary/30 blur-3xl" />
      <div className="absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-brand-lilac/20 blur-3xl" />
      <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl">
        <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-white/40">Discova preview</span>
        </div>
        <div className="flex items-start gap-3">
          <ProfileLogo tool={tool} compact />
          <div className="min-w-0">
            <p className="text-lg font-bold text-neutral-white">{name}</p>
            <p className="text-xs capitalize text-white/55">{getCategoryLabel(tool)}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2">
              <Check className="h-3.5 w-3.5 text-brand-lilac" />
              <span className="truncate text-xs text-white/75">{feature.title}</span>
            </div>
          ))}
        </div>
      </div>
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
  const gallery = getGallery(tool).slice(0, 3);
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
        <ProductVisual tool={tool} large />
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
  const [copied, setCopied] = useState(false);
  const name = getToolName(tool);
  const slug = getToolSlug(tool);
  const chips = getInsightChips(tool);
  const summary = getToolSummary(tool);
  const isFeatured = Boolean(tool.is_featured ?? tool.featured);
  const isNew = Boolean(tool.is_new);
  const videos = getVideos(tool);

  const shareTool = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const url = `${window.location.origin}/tools/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: name, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <>
      <article
        className={cn(
          "group flex min-h-[460px] flex-col overflow-hidden rounded-[28px] border border-neutral-stroke/70 bg-neutral-surface/80 shadow-2xl shadow-black/10 card-lift",
          "hover:border-brand-primary/50 hover:shadow-[0_24px_80px_rgba(124,102,255,0.20)]",
          className,
        )}
      >
        <ProductVisual tool={tool} />
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
              </div>
              <Link href={`/tools/${slug}`} className="line-clamp-1 text-xl font-bold text-foreground transition-colors hover:text-brand-lilac">
                {name}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs capitalize text-muted-foreground">
                <span>{getCategoryLabel(tool)}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>{getSubcategoryLabel(tool)}</span>
                <VerifiedBadge size="sm" />
              </div>
            </div>
            <BookmarkButton toolSlug={slug} size="md" />
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span key={chip} className="inline-flex items-center gap-1 rounded-pill border border-neutral-stroke bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <BadgeCheck className="h-3 w-3 text-brand-lilac" />
                {chip}
              </span>
            ))}
          </div>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <a href={`/api/affiliate/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-input bg-brand-primary px-3 py-2.5 text-sm font-semibold text-neutral-white transition-colors hover:bg-brand-primary/90">
              Visit Tool <ExternalLink className="h-4 w-4" />
            </a>
            <button type="button" onClick={() => setQuickViewOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-input border border-neutral-stroke px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-brand-primary/40">
              Quick View <Layers3 className="h-4 w-4" />
            </button>
            <Link href={videos.length > 0 ? `/tools/${slug}#videos` : `/tools/${slug}`} className="inline-flex items-center justify-center gap-2 rounded-input border border-neutral-stroke px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              Watch Tutorial <PlayCircle className="h-3.5 w-3.5" />
            </Link>
            <div className="grid grid-cols-3 gap-2">
              <BookmarkButton toolSlug={slug} className="h-8 w-full" />
              <Link href={`/compare?tools=${slug}`} aria-label={`Compare ${name}`} className="inline-flex items-center justify-center rounded-input border border-neutral-stroke text-muted-foreground hover:text-foreground">
                <Copy className="h-3.5 w-3.5" />
              </Link>
              <button type="button" onClick={shareTool} aria-label={`Share ${name}`} className="inline-flex items-center justify-center rounded-input border border-neutral-stroke text-muted-foreground hover:text-foreground">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </article>
      <QuickViewDrawer tool={tool} open={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
    </>
  );
}

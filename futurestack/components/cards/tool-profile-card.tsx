"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Star, Calendar, ArrowUpRight, BadgeCheck, Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolProfileCardProps {
  tool: {
    id: string;
    name: string;
    slug: string;
    tagline?: string;
    description?: string;
    logo?: string | null;
    website?: string;
    website_url?: string;
    category?: string;
    tags?: string[];
    has_free?: boolean;
    africa_friendly?: boolean;
    rating?: number | string;
    review_count?: number;
    is_featured?: boolean;
    is_new?: boolean;
    is_verified?: boolean;
    pricing_model?: string;
    created_at?: string;
  };
  className?: string;
}

const PRICING_MAP: Record<string, { label: string; color: string }> = {
  free:       { label: "Free",       color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  freemium:   { label: "Freemium",   color: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  paid:       { label: "Paid",       color: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  enterprise: { label: "Enterprise", color: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
};

const CATEGORY_LABEL: Record<string, string> = {
  writing:     "Writing & Content",
  code:        "Coding & Dev",
  design:      "Design & Creative",
  video:       "Video & Media",
  audio:       "Audio & Voice",
  automation:  "Automation",
  productivity:"Productivity",
  data:        "Data & Analytics",
  marketing:   "Marketing",
  analytics:   "Analytics",
};

function getPricing(tool: ToolProfileCardProps["tool"]) {
  if (tool.has_free && tool.pricing_model === "freemium") return PRICING_MAP.freemium;
  if (tool.has_free || tool.pricing_model === "free") return PRICING_MAP.free;
  if (tool.pricing_model === "enterprise") return PRICING_MAP.enterprise;
  return PRICING_MAP.paid;
}

function getPopularity(tool: ToolProfileCardProps["tool"]) {
  if (tool.is_featured) return { label: "Trending", icon: Flame, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  if (tool.is_new)      return { label: "New",      icon: Sparkles, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  return null;
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Square logo with letter fallback on error */
function ProfileLogo({ tool }: { tool: ToolProfileCardProps["tool"] }) {
  const [errored, setErrored] = useState(false);

  if (tool.logo && !errored) {
    return (
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-card flex items-center justify-center p-1.5 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tool.logo}
          alt={`${tool.name} logo`}
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
    <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 shadow-sm">
      <span className="text-2xl font-bold text-primary">{tool.name[0]}</span>
    </div>
  );
}

export function ToolProfileCard({ tool, className }: ToolProfileCardProps) {
  const pricing   = getPricing(tool);
  const popularity = getPopularity(tool);
  const websiteUrl = tool.website_url || tool.website || "";
  const displayTags = (tool.tags ?? []).filter(t => !["free","pro","trending","africa-friendly"].includes(t)).slice(0, 5);
  const dateAdded = formatDate(tool.created_at);
  const categoryLabel = CATEGORY_LABEL[tool.category ?? ""] ?? tool.category ?? "";
  const rating = tool.rating ? Number(tool.rating) : null;
  const PopIcon = popularity?.icon;

  return (
    <div className={cn(
      "group flex flex-col rounded-2xl border border-border bg-card overflow-hidden",
      "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
      "transition-all duration-200",
      className,
    )}>

      {/* Top bar — popularity indicator */}
      {popularity && PopIcon && (
        <div className={cn("flex items-center gap-1.5 px-4 py-2 border-b border-border/50 text-xs font-semibold", popularity.color)}>
          <PopIcon className="h-3 w-3" />
          {popularity.label}
        </div>
      )}

      {/* Card body */}
      <div className="p-5 flex-1 flex flex-col gap-4">

        {/* Row 1 — Logo + Name + Category */}
        <div className="flex items-start gap-4">
          <ProfileLogo tool={tool} />
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/tools/${tool.slug}`}
                className="font-bold text-foreground hover:text-primary transition-colors text-base leading-tight"
              >
                {tool.name}
              </Link>
              {tool.is_verified && <BadgeCheck className="h-4 w-4 text-blue-400 shrink-0" />}
              {tool.africa_friendly && (
                <span title="Africa-Friendly" className="text-base leading-none">🌍</span>
              )}
            </div>
            {categoryLabel && (
              <span className="mt-1 inline-block text-xs text-muted-foreground capitalize">
                {categoryLabel}
              </span>
            )}
          </div>
        </div>

        {/* Row 2 — Short description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {tool.tagline || tool.description || "AI-powered tool"}
        </p>

        {/* Row 3 — Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Row 4 — Pricing + Rating */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", pricing.color)}>
            {pricing.label}
          </span>
          {rating && rating > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              {tool.review_count != null && (
                <span>({tool.review_count.toLocaleString()} reviews)</span>
              )}
            </div>
          )}
        </div>

        {/* Row 5 — Date added */}
        {dateAdded && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>Added {dateAdded}</span>
          </div>
        )}
      </div>

      {/* Footer — Website + View Details */}
      <div className="px-5 pb-5 flex items-center gap-2 border-t border-border/50 pt-4">
        <Link
          href={`/tools/${tool.slug}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/30 text-foreground transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Details
        </Link>
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Visit <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

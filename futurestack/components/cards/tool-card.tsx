"use client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Plus } from "lucide-react";
import { ToolBadge } from "@/components/ui/tool-badge";
import type { Tool } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  tool: Tool;
  variant?: "default" | "compact" | "horizontal";
  onAddToStack?: (tool: Tool) => void;
  className?: string;
}

/** Renders tool logo image with letter-initial fallback */
export function ToolLogo({
  tool,
  size = 16,
  className,
}: {
  tool: { name: string; logo?: string | null };
  size?: number;
  className?: string;
}) {
  const sizeClass =
    size === 10 ? "h-10 w-10" : size === 12 ? "h-12 w-12" : "h-16 w-16";
  const textSize =
    size === 10 ? "text-sm" : size === 12 ? "text-lg" : "text-2xl";
  const isExternal = tool.logo?.startsWith("http");

  if (tool.logo) {
    return (
      <div
        className={cn(
          sizeClass,
          "shrink-0 rounded-xl overflow-hidden bg-secondary flex items-center justify-center p-1.5",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tool.logo}
          alt={`${tool.name} logo`}
          width={size * 4}
          height={size * 4}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={(e) => {
            // On error, hide image and show parent's bg
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        "shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10",
        className,
      )}
    >
      <span className={cn(textSize, "font-bold text-primary")}>
        {tool.name[0]}
      </span>
    </div>
  );
}

export function ToolCard({
  tool,
  variant = "default",
  onAddToStack,
  className,
}: ToolCardProps) {
  const displayBadges = (tool.badges ?? []).slice(0, 3);

  if (variant === "horizontal") {
    return (
      <Card
        className={cn(
          "flex items-center gap-4 p-4 transition-all hover:shadow-md hover:border-primary/50",
          className,
        )}
      >
        <ToolLogo tool={tool} size={12} />
        <div className="flex-1 min-w-0">
          <Link
            href={`/tools/${tool.slug}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {tool.name}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {tool.shortDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span>{tool.rating}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddToStack?.(tool)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "p-4 transition-all hover:shadow-md hover:border-primary/50",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <ToolLogo tool={tool} size={10} />
          <div className="flex-1 min-w-0">
            <Link
              href={`/tools/${tool.slug}`}
              className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {tool.name}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" />
                <span>{tool.rating}</span>
              </div>
              {tool.pricing.hasFree && <ToolBadge badge="free" size="sm" />}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group flex flex-col p-6 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex justify-center">
        <ToolLogo tool={tool} size={16} />
      </div>

      {/* Name & Description */}
      <div className="mt-4 text-center">
        <Link
          href={`/tools/${tool.slug}`}
          className="font-semibold text-foreground hover:text-primary transition-colors"
        >
          {tool.name}
        </Link>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {tool.shortDescription}
        </p>
      </div>

      {/* Badges */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {displayBadges.map((badge) => (
          <ToolBadge key={badge} badge={badge} />
        ))}
      </div>

      {/* Rating */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                star <= Math.round(tool.rating)
                  ? "fill-accent text-accent"
                  : "fill-muted text-muted",
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-foreground">
          {tool.rating}
        </span>
        <span className="text-sm text-muted-foreground">
          ({(tool.reviewCount ?? 0).toLocaleString()})
        </span>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-2">
        <Button variant="outline" className="flex-1" asChild>
          <Link href={`/tools/${tool.slug}`}>View Details</Link>
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={() => onAddToStack?.(tool)}
          title="Add to stack"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

// Leaderboard row variant for homepage
export function ToolLeaderboardRow({
  tool,
  rank,
  onAddToStack,
}: {
  tool: Tool;
  rank: number;
  onAddToStack?: (tool: Tool) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:bg-secondary/50 hover:border-primary/30">
      {/* Rank */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold",
          rank === 1 && "bg-accent/20 text-accent",
          rank === 2 && "bg-muted text-muted-foreground",
          rank === 3 && "bg-muted text-muted-foreground",
          rank > 3 && "bg-secondary text-muted-foreground",
        )}
      >
        #{rank}
      </div>

      {/* Logo */}
      <ToolLogo tool={tool} size={10} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/tools/${tool.slug}`}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          {tool.name}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span>{tool.rating}</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground capitalize">
            {tool.category}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/tools/${tool.slug}`}>View</Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddToStack?.(tool)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Stack
        </Button>
      </div>
    </div>
  );
}

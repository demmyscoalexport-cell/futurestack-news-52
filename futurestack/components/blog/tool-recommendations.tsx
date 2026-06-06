import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BlogToolRecommendation } from "@/lib/blog/types";

interface ToolRecommendationsProps {
  tools: BlogToolRecommendation[];
  title?: string;
  className?: string;
}

export function ToolRecommendations({
  tools,
  title = "Recommended Tools",
  className,
}: ToolRecommendationsProps) {
  if (!tools.length) return null;

  return (
    <aside
      className={cn(
        "rounded-discova-lg border border-neutral-stroke/60 bg-neutral-surface overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <Zap className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border/30">
        {tools.slice(0, 6).map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
      <div className="px-4 py-3 border-t border-border/30">
        <Link
          href="/tools"
          className="text-xs text-brand-primary hover:text-brand-lilac transition-colors font-medium"
        >
          Browse all AI tools →
        </Link>
      </div>
    </aside>
  );
}

function ToolCard({ tool }: { tool: BlogToolRecommendation }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
      {/* Logo */}
      <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-secondary/60 border border-border/40 shrink-0">
        {tool.logo ? (
          <Image src={tool.logo} alt={tool.name} fill className="object-cover" sizes="36px" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-violet-900/20 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-primary">
              {tool.name[0]}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
          {tool.pricingModel === "free" && (
            <Badge variant="outline" className="text-[9px] border-green-500/30 bg-green-500/10 text-green-400 py-0">
              Free
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
        {tool.rating && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <Star className="h-2.5 w-2.5 fill-brand-gold text-brand-gold" />
            <span className="text-[10px] text-muted-foreground">{tool.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      {tool.visitUrl ? (
        <a
          href={tool.visitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs text-brand-primary hover:text-brand-lilac transition-colors font-medium"
        >
          Visit <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <Link
          href={`/tools/${tool.slug}`}
          className="shrink-0 text-xs text-brand-primary hover:text-brand-lilac transition-colors font-medium"
        >
          View
        </Link>
      )}
    </div>
  );
}

export function InlineToolCard({ tool }: { tool: BlogToolRecommendation }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-discova-lg border border-neutral-stroke/60 bg-neutral-surface hover:border-brand-primary/40 card-lift transition-all my-4">
      <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-secondary/60 border border-border/40 shrink-0">
        {tool.logo ? (
          <Image src={tool.logo} alt={tool.name} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-violet-900/20 flex items-center justify-center">
            <span className="text-base font-bold text-brand-primary">{tool.name[0]}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">{tool.name}</p>
          <Badge variant="outline" className="text-[10px] border-border/60">{tool.category}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{tool.description}</p>
      </div>
      {tool.visitUrl && (
        <a
          href={tool.visitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-input bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition-all"
        >
          Try it <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

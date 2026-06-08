import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPricingLabel, type ToolComparisonSeed } from "@/lib/tool-intelligence";

interface ToolAlternativeCardProps {
  tool: ToolComparisonSeed;
}

export function ToolAlternativeCard({ tool }: ToolAlternativeCardProps) {
  const pricing = tool.pricing_model
    ? tool.pricing_model.charAt(0).toUpperCase() + tool.pricing_model.slice(1)
    : getPricingLabel(tool as object);

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex items-center gap-4 rounded-[20px] border border-neutral-stroke bg-neutral-surface/60 p-4 transition-colors hover:border-brand-primary/40"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-stroke bg-white p-2">
        {tool.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tool.logo} alt={`${tool.name} logo`} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xl font-bold text-brand-primary">{tool.name[0]}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-foreground group-hover:text-brand-lilac">{tool.name}</p>
        {tool.tagline && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{tool.tagline}</p>}
        <p className="mt-1 text-xs font-medium text-muted-foreground">{pricing}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand-lilac" />
    </Link>
  );
}

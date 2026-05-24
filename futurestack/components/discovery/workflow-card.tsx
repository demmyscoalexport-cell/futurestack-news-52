"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AfricaVerifiedBadge } from "@/components/discovery/verified-badge";
import { cn } from "@/lib/utils";

export interface WorkflowItem {
  id: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  title: string;
  description: string;
  tools: string[];
  steps: string[];
  cost: string;
  difficulty: string;
  category: string;
  naijaSuitable: boolean;
  learnHref: string;
  discoverHref: string;
}

const difficultyColor: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Advanced: "bg-rose-500/15 text-rose-300 border-rose-500/20",
};

interface WorkflowCardProps {
  workflow: WorkflowItem;
  expanded: boolean;
  onToggle: () => void;
}

export function WorkflowCard({ workflow: wf, expanded, onToggle }: WorkflowCardProps) {
  const Icon = wf.icon;

  return (
    <div
      className={cn(
        "rounded-discova-lg border bg-neutral-surface/80 p-4 sm:p-5 card-lift transition-all",
        wf.border,
        "hover:border-brand-primary/40",
      )}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-input", wf.bg)}>
          <Icon className={cn("h-5 w-5", wf.color)} />
        </div>
        {wf.naijaSuitable && <AfricaVerifiedBadge />}
      </div>

      <h3 className="font-bold text-sm sm:text-base text-foreground mb-1.5">{wf.title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">{wf.description}</p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={cn("rounded-pill border px-2 py-0.5 text-[10px] font-medium", difficultyColor[wf.difficulty])}>
          {wf.difficulty}
        </span>
        <span className="text-[10px] text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded-pill border border-neutral-stroke/40">
          {wf.steps.length} steps
        </span>
        <span className="text-[10px] text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded-pill border border-neutral-stroke/40">
          {wf.cost}
        </span>
      </div>

      <div className="flex items-center gap-1 flex-wrap mb-4">
        {wf.tools.map((tool) => (
          <span
            key={tool}
            className="text-[10px] bg-brand-primary/8 text-brand-lilac px-2 py-0.5 rounded-pill border border-brand-primary/20"
          >
            {tool}
          </span>
        ))}
      </div>

      {expanded && (
        <div className="mb-4 border-t border-neutral-stroke/40 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Steps</p>
          <ol className="space-y-2">
            {wf.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="shrink-0 font-bold text-brand-primary w-5">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button size="sm" variant="outline" className="flex-1 h-9 text-xs border-neutral-stroke" asChild>
              <Link href={wf.discoverHref}>
                Find Tools <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <Button size="sm" className="flex-1 h-9 text-xs bg-brand-primary hover:bg-brand-primary/90" asChild>
              <Link href={wf.learnHref}>Learn More</Link>
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-1.5 rounded-input border border-neutral-stroke/50 bg-white/[0.03] hover:border-brand-primary/30 transition-colors h-9 text-xs font-medium text-foreground"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" /> Hide Steps
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" /> View Workflow
          </>
        )}
      </button>
    </div>
  );
}

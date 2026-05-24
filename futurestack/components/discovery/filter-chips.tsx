"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
  variant?: "default" | "gold" | "success";
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll?: () => void;
  className?: string;
}

const VARIANTS = {
  default: "bg-brand-primary/10 text-brand-lilac border-brand-primary/30",
  gold: "bg-brand-gold/10 text-brand-gold border-brand-gold/30",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

export function FilterChips({ chips, onClearAll, className }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium",
            VARIANTS[chip.variant ?? "default"],
          )}
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="hover:opacity-70 transition-opacity"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

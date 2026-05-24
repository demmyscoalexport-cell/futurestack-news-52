"use client";

import { X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function FilterSheet({ open, onClose, title = "Filters", children }: FilterSheetProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "fixed z-50 lg:hidden",
          "inset-x-0 bottom-0 max-h-[85vh] rounded-t-discova-lg",
          "border border-neutral-stroke/60 bg-neutral-surface",
          "shadow-[0_-8px_40px_rgba(0,0,0,0.4)]",
          "animate-in slide-in-from-bottom duration-300",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-neutral-stroke/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand-primary" />
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] max-h-[calc(85vh-3.5rem)]">
          {children}
        </div>
        <div className="border-t border-neutral-stroke/40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-pill bg-brand-primary py-3 text-sm font-semibold text-neutral-white hover:bg-brand-primary/90 transition-colors"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}

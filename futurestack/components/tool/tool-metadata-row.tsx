"use client";

import { Calendar, DollarSign, MonitorSmartphone } from "lucide-react";
import { VerifiedBadge } from "@/components/discovery/verified-badge";
import { cn } from "@/lib/utils";
import {
  formatLastUpdated,
  getIsVerified,
  getPlatformsLabel,
  getPricingLabel,
  type ToolRecord,
} from "@/lib/tool-intelligence";

interface ToolMetadataRowProps {
  tool: ToolRecord;
  className?: string;
  compact?: boolean;
}

export function ToolMetadataRow({ tool, className, compact = false }: ToolMetadataRowProps) {
  const items = [
    {
      icon: DollarSign,
      label: "Pricing",
      value: getPricingLabel(tool),
    },
    {
      icon: MonitorSmartphone,
      label: "Platforms",
      value: getPlatformsLabel(tool),
    },
    {
      icon: Calendar,
      label: "Updated",
      value: formatLastUpdated(tool),
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "text-[11px]" : "text-xs",
        className,
      )}
    >
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-pill border border-neutral-stroke bg-white/[0.04] px-2.5 py-1 font-medium text-muted-foreground"
        >
          <item.icon className={cn("shrink-0 text-brand-lilac", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
          <span className="text-muted-foreground/70">{item.label}:</span>
          <span className="text-foreground">{item.value}</span>
        </span>
      ))}
      {getIsVerified(tool) && <VerifiedBadge size={compact ? "sm" : "md"} />}
    </div>
  );
}

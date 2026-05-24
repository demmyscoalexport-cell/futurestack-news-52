import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function VerifiedBadge({ label = "Verified", className, size = "sm" }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        "border-brand-primary/40 bg-brand-primary/10 text-brand-lilac",
        className,
      )}
    >
      <BadgeCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label}
    </span>
  );
}

export function AfricaVerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[10px] font-semibold",
        "border-brand-gold/40 bg-brand-gold/10 text-brand-gold",
        className,
      )}
    >
      <BadgeCheck className="h-3 w-3" />
      Africa Verified
    </span>
  );
}

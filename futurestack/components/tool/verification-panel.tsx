import { BadgeCheck, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIsVerified, getVerificationChecks, type ToolRecord } from "@/lib/tool-intelligence";

interface VerificationPanelProps {
  tool: ToolRecord;
  className?: string;
}

export function VerificationPanel({ tool, className }: VerificationPanelProps) {
  const checks = getVerificationChecks(tool);
  const verified = getIsVerified(tool);

  return (
    <section className={cn("rounded-[24px] border border-neutral-stroke bg-neutral-surface/70 p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Verification</h2>
        <span
          className={cn(
            "rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
            verified
              ? "border border-brand-primary/40 bg-brand-primary/10 text-brand-lilac"
              : "border border-neutral-stroke text-muted-foreground",
          )}
        >
          {verified ? "Verified" : "In review"}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {checks.map((check) => (
          <div key={check.id} className="flex items-start gap-3">
            {check.passed ? (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-lilac" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{check.label}</p>
              {check.detail && <p className="mt-0.5 text-xs text-muted-foreground">{check.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

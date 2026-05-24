import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  badge?: string;
}

export function SectionHeader({ title, subtitle, action, className, badge }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-6", className)}>
      <div className="min-w-0">
        {badge && (
          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
            {badge}
          </span>
        )}
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{title}</h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

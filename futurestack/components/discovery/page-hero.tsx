import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function PageHero({ title, subtitle, children, className, compact }: PageHeroProps) {
  return (
    <section className={cn("relative overflow-hidden hero-glow border-b border-neutral-stroke/40", className)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="orb-glow top-0 left-1/3 h-[400px] w-[400px] bg-brand-primary/10" />
        <div className="orb-glow bottom-0 right-1/4 h-[250px] w-[250px] bg-brand-lilac/8" />
      </div>
      <div
        className={cn(
          "container relative mx-auto px-4 sm:px-6 lg:px-8",
          compact ? "py-8 sm:py-10" : "py-10 sm:py-14 lg:py-16",
        )}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight text-foreground mb-3 sm:mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

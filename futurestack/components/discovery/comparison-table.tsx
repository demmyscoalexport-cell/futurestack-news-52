import Link from "next/link";
import { ExternalLink, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonTool {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  tool_scores?: Record<string, number>;
  tool_pricing?: { id: string; tier_name: string; price_monthly?: number | null }[];
}

interface ComparisonHeroProps {
  tool1: ComparisonTool;
  tool2: ComparisonTool;
  summary: string;
  winnerId?: string | null;
}

export function ComparisonHero({ tool1, tool2, summary, winnerId }: ComparisonHeroProps) {
  return (
    <section className="relative overflow-hidden hero-glow border-b border-neutral-stroke/40 py-10 sm:py-14 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6 sm:mb-8 flex-wrap">
          <ToolLogo tool={tool1} winner={winnerId === tool1.id} />
          <div className="text-xl sm:text-3xl font-black text-brand-lilac italic">VS</div>
          <ToolLogo tool={tool2} winner={winnerId === tool2.id} />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3 sm:mb-4 px-2">
          {tool1.name}{" "}
          <span className="text-muted-foreground font-light">vs</span>{" "}
          {tool2.name}
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
          {summary}
        </p>
        {winnerId && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-pill border border-brand-gold/40 bg-brand-gold/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-brand-gold">
            <Trophy className="h-4 w-4" />
            Winner: {winnerId === tool1.id ? tool1.name : tool2.name}
          </div>
        )}
      </div>
    </section>
  );
}

function ToolLogo({ tool, winner }: { tool: ComparisonTool; winner?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "w-16 h-16 sm:w-20 sm:h-20 rounded-discova-lg flex items-center justify-center overflow-hidden border-2 p-2",
          winner ? "border-brand-gold bg-brand-gold/10 shadow-[0_0_24px_rgba(243,195,68,0.25)]" : "border-neutral-stroke bg-neutral-surface",
        )}
      >
        {tool.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tool.logo} alt={tool.name} className="w-full h-full object-contain" />
        ) : (
          <span className="text-2xl sm:text-3xl font-black text-brand-primary">{tool.name.slice(0, 1)}</span>
        )}
      </div>
      <Link href={`/tools/${tool.slug}`} className="text-xs sm:text-sm font-semibold text-foreground hover:text-brand-lilac transition-colors">
        {tool.name}
      </Link>
    </div>
  );
}

interface ScoreRowProps {
  label: string;
  score1: number;
  score2: number;
}

export function ComparisonScoreRow({ label, score1, score2 }: ScoreRowProps) {
  const v1 = Number(score1).toFixed(1);
  const v2 = Number(score2).toFixed(1);

  return (
    <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center py-3 border-b border-neutral-stroke/30 last:border-0">
      <div className="sm:col-span-3 text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="sm:col-span-4 flex items-center gap-2 sm:gap-3">
        <div className="h-2 sm:h-2.5 bg-neutral-stroke/50 rounded-full flex-1 relative overflow-hidden">
          <div
            className={cn("absolute right-0 top-0 h-full rounded-full", score1 >= score2 ? "bg-brand-primary" : "bg-neutral-stroke")}
            style={{ width: `${(score1 / 10) * 100}%` }}
          />
        </div>
        <span className="font-bold text-foreground tabular-nums w-8 text-sm">{v1}</span>
      </div>
      <div className="hidden sm:block sm:col-span-1 text-center text-xs text-muted-foreground">VS</div>
      <div className="sm:col-span-4 flex items-center gap-2 sm:gap-3">
        <span className="font-bold text-foreground tabular-nums w-8 text-right text-sm sm:order-first">{v2}</span>
        <div className="h-2 sm:h-2.5 bg-neutral-stroke/50 rounded-full flex-1 relative overflow-hidden sm:order-last">
          <div
            className={cn("absolute left-0 top-0 h-full rounded-full", score2 >= score1 ? "bg-brand-lilac" : "bg-neutral-stroke")}
            style={{ width: `${(score2 / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ComparisonCTA({ tool }: { tool: ComparisonTool }) {
  return (
    <a
      href={`/api/affiliate/${tool.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 py-3 sm:py-4 bg-brand-primary hover:bg-brand-primary/90 text-neutral-white font-bold rounded-input transition-colors text-sm sm:text-base"
    >
      <ExternalLink className="w-4 h-4" />
      Try {tool.name}
    </a>
  );
}

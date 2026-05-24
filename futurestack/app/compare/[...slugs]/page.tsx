import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  ComparisonHero,
  ComparisonScoreRow,
  ComparisonCTA,
} from "@/components/discovery/comparison-table";
import { SectionHeader } from "@/components/discovery/section-header";
import { cn } from "@/lib/utils";

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slugs: string[] }>;
}) {
  const { slugs } = await params;

  if (!slugs || slugs.length === 0) return notFound();

  const comparisonStr = slugs[0];
  if (!comparisonStr.includes("-vs-")) return notFound();

  const [slug1, slug2] = comparisonStr.split("-vs-");
  const supabase = await createClient();

  const [tool1Res, tool2Res] = await Promise.all([
    supabase.from("tools").select("*, tool_scores(*), tool_pricing(*)").eq("slug", slug1).single(),
    supabase.from("tools").select("*, tool_scores(*), tool_pricing(*)").eq("slug", slug2).single(),
  ]);

  const tool1 = tool1Res.data;
  const tool2 = tool2Res.data;

  if (!tool1 || !tool2) return notFound();

  const scores1 = Array.isArray(tool1.tool_scores) ? tool1.tool_scores[0] : tool1.tool_scores;
  const scores2 = Array.isArray(tool2.tool_scores) ? tool2.tool_scores[0] : tool2.tool_scores;

  const { data: existingCompare } = await supabase
    .from("tool_comparisons")
    .select("*")
    .or(`and(tool_a_id.eq.${tool1.id},tool_b_id.eq.${tool2.id}),and(tool_a_id.eq.${tool2.id},tool_b_id.eq.${tool1.id})`)
    .maybeSingle();

  const comparison = existingCompare ?? {
    summary: `Both ${tool1.name} and ${tool2.name} excel in their categories. Compare pricing, features, and DISCOVA scores to pick the best fit for your workflow.`,
    winner_tool_id: tool1.id,
  };

  const scoreFields = [
    { key: "ease_of_use", label: "Ease of Use" },
    { key: "value_for_money", label: "Value" },
    { key: "feature_depth", label: "Features" },
    { key: "support_quality", label: "Support" },
    { key: "ai_capability", label: "AI Power" },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <ComparisonHero
        tool1={tool1}
        tool2={tool2}
        summary={comparison.summary}
        winnerId={comparison.winner_tool_id}
      />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
        <section className="glass-panel rounded-discova-lg p-5 sm:p-8 border border-neutral-stroke/60 mb-6 sm:mb-8">
          <SectionHeader title="Scorecard Comparison" badge="DISCOVA Scores" />
          <div>
            {scoreFields.map((stat) => (
              <ComparisonScoreRow
                key={stat.key}
                label={stat.label}
                score1={scores1?.[stat.key] ?? 0}
                score2={scores2?.[stat.key] ?? 0}
              />
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-discova-lg p-5 sm:p-8 border border-neutral-stroke/60 mb-6 sm:mb-8">
          <SectionHeader title="Pricing Breakdown" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {[tool1, tool2].map((tool, idx) => (
              <div key={tool.id}>
                <h3 className={cn(
                  "text-lg font-bold mb-4",
                  idx === 0 ? "text-brand-primary" : "text-brand-lilac",
                )}>
                  {tool.name}
                </h3>
                <div className="space-y-3">
                  {tool.tool_pricing?.length > 0 ? (
                    tool.tool_pricing.map((tier: { id: string; tier_name: string; price_monthly?: number | null }) => (
                      <div
                        key={tier.id}
                        className="p-4 rounded-input border border-neutral-stroke/50 bg-white/[0.02]"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{tier.tier_name}</span>
                          <span className="font-bold text-foreground text-sm shrink-0">
                            {tier.price_monthly ? `$${tier.price_monthly}/mo` : "Free"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No pricing available.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
          <ComparisonCTA tool={tool1} />
          <ComparisonCTA tool={tool2} />
        </section>

        <div className="text-center">
          <Link
            href={`/tools?search=${encodeURIComponent(`${tool1.name} alternatives`)}`}
            className="text-sm text-brand-primary hover:text-brand-lilac transition-colors"
          >
            Browse more tools like {tool1.name} →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

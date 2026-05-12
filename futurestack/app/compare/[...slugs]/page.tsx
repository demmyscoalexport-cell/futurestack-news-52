import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Check, X, ExternalLink } from "lucide-react";

// Layout simplified to standard Next.js 15 App router syntax per user requirements
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
    supabase
      .from("tools")
      .select("*, tool_scores(*), tool_pricing(*)")
      .eq("slug", slug1)
      .single(),
    supabase
      .from("tools")
      .select("*, tool_scores(*), tool_pricing(*)")
      .eq("slug", slug2)
      .single(),
  ]);

  const tool1 = tool1Res.data;
  const tool2 = tool2Res.data;

  if (!tool1 || !tool2) return notFound();

  let comparison = null;
  const { data: existingCompare } = await supabase
    .from("tool_comparisons")
    .select("*")
    .or(
      `and(tool_a_id.eq.\${tool1.id},tool_b_id.eq.\${tool2.id}),and(tool_a_id.eq.\${tool2.id},tool_b_id.eq.\${tool1.id})`,
    )
    .single();

  if (existingCompare) {
    comparison = existingCompare;
  } else {
    // Phase 4: Anthropic logic can be placed here to generate AI verdict synchronously.
    // For demonstration of the UI layout, using placeholder data if not present.
    comparison = {
      summary: `Both ${tool1.name} and ${tool2.name} provide excellent capabilities for their categories, but they specialize in different use-cases ${tool1.name} wins on design, whereas ${tool2.name} excels on raw performance.`,
      winner_tool_id: tool1.id,
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Comparison Hero */}
      <section className="bg-slate-900 border-b border-slate-800 text-center py-20 px-4 mb-12">
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-4xl font-black text-slate-800 shadow-xl">
            {tool1.logo ? (
              <img
                src={tool1.logo}
                alt={tool1.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              tool1.name.slice(0, 1)
            )}
          </div>
          <div className="text-3xl font-black text-slate-600 italic">VS</div>
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-4xl font-black text-slate-800 shadow-xl">
            {tool2.logo ? (
              <img
                src={tool2.logo}
                alt={tool2.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              tool2.name.slice(0, 1)
            )}
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          {tool1.name} <span className="text-slate-500 font-light">vs</span>{" "}
          {tool2.name}
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          {comparison.summary}
        </p>
      </section>

      <div className="container mx-auto px-4 lg:grid lg:grid-cols-1 gap-12 max-w-5xl">
        {/* Scorecard Matrix */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            Scorecard Comparison
          </h2>
          <div className="space-y-6">
            {[
              { key: "ease_of_use", label: "Ease of Use" },
              { key: "value_for_money", label: "Value" },
              { key: "feature_depth", label: "Features" },
              { key: "support_quality", label: "Support" },
              { key: "ai_capability", label: "AI Power" },
            ].map((stat) => {
              const s1 = tool1.tool_scores?.[stat.key] || 0;
              const s2 = tool2.tool_scores?.[stat.key] || 0;
              const v1 = Number(s1).toFixed(1);
              const v2 = Number(s2).toFixed(1);
              return (
                <div
                  key={stat.key}
                  className="grid grid-cols-12 gap-4 items-center"
                >
                  <div className="col-span-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 relative overflow-hidden">
                      <div
                        className={`absolute right-0 top-0 h-full ${s1 >= s2 ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"}`}
                        style={{ width: `${(s1 / 10) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums w-8">
                      {v1}
                    </span>
                  </div>
                  <div className="col-span-1 text-center text-xs text-slate-300 dark:text-slate-700">
                    VS
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums w-8 text-right">
                      {v2}
                    </span>
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 relative overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full ${s2 >= s1 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                        style={{ width: `${(s2 / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pricing Matrix */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            Pricing Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                {tool1.name}
              </h3>
              <div className="space-y-4">
                {tool1.tool_pricing?.length > 0 ? (
                  tool1.tool_pricing.map((tier: any) => (
                    <div
                      key={tier.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {tier.tier_name}
                        </span>
                        <span className="font-bold">
                          {tier.price_monthly
                            ? `$${tier.price_monthly}`
                            : "Free"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No pricing available.</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-500 mb-4">
                {tool2.name}
              </h3>
              <div className="space-y-4">
                {tool2.tool_pricing?.length > 0 ? (
                  tool2.tool_pricing.map((tier: any) => (
                    <div
                      key={tier.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {tier.tier_name}
                        </span>
                        <span className="font-bold">
                          {tier.price_monthly
                            ? `$${tier.price_monthly}`
                            : "Free"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No pricing available.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Visit CTAs */}
        <section className="mt-8 grid grid-cols-2 gap-6">
          <a
            href={`/api/affiliate/${tool1.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Try {tool1.name}
          </a>
          <a
            href={`/api/affiliate/${tool2.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Try {tool2.name}
          </a>
        </section>
      </div>
    </div>
  );
}

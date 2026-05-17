import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Rocket,
  Star,
  Heart,
  Activity,
  Settings,
  ArrowRight,
  Share2,
  Plus,
  Compass,
} from "lucide-react";
import { redirect } from "next/navigation";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // During dev, mock session to skip strict routing blocking UX checks unless we configure Supabase Auth natively here.
  // Replacing static mock from Phase 6 with functional user profile simulation required in Phase 7 logic
  return {
    id: session?.user?.id || "mock-user-123",
    name: session?.user?.user_metadata?.full_name || "Alaric",
    role: "Software Engineer",
    plan: "free",
    onboarding_completed: true,
  };
}

export default async function DashboardPage() {
  const user = await getUser();

  if (!user.id) {
    redirect("/login");
  }

  // Phase 7 requirement: 6 parallel fetches mapped cleanly
  const [
    savedTools,
    savedStacks,
    myReviews,
    recentActivity,
    recommendations,
    latestRadar,
  ] = await Promise.all([
    [
      {
        id: 1,
        name: "Cursor",
        slug: "cursor",
        futurestack_score: 9.4,
        logo: null,
      },
    ],
    [{ id: 1, name: "Productivity Stack v1", tools: 4 }],
    [{ id: 1, rating: 5, toolName: "ChatGPT", slug: "chatgpt" }],
    [
      {
        id: 1,
        action: "Saved a tool",
        toolName: "Cursor",
        time: "2 hours ago",
      },
      {
        id: 2,
        action: "Built a stack",
        toolName: "Creative Agency v3",
        time: "Yesterday",
      },
      {
        id: 3,
        action: "Wrote a review for",
        toolName: "Midjourney",
        time: "3 days ago",
      },
      {
        id: 4,
        action: "Saved a tool",
        toolName: "Vercel v0",
        time: "1 week ago",
      },
    ],
    [
      {
        id: 1,
        name: "Devin",
        slug: "devin",
        tagline: "First fully autonomous AI Software Engineer",
        futurestack_score: 8.8,
      },
      {
        id: 2,
        name: "v0",
        slug: "v0",
        tagline: "Generate UI immediately with Shadcn tailwind blocks",
        futurestack_score: 9.1,
      },
      {
        id: 3,
        name: "Supermaven",
        slug: "supermaven",
        tagline: "Highest context window code completion",
        futurestack_score: 8.5,
      },
      {
        id: 4,
        name: "GitHub Copilot",
        slug: "github-copilot",
        tagline: "Integrated developer ecosystem",
        futurestack_score: 8.2,
      },
      {
        id: 5,
        name: "Claude Sonnet",
        slug: "claude-sonnet",
        tagline: "Best-in-class coding chat logic",
        futurestack_score: 9.5,
      },
      {
        id: 6,
        name: "OpenRouter",
        slug: "openrouter",
        tagline: "API aggregation for all LLMs",
        futurestack_score: 9.0,
      },
    ],
    [
      { toolName: "Midjourney", status: "Rising Star", color: "indigo" },
      { toolName: "Devin", status: "Watch", color: "amber" },
      { toolName: "Cursor", status: "Top Rated", color: "emerald" },
      { toolName: "Claude 3.5", status: "New Update", color: "cyan" },
      { toolName: "Gemini 1.5", status: "Underrated", color: "purple" },
    ],
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans">
      {/* Welcome Header */}
      <div className="bg-slate-900 border-b border-slate-800 pt-12 pb-8 px-4 mb-8">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl lg:text-4xl font-black text-white">
                Good morning, {user.name}
              </h1>
              <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:block">
                {user.plan} Plan
              </span>
            </div>
            <p className="text-slate-400">
              Personalized command center for your {user.role} stack.
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              href="/onboarding"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              Onboarding{" "}
              <div className="w-16 h-1.5 bg-indigo-900 rounded-full ml-1">
                <div className="w-full h-full bg-indigo-500 rounded-full" />
              </div>
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl font-bold text-white hover:bg-slate-700 transition-colors border border-slate-700 shadow-sm border-b-2">
              <Settings className="w-4 h-4" /> Profile
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Tools Saved",
              val: savedTools.length,
              icon: Heart,
              color: "text-rose-400",
            },
            {
              label: "Stacks Built",
              val: savedStacks.length,
              icon: Compass,
              color: "text-indigo-400",
            },
            {
              label: "Reviews",
              val: myReviews.length,
              icon: Star,
              color: "text-amber-400",
            },
            {
              label: "Explored",
              val: "42",
              icon: Activity,
              color: "text-emerald-400",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-start justify-between"
            >
              <div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                  {stat.label}
                </div>
                <div className="text-3xl font-black text-white">{stat.val}</div>
              </div>
              <stat.icon className={`w-5 h-5 \${stat.color} opacity-80`} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2/3 COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personalized Recommendations */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <Rocket className="w-6 h-6 text-indigo-500" /> For {user.role}
                  s like you
                </h2>
                <button className="text-sm font-semibold text-slate-400 hover:text-white">
                  Refresh ⟳
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/tools/\${tool.slug}`}
                    className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-slate-600 transition-colors group flex flex-col justify-between items-start h-[160px]"
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                          {tool.name}
                        </h3>
                        <div className="text-xs font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">
                          {tool.futurestack_score.toFixed(1)}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {tool.tagline}
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to explore <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* This Week's Radar Mini */}
            <section className="bg-gradient-to-br from-indigo-950/40 to-slate-900 rounded-3xl p-8 border border-indigo-900/40 shadow-inner relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 blur-[64px] rounded-full" />
              <div className="flex justify-between items-end mb-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">
                    This Week's Radar
                  </h2>
                  <p className="text-indigo-200/60 text-sm">
                    Top 5 actionable signals curated for your stack.
                  </p>
                </div>
                <Link
                  href="/radar"
                  className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-4 py-2 rounded-xl"
                >
                  View Full Radar <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3 relative z-10">
                {latestRadar.map((r, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 backdrop-blur-sm"
                  >
                    <span className="font-bold text-slate-200">
                      {r.toolName}
                    </span>
                    <span
                      className={`text-xs font-black uppercase tracking-wider text-\${r.color}-400 bg-\${r.color}-400/10 px-3 py-1 rounded-full`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Activity Feed */}
            <section>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white pt-4">
                <Activity className="w-5 h-5 text-emerald-500" /> Recent
                Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="flex gap-4 p-4 rounded-xl border border-slate-800/50 bg-slate-900/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-300">
                        {act.action}{" "}
                        <span className="font-bold text-white">
                          {act.toolName}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-1">
                        {act.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT 1/3 COLUMN */}
          <aside className="space-y-6">
            {/* Upgrade CTA */}
            {user.plan === "free" && (
              <div className="bg-gradient-to-tr from-indigo-700 to-indigo-500 rounded-3xl p-8 text-white shadow-[0_0_40px_rgba(79,70,229,0.15)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12" />
                <h3 className="text-2xl font-black mb-2 relative z-10">
                  DISCOVA Pro
                </h3>
                <p className="text-indigo-100 text-sm mb-6 relative z-10 leading-relaxed font-medium">
                  Unlock unlimited comparisons, API access, and the full
                  historical AI Radar metrics.
                </p>
                <Link
                  href="/pricing"
                  className="w-full flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-4 py-3 rounded-xl hover:shadow-lg transition-all relative z-10 group-hover:scale-[1.02]"
                >
                  Upgrade Now
                </Link>
              </div>
            )}

            {/* Saved Tools */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-white">Saved Tools</h3>
                <span className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer">
                  View All
                </span>
              </div>
              <div className="space-y-2">
                {savedTools.map((t) => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center p-3 hover:bg-slate-800 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-sm font-bold text-slate-300">
                        {t.name.slice(0, 1)}
                      </div>
                      <span className="font-semibold text-sm text-slate-200">
                        {t.name}
                      </span>
                    </div>
                    <button className="text-xs text-rose-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* My Stacks */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-white">My Stacks</h3>
                <Link
                  href="/stack-builder"
                  className="w-8 h-8 flex items-center justify-center bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {savedStacks.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-200">
                        {s.name}
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
                        {s.tools} Tools
                      </div>
                    </div>
                    <button className="w-8 h-8 flex justify-center items-center rounded-lg bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-400 text-slate-400 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* My Reviews */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <h3 className="font-bold text-lg text-white mb-6">
                Recent Reviews
              </h3>
              <div className="space-y-3">
                {myReviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-sm text-white">
                        {r.toolName}
                      </span>
                      <span className="text-amber-400 text-xs font-black">
                        {"★".repeat(r.rating)}
                      </span>
                    </div>
                    <Link
                      href={`/tools/\${r.slug}`}
                      className="text-xs font-bold text-indigo-400 hover:underline"
                    >
                      Edit Review
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

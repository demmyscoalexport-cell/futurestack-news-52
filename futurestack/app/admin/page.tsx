import { redirect } from "next/navigation";
import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Users,
  FileText,
  Star,
  Mail,
  Activity,
  BarChart3,
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
  ExternalLink,
  Database,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { DB_SOURCE } from "@/lib/db";
import { config } from "@/lib/config";

async function getAdminData() {
  await checkAdminOrRedirect();

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();

  const [
    { count: pendingTools },
    { count: pendingReviews },
    { count: totalUsers },
    { count: publishedArticles },
    { data: recentTools },
    affiliateStats,
    pendingPHResult,
  ] = await Promise.all([
    supabase
      .from("tools")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "PUBLISHED"),
    supabase
      .from("tools")
      .select("id, name, slug, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    // Affiliate stats from Replit PG
    db.query(`
      SELECT
        COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '1 day')   AS today,
        COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '7 days')  AS week,
        COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '30 days') AS month
      FROM affiliate_clicks
    `).then(r => r.rows[0]).catch(() => ({ today: 0, week: 0, month: 0 })),
    // Pending PH tools from Replit PG
    db.query(`SELECT COUNT(*)::int AS n FROM tools WHERE status = 'pending_review'`)
      .then(r => r.rows[0].n as number).catch(() => 0),
  ]);

  // Top 5 tools by clicks (30d) + daily trend
  const [topAffiliateTools, dailyTrend] = await Promise.all([
    db.query(`
      SELECT t.name, t.slug, t.logo,
             COUNT(ac.id)::int AS clicks_30d
      FROM affiliate_clicks ac
      JOIN tools t ON t.id = ac.tool_id
      WHERE ac.clicked_at >= NOW() - INTERVAL '30 days'
      GROUP BY t.id, t.name, t.slug, t.logo
      ORDER BY clicks_30d DESC
      LIMIT 5
    `).then(r => r.rows).catch(() => []),
    db.query(`
      SELECT date_trunc('day', clicked_at)::date AS day,
             COUNT(*)::int AS clicks
      FROM affiliate_clicks
      WHERE clicked_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `).then(r => r.rows).catch(() => []),
  ]);

  return {
    profile,
    pendingTools,
    pendingReviews,
    totalUsers,
    publishedArticles,
    recentTools,
    affiliateStats,
    topAffiliateTools,
    dailyTrend,
    pendingPH: pendingPHResult as number,
  };
}

const stats = [
  {
    label: "Pending Tools",
    key: "pendingTools",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    label: "Pending Reviews",
    key: "pendingReviews",
    icon: Star,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    label: "Total Users",
    key: "totalUsers",
    icon: Users,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  {
    label: "Articles Live",
    key: "publishedArticles",
    icon: FileText,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
];

const navSections = [
  { href: "/admin/content", icon: FileText, label: "Content Queue" },
  { href: "/admin/tools-queue", icon: CheckCircle, label: "Tools Queue (PH)" },
  { href: "/admin/tools", icon: CheckCircle, label: "Tool Submissions" },
  { href: "/admin/reviews", icon: Star, label: "Review Moderation" },
  { href: "/admin/opportunities", icon: Activity, label: "Opportunities" },
  { href: "/admin/deals", icon: TrendingUp, label: "Deals & Discounts" },
  { href: "/admin/newsletter", icon: Mail, label: "Newsletter" },
  { href: "/admin/users", icon: Users, label: "User Management" },
  { href: "/admin/affiliates", icon: TrendingUp, label: "Affiliate Links" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/system", icon: Activity, label: "System Health" },
  { href: "/admin/errors", icon: AlertTriangle, label: "Error Monitor" },
];

export default async function AdminPage() {
  const data = await getAdminData();
  const aff = data.affiliateStats as { today: number; week: number; month: number };
  const trend = data.dailyTrend as { day: string; clicks: number }[];
  const maxClicks = Math.max(...trend.map((d) => d.clicks), 1);
  const contentfulConfigured = Boolean(config.contentful.spaceId && config.contentful.deliveryToken);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">DISCOVA Admin</h1>
            <p className="text-xs text-slate-500">
              Signed in as {data.profile?.full_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${DB_SOURCE === "supabase" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
            <Database className="w-3 h-3" />
            {DB_SOURCE === "supabase" ? "Supabase" : "Replit PG"}
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Back to Site
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen p-4 shrink-0">
          <nav className="space-y-1">
            {navSections.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium text-sm"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8">
          <h2 className="text-2xl font-black mb-8">Dashboard Overview</h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-start justify-between"
              >
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    {s.label}
                  </div>
                  <div className="text-4xl font-black text-white">
                    {(data as any)[s.key] ?? 0}
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}
                >
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Affiliate Click Analytics Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-lg">Affiliate Clicks</h3>
              </div>
              <Link
                href="/admin/affiliates"
                className="text-sm text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
              >
                Manage Links →
              </Link>
            </div>

            {/* Click stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Today", value: Number(aff.today) },
                { label: "Last 7 Days", value: Number(aff.week) },
                { label: "Last 30 Days", value: Number(aff.month) },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-white">{s.value.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 30-day daily clicks bar chart */}
            {trend.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Daily Clicks — Last 30 Days</h4>
                <div className="flex items-end gap-0.5 h-16 w-full">
                  {trend.map((d) => {
                    const pct = Math.max((d.clicks / maxClicks) * 100, 4);
                    const label = new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div
                          title={`${label}: ${d.clicks} clicks`}
                          className="w-full rounded-t-sm bg-violet-600 group-hover:bg-violet-400 transition-colors cursor-default"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>{new Date(trend[0].day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span>{new Date(trend[trend.length - 1].day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
            )}

            {/* Top tools by clicks */}
            {data.topAffiliateTools.length > 0 ? (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Top Tools (30 days)</h4>
                <div className="space-y-2">
                  {(data.topAffiliateTools as { name: string; slug: string; logo: string | null; clicks_30d: number }[]).map((t, i) => (
                    <div key={t.slug} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/40">
                      <span className="text-xs font-bold text-slate-600 w-4">{i + 1}</span>
                      {t.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.logo} alt="" className="w-6 h-6 rounded-md object-contain bg-white p-0.5 shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-violet-900 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                          {t.name[0]}
                        </div>
                      )}
                      <span className="flex-1 text-sm font-medium text-slate-200">{t.name}</span>
                      <span className="text-sm font-bold text-violet-400">{t.clicks_30d.toLocaleString()}</span>
                      <a
                        href={`/api/affiliate/${t.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-slate-400"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-600 text-sm text-center py-4">
                No clicks recorded yet — links are live and tracking will start when users visit tools.
              </p>
            )}
          </div>

          {/* Product Hunt Queue Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-lg">Product Hunt Queue</h3>
              </div>
              <Link
                href="/admin/tools-queue"
                className="text-sm text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
              >
                Review Queue →
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <div className="bg-slate-800/50 rounded-xl p-4 text-center flex-1">
                <div className="text-4xl font-black text-white">{data.pendingPH}</div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Awaiting Review</div>
              </div>
              <div className="flex-1 text-sm text-slate-400 leading-relaxed">
                <p>New tools synced daily at <span className="text-white font-semibold">08:00 UTC</span> from Product Hunt.</p>
                <p className="mt-1">Approved tools get a <span className="text-emerald-400 font-semibold">"New" badge</span> for 7 days.</p>
              </div>
            </div>
          </div>

          {/* Recent Tool Submissions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Recent Tool Submissions</h3>
              <Link
                href="/admin/tools"
                className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {(data.recentTools || []).map((tool: any) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
                >
                  <div>
                    <div className="font-semibold text-white">{tool.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(tool.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      tool.status === "pending"
                        ? "bg-amber-400/10 text-amber-400"
                        : tool.status === "approved"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {tool.status}
                  </div>
                </div>
              ))}
              {!data.recentTools?.length && (
                <p className="text-slate-500 text-sm text-center py-4">
                  No pending submissions
                </p>
              )}
            </div>
          </div>

          {/* Contentful + Database Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-lg">Content Sources</h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${DB_SOURCE === "supabase" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                DB: {DB_SOURCE === "supabase" ? "Supabase ✓" : "Replit PG"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contentful */}
              <div className="bg-slate-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${contentfulConfigured ? "bg-emerald-400" : "bg-slate-600"}`} />
                  <span className="font-semibold text-sm">Contentful CMS</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${contentfulConfigured ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-500"}`}>
                    {contentfulConfigured ? "Connected" : "Not configured"}
                  </span>
                </div>
                {contentfulConfigured ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Articles and tools published in Contentful sync automatically via webhook. Trigger a manual sync below.</p>
                    <div className="flex gap-2 mt-3">
                      <a
                        href="/api/contentful/pull"
                        target="_blank"
                        className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-2 rounded-lg transition-colors"
                      >
                        Preview (GET)
                      </a>
                      <span className="text-xs text-slate-500 flex items-center">POST to /api/contentful/pull to sync</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <p>Add these secrets to activate:</p>
                    <code className="block bg-slate-900 rounded p-2 font-mono text-slate-400 text-[10px] leading-relaxed">
                      CONTENTFUL_SPACE_ID<br />
                      CONTENTFUL_DELIVERY_TOKEN<br />
                      CONTENTFUL_MANAGEMENT_TOKEN
                    </code>
                  </div>
                )}
              </div>

              {/* Supabase migration */}
              <div className="bg-slate-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${DB_SOURCE === "supabase" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className="font-semibold text-sm">Supabase Migration</span>
                </div>
                {DB_SOURCE === "supabase" ? (
                  <p className="text-xs text-emerald-400 font-semibold">Already on Supabase — all queries are live.</p>
                ) : (
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <p>To migrate from Replit PG → Supabase:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400">
                      <li>Run schema in Supabase SQL Editor</li>
                      <li><code className="text-slate-300">npm run migrate:supabase</code></li>
                      <li>Run generated <code className="text-slate-300">data_migration.sql</code></li>
                      <li>Add secret: <code className="text-slate-300">SUPABASE_DB_URL</code></li>
                      <li>Restart — auto-switches to Supabase</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                label: "Approve Pending Tools",
                href: "/admin/tools?filter=pending",
                color: "bg-amber-600 hover:bg-amber-500",
              },
              {
                label: "Moderate Reviews",
                href: "/admin/reviews?filter=pending",
                color: "bg-blue-600 hover:bg-blue-500",
              },
              {
                label: "Manage Affiliates",
                href: "/admin/affiliates",
                color: "bg-violet-600 hover:bg-violet-500",
              },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`${action.color} text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors text-center`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

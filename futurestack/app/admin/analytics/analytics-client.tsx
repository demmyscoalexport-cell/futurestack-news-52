"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield, ArrowLeft, BarChart3, Users, FileText,
  Globe, Star, TrendingUp, Zap,
} from "lucide-react";

interface PlatformStats {
  total_tools: number;
  featured_tools: number;
  africa_friendly: number;
  total_articles: number;
  published_articles: number;
  total_reviews: number;
  total_users: number;
  affiliate_links: number;
  total_clicks: number;
}

interface AffSummary { today: number; week: number; month: number; total: number; }
interface DayTick    { day: string; clicks: number; }
interface TopTool    { name: string; slug: string; logo: string | null; clicks: number; }

export default function AnalyticsClient() {
  const [stats, setStats]   = useState<PlatformStats | null>(null);
  const [aff, setAff]       = useState<AffSummary | null>(null);
  const [trend, setTrend]   = useState<DayTick[]>([]);
  const [topTools, setTop]  = useState<TopTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/affiliate-stats").then(r => r.ok ? r.json() : null),
    ]).then(([affData]) => {
      if (affData) {
        setAff(affData.summary);
        setTrend(affData.dailyTrend ?? []);
        setTop(affData.topTools ?? []);
      }
      setLoading(false);
    });

    // Also fetch platform stats
    fetch("/api/admin/platform-stats").then(r => r.ok ? r.json() : null).then(d => {
      if (d) setStats(d);
    });
  }, []);

  const maxClicks = Math.max(...trend.map(d => d.clicks), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Analytics</h1>
            <p className="text-xs text-slate-500">Platform performance overview</p>
          </div>
        </div>
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
      </div>

      <div className="p-6 space-y-6">
        {/* Platform stats */}
        {stats && (
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Tools", value: stats.total_tools, icon: Zap, color: "text-indigo-400", bg: "bg-indigo-400/10" },
                { label: "Featured Tools", value: stats.featured_tools, icon: Star, color: "text-amber-400", bg: "bg-amber-400/10" },
                { label: "Africa Friendly", value: stats.africa_friendly, icon: Globe, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                { label: "Total Articles", value: stats.total_articles, icon: FileText, color: "text-sky-400", bg: "bg-sky-400/10" },
                { label: "Published Articles", value: stats.published_articles, icon: FileText, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                { label: "Total Reviews", value: stats.total_reviews, icon: Star, color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "Total Users", value: stats.total_users, icon: Users, color: "text-violet-400", bg: "bg-violet-400/10" },
                { label: "Active Affiliates", value: stats.affiliate_links, icon: TrendingUp, color: "text-rose-400", bg: "bg-rose-400/10" },
              ].map(s => (
                <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{s.label}</div>
                    <div className="text-3xl font-black text-white">{(s.value ?? 0).toLocaleString()}</div>
                  </div>
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Affiliate stats */}
        {aff && (
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Affiliate Clicks</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { label: "Today", value: Number(aff.today) },
                { label: "Last 7 Days", value: Number(aff.week) },
                { label: "Last 30 Days", value: Number(aff.month) },
                { label: "All Time", value: Number(aff.total) },
              ].map(s => (
                <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-black text-white">{s.value.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {trend.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Daily Clicks — Last 30 Days</h3>
                <div className="flex items-end gap-1 h-28">
                  {trend.map(d => {
                    const pct = Math.max((d.clicks / maxClicks) * 100, 4);
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div title={`${new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${d.clicks} clicks`}
                          className="w-full rounded-t-sm bg-violet-600 group-hover:bg-violet-400 transition-colors"
                          style={{ height: `${pct}%` }} />
                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                          <div className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap">
                            {new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: <span className="font-bold text-violet-400">{d.clicks}</span>
                          </div>
                        </div>
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

            {topTools.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Top Tools by Clicks (30 days)</h3>
                <div className="space-y-2">
                  {topTools.map((t, i) => (
                    <div key={t.slug} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/40">
                      <span className="text-xs font-bold text-slate-600 w-5">{i + 1}</span>
                      {t.logo
                        ? <img src={t.logo} alt="" className="w-6 h-6 rounded object-contain bg-white p-0.5 shrink-0" />
                        : <div className="w-6 h-6 rounded bg-violet-900 flex items-center justify-center text-xs font-bold text-violet-300">{t.name[0]}</div>
                      }
                      <span className="flex-1 text-sm font-medium text-slate-200">{t.name}</span>
                      <span className="text-sm font-bold text-violet-400">{Number(t.clicks).toLocaleString()} clicks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!aff && !stats && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <BarChart3 className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No analytics data yet</p>
            <p className="text-slate-600 text-sm mt-1">
              Run the schema SQL in Supabase SQL Editor to enable analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

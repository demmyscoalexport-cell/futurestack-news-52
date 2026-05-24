"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Users,
  FileText,
  Globe,
  Star,
  TrendingUp,
  Zap,
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
interface DayTick { day: string; clicks: number; }
interface TopTool { name: string; slug: string; logo: string | null; clicks: number; }

export default function AnalyticsClient() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [aff, setAff] = useState<AffSummary | null>(null);
  const [trend, setTrend] = useState<DayTick[]>([]);
  const [topTools, setTop] = useState<TopTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/affiliate-stats").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/platform-stats").then((r) => (r.ok ? r.json() : null)),
    ]).then(([affData, platformStats]) => {
      if (affData) {
        setAff(affData.summary);
        setTrend(affData.dailyTrend ?? []);
        setTop(affData.topTools ?? []);
      }
      if (platformStats) setStats(platformStats);
      setLoading(false);
    });
  }, []);

  const maxClicks = Math.max(...trend.map((d) => d.clicks), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-neutral-stroke/40 bg-neutral-surface/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-discova-lg bg-brand-primary/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-base font-black text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">Platform performance overview</p>
          </div>
        </div>
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {stats && (
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Total Tools", value: stats.total_tools, icon: Zap, color: "text-brand-primary", bg: "bg-brand-primary/10" },
                { label: "Featured Tools", value: stats.featured_tools, icon: Star, color: "text-brand-gold", bg: "bg-brand-gold/10" },
                { label: "Africa Friendly", value: stats.africa_friendly, icon: Globe, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                { label: "Total Articles", value: stats.total_articles, icon: FileText, color: "text-sky-400", bg: "bg-sky-400/10" },
                { label: "Published Articles", value: stats.published_articles, icon: FileText, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                { label: "Total Reviews", value: stats.total_reviews, icon: Star, color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "Total Users", value: stats.total_users, icon: Users, color: "text-brand-lilac", bg: "bg-brand-primary/10" },
                { label: "Active Affiliates", value: stats.affiliate_links, icon: TrendingUp, color: "text-rose-400", bg: "bg-rose-400/10" },
              ].map((s) => (
                <div key={s.label} className="glass-panel border border-neutral-stroke/60 rounded-discova-lg p-4 sm:p-5 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{s.label}</div>
                    <div className="text-2xl sm:text-3xl font-black text-foreground">{(s.value ?? 0).toLocaleString()}</div>
                  </div>
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aff && (
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Affiliate Clicks</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
              {[
                { label: "Today", value: Number(aff.today) },
                { label: "Last 7 Days", value: Number(aff.week) },
                { label: "Last 30 Days", value: Number(aff.month) },
                { label: "All Time", value: Number(aff.total) },
              ].map((s) => (
                <div key={s.label} className="glass-panel border border-neutral-stroke/60 rounded-discova-lg p-4 sm:p-5 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-foreground">{s.value.toLocaleString()}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {trend.length > 0 && (
              <div className="glass-panel border border-neutral-stroke/60 rounded-discova-lg p-5 sm:p-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Daily Clicks — Last 30 Days</h3>
                <div className="flex items-end gap-1 h-28">
                  {trend.map((d) => {
                    const pct = Math.max((d.clicks / maxClicks) * 100, 4);
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div
                          title={`${new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${d.clicks} clicks`}
                          className="w-full rounded-t-sm bg-brand-primary group-hover:bg-brand-lilac transition-colors"
                          style={{ height: `${pct}%` }}
                        />
                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                          <div className="bg-neutral-surface border border-neutral-stroke/60 rounded-lg px-2 py-1 text-xs text-foreground whitespace-nowrap">
                            {new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}:{" "}
                            <span className="font-bold text-brand-primary">{d.clicks}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{new Date(trend[0].day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span>{new Date(trend[trend.length - 1].day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
            )}

            {topTools.length > 0 && (
              <div className="glass-panel border border-neutral-stroke/60 rounded-discova-lg p-5 sm:p-6 mt-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Top Tools by Clicks (30 days)</h3>
                <div className="space-y-2">
                  {topTools.map((t, i) => (
                    <div key={t.slug} className="flex items-center gap-3 p-2 rounded-discova-lg hover:bg-neutral-surface/80 transition-colors">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      {t.logo ? (
                        <img src={t.logo} alt="" className="w-6 h-6 rounded object-contain bg-white p-0.5 shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-lilac">{t.name[0]}</div>
                      )}
                      <span className="flex-1 text-sm font-medium text-foreground">{t.name}</span>
                      <span className="text-sm font-bold text-brand-primary">{Number(t.clicks).toLocaleString()} clicks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!aff && !stats && (
          <div className="glass-panel border border-neutral-stroke/60 rounded-discova-lg p-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-semibold">No analytics data yet</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Run the schema SQL in Supabase SQL Editor to enable analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

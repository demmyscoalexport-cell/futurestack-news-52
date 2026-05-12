"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield, ArrowLeft, Check, X, ExternalLink, Search,
  Flame, Zap, Globe, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";

interface QueueTool {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo: string | null;
  website: string | null;
  website_url: string | null;
  category: string | null;
  pricing_model: string | null;
  has_free: boolean | null;
  africa_friendly: boolean | null;
  rating: number | null;
  upvote_count: number | null;
  tags: string[] | null;
  source: string | null;
  producthunt_url: string | null;
  created_at: string;
}

const PRICING_COLOR: Record<string, string> = {
  free:       "bg-emerald-900/40 text-emerald-400 border-emerald-700/40",
  freemium:   "bg-blue-900/40 text-blue-400 border-blue-700/40",
  paid:       "bg-amber-900/40 text-amber-400 border-amber-700/40",
  enterprise: "bg-purple-900/40 text-purple-400 border-purple-700/40",
};

const CAT_LABEL: Record<string, string> = {
  writing: "Writing & Content", code: "Coding & Dev", design: "Design",
  video: "Video", audio: "Audio", automation: "Automation",
  productivity: "Productivity", analytics: "Analytics", marketing: "Marketing",
};

const PAGE_SIZE = 12;

export default function ToolsQueueClient() {
  const [tools, setTools] = useState<QueueTool[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<Record<string, "approving" | "rejecting">>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    const res = await fetch(`/api/admin/tools-queue?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`);
    if (res.ok) {
      const data = await res.json();
      setTools(data.tools);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(id: string, action: "approve" | "reject", name: string) {
    setActioning(prev => ({ ...prev, [id]: action === "approve" ? "approving" : "rejecting" }));
    const res = await fetch("/api/admin/tools-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setActioning(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (res.ok) {
      setSuccessMsg(`${name} ${action === "approve" ? "approved ✓" : "rejected"}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      load(page);
    }
  }

  async function triggerSync() {
    setSyncing(true);
    await fetch("/api/sync-tools", { method: "POST" });
    setSyncing(false);
    setSuccessMsg("Product Hunt sync triggered — check back in a few minutes");
    setTimeout(() => setSuccessMsg(null), 5000);
  }

  const filtered = tools.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.tagline || "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Tools Queue</h1>
            <p className="text-xs text-slate-500">
              Review & approve Product Hunt discoveries
              {total > 0 && <span className="ml-1 text-amber-400 font-bold">({total} pending)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync PH Now"}
          </button>
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Admin
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 px-4 py-2.5 rounded-xl text-sm">
            <Check className="h-4 w-4 shrink-0" /> {successMsg}
          </div>
        )}

        {/* Empty state */}
        {!loading && total === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold text-lg">No tools waiting for review</p>
            <p className="text-slate-600 text-sm mt-1 mb-6">
              Click "Sync PH Now" to fetch the latest Product Hunt launches.
            </p>
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync Product Hunt"}
            </button>
          </div>
        )}

        {total > 0 && (
          <>
            {/* Search + pagination info */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <span className="text-sm text-slate-500">{total} pending · page {page + 1}/{totalPages}</span>
            </div>

            {/* Tool cards grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse h-52" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(t => {
                  const isActioning = !!actioning[t.id];
                  const pricingColor = PRICING_COLOR[t.pricing_model || "freemium"] ?? PRICING_COLOR.freemium;
                  const siteUrl = t.website_url || t.website;
                  const catLabel = CAT_LABEL[t.category || ""] ?? t.category ?? "";
                  return (
                    <div key={t.id} className="bg-slate-900 border border-slate-800 hover:border-violet-700/40 rounded-2xl p-5 flex flex-col gap-3 transition-colors">
                      {/* Logo + Name */}
                      <div className="flex items-start gap-3">
                        {t.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.logo} alt="" className="w-12 h-12 rounded-xl object-contain bg-white p-1 shrink-0" onError={e => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-violet-900/50 flex items-center justify-center text-violet-300 font-black text-xl shrink-0">
                            {t.name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-sm">{t.name}</span>
                            {t.source === "producthunt" && (
                              <span className="text-xs bg-orange-900/40 text-orange-400 border border-orange-700/40 px-1.5 py-0.5 rounded-full font-semibold">PH</span>
                            )}
                            {t.africa_friendly && <span title="Africa-Friendly" className="text-sm">🌍</span>}
                          </div>
                          {catLabel && <span className="text-xs text-slate-500">{catLabel}</span>}
                        </div>
                      </div>

                      {/* Tagline */}
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {t.tagline || t.description || "—"}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${pricingColor}`}>
                          {t.pricing_model ?? "freemium"}
                        </span>
                        {t.upvote_count != null && t.upvote_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-900/20 border border-orange-800/30 px-2 py-0.5 rounded-full">
                            <Flame className="h-2.5 w-2.5" /> {t.upvote_count.toLocaleString()} votes
                          </span>
                        )}
                      </div>

                      {/* Links */}
                      <div className="flex items-center gap-1.5 text-xs">
                        {siteUrl && (
                          <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors">
                            <Globe className="h-3 w-3" /> Website
                          </a>
                        )}
                        {t.producthunt_url && (
                          <a href={t.producthunt_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-slate-500 hover:text-orange-400 transition-colors ml-2">
                            <ExternalLink className="h-3 w-3" /> Product Hunt
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-auto pt-1 border-t border-slate-800">
                        <button
                          onClick={() => act(t.id, "approve", t.name)}
                          disabled={isActioning}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {actioning[t.id] === "approving" ? "Approving…" : "Approve"}
                        </button>
                        <button
                          onClick={() => act(t.id, "reject", t.name)}
                          disabled={isActioning}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-red-900/50 hover:border-red-700/50 disabled:opacity-50 text-slate-400 hover:text-red-400 text-xs font-bold py-2 rounded-xl border border-slate-700 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          {actioning[t.id] === "rejecting" ? "Rejecting…" : "Reject"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-slate-400">Page {page + 1} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

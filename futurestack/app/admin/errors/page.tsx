"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
  ExternalLink,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorRow {
  id: string;
  level: "error" | "warn" | "info";
  message: string;
  stack: string | null;
  url: string | null;
  user_email: string | null;
  context: Record<string, unknown>;
  resolved: boolean;
  created_at: string;
}

interface Stats {
  total_errors: string;
  total_warns: string;
  total_info: string;
  open_errors: string;
  last_24h: string;
  last_1h: string;
}

const LEVEL_STYLES = {
  error: { bg: "bg-red-500/10 text-red-400 border-red-500/20",    icon: AlertCircle,    dot: "bg-red-400" },
  warn:  { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: AlertTriangle, dot: "bg-amber-400" },
  info:  { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",  icon: Info,           dot: "bg-blue-400" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ErrorMonitorPage() {
  const [errors, setErrors]     = useState<ErrorRow[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [levelFilter, setLevel] = useState("all");
  const [resolvedFilter, setResolved] = useState("false");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage]         = useState(0);
  const PAGE = 50;

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE),
      offset: String(page * PAGE),
      resolved: resolvedFilter,
    });
    if (levelFilter !== "all") params.set("level", levelFilter);

    const res = await fetch(`/api/admin/errors?${params}`);
    const data = await res.json();
    setErrors(data.rows ?? []);
    setTotal(data.total ?? 0);
    setStats(data.stats ?? null);
    setLoading(false);
  }, [levelFilter, resolvedFilter, page]);

  useEffect(() => { fetchErrors(); }, [fetchErrors]);

  const toggleResolved = async (id: string, current: boolean) => {
    await fetch("/api/admin/errors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved: !current }),
    });
    fetchErrors();
  };

  const deleteError = async (id: string) => {
    await fetch(`/api/admin/errors?id=${id}`, { method: "DELETE" });
    fetchErrors();
  };

  const clearResolved = async () => {
    if (!confirm("Delete all resolved errors?")) return;
    await fetch("/api/admin/errors", { method: "DELETE" });
    fetchErrors();
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="font-black text-lg">Error Monitor</div>
            <div className="text-xs text-slate-500">Real-time app error tracking</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-slate-400 hover:text-white">← Admin</Link>
          <button
            onClick={fetchErrors}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={clearResolved}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear Resolved
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Open Errors",  value: stats.open_errors,   color: "text-red-400",   bg: "bg-red-500/10" },
              { label: "Last Hour",    value: stats.last_1h,        color: "text-orange-400",bg: "bg-orange-500/10" },
              { label: "Last 24 h",   value: stats.last_24h,       color: "text-amber-400", bg: "bg-amber-500/10" },
              { label: "Total Errors", value: stats.total_errors,   color: "text-slate-300", bg: "bg-slate-800" },
              { label: "Warnings",     value: stats.total_warns,    color: "text-amber-400", bg: "bg-amber-500/10" },
              { label: "Info Logs",    value: stats.total_info,     color: "text-blue-400",  bg: "bg-blue-500/10" },
            ].map(s => (
              <div key={s.label} className={cn("rounded-2xl border border-slate-800 p-4", s.bg)}>
                <div className={cn("text-3xl font-black", s.color)}>{Number(s.value).toLocaleString()}</div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {[["all","All Levels"],["error","Errors"],["warn","Warnings"],["info","Info"]].map(([val,label]) => (
              <button
                key={val}
                onClick={() => { setLevel(val); setPage(0); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  levelFilter === val ? "bg-white text-slate-900" : "text-slate-400 hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {[["false","Open"],["true","Resolved"],["all","All"]].map(([val,label]) => (
              <button
                key={val}
                onClick={() => { setResolved(val); setPage(0); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  resolvedFilter === val ? "bg-white text-slate-900" : "text-slate-400 hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-sm text-slate-500 ml-auto">
            {total.toLocaleString()} {total === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* Error List */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Loading…
          </div>
        ) : errors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500/40" />
            <p className="font-semibold">No errors found</p>
            <p className="text-sm mt-1">The app is running clean.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {errors.map(err => {
              const style = LEVEL_STYLES[err.level] ?? LEVEL_STYLES.error;
              const LevelIcon = style.icon;
              const isOpen = expanded.has(err.id);

              return (
                <div
                  key={err.id}
                  className={cn(
                    "border rounded-2xl overflow-hidden transition-all",
                    err.resolved ? "border-slate-800 opacity-60" : "border-slate-700",
                    "bg-slate-900",
                  )}
                >
                  {/* Row header */}
                  <div className="flex items-start gap-3 p-4">
                    <button onClick={() => toggleExpand(err.id)} className="mt-0.5 shrink-0">
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </button>

                    <LevelIcon className={cn("w-4 h-4 mt-0.5 shrink-0", style.bg.split(" ")[1])} />

                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", err.resolved ? "line-through text-slate-500" : "text-white")}>
                        {err.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold", style.bg)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
                          {err.level}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(err.created_at)}
                        </span>
                        {err.url && (
                          <span className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-xs">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {err.url.replace(/^https?:\/\/[^/]+/, "")}
                          </span>
                        )}
                        {err.user_email && (
                          <span className="text-xs text-slate-500">{err.user_email}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleResolved(err.id, err.resolved)}
                        title={err.resolved ? "Mark open" : "Mark resolved"}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors text-xs font-bold",
                          err.resolved
                            ? "bg-slate-800 text-slate-400 hover:text-white"
                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteError(err.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: stack + context */}
                  {isOpen && (
                    <div className="border-t border-slate-800 p-4 space-y-3">
                      {err.stack && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Stack Trace</p>
                          <pre className="text-xs text-slate-400 bg-slate-950 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all">
                            {err.stack}
                          </pre>
                        </div>
                      )}
                      {err.url && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">URL</p>
                          <p className="text-xs text-slate-300 font-mono">{err.url}</p>
                        </div>
                      )}
                      {err.context && Object.keys(err.context).length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Context</p>
                          <pre className="text-xs text-slate-400 bg-slate-950 rounded-xl p-4 overflow-x-auto">
                            {JSON.stringify(err.context, null, 2)}
                          </pre>
                        </div>
                      )}
                      <p className="text-xs text-slate-600">
                        {new Date(err.created_at).toLocaleString()} · ID: {err.id}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 text-sm font-medium disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {page + 1} of {Math.ceil(total / PAGE)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * PAGE >= total}
              className="px-4 py-2 rounded-xl bg-slate-800 text-sm font-medium disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Sentry callout */}
        <div className="mt-10 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-white">Connect Sentry for production-grade monitoring</p>
            <p className="text-xs text-slate-400 mt-1">
              Sentry config files are ready. Add <code className="bg-slate-800 px-1 rounded">NEXT_PUBLIC_SENTRY_DSN</code> and{" "}
              <code className="bg-slate-800 px-1 rounded">SENTRY_AUTH_TOKEN</code> to your secrets to activate alerts, performance traces, and release tracking.
            </p>
            <a
              href="https://sentry.io/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Get a free Sentry account →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

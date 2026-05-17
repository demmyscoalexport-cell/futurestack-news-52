"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Search, Check, X, Trash2, Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Review {
  id: string;
  tool_id: string;
  user_name: string | null;
  rating: number | null;
  content: string | null;
  verified: boolean | null;
  location: string | null;
  created_at: string;
  tool_name?: string;
  tool_slug?: string;
}

const PAGE_SIZE = 25;

export default function ReviewsClient() {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(0);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [success, setSuccess]   = useState<string | null>(null);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), search });
    const res = await fetch(`/api/admin/reviews?${params}`);
    if (res.ok) { const d = await res.json(); setReviews(d.reviews ?? []); setTotal(d.total ?? 0); }
    setLoading(false);
  }, [search]);

  useEffect(() => { setPage(0); load(0); }, [load]);

  function flash(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }

  async function toggleVerified(id: string, current: boolean | null) {
    await fetch("/api/admin/reviews", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, verified: !current }),
    });
    flash(current ? "Unverified" : "Verified"); load(page);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    flash("Review deleted"); load(page);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function Stars({ rating }: { rating: number | null }) {
    if (!rating) return <span className="text-slate-600">—</span>;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-3 w-3 ${i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
        ))}
        <span className="text-xs text-slate-500 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Star className="w-4 h-4" /></div>
          <div>
            <h1 className="text-base font-black text-white">Review Moderation</h1>
            <p className="text-xs text-slate-500">{total.toLocaleString()} reviews</p>
          </div>
        </div>
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
      </div>

      <div className="p-6 space-y-5">
        {success && (
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 px-4 py-2.5 rounded-xl text-sm">
            <Check className="h-4 w-4" /> {success}
          </div>
        )}

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Search reviews…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Reviewer</th>
                <th className="px-4 py-3 text-left">Tool</th>
                <th className="px-4 py-3 text-left">Rating</th>
                <th className="px-4 py-3 text-left">Review</th>
                <th className="px-4 py-3 text-center">Verified</th>
                <th className="px-4 py-3 text-right">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Loading…</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">No reviews found</td></tr>
              ) : reviews.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white text-sm">{r.user_name || "Anonymous"}</div>
                    {r.location && <div className="text-xs text-slate-600">{r.location}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {r.tool_slug
                      ? <a href={`/tools/${r.tool_slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm">{r.tool_name || r.tool_id}</a>
                      : <span className="text-slate-500 text-xs font-mono">{r.tool_id.slice(0, 8)}…</span>
                    }
                  </td>
                  <td className="px-4 py-3"><Stars rating={r.rating} /></td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="text-slate-300 text-sm line-clamp-2">{r.content || <span className="text-slate-600 italic">No content</span>}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleVerified(r.id, r.verified)} title={r.verified ? "Unverify" : "Verify"}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${r.verified ? "bg-emerald-900/40 text-emerald-400 border-emerald-700/40" : "bg-slate-800 text-slate-500 border-slate-700 hover:border-emerald-700/40 hover:text-emerald-400"}`}>
                      {r.verified ? <><Check className="h-2.5 w-2.5" /> Verified</> : "Unverified"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Page {page + 1} of {totalPages} · {total.toLocaleString()} reviews</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => { const p = page - 1; setPage(p); load(p); }}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors">
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => { const p = page + 1; setPage(p); load(p); }}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

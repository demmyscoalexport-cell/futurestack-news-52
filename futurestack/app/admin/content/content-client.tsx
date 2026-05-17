"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield, ArrowLeft, Search, Trash2, Eye, EyeOff,
  Star, Check, ChevronLeft, ChevronRight, FileText,
} from "lucide-react";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: string | null;
  category: string | null;
  featured: boolean | null;
  view_count: number | null;
  read_time: number | null;
  published_at: string | null;
  created_at: string;
  featured_image: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-emerald-900/40 text-emerald-400 border-emerald-700/40",
  DRAFT:     "bg-slate-800 text-slate-400 border-slate-700",
  ARCHIVED:  "bg-red-900/40 text-red-400 border-red-700/40",
};

const PAGE_SIZE = 20;

export default function ContentClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(0);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading]   = useState(true);
  const [success, setSuccess]   = useState<string | null>(null);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), search, status: statusFilter });
    const res = await fetch(`/api/admin/content?${params}`);
    if (res.ok) { const d = await res.json(); setArticles(d.articles ?? []); setTotal(d.total ?? 0); }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { setPage(0); load(0); }, [load]);

  function flash(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }

  async function toggleStatus(id: string, current: string | null) {
    const next = current === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await fetch("/api/admin/content", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    flash(next === "PUBLISHED" ? "Published" : "Moved to draft");
    load(page);
  }

  async function toggleFeatured(id: string, current: boolean | null) {
    await fetch("/api/admin/content", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, featured: !current }),
    });
    load(page);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/content?id=${id}`, { method: "DELETE" });
    flash("Article deleted");
    load(page);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Content Management</h1>
            <p className="text-xs text-slate-500">{total.toLocaleString()} articles</p>
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

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input type="text" placeholder="Search articles…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl text-sm text-white px-3 py-2 focus:outline-none focus:border-sky-500">
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Featured</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Loading…</td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">No articles found</td></tr>
              ) : articles.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {a.featured_image
                        ? <img src={a.featured_image} alt="" className="w-10 h-7 rounded object-cover shrink-0 opacity-80" />
                        : <div className="w-10 h-7 rounded bg-slate-800 shrink-0" />
                      }
                      <div>
                        <p className="font-semibold text-white leading-tight max-w-[300px] truncate">{a.title}</p>
                        <p className="text-xs text-slate-500">{a.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{a.category || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[a.status ?? "DRAFT"] ?? STATUS_COLORS.DRAFT}`}>
                      {a.status || "DRAFT"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleFeatured(a.id, a.featured)}
                      className={`p-1.5 rounded-lg transition-colors ${a.featured ? "text-amber-400 bg-amber-400/10" : "text-slate-600 hover:text-slate-400"}`}>
                      <Star className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">{(a.view_count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs">
                    {new Date(a.published_at || a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`/news/${a.slug}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => toggleStatus(a.id, a.status)} title={a.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        className="p-1.5 text-slate-500 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors">
                        {a.status === "PUBLISHED" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => handleDelete(a.id, a.title)}
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
            <span className="text-sm text-slate-500">Page {page + 1} of {totalPages} · {total.toLocaleString()} articles</span>
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

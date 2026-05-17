"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield, ArrowLeft, Search, Edit2, Trash2, Star, Globe,
  Check, X, ChevronLeft, ChevronRight, Video, Plus,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  logo: string | null;
  category: string | null;
  website: string | null;
  africa_friendly: boolean | null;
  featured: boolean | null;
  has_free: boolean | null;
  video_embed_url: string | null;
  promo_video_url: string | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
}

interface EditState extends Partial<Tool> { id: string; }

const CATEGORIES = [
  "writing","code","design","video","audio","automation",
  "productivity","analytics","marketing","finance","education",
  "communication","crm","hr","security","other",
];

const PAGE_SIZE = 20;

export default function ToolsClient() {
  const [tools, setTools]       = useState<Tool[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(0);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [featFilter, setFeatFilter] = useState("");
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<EditState | null>(null);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p), limit: String(PAGE_SIZE), search, category: catFilter, featured: featFilter,
    });
    const res = await fetch(`/api/admin/tools?${params}`);
    if (res.ok) {
      const d = await res.json();
      setTools(d.tools ?? []);
      setTotal(d.total ?? 0);
    }
    setLoading(false);
  }, [search, catFilter, featFilter]);

  useEffect(() => { setPage(0); load(0); }, [load]);

  function flash(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }

  async function handleSave() {
    if (!editing) return;
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/tools", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    if (res.ok) { setEditing(null); flash("Tool updated"); load(page); }
    else { const d = await res.json(); setError(d.error || "Save failed"); }
  }

  async function toggle(id: string, field: "featured" | "africa_friendly", current: boolean | null) {
    await fetch("/api/admin/tools", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: !current }),
    });
    load(page);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/tools?id=${id}`, { method: "DELETE" });
    if (res.ok) { flash("Tool deleted"); load(page); }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Manage Tools</h1>
            <p className="text-xs text-slate-500">{total.toLocaleString()} tools in Supabase</p>
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

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text" placeholder="Search tools…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl text-sm text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={featFilter} onChange={e => setFeatFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl text-sm text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All</option>
            <option value="true">Featured only</option>
            <option value="false">Not featured</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Tool</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-center">Featured</th>
                <th className="px-4 py-3 text-center">Africa</th>
                <th className="px-4 py-3 text-center">Video</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Loading…</td></tr>
              ) : tools.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">No results</td></tr>
              ) : tools.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {t.logo
                        ? <img src={t.logo} alt="" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shrink-0" />
                        : <div className="w-8 h-8 rounded-lg bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">{t.name[0]}</div>
                      }
                      <div>
                        <p className="font-semibold text-white">{t.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{t.short_description || t.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{t.category || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggle(t.id, "featured", t.featured)}
                      className={`p-1.5 rounded-lg transition-colors ${t.featured ? "text-amber-400 bg-amber-400/10" : "text-slate-600 hover:text-slate-400"}`}>
                      <Star className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggle(t.id, "africa_friendly", t.africa_friendly)}
                      className={`p-1.5 rounded-lg transition-colors ${t.africa_friendly ? "text-emerald-400 bg-emerald-400/10" : "text-slate-600 hover:text-slate-400"}`}>
                      <Globe className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.video_embed_url
                      ? <span title={t.video_embed_url}><Video className="h-4 w-4 text-violet-400 mx-auto" /></span>
                      : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-300">
                    {t.rating ? `${t.rating.toFixed(1)} ★` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {t.website && (
                        <a href={t.website} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors">
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button onClick={() => setEditing({ ...t })}
                        className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t.id, t.name)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {page + 1} of {totalPages} · {total.toLocaleString()} tools
            </span>
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

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg mb-5">Edit Tool — {editing.name}</h3>

            <div className="space-y-4">
              {[
                { label: "Name", field: "name" as const, type: "text" },
                { label: "Slug", field: "slug" as const, type: "text" },
                { label: "Short Description", field: "short_description" as const, type: "text" },
                { label: "Website URL", field: "website" as const, type: "url" },
                { label: "Logo URL", field: "logo" as const, type: "url" },
                { label: "Video Embed URL (YouTube / Loom)", field: "video_embed_url" as const, type: "url" },
                { label: "Promo Video URL (Cloudinary)", field: "promo_video_url" as const, type: "url" },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type={type} value={(editing[field] as string) || ""}
                    onChange={e => setEditing({ ...editing, [field]: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                <select value={editing.category || ""} onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 capitalize">
                  <option value="">— Select —</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Featured", field: "featured" as const },
                  { label: "Africa Friendly", field: "africa_friendly" as const },
                  { label: "Has Free Tier", field: "has_free" as const },
                ].map(({ label, field }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer bg-slate-800 rounded-xl px-3 py-2.5">
                    <input type="checkbox" checked={!!(editing[field])}
                      onChange={e => setEditing({ ...editing, [field]: e.target.checked })}
                      className="accent-indigo-500 w-4 h-4" />
                    <span className="text-sm text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setEditing(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

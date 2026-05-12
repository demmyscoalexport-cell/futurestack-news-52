"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  Search,
  Check,
  X,
  TrendingUp,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface AffiliateTool {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  affiliate_id: string | null;
  affiliate_url: string | null;
  partner_name: string | null;
  commission_rate: number | null;
  notes: string | null;
  is_active: boolean | null;
  clicks_30d: number;
  clicks_7d: number;
  clicks_today: number;
}

interface EditState {
  id: string | null; // null = new
  tool_id: string;
  tool_name: string;
  affiliate_url: string;
  partner_name: string;
  commission_rate: string;
  notes: string;
}

type SortKey = "name" | "partner_name" | "commission_rate" | "clicks_30d";

export default function AffiliatesAdminPage() {
  const [tools, setTools] = useState<AffiliateTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("clicks_30d");
  const [sortAsc, setSortAsc] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/affiliates");
    if (res.ok) setTools(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(t: AffiliateTool) {
    setEditing({
      id: t.affiliate_id,
      tool_id: t.id,
      tool_name: t.name,
      affiliate_url: t.affiliate_url || "",
      partner_name: t.partner_name || "",
      commission_rate: t.commission_rate?.toString() || "0",
      notes: t.notes || "",
    });
    setError(null);
  }

  function startNew() {
    setEditing({
      id: null,
      tool_id: "",
      tool_name: "",
      affiliate_url: "",
      partner_name: "",
      commission_rate: "0",
      notes: "",
    });
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/affiliates", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      setSuccessMsg("Saved successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to save");
    }
  }

  async function handleDelete(affiliateId: string, toolName: string) {
    if (!confirm(`Remove affiliate link for ${toolName}?`)) return;
    const res = await fetch(`/api/admin/affiliates?id=${affiliateId}`, { method: "DELETE" });
    if (res.ok) {
      setSuccessMsg("Deleted");
      setTimeout(() => setSuccessMsg(null), 3000);
      load();
    }
  }

  async function toggleActive(affiliateId: string, current: boolean) {
    await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: affiliateId, is_active: !current }),
    });
    load();
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  const filtered = tools
    .filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.partner_name || "").toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortAsc ? cmp : -cmp;
    });

  const totalClicks30d = tools.reduce((s, t) => s + t.clicks_30d, 0);
  const totalClicks7d = tools.reduce((s, t) => s + t.clicks_7d, 0);
  const totalToday = tools.reduce((s, t) => s + t.clicks_today, 0);
  const withLinks = tools.filter(t => t.affiliate_url).length;

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="opacity-20 ml-1">↕</span>;
    return sortAsc ? <ChevronUp className="inline h-3 w-3 ml-1" /> : <ChevronDown className="inline h-3 w-3 ml-1" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Affiliate Links</h1>
            <p className="text-xs text-slate-500">Manage partner links & track clicks</p>
          </div>
        </div>
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>
      </div>

      <div className="p-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tools with Links", value: withLinks, sub: `of ${tools.length} total`, color: "text-violet-400", bg: "bg-violet-400/10" },
            { label: "Clicks Today", value: totalToday, sub: "all tools", color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { label: "Clicks (7d)", value: totalClicks7d, sub: "last 7 days", color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Clicks (30d)", value: totalClicks30d, sub: "last 30 days", color: "text-amber-400", bg: "bg-amber-400/10" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{s.label}</div>
                <div className="text-3xl font-black text-white">{s.value.toLocaleString()}</div>
                <div className="text-xs text-slate-600 mt-0.5">{s.sub}</div>
              </div>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <TrendingUp className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Success/Error messages */}
        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 px-4 py-2.5 rounded-xl text-sm">
            <Check className="h-4 w-4" /> {successMsg}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tools or partners..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Link
          </button>
        </div>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
            <div
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-bold text-white text-lg mb-5">
                {editing.id ? `Edit — ${editing.tool_name}` : "Add Affiliate Link"}
              </h3>

              {!editing.id && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tool ID</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="UUID of tool"
                    value={editing.tool_id}
                    onChange={e => setEditing({ ...editing, tool_id: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Affiliate URL *</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="https://example.com/?ref=futurestack"
                    value={editing.affiliate_url}
                    onChange={e => setEditing({ ...editing, affiliate_url: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Partner Name *</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="e.g. Notion"
                    value={editing.partner_name}
                    onChange={e => setEditing({ ...editing, partner_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Commission Rate (%)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="20"
                    value={editing.commission_rate}
                    onChange={e => setEditing({ ...editing, commission_rate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                    placeholder="e.g. Last verified May 2026"
                    value={editing.notes}
                    onChange={e => setEditing({ ...editing, notes: e.target.value })}
                  />
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-4 py-3 text-left cursor-pointer hover:text-white" onClick={() => handleSort("name")}>
                  Tool <SortIcon k="name" />
                </th>
                <th className="px-4 py-3 text-left cursor-pointer hover:text-white" onClick={() => handleSort("partner_name")}>
                  Partner <SortIcon k="partner_name" />
                </th>
                <th className="px-4 py-3 text-left cursor-pointer hover:text-white" onClick={() => handleSort("commission_rate")}>
                  Commission <SortIcon k="commission_rate" />
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("clicks_30d")}>
                  30d Clicks <SortIcon k="clicks_30d" />
                </th>
                <th className="px-4 py-3 text-right">7d</th>
                <th className="px-4 py-3 text-right">Today</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-600">Loading…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-600">No results</td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {t.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.logo} alt="" className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-violet-900 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                            {t.name[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {t.partner_name || <span className="text-slate-600 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {t.commission_rate && t.commission_rate > 0 ? (
                        <span className="text-emerald-400 font-bold">{t.commission_rate}%</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">{t.clicks_30d.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{t.clicks_7d.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{t.clicks_today.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      {t.affiliate_url ? (
                        t.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 px-2 py-0.5 rounded-full">
                            <Check className="h-2.5 w-2.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">
                            <X className="h-2.5 w-2.5" /> Paused
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-600 italic">No link</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {t.affiliate_url && (
                          <a
                            href={`/api/affiliate/${t.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Test redirect"
                            className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {t.affiliate_id && (
                          <button
                            onClick={() => toggleActive(t.affiliate_id!, t.is_active!)}
                            title={t.is_active ? "Pause" : "Activate"}
                            className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            {t.is_active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(t)}
                          title="Edit"
                          className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {t.affiliate_id && (
                          <button
                            onClick={() => handleDelete(t.affiliate_id!, t.name)}
                            title="Delete"
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

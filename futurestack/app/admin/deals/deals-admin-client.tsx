"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Plus, Trash2, Edit2, Check, X, Search } from "lucide-react";

interface Deal {
  id: string;
  name: string;
  tagline: string | null;
  discount: string;
  original_price: string | null;
  deal_price: string;
  category: string | null;
  expiry: string | null;
  badge: string | null;
  badge_color: string | null;
  hot: boolean;
  africa: boolean;
  type: string;
  url: string;
  status: string;
  created_at: string;
}

const TYPES = ["free", "student", "discount", "lifetime"];
const TYPE_LABELS: Record<string, string> = {
  free: "Free", student: "Student", discount: "Discount", lifetime: "Lifetime",
};

interface DealForm {
  id?: string;
  name: string;
  tagline: string | null;
  discount: string;
  original_price: string | null;
  deal_price: string;
  category: string | null;
  expiry: string | null;
  badge: string | null;
  badge_color: string | null;
  hot: boolean;
  africa: boolean;
  type: string;
  url: string;
  status: string;
}

const EMPTY: DealForm = {
  name: "", tagline: "", discount: "", original_price: "", deal_price: "",
  category: "", expiry: "Ongoing", badge: "", badge_color: "", hot: false,
  africa: true, type: "free", url: "", status: "active",
};

export default function DealsAdminClient() {
  const [items, setItems] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editing, setEditing] = useState<DealForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50", offset: "0" });
    if (typeFilter) params.set("type", typeFilter);
    const res = await fetch(`/api/admin/deals?${params}`);
    if (res.ok) {
      const d = await res.json();
      setItems(d.deals ?? []);
      setTotal(d.total ?? 0);
    }
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  function flash(msg: string, isErr = false) {
    if (isErr) { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 4000); }
    else { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); }
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true); setErrorMsg(null);
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/deals", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      flash(editing.id ? "Deal updated ✓" : "Deal created ✓");
      load();
    } else {
      const d = await res.json();
      flash(d.error || "Save failed", true);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete deal for "${name}"?`)) return;
    const res = await fetch("/api/admin/deals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { flash("Deleted ✓"); load(); }
    else flash("Delete failed", true);
  }

  const filtered = search
    ? items.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white">Deals &amp; Discounts</h1>
          <p className="text-xs text-slate-500">{total} deals in database</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Deal
          </button>
        </div>
      </div>

      <div className="p-8">
        {successMsg && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-3 text-sm font-semibold">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tool name…"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">All Types</option>
            {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 mb-4">No deals yet.</p>
              <button
                onClick={() => setEditing({ ...EMPTY })}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
              >
                Add the first one
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Tool</th>
                  <th className="text-left px-4 py-3">Discount</th>
                  <th className="text-left px-4 py-3">Price</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Expiry</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{d.name}</div>
                      {d.hot && <span className="text-[10px] text-rose-400 font-bold">🔥 HOT</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{d.discount}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-white">{d.deal_price}</span>
                      {d.original_price && (
                        <span className="ml-1 text-[10px] text-slate-500 line-through">{d.original_price}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[d.type] ?? d.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{d.expiry ?? "Ongoing"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        d.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                        d.status === "expired" ? "bg-red-500/10 text-red-400" :
                        "bg-slate-700 text-slate-400"
                      }`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing({ ...d })}
                          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
                          className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-lg">{editing.id ? "Edit Deal" : "New Deal"}</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Tool Name *", key: "name", placeholder: "Notion" },
                { label: "Tagline", key: "tagline", placeholder: "All-in-one workspace" },
                { label: "Discount Description *", key: "discount", placeholder: "Free for Students" },
                { label: "Original Price", key: "original_price", placeholder: "$16/mo" },
                { label: "Deal Price *", key: "deal_price", placeholder: "$0" },
                { label: "Category", key: "category", placeholder: "Productivity" },
                { label: "Expiry", key: "expiry", placeholder: "Jun 30, 2026 or Ongoing" },
                { label: "Badge Label", key: "badge", placeholder: "Student" },
                { label: "URL *", key: "url", placeholder: "https://…" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
                  <input
                    value={((editing as unknown as Record<string, unknown>)[key] as string) ?? ""}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, [key]: e.target.value } : prev)}
                    placeholder={placeholder}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-400"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Type *</label>
                <select
                  value={editing.type}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, type: e.target.value } : prev)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.hot ?? false}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, hot: e.target.checked } : prev)}
                    className="rounded"
                  />
                  Hot Deal
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.africa ?? true}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, africa: e.target.checked } : prev)}
                    className="rounded"
                  />
                  Africa-focused
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {saving ? "Saving…" : <><Check className="w-4 h-4" /> Save</>}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


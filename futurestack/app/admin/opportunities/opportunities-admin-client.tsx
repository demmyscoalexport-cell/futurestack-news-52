"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Plus, Trash2, Edit2, Check, X, Search } from "lucide-react";

interface Opportunity {
  id: string;
  type: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  skills: string[];
  deadline: string | null;
  url: string;
  featured: boolean;
  africa: boolean;
  status: string;
  created_at: string;
}

const TYPES = ["jobs", "grants", "scholarships", "gigs", "fellowships", "accelerators"];
const TYPE_LABELS: Record<string, string> = {
  jobs: "Remote Job", grants: "Grant", scholarships: "Scholarship",
  gigs: "AI Gig", fellowships: "Fellowship", accelerators: "Accelerator",
};

interface OpportunityForm {
  id?: string;
  type: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  skills: string[] | string;
  deadline: string | null;
  url: string;
  featured: boolean;
  africa: boolean;
  status: string;
}

const EMPTY: OpportunityForm = {
  type: "jobs", title: "", company: "", location: "", salary: "",
  skills: [], deadline: "", url: "", featured: false, africa: true, status: "active",
};

export default function OpportunitiesAdminClient() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editing, setEditing] = useState<OpportunityForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50", offset: "0" });
    if (typeFilter) params.set("type", typeFilter);
    const res = await fetch(`/api/admin/opportunities?${params}`);
    if (res.ok) {
      const d = await res.json();
      setItems(d.opportunities ?? []);
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
    const res = await fetch("/api/admin/opportunities", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editing,
        skills: typeof editing.skills === "string"
          ? (editing.skills as string).split(",").map((s: string) => s.trim()).filter(Boolean)
          : editing.skills,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      flash(editing.id ? "Opportunity updated ✓" : "Opportunity created ✓");
      load();
    } else {
      const d = await res.json();
      flash(d.error || "Save failed", true);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch("/api/admin/opportunities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { flash("Deleted ✓"); load(); }
    else flash("Delete failed", true);
  }

  const filtered = search
    ? items.filter((o) =>
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.company.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const skillsStr = (o: { skills: string[] | string }) =>
    Array.isArray(o.skills) ? o.skills.join(", ") : (o.skills ?? "");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white">Opportunities</h1>
          <p className="text-xs text-slate-500">{total} listings in database</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Opportunity
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
              placeholder="Search title or company…"
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
              <p className="text-slate-400 mb-4">No opportunities yet.</p>
              <button
                onClick={() => setEditing({ ...EMPTY })}
                className="bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
              >
                Add the first one
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Company</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Salary</th>
                  <th className="text-left px-4 py-3">Deadline</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{o.title}</div>
                      {o.featured && <span className="text-[10px] text-amber-400 font-bold">★ FEATURED</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{o.company}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[o.type] ?? o.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{o.salary ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{o.deadline ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        o.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                        o.status === "expired" ? "bg-red-500/10 text-red-400" :
                        "bg-slate-700 text-slate-400"
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing({ ...o, skills: skillsStr(o) })}
                          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(o.id, o.title)}
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
              <h2 className="font-black text-lg">{editing.id ? "Edit Opportunity" : "New Opportunity"}</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Title *", key: "title", placeholder: "AI Content Writer — Remote" },
                { label: "Company *", key: "company", placeholder: "TechStart Africa" },
                { label: "Location", key: "location", placeholder: "Remote (Africa)" },
                { label: "Salary / Value", key: "salary", placeholder: "$800 – $1,500/mo" },
                { label: "Deadline", key: "deadline", placeholder: "Jun 30, 2026 or Ongoing" },
                { label: "URL *", key: "url", placeholder: "https://…" },
                { label: "Skills (comma-separated)", key: "skills", placeholder: "ChatGPT, SEO, Writing" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
                  <input
                    value={key === "skills" ? skillsStr(editing as { skills: string[] | string }) : ((editing as unknown as Record<string, unknown>)[key] as string) ?? ""}
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
                    checked={editing.featured ?? false}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, featured: e.target.checked } : prev)}
                    className="rounded"
                  />
                  Featured
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
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
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


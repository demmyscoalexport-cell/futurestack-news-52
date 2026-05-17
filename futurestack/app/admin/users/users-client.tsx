"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Search, Users, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

const ROLES = ["user", "editor", "admin"];
const ROLE_COLORS: Record<string, string> = {
  admin:  "bg-red-900/40 text-red-400 border-red-700/40",
  editor: "bg-amber-900/40 text-amber-400 border-amber-700/40",
  user:   "bg-slate-800 text-slate-400 border-slate-700",
};

const PAGE_SIZE = 30;

export default function UsersClient() {
  const [users, setUsers]     = useState<UserProfile[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(0);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), search });
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) { const d = await res.json(); setUsers(d.users ?? []); setTotal(d.total ?? 0); }
    setLoading(false);
  }, [search]);

  useEffect(() => { setPage(0); load(0); }, [load]);

  function flash(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }

  async function changeRole(id: string, role: string) {
    if (!confirm(`Change role to "${role}"?`)) return;
    setChanging(id);
    await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    setChanging(null);
    flash(`Role changed to ${role}`);
    load(page);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Users className="w-4 h-4" /></div>
          <div>
            <h1 className="text-base font-black text-white">User Management</h1>
            <p className="text-xs text-slate-500">{total.toLocaleString()} users</p>
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
          <input type="text" placeholder="Search by name or email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">Role</th>
                <th className="px-4 py-3 text-right">Joined</th>
                <th className="px-4 py-3 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-600">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-600">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        : <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                            {(u.full_name || u.email || "?")[0].toUpperCase()}
                          </div>
                      }
                      <span className="font-semibold text-white">{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{u.email || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${ROLE_COLORS[u.role ?? "user"] ?? ROLE_COLORS.user}`}>
                      {u.role || "user"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {ROLES.filter(r => r !== u.role).map(r => (
                        <button key={r} onClick={() => changeRole(u.id, r)}
                          disabled={changing === u.id}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-colors disabled:opacity-50
                            ${r === "admin" ? "border-red-700/40 text-red-400 hover:bg-red-900/20" :
                              r === "editor" ? "border-amber-700/40 text-amber-400 hover:bg-amber-900/20" :
                              "border-slate-700 text-slate-400 hover:bg-slate-800"}`}>
                          → {r}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Page {page + 1} of {totalPages} · {total.toLocaleString()} users</span>
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

"use client";

import { useState, useTransition } from "react";
import { toast }   from "sonner";
import { Search, Shield, User, Building2, Loader2, Check } from "lucide-react";

type Role = { id: string; displayName: string; roleName: string };
type UserRow = {
  id: string; name: string; firstName: string; lastName: string;
  email: string | null; phone: string; userType: string;
  status: boolean; createdAt: Date;
  roles: Role[];
  school: { id: string; name: string; code: string } | null;
};

async function updateUserRole(userId: string, roleId: string) {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ roleId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const USER_TYPE_COLORS: Record<string, string> = {
  SCHOOL_ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  STAFF:        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  STUDENT:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  PARENT:       "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function UsersClient({ users, roles }: { users: UserRow[]; roles: Role[] }) {
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isPending,   startTransition] = useTransition();

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) || u.phone.includes(q);
    const matchType = typeFilter === "all" || u.userType === typeFilter;
    return matchSearch && matchType;
  });

  const userTypes = Array.from(new Set(users.map(u => u.userType)));

  const handleSaveRole = (userId: string) => {
    if (!selectedRole) return;
    startTransition(async () => {
      try {
        await updateUserRole(userId, selectedRole);
        toast.success("Role updated");
        setEditingId(null);
        // Refresh
        window.location.reload();
      } catch (e: any) {
        toast.error(e.message ?? "Failed to update role");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Users</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          {users.length} users · manage roles and access
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search name, email, phone…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
          <option value="all">All Types</option>
          {userTypes.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          Showing {filtered.length} of {users.length}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {["User", "Email / Phone", "Type", "School", "Roles", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">No users found.</td></tr>
              ) : filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5B9BD5]/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[#5B9BD5]" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{user.id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <p className="text-slate-700 dark:text-slate-300">{user.email ?? "—"}</p>
                    <p className="text-xs text-slate-400">{user.phone}</p>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${USER_TYPE_COLORS[user.userType] ?? "bg-slate-100 text-slate-600"}`}>
                      {user.userType.replace("_", " ")}
                    </span>
                  </td>

                  {/* School */}
                  <td className="px-4 py-3">
                    {user.school ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{user.school.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>

                  {/* Roles */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? user.roles.map(r => (
                        <span key={r.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#5B9BD5]/10 text-[#5B9BD5] rounded text-xs font-medium">
                          <Shield className="w-3 h-3" />{r.displayName}
                        </span>
                      )) : (
                        <span className="text-xs text-slate-400 italic">No role</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedRole}
                          onChange={e => setSelectedRole(e.target.value)}
                          className="px-2 py-1 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#5B9BD5]"
                        >
                          <option value="">Select role…</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.displayName}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveRole(user.id)}
                          disabled={!selectedRole || isPending}
                          className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 px-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(user.id);
                          setSelectedRole(user.roles[0]?.id ?? "");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" /> Change Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

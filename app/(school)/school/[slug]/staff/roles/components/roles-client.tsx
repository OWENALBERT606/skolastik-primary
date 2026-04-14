"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ShieldCheck, ArrowLeft, Plus, Edit2, CheckCircle2,
  AlertTriangle, X, Search, Loader2, Building2, ChevronRight
} from "lucide-react";
import {
  getStaffRoleDefinitions,
  createStaffRoleDefinition,
  updateStaffRoleDefinition,
} from "@/actions/staff-actions";
import { seedDefaultRoleDefinitions } from "@/actions/staff-role";
import type { StaffRoleType } from "@prisma/client";

// ─── TYPES ──────────────────────────────────────────────────────────────────

type RoleDef = Awaited<ReturnType<typeof getStaffRoleDefinitions>>[number];

const ROLE_TYPES: StaffRoleType[] = [
  "TEACHER", "DOS", "DEPUTY_HEAD", "HEAD_TEACHER",
  "SECRETARY", "ACCOUNTANT", "LIBRARIAN", "STORE_KEEPER",
  "NURSE", "COUNSELOR", "SECURITY", "COOK",
  "CLEANER", "DRIVER", "IT_OFFICER", "ADMIN", "CUSTOM"
];

// ─── SHARED UI ──────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-black dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-600 transition";

function Field({ label, children, required, hint }: {
  label: string; children: React.ReactNode; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        {hint && <span className="font-normal text-slate-400 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium ${
      type === "success"
        ? "bg-emerald-50 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
        : "bg-rose-50 dark:bg-rose-900/90 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200"
    }`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ─── ROLE MODAL ─────────────────────────────────────────────────────────────

function RoleModal({
  schoolId, role, onClose, onSaved
}: {
  schoolId: string; role?: RoleDef; onClose: () => void; onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: role?.name ?? "",
    code: role?.code ?? "",
    roleType: role?.roleType ?? "CUSTOM",
    description: role?.description ?? "",
  });
  const [error, setError] = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit() {
    if (!form.name || !form.code) {
      setError("Name and Code are required.");
      return;
    }
    setError("");
    startTransition(async () => {
      let res;
      if (role) {
        res = await updateStaffRoleDefinition(role.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
      } else {
        res = await createStaffRoleDefinition({
          schoolId,
          roleType: form.roleType as StaffRoleType,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
        });
      }
      
      if (res.ok) onSaved();
      else setError(res.message);
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-[100dvh]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-black dark:text-white">{role ? "Edit Role" : "Add Staff Role"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Define a custom or standard title</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Role Name" required>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Senior Bursar" className={inputCls} />
            </Field>
            
            <Field label="Role Code" required hint="Must be Unique">
              <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())} placeholder="e.g. S-BURSAR" disabled={!!role} className={`${inputCls} ${role ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </Field>
          </div>

          <Field label="Base Role Type" required>
             <select value={form.roleType} onChange={e => set("roleType", e.target.value)} disabled={!!role} className={`${inputCls} ${role ? 'opacity-60 cursor-not-allowed' : ''}`}>
               {ROLE_TYPES.map(type => (
                 <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
               ))}
             </select>
          </Field>

          <Field label="Description (Optional)">
            <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the responsibilities..." rows={3} className={inputCls} />
          </Field>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} disabled={isPending} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60">
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? "Saving…" : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function RolesClient({ schoolId, slug, schoolName }: { schoolId: string; slug: string; schoolName: string; }) {
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDef | undefined>(undefined);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      let data = await getStaffRoleDefinitions(schoolId);
      if (data.length === 0) {
        await seedDefaultRoleDefinitions(schoolId);
        data = await getStaffRoleDefinitions(schoolId);
      }
      setRoles(data);
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to load roles", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [schoolId]);

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-black dark:text-white">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Building2 size={13} /><span>{schoolName}</span><ChevronRight size={11} />
              <Link href={`/school/${slug}/staff`} className="hover:text-blue-600 transition">Staff</Link><ChevronRight size={11} />
              <span className="text-blue-600 dark:text-blue-400 font-medium">Roles</span>
            </div>
            <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight flex items-center gap-3">
              <Link href={`/school/${slug}/staff`} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 transition"><ArrowLeft size={16} /></Link>
              Staff Roles
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 ml-11">Define custom roles to assign to your staff members.</p>
          </div>
          <button onClick={() => { setEditingRole(undefined); setModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all">
            <Plus size={16} /> Create Role
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="mb-6 flex gap-4 max-w-sm">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13}/></button>}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={24} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-bold">No roles found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">You haven't defined any roles yet. Get started by creating standard roles like Teachers and Accountants to assign to your staff.</p>
            <button onClick={() => { setEditingRole(undefined); setModalOpen(true); }} className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
              Create First Role
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map(r => (
              <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow group relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center">
                      <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base leading-tight text-black dark:text-white">{r.name}</h4>
                      <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 mt-0.5 bg-slate-100 dark:bg-slate-800 inline-block px-1.5 py-0.5 rounded uppercase tracking-wide">
                        {r.code}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setEditingRole(r); setModalOpen(true); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
                
                <div className="mt-3 text-xs">
                  <span className="inline-flex items-center px-2 pt-[2px] pb-[3px] rounded-full font-medium text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    Type: <strong className="ml-1 tracking-wide">{r.roleType.replace("_", " ")}</strong>
                  </span>
                </div>

                {r.description && (
                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <RoleModal 
          schoolId={schoolId} 
          role={editingRole} 
          onClose={() => setModalOpen(false)} 
          onSaved={() => { 
            setModalOpen(false); 
            setToast({ msg: `Role successfully ${editingRole ? 'updated' : 'created'}`, type: "success" });
            loadData();
          }} 
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

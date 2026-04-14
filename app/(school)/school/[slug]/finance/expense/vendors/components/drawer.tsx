"use client";

import { getVendors, createVendor, updateVendor } from "@/actions/expenses";
import { useCallback, useEffect, useState, useTransition } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Vendor = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tinNo?: string | null;
  isActive: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
];
const avatarCls = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const inp =
  "w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 " +
  "placeholder:text-gray-300 transition-all";
const lbl =
  "block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1.5";

// ─── SlideDrawer ──────────────────────────────────────────────────────────────
function SlideDrawer({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`relative bg-white w-full max-w-[500px] h-full shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="shrink-0 px-6 py-5 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-violet-600">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
              {subtitle && <p className="text-sm text-blue-200 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, danger, busy }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel: string; danger?: boolean; busy?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: "modalPop 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1.5 w-full ${danger ? "bg-gradient-to-r from-red-400 to-red-600" : "bg-gradient-to-r from-blue-500 to-violet-600"}`} />
        <div className="p-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? "bg-red-100" : "bg-blue-100"}`}>
            <svg className={`w-6 h-6 ${danger ? "text-red-600" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={danger
                  ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
            </svg>
          </div>
          <h3 className="text-base font-black text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className={`flex-1 py-2.5 rounded-xl text-sm font-black disabled:opacity-50 transition-colors ${danger ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalPop { from { opacity:0; transform:scale(0.88) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>
    </div>
  );
}

// ─── VendorDetailModal ────────────────────────────────────────────────────────
function VendorDetailModal({ vendor, onClose, onEdit, onToggle }: {
  vendor: Vendor | null; onClose: () => void; onEdit: () => void; onToggle: () => void;
}) {
  if (!vendor) return null;
  const avCls = avatarCls(vendor.name);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 px-6 pt-8 pb-14 relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className={`w-16 h-16 rounded-2xl ${avCls} flex items-center justify-center text-3xl font-black mb-4 ring-4 ring-white/20 shadow-lg`}>
            {vendor.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-xl font-black text-white leading-tight">{vendor.name}</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${vendor.isActive ? "bg-emerald-400/25 text-emerald-100" : "bg-white/15 text-white/60"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${vendor.isActive ? "bg-emerald-300 animate-pulse" : "bg-white/40"}`} />
              {vendor.isActive ? "Active" : "Inactive"}
            </span>
            {vendor.tinNo && (
              <span className="text-[11px] font-mono bg-white/15 text-white/80 px-2.5 py-1 rounded-full">TIN: {vendor.tinNo}</span>
            )}
          </div>
        </div>

        {/* Pull-up */}
        <div className="-mt-6 bg-white rounded-t-3xl px-6 pt-6 pb-6">
          <div className="divide-y divide-gray-50 mb-5">
            {[
              { label: "Phone",   value: vendor.phone,   path: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
              { label: "Email",   value: vendor.email,   path: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              { label: "Address", value: vendor.address, path: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
            ].map(({ label, value, path }) => (
              <div key={label} className="flex items-center gap-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className={`text-sm font-semibold mt-0.5 truncate ${value ? "text-gray-800" : "text-gray-300 italic font-normal"}`}>
                    {value ?? "Not provided"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { onClose(); onEdit(); }}
              className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-black transition-colors shadow-sm shadow-blue-200">
              Edit Vendor
            </button>
            <button onClick={() => { onClose(); onToggle(); }}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${vendor.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
              {vendor.isActive ? "Deactivate" : "Reactivate"}
            </button>
            <button onClick={onClose} className="py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">Close</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(32px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function VendorsPage({ schoolId }: { schoolId: string }) {
  const [, startTx] = useTransition();
  const [busy, setBusy] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [err, setErr] = useState("");

  type DrawerMode = "new" | Vendor | null;
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", tinNo: "" });
  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Vendor | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    startTx(async () => {
      const all = await getVendors(schoolId, true);
      setVendors(all as Vendor[]);
      setLoading(false);
    });
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", phone: "", email: "", address: "", tinNo: "" }); setErr(""); setDrawer("new"); };
  const openEdit = (v: Vendor) => { setForm({ name: v.name, phone: v.phone ?? "", email: v.email ?? "", address: v.address ?? "", tinNo: v.tinNo ?? "" }); setErr(""); setDrawer(v); };

  const act = async (fn: () => Promise<unknown>, then?: () => void) => {
    setBusy(true); setErr("");
    try { await fn(); then?.(); load(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  };

  const handleSave = () => {
    if (!form.name.trim()) { setErr("Vendor name is required."); return; }
    act(async () => {
      if (drawer === "new") {
        await createVendor({ schoolId, name: form.name, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined, tinNo: form.tinNo || undefined });
      } else if (drawer) {
        await updateVendor((drawer as Vendor).id, { name: form.name, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined });
      }
    }, () => setDrawer(null));
  };

  const handleToggle = (v: Vendor) => {
    act(() => updateVendor(v.id, { isActive: !v.isActive }), () => setToggleTarget(null));
  };

  const filtered = vendors.filter((v) =>
    (showInactive || v.isActive) &&
    (!search || v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.phone?.includes(search) || v.email?.toLowerCase().includes(search.toLowerCase()))
  );
  const activeCount = vendors.filter((v) => v.isActive).length;
  const withTIN = vendors.filter((v) => v.tinNo).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center shadow-sm shadow-blue-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Vendors</h1>
              <p className="text-xs text-gray-400 mt-0.5">{activeCount} active · {vendors.length} total suppliers</p>
            </div>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Vendor
          </button>
        </div>
      </header>

      <div className="px-6 py-5 space-y-4 max-w-7xl mx-auto">
        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",    value: vendors.length, sub: "all vendors",     color: "text-gray-900" },
            { label: "Active",   value: activeCount,    sub: "currently active", color: "text-emerald-600" },
            { label: "With TIN", value: withTIN,        sub: "URA registered",  color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 hover:border-blue-200 transition-colors">
              <p className={`text-2xl font-black leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1.5">{s.label}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone or email…"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-white border border-gray-200 hover:border-blue-200 rounded-xl px-4 py-2.5 select-none transition-colors">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded accent-blue-600 w-4 h-4" />
            Show inactive
          </label>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {err}
          </div>
        )}

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
              <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Loading vendors…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-700 font-bold text-base">No vendors found</p>
              <p className="text-gray-400 text-sm mt-1">{search ? "Try a different search term" : "Add your first supplier to get started"}</p>
              {!search && (
                <button onClick={openNew} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add your first vendor
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-100">
                      {[
                        { label: "Vendor",  cls: "text-left px-5 py-3.5" },
                        { label: "Phone",   cls: "text-left px-5 py-3.5 hidden sm:table-cell" },
                        { label: "Email",   cls: "text-left px-5 py-3.5 hidden md:table-cell" },
                        { label: "Status",  cls: "text-left px-5 py-3.5" },
                        { label: "Actions", cls: "text-right px-5 py-3.5" },
                      ].map((h) => (
                        <th key={h.label} className={`${h.cls} text-[10px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v, i) => (
                      <tr key={v.id}
                        className={`${i < filtered.length - 1 ? "border-b border-gray-50" : ""} hover:bg-blue-50/50 transition-colors group ${!v.isActive ? "opacity-50" : ""}`}>

                        {/* Name + avatar */}
                        <td className="px-5 py-4">
                          <button className="flex items-center gap-3 text-left" onClick={() => setDetailVendor(v)}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${avatarCls(v.name)} group-hover:ring-2 group-hover:ring-blue-300/60 transition-all`}>
                              {v.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug">{v.name}</p>
                              <p className="text-[11px] text-gray-400 sm:hidden mt-0.5">{v.phone ?? "No phone"}</p>
                            </div>
                          </button>
                        </td>

                        <td className="px-5 py-4 hidden sm:table-cell text-gray-600 text-xs">{v.phone ?? <span className="text-gray-300 italic">—</span>}</td>
                        <td className="px-5 py-4 hidden md:table-cell"><span className="text-gray-600 text-xs truncate block max-w-[180px]">{v.email ?? <span className="text-gray-300 italic">—</span>}</span></td>

                        <td className="px-5 py-4">
                          {v.isActive
                            ? <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span>
                            : <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Inactive</span>}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setDetailVendor(v)} title="View"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button onClick={() => openEdit(v)}
                              className="text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                              Edit
                            </button>
                            <button onClick={() => setToggleTarget(v)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border ${v.isActive ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100"}`}>
                              {v.isActive ? "Disable" : "Enable"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">
                  Showing <span className="text-gray-700 font-bold">{filtered.length}</span> of <span className="text-gray-700 font-bold">{vendors.length}</span> vendors
                </p>
                <button onClick={openNew} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Add new
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Add / Edit Drawer ──────────────────────────────────────────────── */}
      <SlideDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === "new" ? "Add Vendor" : "Edit Vendor"}
        subtitle={drawer === "new" ? "Fill in supplier details" : `Editing: ${(drawer as Vendor)?.name}`}
      >
        <div className="p-6 space-y-5">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {err}
            </div>
          )}
          <div>
            <label className={lbl}>Vendor Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={setF("name")} placeholder="e.g. Nakasero Market Traders Ltd" className={inp} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Phone</label>
              <input type="tel" value={form.phone} onChange={setF("phone")} placeholder="0700 000 000" className={inp} />
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input type="email" value={form.email} onChange={setF("email")} placeholder="vendor@email.com" className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Physical Address</label>
            <input type="text" value={form.address} onChange={setF("address")} placeholder="e.g. Nakasero Road, Kampala" className={inp} />
          </div>
          <div>
            <label className={lbl}>TIN No. <span className="text-gray-400 font-normal normal-case text-[11px]">(URA Tax ID — optional)</span></label>
            <input type="text" value={form.tinNo} onChange={setF("tinNo")} placeholder="e.g. 1234567890" className={`${inp} font-mono tracking-widest`} />
          </div>
          {form.name && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Preview</p>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black ${avatarCls(form.name)}`}>
                  {form.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-gray-900">{form.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[form.phone, form.email].filter(Boolean).join(" · ") || "No contact info added yet"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={() => setDrawer(null)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={busy || !form.name.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl text-sm font-black disabled:opacity-50 transition-colors shadow-sm shadow-blue-200">
            {busy ? "Saving…" : drawer === "new" ? "Add Vendor" : "Save Changes"}
          </button>
        </div>
      </SlideDrawer>

      {/* ── Vendor Detail Modal ──────────────────────────────────────────── */}
      <VendorDetailModal
        vendor={detailVendor}
        onClose={() => setDetailVendor(null)}
        onEdit={() => { if (detailVendor) openEdit(detailVendor); }}
        onToggle={() => { if (detailVendor) setToggleTarget(detailVendor); }}
      />

      {/* ── Toggle Confirm Modal ─────────────────────────────────────────── */}
      <ConfirmModal
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && handleToggle(toggleTarget)}
        title={toggleTarget?.isActive ? "Deactivate Vendor?" : "Reactivate Vendor?"}
        message={
          toggleTarget?.isActive
            ? `"${toggleTarget?.name}" will no longer appear in expense forms until reactivated.`
            : `"${toggleTarget?.name}" will become available again when creating expenses.`
        }
        confirmLabel={toggleTarget?.isActive ? "Deactivate" : "Reactivate"}
        danger={toggleTarget?.isActive}
        busy={busy}
      />
    </div>
  );
}
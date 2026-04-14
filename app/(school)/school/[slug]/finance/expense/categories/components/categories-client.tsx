// "use client";

// import { createExpenseCategory, getExpenseCategories, updateExpenseCategory } from "@/actions/expenses";
// import { useEffect, useState, useTransition, useCallback } from "react";


// type Category = {
//   id: string;
//   name: string;
//   code: string;
//   description?: string | null;
//   isActive: boolean;
// };

// const inp = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/20 placeholder:text-gray-400";
// const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

// const CODE_COLORS: Record<string, string> = {
//   SAL:"bg-violet-100 text-violet-700", FOD:"bg-orange-100 text-orange-700", UTL:"bg-blue-100 text-blue-700",
//   FUL:"bg-yellow-100 text-yellow-700", MNT:"bg-stone-100 text-stone-700", STN:"bg-cyan-100 text-cyan-700",
//   MED:"bg-red-100 text-red-700", TRP:"bg-green-100 text-green-700", ICT:"bg-indigo-100 text-indigo-700",
//   EVT:"bg-pink-100 text-pink-700", CLN:"bg-teal-100 text-teal-700", LAB:"bg-emerald-100 text-emerald-700",
//   SEC:"bg-gray-200 text-gray-700", INS:"bg-sky-100 text-sky-700", OTH:"bg-slate-100 text-slate-600",
// };

// function SlideDrawer({ open, onClose, title, subtitle, children }: {
//   open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
// }) {
//   useEffect(() => {
//     const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
//     if (open) document.addEventListener("keydown", fn);
//     return () => document.removeEventListener("keydown", fn);
//   }, [open, onClose]);

//   return (
//     <div className={`fixed inset-0 z-50 flex justify-end ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
//       <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
//       <div className={`relative bg-white w-full max-w-[460px] h-full shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-x-0" : "translate-x-full"}`}>
//         <div className="px-6 py-5 border-b border-gray-100">
//           <div className="flex items-start justify-between gap-4">
//             <div>
//               <h2 className="text-lg font-bold text-gray-900">{title}</h2>
//               {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
//             </div>
//             <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0">
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
//             </button>
//           </div>
//         </div>
//         <div className="flex-1 overflow-y-auto">{children}</div>
//       </div>
//     </div>
//   );
// }

// interface Props { schoolId: string }

// export default function CategoriesPage({ schoolId }: Props) {
//   const [, startTx] = useTransition();
//   const [busy, setBusy] = useState(false);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showInactive, setShowInactive] = useState(false);
//   const [err, setErr] = useState("");
//   type DrawerMode = "new" | Category | null;
//   const [drawer, setDrawer] = useState<DrawerMode>(null);
//   const [form, setForm] = useState({ name: "", code: "", description: "" });
//   const setF = (k: keyof typeof form) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }));

//   const load = useCallback(() => {
//     setLoading(true);
//     startTx(async () => {
//       const cats = await getExpenseCategories(schoolId);
//       setCategories(cats as any[]);
//       setLoading(false);
//     });
//   }, [schoolId]);

//   useEffect(() => { load(); }, [load]);

//   const openNew = () => { setForm({ name:"", code:"", description:"" }); setErr(""); setDrawer("new"); };
//   const openEdit = (c: Category) => { setForm({ name: c.name, code: c.code, description: c.description??"" }); setErr(""); setDrawer(c); };

//   const act = async (fn: () => Promise<any>) => {
//     setBusy(true); setErr("");
//     try { await fn(); setDrawer(null); load(); }
//     catch (e: any) { setErr(e.message ?? "Something went wrong"); }
//     finally { setBusy(false); }
//   };

//   const handleSave = () => {
//     if (!form.name.trim()) { setErr("Name is required."); return; }
//     if (drawer === "new" && !form.code.trim()) { setErr("Code is required (2–4 letters, e.g. FOD)."); return; }
//     act(async () => {
//       if (drawer === "new") {
//         await createExpenseCategory({ schoolId, name: form.name, code: form.code.toUpperCase(), description: form.description||undefined });
//       } else if (drawer) {
//         await updateExpenseCategory(drawer.id, { name: form.name, description: form.description||undefined });
//       }
//     });
//   };

//   const handleToggle = (c: Category) => {
//     if (!confirm(`${c.isActive ? "Deactivate" : "Reactivate"} category "${c.name}"?`)) return;
//     setBusy(true);
//     updateExpenseCategory(c.id, { isActive: !c.isActive }).then(() => load()).finally(() => setBusy(false));
//   };

//   const filtered = categories.filter(c => showInactive || c.isActive);
//   const previewColor = CODE_COLORS[form.code.toUpperCase()] ?? "bg-gray-100 text-gray-600";

//   return (
//     <div className="min-h-screen bg-[#f7f8fc]">
//       <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-20">
//         <div className="flex items-center justify-between gap-4">
//           <div>
//             <h1 className="text-xl font-bold text-gray-900">Expense Categories</h1>
//             <p className="text-sm text-gray-400 mt-0.5">{categories.filter(c => c.isActive).length} active categories</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
//               <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
//               Show inactive
//             </label>
//             <button onClick={openNew}
//               className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
//               Add Category
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="px-6 py-5">
//         <p className="text-sm text-gray-400 mb-5">
//           Categories appear when creating expenses and are used in spending reports. Each has a short code (2–4 letters) for quick reference.
//         </p>

//         {loading ? (
//           <div className="text-center py-20 text-gray-400 text-sm">Loading categories…</div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
//             {filtered.map(cat => {
//               const colorCls = CODE_COLORS[cat.code] ?? "bg-gray-100 text-gray-600";
//               return (
//                 <div key={cat.id}
//                   className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-sm ${cat.isActive ? "border-gray-200" : "border-dashed border-gray-200 opacity-50"}`}>
//                   <div className="flex items-start gap-3 mb-3">
//                     <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${colorCls}`}>
//                       {cat.code}
//                     </span>
//                     <div className="flex-1 min-w-0 pt-0.5">
//                       <p className="font-bold text-gray-900 text-sm leading-snug">{cat.name}</p>
//                       {!cat.isActive && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Inactive</span>}
//                     </div>
//                   </div>
//                   {cat.description && (
//                     <p className="text-[11px] text-gray-400 leading-relaxed mb-3 line-clamp-2">{cat.description}</p>
//                   )}
//                   <div className="flex gap-1.5 pt-3 border-t border-gray-100">
//                     <button onClick={() => openEdit(cat)}
//                       className="flex-1 text-[11px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 py-1.5 rounded-lg transition-colors">
//                       Edit
//                     </button>
//                     <button onClick={() => handleToggle(cat)}
//                       className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-colors ${cat.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
//                       {cat.isActive ? "Disable" : "Enable"}
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}

//             {/* Add card */}
//             <button onClick={openNew}
//               className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all min-h-[130px]">
//               <div className="w-9 h-9 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
//               </div>
//               <span className="text-xs font-semibold">New Category</span>
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Category Drawer */}
//       <SlideDrawer
//         open={drawer !== null}
//         onClose={() => setDrawer(null)}
//         title={drawer === "new" ? "New Category" : "Edit Category"}
//         subtitle={drawer !== "new" && drawer ? `Code: ${(drawer as Category).code}` : "Set a name and short code"}
//       >
//         <div className="p-6 space-y-4">
//           {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{err}</div>}

//           <div>
//             <label className={lbl}>Category Name <span className="text-red-500">*</span></label>
//             <input type="text" value={form.name} onChange={setF("name")} placeholder="e.g. Food & Provisions" className={inp} autoFocus />
//           </div>

//           <div>
//             <label className={lbl}>
//               Short Code <span className="text-red-500">*</span>
//               <span className="text-gray-400 font-normal normal-case ml-1">(2–4 letters, used in reports)</span>
//             </label>
//             <input
//               type="text"
//               value={form.code}
//               onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z]/g,"").slice(0,4) }))}
//               placeholder="e.g. FOD"
//               maxLength={4}
//               disabled={drawer !== "new"}
//               className={`${inp} font-mono ${drawer !== "new" ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
//             />
//             {drawer !== "new" && <p className="text-xs text-gray-400 mt-1.5">Code cannot be changed after creation.</p>}
//           </div>

//           <div>
//             <label className={lbl}>Description <span className="text-gray-400 font-normal normal-case text-xs">(optional)</span></label>
//             <textarea rows={3} value={form.description} onChange={setF("description")}
//               placeholder="What expenses belong here?" className={`${inp} resize-none`} />
//           </div>

//           {/* Live preview */}
//           {(form.code || form.name) && (
//             <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
//               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Preview</p>
//               <div className="flex items-center gap-3">
//                 <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${previewColor}`}>
//                   {form.code || "??"}
//                 </span>
//                 <p className="font-bold text-gray-900 text-sm">{form.name || "Category name"}</p>
//               </div>
//             </div>
//           )}
//         </div>
//         <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
//           <button onClick={() => setDrawer(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
//           <button onClick={handleSave} disabled={busy}
//             className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
//             {busy ? "Saving…" : drawer === "new" ? "Create Category" : "Save Changes"}
//           </button>
//         </div>
//       </SlideDrawer>
//     </div>
//   );
// }





"use client";

import { createExpenseCategory, getExpenseCategories, updateExpenseCategory } from "@/actions/expenses";
import { useEffect, useState, useTransition, useCallback } from "react";

type Category = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
};

const inp = "w-full border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-gray-400";
const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

const CODE_COLORS: Record<string, string> = {
  SAL:"bg-violet-100 text-violet-700", FOD:"bg-orange-100 text-orange-700", UTL:"bg-blue-100 text-blue-700",
  FUL:"bg-yellow-100 text-yellow-700", MNT:"bg-stone-100 text-stone-700", STN:"bg-cyan-100 text-cyan-700",
  MED:"bg-red-100 text-red-700", TRP:"bg-green-100 text-green-700", ICT:"bg-indigo-100 text-indigo-700",
  EVT:"bg-pink-100 text-pink-700", CLN:"bg-teal-100 text-teal-700", LAB:"bg-emerald-100 text-emerald-700",
  SEC:"bg-gray-200 text-gray-700", INS:"bg-sky-100 text-sky-700", OTH:"bg-slate-100 text-slate-600",
};

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
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`relative bg-white w-full max-w-[460px] h-full shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="text-xs text-blue-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

interface Props { schoolId: string }

export default function CategoriesPage({ schoolId }: Props) {
  const [, startTx] = useTransition();
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  type DrawerMode = "new" | Category | null;
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = useCallback(() => {
    setLoading(true);
    startTx(async () => {
      const cats = await getExpenseCategories(schoolId);
      setCategories(cats as any[]);
      setLoading(false);
    });
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", code: "", description: "" }); setErr(""); setDrawer("new"); };
  const openEdit = (c: Category) => { setForm({ name: c.name, code: c.code, description: c.description ?? "" }); setErr(""); setDrawer(c); };

  const act = async (fn: () => Promise<any>) => {
    setBusy(true); setErr("");
    try { await fn(); setDrawer(null); load(); }
    catch (e: any) { setErr(e.message ?? "Something went wrong"); }
    finally { setBusy(false); }
  };

  const handleSave = () => {
    if (!form.name.trim()) { setErr("Name is required."); return; }
    if (drawer === "new" && !form.code.trim()) { setErr("Code is required (2–4 letters, e.g. FOD)."); return; }
    act(async () => {
      if (drawer === "new") {
        await createExpenseCategory({ schoolId, name: form.name, code: form.code.toUpperCase(), description: form.description || undefined });
      } else if (drawer) {
        await updateExpenseCategory((drawer as Category).id, { name: form.name, description: form.description || undefined });
      }
    });
  };

  const handleToggle = (c: Category) => {
    if (!confirm(`${c.isActive ? "Deactivate" : "Reactivate"} category "${c.name}"?`)) return;
    setBusy(true);
    updateExpenseCategory(c.id, { isActive: !c.isActive }).then(() => load()).finally(() => setBusy(false));
  };

  const filtered = categories.filter(c =>
    (showInactive || c.isActive) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = categories.filter(c => c.isActive).length;
  const previewColor = CODE_COLORS[form.code.toUpperCase()] ?? "bg-blue-100 text-blue-700";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Expense Categories</h1>
              <p className="text-sm text-gray-400 mt-0.5">{activeCount} active · {categories.length} total</p>
            </div>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: categories.length, icon: "🏷️", color: "text-gray-900" },
            { label: "Active", value: activeCount, icon: "✅", color: "text-emerald-600" },
            { label: "Inactive", value: categories.length - activeCount, icon: "⏸️", color: "text-gray-400" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className={`text-2xl font-black leading-none ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or code…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-white border border-gray-200 rounded-xl px-4 py-2.5 select-none">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded accent-blue-600" />
            Show inactive
          </label>
        </div>

        {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{err}</div>}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
              <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              <span className="text-sm">Loading categories…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-gray-600 font-semibold">No categories found</p>
              <p className="text-gray-400 text-sm mt-1">Create your first expense category</p>
              <button onClick={openNew} className="mt-3 text-sm text-blue-600 hover:underline font-medium">+ Add category</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-100">
                      <th className="text-left px-5 py-3.5 text-[10px] font-black text-blue-600 uppercase tracking-widest w-24">Code</th>
                      <th className="text-left px-5 py-3.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">Category Name</th>
                      <th className="text-left px-5 py-3.5 text-[10px] font-black text-blue-600 uppercase tracking-widest hidden md:table-cell">Description</th>
                      <th className="text-left px-5 py-3.5 text-[10px] font-black text-blue-600 uppercase tracking-widest w-28">Status</th>
                      <th className="text-right px-5 py-3.5 text-[10px] font-black text-blue-600 uppercase tracking-widest w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((cat, i) => {
                      const colorCls = CODE_COLORS[cat.code] ?? "bg-blue-100 text-blue-700";
                      return (
                        <tr
                          key={cat.id}
                          className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors group ${i === filtered.length - 1 ? "border-b-0" : ""} ${!cat.isActive ? "opacity-50" : ""}`}
                        >
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center justify-center w-14 h-7 rounded-lg text-[11px] font-black tracking-wider ${colorCls}`}>
                              {cat.code}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">{cat.name}</p>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <p className="text-gray-400 text-xs max-w-xs truncate">
                              {cat.description ?? <span className="italic text-gray-300">No description</span>}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            {cat.isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(cat)}
                                className="text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggle(cat)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                  cat.isActive
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                }`}
                              >
                                {cat.isActive ? "Disable" : "Enable"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing {filtered.length} of {categories.length} categories
                </p>
                <button onClick={openNew} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add new
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drawer */}
      <SlideDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === "new" ? "New Category" : "Edit Category"}
        subtitle={drawer !== "new" && drawer ? `Editing code: ${(drawer as Category).code}` : "Fill in the details below"}
      >
        <div className="p-6 space-y-4">
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{err}</div>}

          <div>
            <label className={lbl}>Category Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={setF("name")} placeholder="e.g. Food & Provisions" className={inp} autoFocus />
          </div>

          <div>
            <label className={lbl}>
              Short Code <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal normal-case ml-1">(2–4 letters, used in reports)</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) }))}
              placeholder="e.g. FOD"
              maxLength={4}
              disabled={drawer !== "new"}
              className={`${inp} font-mono tracking-widest ${drawer !== "new" ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
            />
            {drawer !== "new" && <p className="text-xs text-gray-400 mt-1.5">Code cannot be changed after creation.</p>}
          </div>

          <div>
            <label className={lbl}>Description <span className="text-gray-400 font-normal normal-case text-xs">(optional)</span></label>
            <textarea rows={3} value={form.description} onChange={setF("description")} placeholder="What expenses belong here?" className={`${inp} resize-none`} />
          </div>

          {(form.code || form.name) && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <span className={`w-14 h-7 rounded-lg flex items-center justify-center text-[11px] font-black tracking-wider ${previewColor}`}>
                  {form.code || "??"}
                </span>
                <p className="font-bold text-gray-900 text-sm">{form.name || "Category name"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={() => setDrawer(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={busy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm shadow-blue-200">
            {busy ? "Saving…" : drawer === "new" ? "Create Category" : "Save Changes"}
          </button>
        </div>
      </SlideDrawer>
    </div>
  );
}
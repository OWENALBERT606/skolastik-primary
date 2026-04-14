"use client";

import {
  createStockItem,
  createStore,
  getAllMovements,
  getInventoryStats,
  getStockItems,
  getStores,
  recordAdjustment,
  recordStockIn,
  recordStockOut,
  updateStockItem,
  updateStore,
} from "@/actions/inventory";
import { useCallback, useEffect, useState, useTransition } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Store = {
  id: string; name: string; description?: string | null;
  location?: string | null; isActive: boolean;
  _count?: { stockItems: number };
};
type StockItem = {
  id: string; name: string; code?: string | null; unit: string;
  category?: string | null; quantity: number;
  minQuantity?: number | null; lastPurchasePrice?: number | null;
  isActive: boolean;
};
type Movement = {
  id: string; type: string; reason: string; quantity: number;
  quantityBefore: number; quantityAfter: number;
  unitCost?: number | null; notes?: string | null;
  createdAt: string | Date;
  stockItem: { name: string; unit: string };
  performedBy?: { name: string | null } | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const UNITS       = ["KG","Grams","Litres","ML","Pieces","Boxes","Reams","Rolls","Bags","Cartons","Bundles","Dozen","Sets","Metres"];
const CATEGORIES  = ["Food","Stationery","Cleaning","Lab","Maintenance","Fuel","Medical","Other"];
const CAT_ICONS: Record<string, string> = {
  Food:"🍚", Stationery:"📝", Cleaning:"🧹", Lab:"🔬",
  Maintenance:"🔧", Fuel:"⛽", Medical:"💊", Other:"📦", Uncategorised:"📦",
};
const OUT_REASONS = [
  { v:"KITCHEN_USE",      l:"Kitchen Use" },
  { v:"CLASSROOM_USE",    l:"Classroom / Lab" },
  { v:"OFFICE_USE",       l:"Office Use" },
  { v:"MAINTENANCE_USE",  l:"Maintenance" },
  { v:"DAMAGE_WRITE_OFF", l:"Damage / Write-off" },
  { v:"OTHER",            l:"Other" },
];
const ADJ_REASONS = [
  { v:"AUDIT_ADJUSTMENT", l:"Stock Audit" },
  { v:"DAMAGE_WRITE_OFF", l:"Damage / Write-off" },
  { v:"DONATION",         l:"Donation Received" },
  { v:"OPENING_BALANCE",  l:"Opening Balance" },
  { v:"OTHER",            l:"Other" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtQ    = (n: number, u: string) =>
  `${(n % 1 === 0 ? n : Number(n.toFixed(2))).toLocaleString()} ${u}`;
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-UG", { day:"2-digit", month:"short" });
const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("en-UG", { hour:"2-digit", minute:"2-digit" });
const fmtUGX  = (n: number) => "UGX " + Math.round(n).toLocaleString("en-UG");

// ─── UI Primitives ────────────────────────────────────────────────────────────
const inp =
  "w-full border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 " +
  "placeholder:text-gray-300 transition-all";
const lbl = "block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1.5";

// ─── StockPill ────────────────────────────────────────────────────────────────
function StockPill({ qty, min }: { qty: number; min?: number | null }) {
  if (qty <= 0)
    return <span className="inline-flex items-center gap-1 text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Out</span>;
  if (min != null && qty <= min)
    return <span className="inline-flex items-center gap-1 text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" />Low</span>;
  return <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />OK</span>;
}

// ─── MovBadge ─────────────────────────────────────────────────────────────────
function MovBadge({ type }: { type: string }) {
  if (type === "IN")   return <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg uppercase tracking-wide">IN ↑</span>;
  if (type === "OUT")  return <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-lg uppercase tracking-wide">OUT ↓</span>;
  return <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg uppercase tracking-wide">ADJ ↔</span>;
}

// ─── SlideDrawer ──────────────────────────────────────────────────────────────
function SlideDrawer({
  open, onClose, title, subtitle, children,
}: {
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
      <div className={`relative bg-white w-full max-w-[480px] h-full shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="shrink-0 px-6 py-5 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-violet-600">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
              {subtitle && <p className="text-sm text-blue-200 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0">
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

// ─── PopModal ─────────────────────────────────────────────────────────────────
function PopModal({
  open, onClose, title, subtitle, children, accent = "purple",
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  children: React.ReactNode; accent?: "emerald" | "red" | "amber" | "purple";
}) {
  if (!open) return null;
  const bars = {
    emerald: "from-emerald-400 to-emerald-600",
    red:     "from-red-400 to-red-600",
    amber:   "from-amber-400 to-amber-500",
    purple:  "from-blue-500 to-violet-600",
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "popIn .2s cubic-bezier(.34,1.56,.64,1)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`h-1.5 bg-gradient-to-r ${bars[accent]}`} />
        <div className="px-5 pt-4 pb-1">
          <h3 className="font-black text-gray-900 text-base">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
      <style>{`@keyframes popIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function InventoryPage({ schoolId }: { schoolId: string }) {
  const [, startTx] = useTransition();
  const [busy, setBusy] = useState(false);

  const [stores,        setStores]        = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [items,         setItems]         = useState<StockItem[]>([]);
  const [movements,     setMovements]     = useState<Movement[]>([]);
  const [stats,         setStats]         = useState<any>(null);

  const [tab,       setTab]       = useState<"items" | "movements" | "alerts">("items");
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [err,       setErr]       = useState("");

  type ModalType =
    | "stockIn" | "stockOut" | "adjust"
    | "newItem" | "editItem"
    | "newStore" | "editStore"
    | null;
  const [modal,      setModal]      = useState<ModalType>(null);
  const [activeItem, setActiveItem] = useState<StockItem | null>(null);

  // ── Forms ──────────────────────────────────────────────────────────────────
  const [inForm,      setInForm]      = useState({ qty: "", cost: "", notes: "" });
  const [outForm,     setOutForm]     = useState({ qty: "", reason: "KITCHEN_USE", notes: "" });
  const [adjForm,     setAdjForm]     = useState({ qty: "", reason: "AUDIT_ADJUSTMENT", notes: "" });
  const [newItemForm, setNewItemForm] = useState({ name: "", code: "", unit: "KG", category: "Food", minQty: "", openQty: "", openCost: "" });
  const [editItemForm,setEditItemForm]= useState({ name: "", code: "", unit: "KG", category: "Food", minQty: "" });
  const [storeForm,   setStoreForm]   = useState({ name: "", description: "", location: "" });

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadStores = useCallback(() => {
    startTx(async () => {
      const s = await getStores(schoolId);
      setStores(s as Store[]);
      setSelectedStore(prev => {
        if (prev) return prev;
        return s.length > 0 ? s[0] as Store : null;
      });
    });
  }, [schoolId]);

  const loadStats = useCallback(() => {
    startTx(async () => {
      const st = await getInventoryStats(schoolId);
      setStats(st);
    });
  }, [schoolId]);

  const loadItems = useCallback((storeId: string) => {
    startTx(async () => {
      const it = await getStockItems(storeId, {
        search:   search    || undefined,
        category: catFilter || undefined,
      });
      setItems(it as StockItem[]);
    });
  }, [search, catFilter]);

  const loadMovements = useCallback((storeId: string) => {
    startTx(async () => {
      const mv = await getAllMovements(schoolId, { storeId });
      setMovements(mv as Movement[]);
    });
  }, [schoolId]);

  useEffect(() => { loadStores(); loadStats(); }, [loadStores, loadStats]);
  useEffect(() => {
    if (selectedStore) {
      loadItems(selectedStore.id);
      loadMovements(selectedStore.id);
    }
  }, [selectedStore, search, catFilter, loadItems, loadMovements]);

  // ── Reloader ───────────────────────────────────────────────────────────────
  const reloadAll = useCallback(() => {
    if (selectedStore) {
      loadItems(selectedStore.id);
      loadMovements(selectedStore.id);
    }
    loadStats();
    loadStores();
  }, [selectedStore, loadItems, loadMovements, loadStats, loadStores]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = (m: ModalType, item?: StockItem) => {
    setActiveItem(item ?? null);
    setErr("");
    if (m === "editItem" && item) {
      setEditItemForm({
        name:     item.name,
        code:     item.code     ?? "",
        unit:     item.unit,
        category: item.category ?? "Other",
        minQty:   item.minQuantity != null ? String(item.minQuantity) : "",
      });
    }
    setModal(m);
  };

  const resetForms = () => {
    setInForm({ qty: "", cost: "", notes: "" });
    setOutForm({ qty: "", reason: "KITCHEN_USE", notes: "" });
    setAdjForm({ qty: "", reason: "AUDIT_ADJUSTMENT", notes: "" });
    setNewItemForm({ name: "", code: "", unit: "KG", category: "Food", minQty: "", openQty: "", openCost: "" });
    setStoreForm({ name: "", description: "", location: "" });
  };

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
      setModal(null);
      resetForms();
      reloadAll();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const grouped = items.reduce<Record<string, StockItem[]>>((acc, item) => {
    const cat = item.category ?? "Uncategorised";
    (acc[cat] ??= []).push(item);
    return acc;
  }, {});

  const lowAlerts:      any[] = stats?.lowStockItems ?? [];
  const storeLowAlerts: any[] = lowAlerts.filter((a: any) => a.storeId === selectedStore?.id);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center shadow-sm shadow-blue-300">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Inventory</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {stats
                ? `${stats.storeCount} store${stats.storeCount !== 1 ? "s" : ""} · ${stats.totalItems} items`
                : "Loading…"}
              {(stats?.lowStockCount ?? 0) > 0 && (
                <span className="ml-2 text-orange-500 font-bold">· ⚠ {stats.lowStockCount} low stock</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setStoreForm({ name:"", description:"", location:"" }); setErr(""); setModal("newStore"); }}
            className="border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 text-sm font-bold px-3 py-2.5 rounded-xl transition-colors"
          >
            + Store
          </button>
          {selectedStore && (
            <button
              onClick={() => { setNewItemForm({ name:"", code:"", unit:"KG", category:"Food", minQty:"", openQty:"", openCost:"" }); setErr(""); setModal("newItem"); }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              + Item
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Store Sidebar ────────────────────────────────────────────── */}
        <aside className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest px-2 mb-2">Stores</p>
            {stores.map(s => {
              const hasAlert = lowAlerts.some((a: any) => a.storeId === s.id);
              const isActive = selectedStore?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStore(s)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm mb-0.5 flex items-center gap-2 transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <span className="flex-1 font-bold truncate">{s.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasAlert && <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
                    <span className={`text-xs font-semibold ${isActive ? "text-blue-200" : "text-gray-400"}`}>
                      {s._count?.stockItems ?? 0}
                    </span>
                  </div>
                </button>
              );
            })}
            {stores.length === 0 && (
              <p className="text-xs text-gray-400 text-center px-2 py-4">No stores yet</p>
            )}
          </div>

          {/* Low stock mini panel */}
          {lowAlerts.length > 0 && (
            <div className="border-t border-orange-100 bg-orange-50/60 p-3 shrink-0">
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-2">⚠ Needs Restocking</p>
              {lowAlerts.slice(0, 5).map((a: any) => (
                <div key={a.id} className="px-1 py-1.5 border-b border-orange-100/60 last:border-0">
                  <p className="text-xs font-bold text-gray-700 truncate">{a.name}</p>
                  <p className="text-[10px] text-orange-600 font-semibold">{a.quantity} / {a.minQuantity} {a.unit}</p>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {!selectedStore ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="font-black text-gray-700 text-lg">No stores yet</p>
                <p className="text-gray-400 text-sm mt-1 mb-4">Create a storage location to start tracking inventory</p>
                <button
                  onClick={() => { setStoreForm({ name:"", description:"", location:"" }); setErr(""); setModal("newStore"); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-blue-200"
                >
                  + Create first store
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-4">

              {/* Store header + tabs + edit button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{selectedStore.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedStore.location ?? "No location set"} · {items.length} item{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => { setStoreForm({ name: selectedStore.name, description: selectedStore.description ?? "", location: selectedStore.location ?? "" }); setErr(""); setModal("editStore"); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    title="Edit store"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start">
                  {(["items","movements","alerts"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`relative text-xs px-4 py-1.5 rounded-lg font-bold capitalize transition-all ${
                        tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {t}
                      {t === "alerts" && storeLowAlerts.length > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-orange-500 text-white text-[8px] font-black rounded-full">
                          {storeLowAlerts.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ════ ITEMS TAB ════════════════════════════════════════════ */}
              {tab === "items" && (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search items…"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
                      />
                    </div>
                    <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                      className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
                    >
                      <option value="">All categories</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {items.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 text-center py-24">
                      <div className="text-4xl mb-3">📦</div>
                      <p className="text-gray-600 font-bold">No items in this store</p>
                      <p className="text-gray-400 text-sm mt-1">{search || catFilter ? "Try clearing your filters" : "Add stock items to track quantities"}</p>
                      {!search && !catFilter && (
                        <button onClick={() => openModal("newItem")} className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700">
                          + Add first item
                        </button>
                      )}
                    </div>
                  ) : (
                    Object.entries(grouped).map(([cat, catItems]) => (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="text-base">{CAT_ICONS[cat] ?? "📦"}</span>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cat}</p>
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-[10px] text-gray-400">{catItems.length}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-5">
                          {catItems.map(item => (
                            <div key={item.id}
                              className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-black text-gray-900 text-sm leading-snug truncate group-hover:text-blue-700 transition-colors">
                                    {item.name}
                                  </p>
                                  {item.code && (
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.code}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <StockPill qty={item.quantity} min={item.minQuantity} />
                                  <button onClick={() => openModal("editItem", item)} title="Edit item"
                                    className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              <p className="text-2xl font-black text-gray-900 tabular-nums leading-none mb-1">
                                {fmtQ(item.quantity, item.unit)}
                              </p>
                              {item.minQuantity != null && (
                                <p className="text-[11px] text-gray-400 mb-0.5">
                                  Min: {fmtQ(item.minQuantity, item.unit)}
                                  {item.quantity <= item.minQuantity && (
                                    <span className="ml-1.5 text-orange-500 font-bold">
                                      — need {fmtQ(item.minQuantity - item.quantity, item.unit)} more
                                    </span>
                                  )}
                                </p>
                              )}
                              {item.lastPurchasePrice != null && (
                                <p className="text-[10px] text-gray-400 mb-3">
                                  Last price: {fmtUGX(item.lastPurchasePrice)}/{item.unit}
                                </p>
                              )}
                              <div className={item.minQuantity != null || item.lastPurchasePrice != null ? "" : "mt-3"} />

                              <div className="flex gap-1.5">
                                <button onClick={() => openModal("stockIn", item)}
                                  className="flex-1 text-[11px] font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-xl transition-colors border border-emerald-100">
                                  + IN
                                </button>
                                <button onClick={() => openModal("stockOut", item)}
                                  className="flex-1 text-[11px] font-black bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-xl transition-colors border border-red-100">
                                  − OUT
                                </button>
                                <button onClick={() => openModal("adjust", item)} title="Adjust stock"
                                  className="text-[11px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-xl transition-colors border border-blue-100">
                                  ⚖
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* ════ MOVEMENTS TAB ════════════════════════════════════════ */}
              {tab === "movements" && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 border-b border-blue-100 bg-blue-50 flex items-center justify-between">
                    <p className="font-black text-blue-700 text-sm">Movement Log</p>
                    <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">Last 200 entries</p>
                  </div>

                  {movements.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="font-bold text-gray-600">No movements yet</p>
                      <p className="text-sm text-gray-400 mt-1">Stock IN and OUT will appear here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-blue-50 border-b border-blue-100">
                            {["Date","Item","Type","Qty","Before → After","Reason","By"].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {movements.map((m, i) => (
                            <tr key={m.id}
                              className={`hover:bg-blue-50/40 transition-colors ${i < movements.length - 1 ? "border-b border-gray-50" : ""}`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <p className="text-xs font-bold text-gray-700">{fmtDate(m.createdAt)}</p>
                                <p className="text-[10px] text-gray-400">{fmtTime(m.createdAt)}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-900 text-xs whitespace-nowrap max-w-[120px] truncate">{m.stockItem?.name}</p>
                              </td>
                              <td className="px-4 py-3"><MovBadge type={m.type} /></td>
                              <td className="px-4 py-3 font-black text-gray-900 tabular-nums text-sm whitespace-nowrap">
                                {m.quantity} {m.stockItem?.unit}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                                {Number(m.quantityBefore).toFixed(1)} → {Number(m.quantityAfter).toFixed(1)}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">
                                {m.reason?.replace(/_/g, " ")}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                                {m.performedBy?.name ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ════ ALERTS TAB ════════════════════════════════════════════ */}
              {tab === "alerts" && (
                storeLowAlerts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 text-center py-24">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
                    <p className="font-black text-gray-700 text-lg">All stock levels healthy</p>
                    <p className="text-sm text-gray-400 mt-1">No items below their minimum threshold in this store</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                      <span className="text-xl">⚠️</span>
                      <p className="text-sm font-bold text-orange-700">
                        {storeLowAlerts.length} item{storeLowAlerts.length !== 1 ? "s" : ""} need restocking in {selectedStore.name}
                      </p>
                    </div>
                    {storeLowAlerts.map((item: any) => {
                      const pct     = item.minQuantity > 0 ? Math.min(100, Math.round((item.quantity / item.minQuantity) * 100)) : 0;
                      const isEmpty = item.quantity <= 0;
                      return (
                        <div key={item.id}
                          className={`bg-white rounded-2xl border p-5 flex items-center gap-4 hover:shadow-sm transition-all ${isEmpty ? "border-red-200" : "border-orange-200"}`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${isEmpty ? "bg-red-100" : "bg-orange-100"}`}>
                            {isEmpty ? "🚫" : "⚠️"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400 mb-1.5">{item.category ?? "Uncategorised"}</p>
                            <div className="w-full max-w-xs h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isEmpty ? "bg-red-500" : "bg-orange-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {pct}% of minimum threshold ({item.minQuantity} {item.unit})
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-2xl font-black tabular-nums ${isEmpty ? "text-red-600" : "text-orange-600"}`}>
                              {fmtQ(item.quantity, item.unit)}
                            </p>
                            <p className="text-xs text-gray-400">remaining</p>
                            <button
                              onClick={() => {
                                const si = items.find(i => i.id === item.id);
                                if (si) { openModal("stockIn", si); setTab("items"); }
                              }}
                              className="mt-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              + Restock →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          POP MODAL — Stock IN
      ══════════════════════════════════════════════════════════════════ */}
      <PopModal
        open={modal === "stockIn"} onClose={() => setModal(null)} accent="emerald"
        title={`Add Stock — ${activeItem?.name}`}
        subtitle={`Current: ${activeItem ? fmtQ(activeItem.quantity, activeItem.unit) : "—"}`}
      >
        {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-2 mb-3">{err}</p>}
        <div className="space-y-3 mt-3">
          <div>
            <label className={lbl}>Quantity ({activeItem?.unit}) <span className="text-red-400">*</span></label>
            <input type="number" min="0.01" step="0.01" value={inForm.qty}
              onChange={e => setInForm(f => ({ ...f, qty: e.target.value }))}
              className={inp} placeholder="0" autoFocus
            />
          </div>
          <div>
            <label className={lbl}>Unit Cost — UGX <span className="text-gray-400 font-normal normal-case text-[10px]">(optional)</span></label>
            <input type="number" min="0" value={inForm.cost}
              onChange={e => setInForm(f => ({ ...f, cost: e.target.value }))}
              className={inp} placeholder="e.g. 4500"
            />
            {inForm.qty && inForm.cost && (
              <p className="text-xs text-gray-400 mt-1 font-semibold">
                Total: {fmtUGX(Number(inForm.qty) * Number(inForm.cost))}
              </p>
            )}
          </div>
          <div>
            <label className={lbl}>Notes</label>
            <input type="text" value={inForm.notes}
              onChange={e => setInForm(f => ({ ...f, notes: e.target.value }))}
              className={inp} placeholder="Supplier, delivery note…"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => act(() => recordStockIn({
              stockItemId: activeItem!.id,
              quantity:    Number(inForm.qty),
              unitCost:    inForm.cost ? Number(inForm.cost) : undefined,
              notes:       inForm.notes || undefined,
            }))}
            disabled={!inForm.qty || Number(inForm.qty) <= 0 || busy}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50 transition-colors"
          >
            {busy ? "Adding…" : "Add to Stock"}
          </button>
        </div>
      </PopModal>

      {/* ══════════════════════════════════════════════════════════════════
          POP MODAL — Stock OUT
      ══════════════════════════════════════════════════════════════════ */}
      <PopModal
        open={modal === "stockOut"} onClose={() => setModal(null)} accent="red"
        title={`Record Usage — ${activeItem?.name}`}
        subtitle={`Available: ${activeItem ? fmtQ(activeItem.quantity, activeItem.unit) : "—"}`}
      >
        {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-2 mb-3">{err}</p>}
        <div className="space-y-3 mt-3">
          <div>
            <label className={lbl}>Quantity ({activeItem?.unit}) <span className="text-red-400">*</span></label>
            <input type="number" min="0.01" step="0.01" value={outForm.qty}
              onChange={e => setOutForm(f => ({ ...f, qty: e.target.value }))}
              className={inp} placeholder="0" autoFocus
            />
          </div>
          <div>
            <label className={lbl}>Reason <span className="text-red-400">*</span></label>
            <select value={outForm.reason} onChange={e => setOutForm(f => ({ ...f, reason: e.target.value }))} className={inp}>
              {OUT_REASONS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Notes</label>
            <input type="text" value={outForm.notes}
              onChange={e => setOutForm(f => ({ ...f, notes: e.target.value }))}
              className={inp} placeholder="Issued to, purpose…"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => act(() => recordStockOut({
              stockItemId: activeItem!.id,
              quantity:    Number(outForm.qty),
              reason:      outForm.reason,
              notes:       outForm.notes || undefined,
            }))}
            disabled={!outForm.qty || Number(outForm.qty) <= 0 || busy}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50 transition-colors"
          >
            {busy ? "Recording…" : "Record Usage"}
          </button>
        </div>
      </PopModal>

      {/* ══════════════════════════════════════════════════════════════════
          POP MODAL — Adjust
      ══════════════════════════════════════════════════════════════════ */}
      <PopModal
        open={modal === "adjust"} onClose={() => setModal(null)} accent="amber"
        title={`Adjust Stock — ${activeItem?.name}`}
        subtitle={`Current: ${activeItem ? fmtQ(activeItem.quantity, activeItem.unit) : "—"}`}
      >
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mt-2 mb-3 text-xs text-amber-800 font-medium">
          Use <strong>+5</strong> to add found units · Use <strong>-3</strong> to write off damaged stock
        </div>
        {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{err}</p>}
        <div className="space-y-3">
          <div>
            <label className={lbl}>Adjustment Qty <span className="text-red-400">*</span></label>
            <input type="number" step="0.01" value={adjForm.qty}
              onChange={e => setAdjForm(f => ({ ...f, qty: e.target.value }))}
              className={`${inp} font-mono tracking-widest`} placeholder="+5 or -3" autoFocus
            />
            {adjForm.qty && activeItem && (
              <p className="text-xs text-gray-400 mt-1">
                New total: <strong className="text-gray-800">{Math.max(0, activeItem.quantity + Number(adjForm.qty)).toFixed(2)} {activeItem.unit}</strong>
              </p>
            )}
          </div>
          <div>
            <label className={lbl}>Reason <span className="text-red-400">*</span></label>
            <select value={adjForm.reason} onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))} className={inp}>
              {ADJ_REASONS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Explanation <span className="text-red-400">*</span></label>
            <input type="text" value={adjForm.notes}
              onChange={e => setAdjForm(f => ({ ...f, notes: e.target.value }))}
              className={inp} placeholder="Why are you adjusting this?"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => act(() => recordAdjustment({
              stockItemId: activeItem!.id,
              quantity:    Number(adjForm.qty),
              reason:      adjForm.reason,
              notes:       adjForm.notes || "Manual adjustment",
            }))}
            disabled={!adjForm.qty || isNaN(Number(adjForm.qty)) || !adjForm.notes.trim() || busy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
          >
            {busy ? "Applying…" : "Apply Adjustment"}
          </button>
        </div>
      </PopModal>

      {/* ══════════════════════════════════════════════════════════════════
          SLIDE DRAWER — New Item
      ══════════════════════════════════════════════════════════════════ */}
      <SlideDrawer
        open={modal === "newItem"} onClose={() => setModal(null)}
        title={`Add Item — ${selectedStore?.name}`}
        subtitle="Configure the item and set opening stock"
      >
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}

          <div>
            <label className={lbl}>Item Name <span className="text-red-400">*</span></label>
            <input type="text" value={newItemForm.name}
              onChange={e => setNewItemForm(f => ({ ...f, name: e.target.value }))}
              className={inp} placeholder="e.g. Rice, A4 Paper, Detergent" autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Code</label>
              <input type="text" value={newItemForm.code}
                onChange={e => setNewItemForm(f => ({ ...f, code: e.target.value }))}
                className={`${inp} font-mono`} placeholder="RICE-01"
              />
            </div>
            <div>
              <label className={lbl}>Unit <span className="text-red-400">*</span></label>
              <select value={newItemForm.unit} onChange={e => setNewItemForm(f => ({ ...f, unit: e.target.value }))} className={inp}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Category</label>
            <select value={newItemForm.category} onChange={e => setNewItemForm(f => ({ ...f, category: e.target.value }))} className={inp}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
          </div>

          <div className="border-t border-blue-100 pt-4">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
              Opening Stock &amp; Alert Threshold
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Min Qty</label>
                <input type="number" min="0" value={newItemForm.minQty}
                  onChange={e => setNewItemForm(f => ({ ...f, minQty: e.target.value }))}
                  className={inp} placeholder="0"
                />
              </div>
              <div>
                <label className={lbl}>Opening Qty</label>
                <input type="number" min="0" value={newItemForm.openQty}
                  onChange={e => setNewItemForm(f => ({ ...f, openQty: e.target.value }))}
                  className={inp} placeholder="0"
                />
              </div>
              <div>
                <label className={lbl}>Unit Cost</label>
                <input type="number" min="0" value={newItemForm.openCost}
                  onChange={e => setNewItemForm(f => ({ ...f, openCost: e.target.value }))}
                  className={inp} placeholder="UGX"
                />
              </div>
            </div>
            {newItemForm.openQty && newItemForm.openCost && (
              <p className="text-xs text-gray-400 mt-2 font-semibold">
                Opening value: {fmtUGX(Number(newItemForm.openQty) * Number(newItemForm.openCost))}
              </p>
            )}
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => act(() => createStockItem({
              storeId:        selectedStore!.id,
              name:           newItemForm.name.trim(),
              code:           newItemForm.code     || undefined,
              unit:           newItemForm.unit,
              category:       newItemForm.category || undefined,
              minQuantity:    newItemForm.minQty   ? Number(newItemForm.minQty)   : undefined,
              openingBalance: newItemForm.openQty  ? Number(newItemForm.openQty)  : undefined,
              openingCost:    newItemForm.openCost ? Number(newItemForm.openCost) : undefined,
            }))}
            disabled={!newItemForm.name.trim() || busy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
          >
            {busy ? "Adding…" : "Add Item"}
          </button>
        </div>
      </SlideDrawer>

      {/* ══════════════════════════════════════════════════════════════════
          SLIDE DRAWER — Edit Item
      ══════════════════════════════════════════════════════════════════ */}
      <SlideDrawer
        open={modal === "editItem"} onClose={() => setModal(null)}
        title={`Edit Item — ${activeItem?.name}`}
        subtitle="Update name, unit, category or minimum threshold"
      >
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}

          <div>
            <label className={lbl}>Item Name <span className="text-red-400">*</span></label>
            <input type="text" value={editItemForm.name}
              onChange={e => setEditItemForm(f => ({ ...f, name: e.target.value }))}
              className={inp} autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Code</label>
              <input type="text" value={editItemForm.code}
                onChange={e => setEditItemForm(f => ({ ...f, code: e.target.value }))}
                className={`${inp} font-mono`} placeholder="RICE-01"
              />
            </div>
            <div>
              <label className={lbl}>Unit <span className="text-red-400">*</span></label>
              <select value={editItemForm.unit} onChange={e => setEditItemForm(f => ({ ...f, unit: e.target.value }))} className={inp}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Category</label>
            <select value={editItemForm.category} onChange={e => setEditItemForm(f => ({ ...f, category: e.target.value }))} className={inp}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Minimum Quantity (Alert Threshold)</label>
            <input type="number" min="0" value={editItemForm.minQty}
              onChange={e => setEditItemForm(f => ({ ...f, minQty: e.target.value }))}
              className={inp} placeholder="0 = no alert"
            />
            <p className="text-[10px] text-gray-400 mt-1">System will alert when stock drops to or below this level</p>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-xs font-bold text-red-600 mb-1">Deactivate Item</p>
            <p className="text-xs text-gray-500 mb-2">Removes the item from active inventory. Movements history is preserved.</p>
            <button
              onClick={() => act(() => updateStockItem(activeItem!.id, { isActive: false }))}
              disabled={busy}
              className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              Deactivate
            </button>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => act(() => updateStockItem(activeItem!.id, {
              name:        editItemForm.name.trim(),
              code:        editItemForm.code     || undefined,
              unit:        editItemForm.unit,
              category:    editItemForm.category || undefined,
              minQuantity: editItemForm.minQty ? Number(editItemForm.minQty) : undefined,
            }))}
            disabled={!editItemForm.name.trim() || busy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
          >
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </SlideDrawer>

      {/* ══════════════════════════════════════════════════════════════════
          SLIDE DRAWER — New Store
      ══════════════════════════════════════════════════════════════════ */}
      <SlideDrawer
        open={modal === "newStore"} onClose={() => setModal(null)}
        title="Create Store"
        subtitle="A physical storage location in your school"
      >
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
          <div>
            <label className={lbl}>Store Name <span className="text-red-400">*</span></label>
            <input type="text" value={storeForm.name}
              onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))}
              className={inp} placeholder="e.g. Kitchen Store, Lab Store" autoFocus
            />
          </div>
          <div>
            <label className={lbl}>Description</label>
            <input type="text" value={storeForm.description}
              onChange={e => setStoreForm(f => ({ ...f, description: e.target.value }))}
              className={inp} placeholder="What is stored here?"
            />
          </div>
          <div>
            <label className={lbl}>Location in School</label>
            <input type="text" value={storeForm.location}
              onChange={e => setStoreForm(f => ({ ...f, location: e.target.value }))}
              className={inp} placeholder="e.g. Kitchen Block, Admin Block"
            />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => act(async () => {
              const res = await createStore({
                schoolId,
                name:        storeForm.name,
                description: storeForm.description || undefined,
                location:    storeForm.location    || undefined,
              }) as any;
              loadStores();
              setSelectedStore(res.store);
            })}
            disabled={!storeForm.name.trim() || busy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
          >
            {busy ? "Creating…" : "Create Store"}
          </button>
        </div>
      </SlideDrawer>

      {/* ══════════════════════════════════════════════════════════════════
          SLIDE DRAWER — Edit Store
      ══════════════════════════════════════════════════════════════════ */}
      <SlideDrawer
        open={modal === "editStore"} onClose={() => setModal(null)}
        title={`Edit Store — ${selectedStore?.name}`}
        subtitle="Update store details"
      >
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
          <div>
            <label className={lbl}>Store Name <span className="text-red-400">*</span></label>
            <input type="text" value={storeForm.name}
              onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))}
              className={inp} autoFocus
            />
          </div>
          <div>
            <label className={lbl}>Description</label>
            <input type="text" value={storeForm.description}
              onChange={e => setStoreForm(f => ({ ...f, description: e.target.value }))}
              className={inp} placeholder="What is stored here?"
            />
          </div>
          <div>
            <label className={lbl}>Location in School</label>
            <input type="text" value={storeForm.location}
              onChange={e => setStoreForm(f => ({ ...f, location: e.target.value }))}
              className={inp} placeholder="e.g. Kitchen Block"
            />
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-xs font-bold text-red-600 mb-1">Deactivate Store</p>
            <p className="text-xs text-gray-500 mb-2">Hides this store from the sidebar. All item data is preserved.</p>
            <button
              onClick={() => act(async () => {
                await updateStore(selectedStore!.id, { isActive: false });
                setSelectedStore(null);
                loadStores();
              })}
              disabled={busy}
              className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              Deactivate Store
            </button>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => act(async () => {
              await updateStore(selectedStore!.id, {
                name:        storeForm.name,
                description: storeForm.description || undefined,
                location:    storeForm.location    || undefined,
              });
              setSelectedStore(s => s ? { ...s, name: storeForm.name, description: storeForm.description, location: storeForm.location } : s);
              loadStores();
            })}
            disabled={!storeForm.name.trim() || busy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-black disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
          >
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </SlideDrawer>
    </div>
  );
}
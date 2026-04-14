// app/school/[slug]/finance/fees/structures/components/FeeStructuresClient.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Badge }    from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  CheckCircle2, Eye, ListChecks, Loader2, Plus, Trash2, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  createFeeStructure, publishFeeStructure, unpublishFeeStructure,
} from "@/actions/fees-stracture";

// ── Types ─────────────────────────────────────────────────────────────────────
type FeeCategory   = { id: string; name: string; code: string };
type StructureItem = { id: string; amount: number; feeCategory: FeeCategory };
type StructureForUI = {
  id: string; name: string | null; isPublished: boolean; totalAmount: number;
  schoolId: string; academicYearId: string; termId: string; classYearId: string;
  items: StructureItem[];
  term:     { id: string; name: string; termNumber: number };
  classYear: { id: string; classTemplate: { id: string; name: string; code: string | null } };
  _count: { invoices: number };
};
type ClassYearOption = { id: string; name: string; academicYearId: string };
type TermOption      = { id: string; name: string; termNumber: number; isActive: boolean; academicYearId: string };
type YearOption      = { id: string; year: string; isActive: boolean; terms: TermOption[] };

type Props = {
  initialStructures:  StructureForUI[];
  feeCategories:      FeeCategory[];
  classYears:         ClassYearOption[];
  allYears:           YearOption[];
  selectedYearId:     string;
  selectedTermId:     string;
  schoolId:           string;
  slug:               string;
  basePath?:          string;
};

// ── Create Dialog ─────────────────────────────────────────────────────────────
function CreateStructureDialog({
  feeCategories, classYears, selectedTermId, selectedYearId, schoolId, onDone,
}: {
  feeCategories: FeeCategory[]; classYears: ClassYearOption[];
  selectedTermId: string; selectedYearId: string;
  schoolId: string; onDone: (s: StructureForUI) => void;
}) {
  const [open, setOpen]              = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm]              = useState({ classYearId: "", name: "" });
  const [items, setItems]            = useState([{ feeCategoryId: "", amount: "" }]);

  const total    = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const isValid  = form.classYearId && items.length > 0 && items.every(i => i.feeCategoryId && Number(i.amount) > 0);
  const usedCats = items.map(i => i.feeCategoryId).filter(Boolean);

  function reset() { setOpen(false); setForm({ classYearId: "", name: "" }); setItems([{ feeCategoryId: "", amount: "" }]); }
  function addItem()             { setItems([...items, { feeCategoryId: "", amount: "" }]); }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, f: string, v: string) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [f]: v } : item));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await createFeeStructure({
        schoolId,
        academicYearId: selectedYearId,
        termId:         selectedTermId,
        classYearId:    form.classYearId,
        name:           form.name.trim() || undefined,
        items: items.map(i => ({ feeCategoryId: i.feeCategoryId, amount: Number(i.amount) })),
      });
      if (result.ok) { toast.success("Fee structure created"); onDone(result.data as StructureForUI); reset(); }
      else toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> New Structure
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fee Structure</DialogTitle>
          <DialogDescription>Define fee line items for a class for this term. Publish to enable auto-invoicing.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select value={form.classYearId} onValueChange={v => setForm({ ...form, classYearId: v })} disabled={isPending}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classYears.map(cy => <SelectItem key={cy.id} value={cy.id}>{cy.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
              <Input placeholder="Auto-generated if blank" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} disabled={isPending} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Fee Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}
                disabled={isPending || items.length >= feeCategories.length} className="h-7 px-2.5 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <Select value={item.feeCategoryId} onValueChange={v => updateItem(i, "feeCategoryId", v)} disabled={isPending}>
                    <SelectTrigger className="col-span-3 text-sm"><SelectValue placeholder="Select category…" /></SelectTrigger>
                    <SelectContent>
                      {feeCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}
                          disabled={usedCats.includes(cat.id) && cat.id !== item.feeCategoryId}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Amount" value={item.amount}
                    onChange={e => updateItem(i, "amount", e.target.value)}
                    className="col-span-1 font-mono text-sm" min={1} disabled={isPending} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" disabled={items.length === 1 || isPending}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              <span className="text-sm text-slate-600">Total Amount</span>
              <span className="text-base font-bold text-slate-900">UGX {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={reset} disabled={isPending}>Cancel</Button>
          <Button disabled={!isValid || isPending} onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Create Structure
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Detail Sheet ──────────────────────────────────────────────────────────────
function StructureDetailSheet({ s }: { s: StructureForUI }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100">
          <Eye className="w-3.5 h-3.5 text-slate-500" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px]">
        <SheetHeader className="pb-4 border-b border-slate-200">
          <SheetTitle>{s.name ?? `${s.classYear.classTemplate.name} — ${s.term.name}`}</SheetTitle>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{s.classYear.classTemplate.name}</Badge>
            <Badge variant="outline" className="text-[10px]">{s.term.name}</Badge>
            <Badge variant="outline" className={`text-[10px] ${s.isPublished ? "border-blue-200 text-blue-700 bg-blue-50" : "border-amber-200 text-amber-700 bg-amber-50"}`}>
              {s.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </SheetHeader>
        <div className="py-4 space-y-1.5">
          {s.items.map(item => (
            <div key={item.id} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm text-slate-700">{item.feeCategory.name}</p>
                <code className="text-[10px] text-slate-400">{item.feeCategory.code}</code>
              </div>
              <span className="text-sm font-semibold text-slate-800">UGX {item.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3">
            <span className="text-sm font-semibold text-slate-800">Total</span>
            <span className="text-base font-bold text-slate-900">UGX {s.totalAmount.toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-400 pt-1">{s._count.invoices} invoice{s._count.invoices !== 1 ? "s" : ""} generated</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FeeStructuresClient({
  initialStructures, feeCategories, classYears, allYears,
  selectedYearId: initialYearId, selectedTermId: initialTermId, schoolId, slug, basePath = "finance",
}: Props) {
  const router = useRouter();
  const [structures,    setStructures]    = useState<StructureForUI[]>(initialStructures);
  const [togglingId,    setTogglingId]    = useState<string | null>(null);
  const [activeYearId,  setActiveYearId]  = useState(initialYearId);
  const [activeTermId,  setActiveTermId]  = useState(initialTermId);
  const [loadingYear,   setLoadingYear]   = useState(false);

  const selectedYear = allYears.find(y => y.id === activeYearId) ?? allYears[0];
  const selectedTerm = selectedYear?.terms.find(t => t.id === activeTermId) ?? selectedYear?.terms[0];

  // Filter structures for the selected term — purely client-side, no reload
  const termStructures = useMemo(
    () => structures.filter(s => s.termId === selectedTerm?.id),
    [structures, selectedTerm?.id]
  );

  const published = termStructures.filter(s => s.isPublished).length;
  const drafts    = termStructures.filter(s => !s.isPublished).length;

  // Switching term within same year — just update state, no fetch needed
  function selectTerm(tId: string) {
    setActiveTermId(tId);
  }

  // Switching year — need to fetch structures for the new year
  async function selectYear(yId: string) {
    const year      = allYears.find(y => y.id === yId);
    const firstTerm = year?.terms.find(t => t.isActive) ?? year?.terms[0];
    setActiveYearId(yId);
    setActiveTermId(firstTerm?.id ?? "");
    setLoadingYear(true);
    try {
      const res = await fetch(
        `/api/fee-structures?schoolId=${schoolId}&yearId=${yId}`
      );
      if (res.ok) {
        const data = await res.json();
        setStructures(data);
      }
    } catch {
      // keep existing structures
    } finally {
      setLoadingYear(false);
    }
  }

  function handleCreated(created: StructureForUI) {
    setStructures(prev => [created, ...prev]);
  }

  async function handleTogglePublish(s: StructureForUI) {
    setTogglingId(s.id);
    const result = s.isPublished ? await unpublishFeeStructure(s.id) : await publishFeeStructure(s.id);
    setTogglingId(null);
    if (result.ok) {
      toast.success(s.isPublished ? "Structure unpublished" : "Structure published — auto-invoice active");
      setStructures(prev => prev.map(st => st.id === s.id ? { ...st, isPublished: !s.isPublished } : st));
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Fee Structures</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {selectedYear?.year} · {selectedTerm?.name} — {published} published · {drafts} draft{drafts !== 1 ? "s" : ""}
          </p>
        </div>
        {selectedTerm && (
          <CreateStructureDialog
            feeCategories={feeCategories}
            classYears={classYears.filter(cy => cy.academicYearId === activeYearId)}
            selectedTermId={selectedTerm.id}
            selectedYearId={activeYearId}
            schoolId={schoolId}
            onDone={handleCreated}
          />
        )}
      </div>

      {/* Year + Term selectors */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">Year</span>
        <div className="flex flex-wrap gap-2">
          {allYears.map(y => (
            <button key={y.id}
              onClick={() => selectYear(y.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                activeYearId === y.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300"
              }`}>
              {y.year}{y.isActive && <span className="ml-1 text-[10px] opacity-80">●</span>}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">Term</span>
        <div className="flex flex-wrap gap-2">
          {(selectedYear?.terms ?? []).map(t => (
            <button key={t.id}
              onClick={() => selectTerm(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                activeTermId === t.id
                  ? "bg-primary text-white border-primary"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50"
              }`}>
              {t.name}{t.isActive && <span className="ml-1 text-[10px] opacity-80">●</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!loadingYear && termStructures.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mx-auto mb-3">
            <ListChecks className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No fee structures for {selectedTerm?.name}</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Create a structure for each class in this term, then publish it to enable auto-invoicing.
          </p>
        </div>
      )}

      {/* Loading state for year switch */}
      {loadingYear && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading structures…
        </div>
      )}

      {/* Table */}
      {!loadingYear && termStructures.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                {["Structure", "Class", "Total Amount", "Invoices", "Status", ""].map(h => (
                  <TableHead key={h} className="text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {termStructures.map(s => {
                const className = s.classYear.classTemplate.name;
                const label     = s.name ?? `${className} — ${s.term.name}`;
                return (
                  <TableRow key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center">
                          <ListChecks className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">{className}</TableCell>
                    <TableCell className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      UGX {s.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {s._count.invoices} invoice{s._count.invoices !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${
                        s.isPublished
                          ? "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                          : "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
                      }`}>
                        {s.isPublished && <CheckCircle2 className="w-3 h-3" />}
                        {s.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center gap-1">
                        <StructureDetailSheet s={s} />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                          onClick={() => handleTogglePublish(s)} disabled={togglingId === s.id}
                          title={s.isPublished ? "Unpublish" : "Publish"}>
                          {togglingId === s.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                            : s.isPublished
                              ? <span className="text-[11px] font-semibold text-slate-500">Unpublish</span>
                              : <span className="text-[11px] font-semibold text-blue-600">Publish</span>
                          }
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

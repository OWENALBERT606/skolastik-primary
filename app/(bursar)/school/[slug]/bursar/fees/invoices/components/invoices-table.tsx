"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────
export type InvoiceRow = {
  id:            string;
  invoiceNumber: string;
  status:        "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" | "VOID";
  totalAmount:   number;
  paidAmount:    number;
  balance:       number;
  issueDate:     string;
  dueDate:       string | null;
  studentName:   string;
  admNo:         string;
  className:     string;
};

type Tab = "ALL" | "ISSUED" | "PARTIAL" | "PAID" | "OVERDUE" | "VOID";

const STATUS_TABS: { key: Tab; label: string }[] = [
  { key: "ALL",     label: "All"     },
  { key: "ISSUED",  label: "Issued"  },
  { key: "PARTIAL", label: "Partial" },
  { key: "PAID",    label: "Paid"    },
  { key: "OVERDUE", label: "Overdue" },
  { key: "VOID",    label: "Void"    },
];

function currency(n: number): string {
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `UGX ${(n / 1_000).toFixed(0)}K`;
  return `UGX ${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: InvoiceRow["status"] }) {
  const map: Record<InvoiceRow["status"], string> = {
    DRAFT:     "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    ISSUED:    "bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300",
    PARTIAL:   "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    PAID:      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    OVERDUE:   "bg-red-100   text-red-800   dark:bg-red-900/30   dark:text-red-300",
    CANCELLED: "bg-gray-100  text-gray-600  dark:bg-gray-800     dark:text-gray-400",
    VOID:      "bg-gray-100  text-gray-500  dark:bg-gray-800     dark:text-gray-500",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

export default function InvoicesTable({ invoices }: { invoices: InvoiceRow[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [search, setSearch]       = useState("");

  const filtered = useMemo(() => {
    let rows = invoices;
    if (activeTab !== "ALL") {
      rows = rows.filter((r) => r.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.admNo.toLowerCase().includes(q) ||
          r.invoiceNumber.toLowerCase().includes(q) ||
          r.className.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [invoices, activeTab, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: invoices.length };
    for (const inv of invoices) {
      c[inv.status] = (c[inv.status] ?? 0) + 1;
    }
    return c;
  }, [invoices]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student, admission no, invoice..."
          className="pl-9 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] opacity-70">{counts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Invoice #</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Student</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Class</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Amount</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Paid</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Balance</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-10">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{inv.studentName}</p>
                      <p className="text-slate-400">{inv.admNo}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{inv.className || "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{currency(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{currency(inv.paidAmount)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${inv.balance > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
                      {currency(inv.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {format(new Date(inv.issueDate), "dd MMM yy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Showing {filtered.length} of {invoices.length} invoices
          </div>
        )}
      </Card>
    </div>
  );
}

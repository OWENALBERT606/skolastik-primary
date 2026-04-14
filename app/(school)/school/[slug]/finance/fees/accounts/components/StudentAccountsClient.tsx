// app/school/[slug]/finance/fees/accounts/StudentAccountsClient.tsx
"use client";

import { useState, useTransition } from "react";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Badge }     from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetDescription,
  SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle, CheckCircle2, ChevronRight,
  CreditCard, Loader2, Receipt, Search, Wallet,
} from "lucide-react";
import Link from "next/link";
import { getInvoicesByAccount, getLedgerByAccount } from "@/actions/fee-account-invoice";


// ─── Types ─────────────────────────────────────────────────────────────────────

type AccountStatus = "ACTIVE" | "CLEARED" | "OVERPAID" | "SUSPENDED";

export type AccountForUI = {
  id:                   string;
  studentId:            string;
  studentName:          string;
  admissionNo:          string;
  class:                string;
  termName:             string;
  totalInvoiced:        number;
  totalPaid:            number;
  totalDiscount:        number;
  totalPenalty:         number;
  totalWaived:          number;
  totalRefunded:        number;
  carryForward:         number;
  balance:              number;
  status:               AccountStatus;
  autoInvoiceGenerated: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `UGX ${Math.abs(n).toLocaleString()}`;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE:    { label: "Arrears",   color: "bg-amber-50 text-amber-700 border-amber-200",       icon: AlertCircle  },
  CLEARED:   { label: "Cleared",   color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  OVERPAID:  { label: "Overpaid",  color: "bg-violet-50 text-violet-700 border-violet-200",    icon: CreditCard   },
  SUSPENDED: { label: "Suspended", color: "bg-slate-100 text-slate-500 border-slate-200",      icon: AlertCircle  },
};

const txTypeColor: Record<string, string> = {
  PAYMENT:       "text-blue-600 bg-blue-50",
  INVOICE:       "text-blue-600 bg-blue-50",
  DISCOUNT:      "text-violet-600 bg-violet-50",
  WAIVER:        "text-teal-600 bg-teal-50",
  PENALTY:       "text-red-600 bg-red-50",
  REFUND:        "text-amber-600 bg-amber-50",
  ADJUSTMENT:    "text-slate-600 bg-slate-100",
  CARRY_FORWARD: "text-orange-600 bg-orange-50",
};

// ─── Account Detail Sheet ──────────────────────────────────────────────────────

function AccountDetailSheet({
  account,
  slug,
  basePath = "finance",
}: {
  account:   AccountForUI;
  slug:      string;
  basePath?: string;
}) {
  const [open, setOpen]         = useState(false);
  const [tab,  setTab]          = useState("invoices");
  const [loading, startLoading] = useTransition();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [ledger,   setLedger]   = useState<any[]>([]);
  const [fetched,  setFetched]  = useState(false);

  function handleOpen(o: boolean) {
    setOpen(o);
    if (!o || fetched) return;
    startLoading(async () => {
      const [invRes, ledRes] = await Promise.all([
        getInvoicesByAccount(account.id),
        getLedgerByAccount(account.id),
      ]);
      if (invRes.ok)  setInvoices(invRes.data);
      if (ledRes.ok)  setLedger(ledRes.data);
      setFetched(true);
    });
  }

  const cfg = statusConfig[account.status] ?? statusConfig.ACTIVE;

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50"
        >
          View <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[520px] sm:max-w-[520px] p-0 overflow-y-auto"
      >
        {/* ── Header ── */}
        <SheetHeader className="p-5 pb-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {initials(account.studentName)}
            </div>
            <div>
              <SheetTitle className="text-slate-900 leading-tight">
                {account.studentName}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {account.admissionNo}
                {account.class   ? ` · ${account.class}`   : ""}
                {account.termName ? ` · ${account.termName}` : ""}
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className={`ml-auto text-[10px] border gap-1 ${cfg.color}`}
            >
              <cfg.icon className="w-3 h-3" />
              {cfg.label}
            </Badge>
          </div>

          {/* Balance summary */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              {
                label: "Invoiced",
                value: `UGX ${(account.totalInvoiced / 1_000_000).toFixed(2)}M`,
                color: "text-slate-700",
              },
              {
                label: "Paid",
                value: `UGX ${(account.totalPaid / 1_000_000).toFixed(2)}M`,
                color: "text-blue-600",
              },
              {
                label: "Balance",
                value: fmt(account.balance),
                color:
                  account.balance > 0
                    ? "text-amber-600"
                    : account.balance < 0
                    ? "text-violet-600"
                    : "text-slate-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-slate-200 rounded-lg p-2.5 text-center"
              >
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
                  {s.label}
                </p>
                <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Extra stats */}
          {(account.totalDiscount > 0 ||
            account.carryForward  !== 0 ||
            account.totalPenalty  > 0) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {account.totalDiscount > 0 && (
                <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 rounded px-2 py-0.5">
                  Discount: {fmt(account.totalDiscount)}
                </span>
              )}
              {account.carryForward !== 0 && (
                <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-0.5">
                  Carry-fwd:{" "}
                  {account.carryForward > 0 ? "+" : ""}
                  {fmt(account.carryForward)}
                </span>
              )}
              {account.totalPenalty > 0 && (
                <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 rounded px-2 py-0.5">
                  Penalties: {fmt(account.totalPenalty)}
                </span>
              )}
            </div>
          )}

          {/* Record payment shortcut */}
          <Link
            href={`/school/${slug}/${basePath}/fees/payments?accountId=${account.id}`}
            className="mt-2 block"
          >
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs"
            >
              <Receipt className="w-3.5 h-3.5" /> Record Payment
            </Button>
          </Link>
        </SheetHeader>

        {/* ── Body ── */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-2 bg-slate-100 mb-4">
                <TabsTrigger value="invoices" className="text-xs">
                  Invoices{invoices.length > 0 ? ` (${invoices.length})` : ""}
                </TabsTrigger>
                <TabsTrigger value="ledger" className="text-xs">
                  Ledger{ledger.length > 0 ? ` (${ledger.length})` : ""}
                </TabsTrigger>
              </TabsList>

              {/* Invoices */}
              <TabsContent value="invoices" className="space-y-2 mt-0">
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No invoices found for this account.
                  </div>
                ) : (
                  invoices.map((inv: any) => {
                    const paidPct =
                      inv.totalAmount > 0
                        ? Math.min((inv.paidAmount / inv.totalAmount) * 100, 100)
                        : 0;
                    const invColor =
                      inv.status === "PAID"
                        ? "border-blue-200 text-blue-700 bg-blue-50"
                        : inv.status === "PARTIAL"
                        ? "border-amber-200 text-amber-700 bg-amber-50"
                        : inv.status === "VOID"
                        ? "border-slate-200 text-slate-400 bg-slate-50"
                        : inv.status === "OVERDUE"
                        ? "border-red-200 text-red-700 bg-red-50"
                        : "border-blue-200 text-blue-700 bg-blue-50";

                    return (
                      <div
                        key={inv.id}
                        className="border border-slate-200 rounded-lg p-3.5 bg-white hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-mono font-semibold text-slate-700">
                              {inv.invoiceNumber}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {inv.dueDate
                                ? `Due: ${new Date(inv.dueDate).toLocaleDateString("en-UG")}`
                                : "No due date"}
                              {" · "}Issued:{" "}
                              {new Date(inv.issueDate).toLocaleDateString("en-UG")}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 ${invColor}`}
                          >
                            {inv.status}
                          </Badge>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-slate-600">
                          <span>
                            Total:{" "}
                            <b>UGX {inv.totalAmount.toLocaleString()}</b>
                          </span>
                          <span>
                            Paid:{" "}
                            <b className="text-blue-600">
                              UGX {inv.paidAmount.toLocaleString()}
                            </b>
                          </span>
                          <span>
                            Bal:{" "}
                            <b
                              className={
                                inv.balance > 0 ? "text-amber-600" : "text-slate-400"
                              }
                            >
                              UGX {inv.balance.toLocaleString()}
                            </b>
                          </span>
                        </div>
                        {inv.discountAmount > 0 && (
                          <p className="text-[10px] text-violet-600 mt-1">
                            Discount: UGX {inv.discountAmount.toLocaleString()}
                          </p>
                        )}
                        <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
                            style={{ width: `${paidPct}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 text-right">
                          {paidPct.toFixed(0)}% paid
                        </p>
                      </div>
                    );
                  })
                )}
              </TabsContent>

              {/* Ledger */}
              <TabsContent value="ledger" className="space-y-1.5 mt-0">
                {ledger.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No transactions recorded yet.
                  </div>
                ) : (
                  ledger.map((tx: any) => {
                    const isCredit = [
                      "PAYMENT", "DISCOUNT", "WAIVER", "REFUND",
                    ].includes(tx.transactionType);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                              txTypeColor[tx.transactionType] ??
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {tx.transactionType.replace("_", " ")}
                          </span>
                          <div>
                            <p className="text-xs text-slate-700">
                              {tx.description ?? "—"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(tx.processedAt).toLocaleDateString("en-UG")}
                              {tx.referenceNumber ? ` · ${tx.referenceNumber}` : ""}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            isCredit ? "text-blue-600" : "text-slate-800"
                          }`}
                        >
                          {isCredit ? "−" : "+"}UGX {tx.amount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Props = {
  accounts: AccountForUI[];
  slug:     string;
  basePath?: string;
};

export default function StudentAccountsPage({ accounts, slug, basePath = "finance" }: Props) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = accounts.filter((a) => {
    const matchSearch =
      a.studentName.toLowerCase().includes(search.toLowerCase()) ||
      a.admissionNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE"   && a.balance > 0) ||
      (statusFilter === "CLEARED"  && a.balance === 0) ||
      (statusFilter === "OVERPAID" && a.balance < 0);
    return matchSearch && matchStatus;
  });

  const arrearsCount  = accounts.filter((a) => a.balance > 0).length;
  const clearedCount  = accounts.filter((a) => a.balance === 0).length;
  const overpaidCount = accounts.filter((a) => a.balance < 0).length;
  const totalArrears  = accounts.reduce((s, a) => s + Math.max(a.balance, 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Student Accounts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {accounts.length} accounts · {arrearsCount} with arrears
          </p>
        </div>
        <Link href={`/school/${slug}/${basePath}/fees/payments`}>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Receipt className="w-4 h-4" /> Record Payment
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total Accounts",
            value: accounts.length,
            sub:   "This term",
            icon:  Wallet,
            color: "text-blue-600",
            bg:    "bg-blue-50 border-blue-100",
          },
          {
            label: "In Arrears",
            value: arrearsCount,
            sub:   `UGX ${(totalArrears / 1_000_000).toFixed(1)}M outstanding`,
            icon:  AlertCircle,
            color: "text-amber-600",
            bg:    "bg-amber-50 border-amber-100",
          },
          {
            label: "Cleared",
            value: clearedCount,
            sub:   "Fully paid",
            icon:  CheckCircle2,
            color: "text-blue-600",
            bg:    "bg-blue-50 border-blue-100",
          },
          {
            label: "Overpaid",
            value: overpaidCount,
            sub:   "Refund due",
            icon:  CreditCard,
            color: "text-violet-600",
            bg:    "bg-violet-50 border-violet-100",
          },
        ].map((c) => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-xs font-medium text-slate-500">{c.label}</span>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search student or admission no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200 w-72"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-white border-slate-200 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">In Arrears</SelectItem>
            <SelectItem value="CLEARED">Cleared</SelectItem>
            <SelectItem value="OVERPAID">Overpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {accounts.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No fee accounts yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Accounts are created automatically when students enroll in a term.
          </p>
        </div>
      )}

      {/* Table */}
      {accounts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                {["Student", "Class", "Term", "Invoiced", "Paid", "Balance", "Status", ""].map(
                  (h) => (
                    <TableHead
                      key={h}
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5"
                    >
                      {h}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-xs text-slate-400"
                  >
                    No accounts match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((acc) => {
                  // If ACTIVE but zero balance, show as Cleared visually
                  const cfg =
                    acc.status === "ACTIVE" && acc.balance === 0
                      ? statusConfig.CLEARED
                      : (statusConfig[acc.status] ?? statusConfig.ACTIVE);

                  return (
                    <TableRow
                      key={acc.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Student */}
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-xs font-bold text-white">
                            {initials(acc.studentName)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {acc.studentName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {acc.admissionNo}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-600">
                        {acc.class || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {acc.termName}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-700">
                        UGX {acc.totalInvoiced.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-blue-600">
                        UGX {acc.totalPaid.toLocaleString()}
                      </TableCell>

                      {/* Balance */}
                      <TableCell>
                        <span
                          className={`text-xs font-bold ${
                            acc.balance > 0
                              ? "text-amber-600"
                              : acc.balance < 0
                              ? "text-violet-600"
                              : "text-slate-400"
                          }`}
                        >
                          {acc.balance < 0 ? "−" : ""}UGX{" "}
                          {Math.abs(acc.balance).toLocaleString()}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] border gap-1 ${cfg.color}`}
                        >
                          <cfg.icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-5">
                        <AccountDetailSheet account={acc} slug={slug} basePath={basePath} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
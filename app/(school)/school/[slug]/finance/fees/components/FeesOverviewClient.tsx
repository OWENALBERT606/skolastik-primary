// app/school/[slug]/finance/fees/FeesOverviewClient.tsx
"use client";

import { useState }    from "react";
import Link             from "next/link";
import { Badge }        from "@/components/ui/badge";
import { Button }       from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle, BadgeDollarSign, BarChart3,
  CheckCircle2, ChevronRight, FileText,
  Receipt, Wallet, ArrowUpRight, Clock,
  CreditCard, Smartphone, Banknote, Building2,
  TrendingUp, Users,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Stats = {
  totalInvoiced:   number;
  totalCollected:  number;
  outstanding:     number;
  totalBursaries:  number;
  collectionRate:  number;
  arrearsCount:    number;
  overdueCount:    number;
  paymentCount:    number;
  bursaryCount:    number;
};

type RecentPayment = {
  id:            string;
  studentName:   string;
  amount:        number;
  paymentMethod: string;
  network:       string | null;
  processedAt:   string;
  receiptNo:     string | null;
};

type OverdueInvoice = {
  id:            string;
  invoiceNumber: string;
  studentName:   string;
  balance:       number;
  dueDate:       string | null;
};

type MethodBreakdown = {
  method: string;
  amount: number;
  count:  number;
};

type Term = {
  id:    string;
  label: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtM   = (n: number) => n >= 1_000_000 ? `UGX ${(n / 1_000_000).toFixed(2)}M` : `UGX ${n.toLocaleString()}`;
const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`;
const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  CASH:          Banknote,
  BANK_TRANSFER: Building2,
  MOBILE_MONEY:  Smartphone,
  CHEQUE:        FileText,
  ONLINE:        CreditCard,
  POS:           CreditCard,
};

const METHOD_COLORS: Record<string, string> = {
  CASH:          "bg-emerald-100 text-emerald-700",
  BANK_TRANSFER: "bg-blue-100 text-blue-700",
  MOBILE_MONEY:  "bg-amber-100 text-amber-700",
  CHEQUE:        "bg-slate-100 text-slate-700",
  ONLINE:        "bg-blue-100 text-blue-700",
  POS:           "bg-violet-100 text-violet-700",
};

const fmtMethod = (m: string, network?: string | null) => {
  if (m === "MOBILE_MONEY" && network) return network;
  return m.replace("_", " ");
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, accent, href, slug,
}: {
  label:  string;
  value:  string;
  sub:    string;
  icon:   React.ElementType;
  accent: string;
  href?:  string;
  slug:   string;
}) {
  const inner = (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group ${accent.split(" ")[1] ?? "border-slate-200"}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
          <p className="text-xs text-slate-500 font-medium">{sub}</p>
        </div>
        <div className={`p-3 rounded-xl ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {href && (
        <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
          View details <ArrowUpRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={`/school/${slug}/finance/${href}`}>{inner}</Link> : inner;
}

// ─── Quick Action Tile ──────────────────────────────────────────────────────────

function QuickTile({
  title, desc, href, icon: Icon, bg, slug, basePath,
}: {
  title: string; desc: string; href: string;
  icon: React.ElementType; bg: string; slug: string; basePath: string;
}) {
  return (
    <Link href={`/school/${slug}/${basePath}/${href}`}>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group h-full">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 leading-snug">{title}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function FeesOverviewClient({
  slug,
  stats,
  recentPayments,
  overdueInvoices,
  methodBreakdown,
  terms,
  activeTermId,
  activeTermLabel,
  basePath = "finance",
}: {
  slug:              string;
  stats:             Stats;
  recentPayments:    RecentPayment[];
  overdueInvoices:   OverdueInvoice[];
  methodBreakdown:   MethodBreakdown[];
  terms:             Term[];
  activeTermId:      string | null;
  activeTermLabel:   string;
  basePath?:         string;
}) {
  const [selectedTerm, setSelectedTerm] = useState(activeTermId ?? "all");
  const totalMethodAmount = methodBreakdown.reduce((s, m) => s + m.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fees Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeTermLabel} · Financial health at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-48 bg-white border-slate-200 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={activeTermId ?? "all"}>Current Term</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href={`/school/${slug}/${basePath}/fees/reports`}>
            <Button variant="outline" className="gap-2 bg-white border-slate-200">
              <BarChart3 className="w-4 h-4" /> Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Invoiced"
          value={fmtM(stats.totalInvoiced)}
          sub={`${stats.paymentCount} payments received`}
          icon={FileText}
          accent="bg-blue-50 text-blue-600 border-blue-100"
          href="fees/invoices"
          slug={slug}
        />
        <StatCard
          label="Total Collected"
          value={fmtM(stats.totalCollected)}
          sub={`${stats.collectionRate.toFixed(1)}% collection rate`}
          icon={Receipt}
          accent="bg-blue-50 text-blue-600 border-blue-100"
          href="fees/payments"
          slug={slug}
        />
        <StatCard
          label="Outstanding"
          value={fmtM(stats.outstanding)}
          sub={`${stats.arrearsCount} students in arrears`}
          icon={AlertCircle}
          accent="bg-amber-50 text-amber-600 border-amber-100"
          href="fees/accounts"
          slug={slug}
        />
        <StatCard
          label="Bursaries"
          value={fmtM(stats.totalBursaries)}
          sub={`${stats.bursaryCount} allocations applied`}
          icon={BadgeDollarSign}
          accent="bg-emerald-50 text-emerald-600 border-emerald-100"
          href="fees/bursaries"
          slug={slug}
        />
      </div>

      {/* ── Collection progress bar ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-slate-800">Collection Progress</p>
            <p className="text-xs text-slate-400 mt-0.5">{activeTermLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            {stats.overdueCount > 0 && (
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-xs gap-1">
                <AlertCircle className="w-3 h-3" />
                {stats.overdueCount} overdue
              </Badge>
            )}
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs font-bold">
              {stats.collectionRate.toFixed(1)}% collected
            </Badge>
          </div>
        </div>

        {/* Segmented bar: collected / bursaries / outstanding */}
        {stats.totalInvoiced > 0 ? (
          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
              <div
                className="h-4 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                style={{ width: `${(stats.totalCollected / stats.totalInvoiced) * 100}%` }}
              />
              <div
                className="h-4 bg-gradient-to-r from-emerald-300 to-emerald-500 transition-all duration-1000"
                style={{ width: `${(stats.totalBursaries / stats.totalInvoiced) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span>Collected <strong className="text-slate-700">{fmtM(stats.totalCollected)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span>Bursaries <strong className="text-slate-700">{fmtM(stats.totalBursaries)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
                <span>Outstanding <strong className="text-amber-600">{fmtM(stats.outstanding)}</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-slate-400">
            No invoices issued this term yet.
          </div>
        )}
      </div>

      {/* ── Main 3-col grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Record Payment", desc: "Post a student payment",    href: "fees/payments",   icon: Receipt,        bg: "bg-blue-500" },
              { title: "Invoices",       desc: "View & manage invoices",    href: "fees/invoices",   icon: FileText,       bg: "bg-blue-500"   },
              { title: "Accounts",       desc: "View balances & history",   href: "fees/accounts",   icon: Wallet,         bg: "bg-violet-500" },
              { title: "Bursaries",      desc: "Manage scholarships",       href: "fees/bursaries",  icon: BadgeDollarSign, bg: "bg-amber-500" },
              { title: "Fee Structures", desc: "Configure fee schedules",   href: "fees/structures", icon: BarChart3,      bg: "bg-slate-600"  },
              { title: "Categories",     desc: "Manage fee categories",     href: "fees/categories", icon: TrendingUp,     bg: "bg-teal-500"   },
            ].map((q) => (
              <QuickTile key={q.title} {...q} slug={slug} basePath={basePath} />
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Recent Payments</h2>
            <Link
              href={`/school/${slug}/${basePath}/fees/payments`}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No payments yet this term.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentPayments.map((p) => {
                const Icon = METHOD_ICONS[p.paymentMethod] ?? CreditCard;
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${METHOD_COLORS[p.paymentMethod] ?? "bg-slate-100 text-slate-600"}`}>
                        {p.studentName.split(" ").map((n) => n[0]).join("").slice(0,2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{p.studentName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                          <p className="text-[10px] text-slate-400 truncate">
                            {fmtMethod(p.paymentMethod, p.network)} · {timeAgo(p.processedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-black text-slate-800">{fmtUGX(p.amount)}</p>
                      {p.receiptNo && (
                        <p className="text-[9px] font-mono text-slate-400">{p.receiptNo}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: overdue + method breakdown */}
        <div className="space-y-4">

          {/* Overdue invoices */}
          {overdueInvoices.length > 0 && (
            <div className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-red-50 bg-red-50/40">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <h2 className="text-sm font-bold text-red-700">Overdue Invoices</h2>
                </div>
                <Link
                  href={`/school/${slug}/${basePath}/fees/invoices`}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {overdueInvoices.map((inv) => {
                  const daysOverdue = inv.dueDate
                    ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000)
                    : null;
                  return (
                    <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{inv.studentName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-red-400" />
                          <p className="text-[10px] text-red-500 font-medium">
                            {daysOverdue !== null ? `${daysOverdue}d overdue` : "Overdue"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-red-600">{fmtUGX(inv.balance)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment method breakdown */}
          {methodBreakdown.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-800 mb-3">Payment Methods</h2>
              <div className="space-y-2.5">
                {methodBreakdown.map((m) => {
                  const Icon = METHOD_ICONS[m.method] ?? CreditCard;
                  const pct  = totalMethodAmount > 0 ? (m.amount / totalMethodAmount) * 100 : 0;
                  return (
                    <div key={m.method}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${METHOD_COLORS[m.method] ?? "bg-slate-100 text-slate-600"}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {m.method.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800">{fmtM(m.amount)}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({m.count})</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-700 ${
                            m.method === "MOBILE_MONEY" ? "bg-amber-400" :
                            m.method === "CASH"         ? "bg-emerald-400" :
                            m.method === "BANK_TRANSFER"? "bg-blue-400" : "bg-slate-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state if no overdue and no breakdown */}
          {overdueInvoices.length === 0 && methodBreakdown.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No overdue invoices this term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
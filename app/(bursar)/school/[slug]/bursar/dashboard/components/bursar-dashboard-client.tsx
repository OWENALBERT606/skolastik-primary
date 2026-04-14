"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Landmark, TrendingUp, DollarSign, CheckCircle, AlertCircle,
  Users, ArrowRight, BarChart2, Tag, Layers, FileText, Receipt,
  CreditCard, ShieldAlert, Settings, Wallet, Zap, Loader2, CheckCircle2, X,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bulkInvoiceAllStudents } from "@/actions/bulk-invoice-all";

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = {
  slug:            string;
  school:          { name: string };
  activeYear:      { id: string; year: string } | null;
  activeTerm:      { id: string; name: string; termNumber: number } | null;
  schoolId:        string;
  userId:          string;
  stats: {
    todayCollected:  number;
    totalBilled:     number;
    totalCollected:  number;
    outstanding:     number;
    collectionRate:  number;
    arrearsCount:    number;
    overdueCount:    number;
    paymentCount:    number;
  };
  dailyCollections: { date: string; amount: number }[];
  classBreakdown:   { className: string; billed: number; paid: number; outstanding: number }[];
  paymentMethods:   { method: string; amount: number; count: number }[];
  recentPayments:   { id: string; studentName: string; admNo: string; amount: number; method: string; processedAt: string; receiptNo: string | null }[];
  topDebtors:       { id: string; studentName: string; admNo: string; className: string; balance: number }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function currency(n: number): string {
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `UGX ${(n / 1_000).toFixed(0)}K`;
  return `UGX ${n.toLocaleString()}`;
}

const PIE_COLORS: Record<string, string> = {
  CASH:          "hsl(142 71% 45%)",
  MOBILE_MONEY:  "hsl(217 91% 60%)",
  BANK_TRANSFER: "hsl(270 95% 65%)",
  CHEQUE:        "hsl(25 95% 55%)",
  ONLINE:        "hsl(190 95% 50%)",
  POS:           "hsl(340 75% 55%)",
};
const FALLBACK_PIE_COLORS = [
  "hsl(217 91% 60%)", "hsl(142 71% 45%)", "hsl(270 95% 65%)",
  "hsl(25 95% 55%)",  "hsl(190 95% 50%)", "hsl(340 75% 55%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border:          "1px solid hsl(var(--border))",
  borderRadius:    "8px",
  color:           "hsl(var(--card-foreground))",
  fontSize:        12,
};

const CARD_CLS = "border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm";

function methodLabel(m: string) {
  const map: Record<string, string> = {
    CASH: "Cash", MOBILE_MONEY: "Mobile Money", BANK_TRANSFER: "Bank Transfer",
    CHEQUE: "Cheque", ONLINE: "Online", POS: "POS",
  };
  return map[m] ?? m;
}

function MethodBadge({ method }: { method: string }) {
  const variants: Record<string, string> = {
    CASH:          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    MOBILE_MONEY:  "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    BANK_TRANSFER: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    CHEQUE:        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    ONLINE:        "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    POS:           "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  };
  const cls = variants[method] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
      {methodLabel(method)}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BursarDashboardClient({
  slug, school, activeYear, activeTerm, schoolId, userId, stats,
  dailyCollections, classBreakdown, paymentMethods,
  recentPayments, topDebtors,
}: Props) {
  const base = `/school/${slug}/bursar`;

  // Bulk invoice state
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult,  setBulkResult]  = useState<{ success: number; skipped: number; failed: number; errors: string[] } | null>(null);
  const [bulkError,   setBulkError]   = useState<string | null>(null);

  async function handleBulkInvoice() {
    if (!activeYear?.id || !activeTerm?.id) return;
    if (!confirm(`This will generate invoices for ALL enrolled students in ${activeTerm.name}, ${activeYear.year} who don't have one yet.\n\nContinue?`)) return;
    setBulkLoading(true);
    setBulkResult(null);
    setBulkError(null);
    try {
      const res = await bulkInvoiceAllStudents({
        schoolId,
        academicYearId: activeYear.id,
        termId:         activeTerm.id,
        triggeredById:  userId,
        includeCarryForward: true,
        applyBursaries:      true,
      });
      if (res.ok) {
        setBulkResult(res.data);
      } else {
        setBulkError(res.error);
      }
    } catch (e: any) {
      setBulkError(e?.message ?? "Unexpected error");
    } finally {
      setBulkLoading(false);
    }
  }

  // KPI cards
  const rateColor =
    stats.collectionRate >= 80 ? "text-green-600 dark:text-green-400"
    : stats.collectionRate >= 50 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";
  const rateIconBg =
    stats.collectionRate >= 80 ? "bg-green-100 dark:bg-green-900/30"
    : stats.collectionRate >= 50 ? "bg-amber-100 dark:bg-amber-900/30"
    : "bg-red-100 dark:bg-red-900/30";

  const kpiCards = [
    {
      label: "Today Collected",
      value: currency(stats.todayCollected),
      icon:  TrendingUp,
      iconCls: "text-green-600 dark:text-green-400",
      iconBg:  "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Term Billed",
      value: currency(stats.totalBilled),
      icon:  DollarSign,
      iconCls: "text-primary",
      iconBg:  "bg-primary/10",
    },
    {
      label: "Term Collected",
      value: currency(stats.totalCollected),
      icon:  CheckCircle,
      iconCls: "text-emerald-600 dark:text-emerald-400",
      iconBg:  "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Outstanding",
      value: currency(stats.outstanding),
      icon:  AlertCircle,
      iconCls: stats.outstanding > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400",
      iconBg:  stats.outstanding > 0 ? "bg-rose-100 dark:bg-rose-900/30" : "bg-slate-100 dark:bg-slate-800",
    },
    {
      label: `Collection Rate`,
      value: `${stats.collectionRate.toFixed(1)}%`,
      icon:  TrendingUp,
      iconCls: rateColor,
      iconBg:  rateIconBg,
    },
    {
      label: "Students in Arrears",
      value: stats.arrearsCount.toString(),
      icon:  Users,
      iconCls: "text-orange-600 dark:text-orange-400",
      iconBg:  "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  // Format X axis dates for area chart
  const dailyForChart = dailyCollections.map((d) => ({
    ...d,
    label: format(new Date(d.date), "dd MMM"),
  }));

  // Pie chart data
  const pieData = paymentMethods.map((m, i) => ({
    name:  methodLabel(m.method),
    value: m.amount,
    color: PIE_COLORS[m.method] ?? FALLBACK_PIE_COLORS[i % FALLBACK_PIE_COLORS.length],
  }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Bursar Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{school.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activeYear && activeTerm ? (
            <Badge variant="outline" className="text-xs font-medium px-3 py-1">
              {activeYear.year} · {activeTerm.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-slate-400">No active term</Badge>
          )}
          {/* Bulk Invoice Button */}
          <Button
            size="sm"
            onClick={handleBulkInvoice}
            disabled={bulkLoading || !activeYear?.id || !activeTerm?.id}
            className="gap-1.5 font-semibold"
          >
            {bulkLoading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              : <><Zap className="h-4 w-4" /> Invoice All Students</>
            }
          </Button>
          <Link
            href={`${base}/fees/payments`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            All payments <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Bulk invoice result banner */}
      {bulkResult && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              Bulk invoicing complete — {bulkResult.success} generated, {bulkResult.skipped} skipped, {bulkResult.failed} failed
            </p>
            {bulkResult.errors.length > 0 && (
              <p className="text-xs text-green-700 dark:text-green-400 mt-1 truncate">
                Errors: {bulkResult.errors.slice(0, 3).join(" · ")}{bulkResult.errors.length > 3 ? ` +${bulkResult.errors.length - 3} more` : ""}
              </p>
            )}
          </div>
          <button onClick={() => setBulkResult(null)} className="shrink-0 text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {bulkError && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{bulkError}</p>
          <button onClick={() => setBulkError(null)} className="shrink-0 text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label} className={CARD_CLS}>
            <CardContent className="p-4 flex flex-col gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.iconBg}`}>
                <k.icon className={`h-4 w-4 ${k.iconCls}`} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">{k.label}</p>
                <p className={`text-base font-bold mt-1 ${k.iconCls}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Collections Area Chart */}
        <Card className={`lg:col-span-2 ${CARD_CLS}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Daily Collections — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyForChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="collectionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v))}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [currency(v), "Collected"]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#collectionGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Pie Chart */}
        <Card className={CARD_CLS}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    outerRadius={72}
                    dataKey="value"
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [currency(v), ""]}
                  />
                  <Legend
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-class Breakdown */}
      <Card className={CARD_CLS}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Per-Class Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classBreakdown.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, classBreakdown.length * 40)}>
              <BarChart
                data={classBreakdown}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v))}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="className"
                  type="category"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={76}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [currency(v), name]}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="billed"      name="Billed"      fill="hsl(var(--primary))"   radius={[0, 3, 3, 0]} barSize={8} />
                <Bar dataKey="paid"        name="Paid"        fill="hsl(142 71% 45%)"      radius={[0, 3, 3, 0]} barSize={8} />
                <Bar dataKey="outstanding" name="Outstanding" fill="hsl(347 77% 50%)"      radius={[0, 3, 3, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className={CARD_CLS}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              { label: "Overview",            href: `${base}/fees`,              icon: BarChart2   },
              { label: "Fee Categories",      href: `${base}/fees/categories`,   icon: Tag         },
              { label: "Fee Structures",      href: `${base}/fees/structures`,   icon: Layers      },
              { label: "Student Accounts",    href: `${base}/fees/accounts`,     icon: Users       },
              { label: "Invoices",            href: `${base}/fees/invoices`,     icon: FileText    },
              { label: "Payments",            href: `${base}/fees/payments`,     icon: Receipt     },
              { label: "Bursaries",           href: `${base}/fees/bursaries`,    icon: DollarSign  },
              { label: "Installment Plans",   href: `${base}/fees/installments`, icon: CreditCard  },
              { label: "Penalty Rules",       href: `${base}/fees/penalties`,    icon: ShieldAlert },
              { label: "Auto-Invoice Config", href: `${base}/fees/config`,       icon: Settings    },
              { label: "Reports",             href: `${base}/fees/reports`,      icon: BarChart2   },
              { label: "Expenses",            href: `${base}/expense`,           icon: Wallet      },
            ].map(q => (
              <Link
                key={q.label}
                href={q.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all group text-center"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <q.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors leading-tight">{q.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <Card className={CARD_CLS}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Recent Payments
            </CardTitle>
            <Link
              href={`${base}/fees/payments`}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No payments yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Receipt</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Student</th>
                      <th className="text-right px-4 py-2 text-slate-500 font-medium">Amount</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Method</th>
                      <th className="text-right px-4 py-2 text-slate-500 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2 text-slate-500 font-mono">
                          {p.receiptNo ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{p.studentName}</p>
                          <p className="text-slate-400">{p.admNo}</p>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-green-600 dark:text-green-400">
                          {currency(p.amount)}
                        </td>
                        <td className="px-4 py-2">
                          <MethodBadge method={p.method} />
                        </td>
                        <td className="px-4 py-2 text-right text-slate-400">
                          {format(new Date(p.processedAt), "dd MMM")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Debtors */}
        <Card className={CARD_CLS}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Top Debtors
            </CardTitle>
            <Link
              href={`${base}/fees/accounts`}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              All accounts <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {topDebtors.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No outstanding balances</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Student</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Class</th>
                      <th className="text-right px-4 py-2 text-slate-500 font-medium">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDebtors.map((d) => (
                      <tr key={d.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{d.studentName}</p>
                          <p className="text-slate-400">{d.admNo}</p>
                        </td>
                        <td className="px-4 py-2 text-slate-500">{d.className}</td>
                        <td className="px-4 py-2 text-right font-bold text-rose-600 dark:text-rose-400">
                          {currency(d.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

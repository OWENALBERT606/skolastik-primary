"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, CheckCircle, AlertCircle, Users, Percent } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = {
  slug:            string;
  activeTermId:    string | null;
  activeTermLabel: string;
  terms:           { id: string; label: string }[];
  summary: {
    totalInvoiced:  number;
    totalCollected: number;
    outstanding:    number;
    totalBursaries: number;
    totalPenalties: number;
    collectionRate: number;
    arrearsCount:   number;
  };
  classBars:      { class: string; invoiced: number; collected: number; rate: number }[];
  methodBreakdown:{ method: string; amount: number; count: number; pct: number }[];
  monthlyTrend:   { month: string; amount: number }[];
  topArrears:     { studentName: string; admNo: string; className: string; balance: number; totalInvoiced: number }[];
};

function currency(n: number): string {
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `UGX ${(n / 1_000).toFixed(0)}K`;
  return `UGX ${n.toLocaleString()}`;
}

const PIE_COLORS = [
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

export default function BursarReportsClient({
  activeTermLabel, summary, classBars, methodBreakdown, monthlyTrend, topArrears,
}: Props) {
  const rateColor =
    summary.collectionRate >= 80 ? "text-green-600 dark:text-green-400"
    : summary.collectionRate >= 50 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  const statCards = [
    { label: "Total Invoiced",   value: currency(summary.totalInvoiced),  icon: DollarSign,  color: "text-primary",                              bg: "bg-primary/10" },
    { label: "Total Collected",  value: currency(summary.totalCollected), icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400",     bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { label: "Outstanding",      value: currency(summary.outstanding),    icon: AlertCircle, color: summary.outstanding > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400", bg: summary.outstanding > 0 ? "bg-rose-100 dark:bg-rose-900/30" : "bg-slate-100 dark:bg-slate-800" },
    { label: "Bursaries Applied",value: currency(summary.totalBursaries), icon: TrendingUp,  color: "text-violet-600 dark:text-violet-400",       bg: "bg-violet-100 dark:bg-violet-900/30" },
    { label: "Collection Rate",  value: `${summary.collectionRate.toFixed(1)}%`, icon: Percent, color: rateColor, bg: "bg-slate-100 dark:bg-slate-800" },
    { label: "In Arrears",       value: summary.arrearsCount.toString(),  icon: Users,       color: "text-orange-600 dark:text-orange-400",       bg: "bg-orange-100 dark:bg-orange-900/30" },
  ];

  const pieData = methodBreakdown.map((m, i) => ({
    name:  methodLabel(m.method),
    value: m.amount,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Financial analysis & collection trends</p>
        </div>
        <Badge variant="outline" className="text-xs font-medium px-3 py-1">{activeTermLabel}</Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className={CARD_CLS}>
            <CardContent className="p-4 flex flex-col gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 6-month trend */}
        <Card className={`lg:col-span-2 ${CARD_CLS}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              6-Month Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false} axisLine={false} width={48}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [currency(v), "Collected"]} />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment methods pie */}
        <Card className={CARD_CLS}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" outerRadius={70} dataKey="value" labelLine={false}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [currency(v), ""]} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-class bar chart */}
      <Card className={CARD_CLS}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Class-by-Class Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {classBars.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, classBars.length * 40)}>
              <BarChart data={classBars} layout="vertical" margin={{ top: 0, right: 8, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  dataKey="class" type="category"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false} axisLine={false} width={76}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [currency(v), name]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="invoiced"  name="Invoiced"   fill="hsl(var(--primary))"   radius={[0, 3, 3, 0]} barSize={8} />
                <Bar dataKey="collected" name="Collected"  fill="hsl(142 71% 45%)"      radius={[0, 3, 3, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom row: method table + top debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Method breakdown table */}
        <Card className={CARD_CLS}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="text-left px-4 py-2 text-slate-500 font-semibold">Method</th>
                  <th className="text-right px-4 py-2 text-slate-500 font-semibold">Amount</th>
                  <th className="text-right px-4 py-2 text-slate-500 font-semibold">Count</th>
                  <th className="text-right px-4 py-2 text-slate-500 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {methodBreakdown.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-slate-400 py-6">No data</td></tr>
                ) : (
                  methodBreakdown.map((m) => (
                    <tr key={m.method} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                      <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{methodLabel(m.method)}</td>
                      <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">{currency(m.amount)}</td>
                      <td className="px-4 py-2 text-right text-slate-500">{m.count}</td>
                      <td className="px-4 py-2 text-right text-slate-500">{m.pct}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Top debtors */}
        <Card className={CARD_CLS}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Top Debtors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="text-left px-4 py-2 text-slate-500 font-semibold">Student</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-semibold">Class</th>
                  <th className="text-right px-4 py-2 text-slate-500 font-semibold">Balance</th>
                  <th className="text-right px-4 py-2 text-slate-500 font-semibold">% of Billed</th>
                </tr>
              </thead>
              <tbody>
                {topArrears.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-slate-400 py-6">No outstanding balances</td></tr>
                ) : (
                  topArrears.map((a, i) => {
                    const pct = a.totalInvoiced > 0 ? Math.round((a.balance / a.totalInvoiced) * 100) : 0;
                    return (
                      <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                        <td className="px-4 py-2">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{a.studentName}</p>
                          <p className="text-slate-400">{a.admNo}</p>
                        </td>
                        <td className="px-4 py-2 text-slate-500">{a.className || "—"}</td>
                        <td className="px-4 py-2 text-right font-bold text-rose-600 dark:text-rose-400">{currency(a.balance)}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{pct}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

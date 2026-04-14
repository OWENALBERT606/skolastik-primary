"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, FileText, AlertCircle, DollarSign,
  Loader2, School, Receipt, Wallet, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Revenue = {
  totalBilled:      number;
  totalCollected:   number;
  totalOutstanding: number;
  totalExpenses:    number;
  netProfit:        number;
  byTerm:   { termId: string; termName: string; billed: number; collected: number; outstanding: number }[];
  bySchool: { schoolId: string; schoolName: string; pricePerTerm: number; totalBilled: number; totalPaid: number; balance: number }[];
};

const fmt = (n: number) =>
  n >= 1_000_000
    ? `UGX ${(n / 1_000_000).toFixed(2)}M`
    : `UGX ${n.toLocaleString("en-UG")}`;

function StatCard({
  label, value, sub, icon: Icon, colorClass, bgClass, trend,
}: {
  label:      string;
  value:      string;
  sub?:       string;
  icon:       React.ElementType;
  colorClass: string;
  bgClass:    string;
  trend?:     "up" | "down" | "neutral";
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="grid grid-cols-3 items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-black leading-none ${colorClass}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl shrink-0 ml-3 ${bgClass}`}>
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-slate-400"}`}>
            {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RevenueOverview() {
  const [data,    setData]    = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i}><CardContent className="p-5"><div className="h-16 animate-pulse bg-slate-100 dark:bg-slate-800 rounded" /></CardContent></Card>
      ))}
    </div>
  );

  if (!data) return null;

  const schoolsInArrears  = data.bySchool.filter(s => s.balance > 0).length;
  const schoolsFullyPaid  = data.bySchool.filter(s => s.balance === 0 && s.totalPaid > 0).length;
  const totalPayments     = data.byTerm.reduce((s, t) => s + (t.collected > 0 ? 1 : 0), 0);
  const collectionRate    = data.totalBilled > 0 ? Math.round((data.totalCollected / data.totalBilled) * 100) : 0;

  const cards = [
    {
      label:      "Total Collected",
      value:      fmt(data.totalCollected),
      sub:        `${collectionRate}% collection rate`,
      icon:       TrendingUp,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass:    "bg-emerald-50 dark:bg-emerald-900/20",
      trend:      "up" as const,
    },
    {
      label:      "Total Billed",
      value:      fmt(data.totalBilled),
      sub:        `Across ${data.bySchool.length} school${data.bySchool.length !== 1 ? "s" : ""}`,
      icon:       FileText,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass:    "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label:      "Outstanding",
      value:      fmt(data.totalOutstanding),
      sub:        `${schoolsInArrears} school${schoolsInArrears !== 1 ? "s" : ""} in arrears`,
      icon:       AlertCircle,
      colorClass: data.totalOutstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
      bgClass:    data.totalOutstanding > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-emerald-50 dark:bg-emerald-900/20",
      trend:      data.totalOutstanding > 0 ? "down" as const : "up" as const,
    },
    {
      label:      "Total Expenses",
      value:      fmt(data.totalExpenses),
      sub:        "Server & hosting costs",
      icon:       Wallet,
      colorClass: "text-rose-600 dark:text-rose-400",
      bgClass:    "bg-rose-50 dark:bg-rose-900/20",
      trend:      "down" as const,
    },
    {
      label:      "Net Profit",
      value:      fmt(data.netProfit),
      sub:        "Collected minus expenses",
      icon:       DollarSign,
      colorClass: data.netProfit >= 0 ? "text-violet-600 dark:text-violet-400" : "text-rose-600 dark:text-rose-400",
      bgClass:    data.netProfit >= 0 ? "bg-violet-50 dark:bg-violet-900/20" : "bg-rose-50 dark:bg-rose-900/20",
      trend:      data.netProfit >= 0 ? "up" as const : "down" as const,
    },
    {
      label:      "Schools Paid",
      value:      `${schoolsFullyPaid} / ${data.bySchool.length}`,
      sub:        `${schoolsInArrears} still owe`,
      icon:       School,
      colorClass: schoolsInArrears === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400",
      bgClass:    "bg-slate-50 dark:bg-slate-800",
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Per-term breakdown */}
      {data.byTerm.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.byTerm.map(t => {
            const rate = t.billed > 0 ? Math.round((t.collected / t.billed) * 100) : 0;
            return (
              <div key={t.termId} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                <Receipt className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{t.termName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 shrink-0">{rate}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{fmt(t.collected)}</p>
                  <p className="text-[10px] text-slate-400">of {fmt(t.billed)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

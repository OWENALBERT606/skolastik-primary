"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Users, School, FileText, UserCheck,
  GraduationCap, Calendar, Settings,
  CheckCircle2, ExternalLink, Plus,
  Search, TrendingUp, Wallet, AlertCircle,
  ChevronUp, ChevronDown, HardDrive,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import StorageUsageTable from "@/app/(dashboard)/dashboard/components/StorageUsageTable";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Stats = {
  totalSchools:    number;
  activeSchools:   number;
  inactiveSchools: number;
  totalStudents:   number;
  totalTeachers:   number;
  totalParents:    number;
  totalReportCards: number;
  activeTerms:     number;
  activeYears:     number;
};

type SchoolStat = {
  id:             string;
  name:           string;
  slug:           string;
  logo:           string | null;
  isActive:       boolean;
  address:        string | null;
  students:       number;
  teachers:       number;
  parents:        number;
  streams:        number;
  activeYear:     string | null;
  activeTerm:     string | null;
  reportCards:    number;
  publishedCards: number;
  totalInvoiced:  number;
  totalCollected: number;
  collectionRate: number;
  arrearsCount:   number;
};

type Props = {
  stats:          Stats;
  perSchoolStats: SchoolStat[];
  maxStudents:    number;
  adminName:      string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtM = (n: number) =>
  n >= 1_000_000 ? `UGX ${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `UGX ${(n / 1_000).toFixed(0)}K`
  : `UGX ${n.toLocaleString()}`;

type SortKey = "name" | "students" | "teachers" | "collectionRate" | "arrearsCount" | "reportCards";

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard({ stats, perSchoolStats, maxStudents, adminName }: Props) {
  const [search,  setSearch]  = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("students");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const filtered = perSchoolStats
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.address ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortAsc ? cmp : -cmp;
    });

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <button onClick={() => toggleSort(col)} className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${active ? "text-primary" : "text-slate-500 dark:text-slate-400"}`}>
        {label}
        {active ? (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronDown className="h-3 w-3 opacity-30" />}
      </button>
    );
  }

  const totalCollectedAll = perSchoolStats.reduce((s, x) => s + x.totalCollected, 0);
  const totalInvoicedAll  = perSchoolStats.reduce((s, x) => s + x.totalInvoiced, 0);
  const overallRate       = totalInvoicedAll > 0 ? Math.round((totalCollectedAll / totalInvoicedAll) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-8">

        {/* Welcome */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Welcome back, {adminName.split(" ")[0]}</h2>
            <p className="text-muted-foreground mt-1">Here's what's happening across your school network today.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/schools"><School className="h-4 w-4 mr-1.5" />Schools</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/schools"><Plus className="h-4 w-4 mr-1.5" />Add School</Link>
            </Button>
          </div>
        </div>

        {/* System KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schools</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><School className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalSchools}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" />{stats.activeSchools} Active</Badge>
                {stats.inactiveSchools > 0 && <Badge variant="outline" className="text-xs">{stats.inactiveSchools} Inactive</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalStudents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all active schools</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff & Parents</CardTitle>
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30"><UserCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{(stats.totalTeachers + stats.totalParents).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.totalTeachers.toLocaleString()} teachers · {stats.totalParents.toLocaleString()} parents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fee Collection</CardTitle>
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{fmtM(totalCollectedAll)}</div>
              <p className="text-xs text-muted-foreground mt-1">{overallRate}% collection rate · {fmtM(totalInvoicedAll)} billed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Report Cards</CardTitle>
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30"><FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalReportCards.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Generated across all schools</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Terms</CardTitle>
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30"><Calendar className="h-4 w-4 text-cyan-600 dark:text-cyan-400" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.activeTerms}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.activeYears} active academic year{stats.activeYears !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Manage Schools", href: "/dashboard/schools",      icon: School    },
                  { label: "Manage Users",   href: "/dashboard/users",        icon: Users     },
                  { label: "Roles",          href: "/dashboard/users/roles",  icon: UserCheck },
                  { label: "Add School",     href: "/dashboard/schools",      icon: Plus      },
                ].map(q => (
                  <Button key={q.label} asChild variant="outline" size="sm" className="justify-start text-xs">
                    <Link href={q.href}><q.icon className="h-3.5 w-3.5 mr-1.5" />{q.label}</Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Per-school stats table */}
        <Card>          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5" /> Per-School Summary
                </CardTitle>
                <CardDescription>Statistics for each school — click a school to open its portal</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search schools…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-5 py-3"><SortBtn col="name" label="School" /></th>
                    <th className="text-center px-4 py-3"><SortBtn col="students" label="Students" /></th>
                    <th className="text-center px-4 py-3"><SortBtn col="teachers" label="Teachers" /></th>
                    <th className="text-center px-4 py-3 hidden md:table-cell">Parents</th>
                    <th className="text-center px-4 py-3 hidden lg:table-cell">Streams</th>
                    <th className="text-center px-4 py-3 hidden lg:table-cell"><SortBtn col="reportCards" label="Reports" /></th>
                    <th className="text-center px-4 py-3 hidden xl:table-cell">Billed</th>
                    <th className="text-center px-4 py-3 hidden xl:table-cell">Collected</th>
                    <th className="text-center px-4 py-3"><SortBtn col="collectionRate" label="Rate" /></th>
                    <th className="text-center px-4 py-3 hidden md:table-cell"><SortBtn col="arrearsCount" label="Arrears" /></th>
                    <th className="text-center px-4 py-3">Term</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filtered.length === 0 && (
                    <tr><td colSpan={12} className="text-center py-12 text-sm text-muted-foreground">No schools found.</td></tr>
                  )}
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* School name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${s.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100 max-w-[180px] truncate">{s.name}</p>
                            {s.address && <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{s.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">{s.students.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-400">{s.teachers}</td>
                      <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-400 hidden md:table-cell">{s.parents}</td>
                      <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-400 hidden lg:table-cell">{s.streams}</td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">{s.reportCards.toLocaleString()}</div>
                        {s.reportCards > 0 && (
                          <div className="text-[10px] text-muted-foreground">{s.publishedCards} published</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-400 hidden xl:table-cell text-xs">{fmtM(s.totalInvoiced)}</td>
                      <td className="px-4 py-3.5 text-center text-emerald-600 dark:text-emerald-400 hidden xl:table-cell text-xs font-semibold">{fmtM(s.totalCollected)}</td>
                      {/* Collection rate */}
                      <td className="px-4 py-3.5 text-center">
                        <div className={`text-sm font-bold ${s.collectionRate >= 80 ? "text-emerald-600" : s.collectionRate >= 50 ? "text-amber-600" : s.totalInvoiced === 0 ? "text-slate-400" : "text-rose-600"}`}>
                          {s.totalInvoiced === 0 ? "—" : `${s.collectionRate}%`}
                        </div>
                        {s.totalInvoiced > 0 && (
                          <div className="w-16 mx-auto mt-1">
                            <Progress value={s.collectionRate} className="h-1" />
                          </div>
                        )}
                      </td>
                      {/* Arrears */}
                      <td className="px-4 py-3.5 text-center hidden md:table-cell">
                        {s.arrearsCount > 0
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><AlertCircle className="h-3 w-3" />{s.arrearsCount}</span>
                          : <span className="text-xs text-emerald-600">✓</span>
                        }
                      </td>
                      {/* Active term */}
                      <td className="px-4 py-3.5 text-center">
                        {s.activeTerm
                          ? <Badge variant="outline" className="text-[10px]">{s.activeYear} · {s.activeTerm}</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>
                        }
                      </td>
                      {/* Link */}
                      <td className="px-4 py-3.5 text-center">
                        <Link href={`/school/${s.slug}`} className="text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage — superadmin only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-5 w-5" /> Storage Usage by School
            </CardTitle>
            <CardDescription>Database rows + Cloudflare R2 file storage per school tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <StorageUsageTable />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

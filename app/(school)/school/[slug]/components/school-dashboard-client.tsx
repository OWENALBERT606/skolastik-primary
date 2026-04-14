"use client";

import {
  Users, GraduationCap, UserCheck, BookOpen, GitBranch,
  Library, DollarSign, FileText, TrendingUp, Award,
  ArrowUpRight, Calendar, School, ArrowRight,
  UserPlus, Repeat2, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link   from "next/link";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  school:     { id: string; name: string; slug: string; logo: string | null; motto: string | null };
  activeYear: { id: string; year: string } | null;
  activeTerm: { id: string; name: string; termNumber: number } | null;
  stats: {
    totalStudents: number; activeStudents: number;
    totalTeachers: number; activeTeachers: number;
    totalParents: number; totalStaff: number;
    totalSubjects: number; totalStreams: number; activeStreams: number;
    classYearCount: number; boysCount: number; girlsCount: number;
    reportCardCount: number; publishedReportCards: number;
  };
  feeStats:            { totalBilled: number; totalPaid: number; outstanding: number };
  enrolmentByClass:    { className: string; boys: number; girls: number; students: number }[];
  termEnrolmentTrend:  { term: string; students: number }[];
  subjectPerformance:  { subject: string; avgScore: number }[];
  recentEnrollments:   { id: string; name: string; admNo: string; className: string; createdAt: string }[];
  slug: string;
};

// ── Colours — use CSS variables so school palette applies automatically ────────
const BLUE   = "hsl(var(--primary))";
const ACCENT = "hsl(var(--accent))";
const PINK   = "#ec4899";
const GREEN  = "#22c55e";
const ORANGE = "#f97316";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--card-foreground))",
  fontSize: 12,
};

function currency(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, bg, badge }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; bg: string; badge?: string;
}) {
  return (
    <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-zinc-400 dark:text-slate-500 mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        {badge && (
          <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-3 w-3" />
            <span>{badge}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SchoolDashboardClient({
  school, activeYear, activeTerm, stats, feeStats,
  enrolmentByClass, termEnrolmentTrend, subjectPerformance, recentEnrollments, slug,
}: Props) {
  const collectionRate = feeStats.totalBilled > 0
    ? Math.round((feeStats.totalPaid / feeStats.totalBilled) * 100)
    : 0;

  const reportCardPct = stats.reportCardCount > 0
    ? Math.round((stats.publishedReportCards / stats.reportCardCount) * 100)
    : 0;

  const genderData = [
    { name: "Boys",  value: stats.boysCount  },
    { name: "Girls", value: stats.girlsCount },
  ];

  return (
    <div className="space-y-6 p-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <School className="h-6 w-6 text-primary" />
            {school.name}
          </h1>
          {(activeYear || activeTerm) && (
            <p className="text-sm text-zinc-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {activeYear && `Academic Year ${activeYear.year}`}
              {activeTerm && ` · ${activeTerm.name}`}
            </p>
          )}
          {school.motto && (
            <p className="text-xs italic text-zinc-400 dark:text-slate-500 mt-0.5">"{school.motto}"</p>
          )}
        </div>
        {activeTerm && (
          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0">
            Active Term
          </Badge>
        )}
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard
          icon={Users} label="Total Students" value={stats.activeStudents}
          sub={`${stats.totalStudents} registered`}
          color="text-primary" bg="bg-primary/10"
          badge={`${stats.boysCount}B · ${stats.girlsCount}G`}
        />
        <StatCard
          icon={GraduationCap} label="Teachers" value={stats.activeTeachers}
          sub={`${stats.totalTeachers} total`}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <StatCard
          icon={UserCheck} label="Parents" value={stats.totalParents}
          sub="Registered guardians"
          color="text-orange-600 dark:text-orange-400" bg="bg-orange-100 dark:bg-orange-900/30"
        />
        <StatCard
          icon={BookOpen} label="Classes" value={stats.classYearCount}
          sub={`${stats.activeStreams} streams active`}
          color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-100 dark:bg-indigo-900/30"
        />
        <StatCard
          icon={Library} label="Subjects" value={stats.totalSubjects}
          sub="On curriculum"
          color="text-amber-600 dark:text-amber-400" bg="bg-amber-100 dark:bg-amber-900/30"
        />
        <StatCard
          icon={Users} label="Staff" value={stats.totalStaff}
          sub="Non-teaching"
          color="text-cyan-600 dark:text-cyan-400" bg="bg-cyan-100 dark:bg-cyan-900/30"
        />
        <StatCard
          icon={GitBranch} label="Streams" value={stats.totalStreams}
          sub={`${stats.activeStreams} this year`}
          color="text-pink-600 dark:text-pink-400" bg="bg-pink-100 dark:bg-pink-900/30"
        />
        <StatCard
          icon={FileText} label="Report Cards" value={stats.reportCardCount}
          sub={`${stats.publishedReportCards} published`}
          color="text-violet-600 dark:text-violet-400" bg="bg-violet-100 dark:bg-violet-900/30"
          badge={reportCardPct > 0 ? `${reportCardPct}% published` : undefined}
        />
        <StatCard
          icon={DollarSign} label="Fees Collected" value={`UGX ${currency(feeStats.totalPaid)}`}
          sub={`${collectionRate}% of ${currency(feeStats.totalBilled)}`}
          color="text-teal-600 dark:text-teal-400" bg="bg-teal-100 dark:bg-teal-900/30"
          badge={feeStats.outstanding > 0 ? `${currency(feeStats.outstanding)} outstanding` : undefined}
        />
        <StatCard
          icon={TrendingUp} label="Collection Rate" value={`${collectionRate}%`}
          sub="This term"
          color={collectionRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
          bg={collectionRate >= 80 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"}
        />
      </div>

      {/* ── Charts row 1 ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Enrolment by class */}
        <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-800 dark:text-slate-200">Enrolment by Class</CardTitle>
            <CardDescription className="text-xs text-zinc-400 dark:text-slate-500">Students split by gender per class</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolmentByClass.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={enrolmentByClass} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="className" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="boys"  name="Boys"  fill={BLUE} radius={[3,3,0,0]} />
                  <Bar dataKey="girls" name="Girls" fill={PINK} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-zinc-400 dark:text-slate-500">
                No enrolment data for this term
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrolment trend */}
        <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-800 dark:text-slate-200">Enrolment Trend</CardTitle>
            <CardDescription className="text-xs text-zinc-400 dark:text-slate-500">Student count across terms</CardDescription>
          </CardHeader>
          <CardContent>
            {termEnrolmentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={termEnrolmentTrend} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="enrolGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="term" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="students" name="Students" stroke={ACCENT} strokeWidth={2} fill="url(#enrolGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-zinc-400 dark:text-slate-500">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 2 ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Subject performance */}
        <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-800 dark:text-slate-200">Subject Performance</CardTitle>
            <CardDescription className="text-xs text-zinc-400 dark:text-slate-500">Average score per subject (%)</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subjectPerformance} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="subject" type="category" width={72} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, "Avg Score"]} />
                  <Bar dataKey="avgScore" name="Avg Score" radius={[0,3,3,0]}>
                    {subjectPerformance.map((entry, i) => (
                      <Cell key={i} fill={entry.avgScore >= 70 ? GREEN : entry.avgScore >= 50 ? ORANGE : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-zinc-400 dark:text-slate-500">
                No performance data for this term
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gender distribution */}
        <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-800 dark:text-slate-200">Gender Distribution</CardTitle>
            <CardDescription className="text-xs text-zinc-400 dark:text-slate-500">
              {(stats.boysCount + stats.girlsCount).toLocaleString()} active students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(stats.boysCount + stats.girlsCount) > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    <Cell fill={BLUE} />
                    <Cell fill={PINK} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v.toLocaleString(), "Students"]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-zinc-400 dark:text-slate-500">
                No student data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee collection */}
        <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-800 dark:text-slate-200">Fee Collection</CardTitle>
            <CardDescription className="text-xs text-zinc-400 dark:text-slate-500">
              {activeTerm?.name ?? "Current term"} summary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {feeStats.totalBilled > 0 ? (
              <>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500 dark:text-slate-400">Collection rate</span>
                    <span className="font-semibold text-zinc-800 dark:text-slate-200">{collectionRate}%</span>
                  </div>
                  <div className="h-2.5 bg-zinc-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${collectionRate}%`, backgroundColor: collectionRate >= 80 ? GREEN : collectionRate >= 50 ? ORANGE : "#ef4444" }} />
                  </div>
                </div>
                {[
                  { label: "Total Billed",   value: feeStats.totalBilled,   color: "text-zinc-700 dark:text-slate-300" },
                  { label: "Total Paid",     value: feeStats.totalPaid,     color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Outstanding",    value: feeStats.outstanding,   color: "text-rose-600 dark:text-rose-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-slate-700/50 last:border-0">
                    <span className="text-xs text-zinc-500 dark:text-slate-400">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>UGX {value.toLocaleString()}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-zinc-400 dark:text-slate-500">
                No fee data for this term
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────────── */}
      <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-zinc-800 dark:text-slate-200 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon:  UserPlus,
                label: "Bulk Enroll Students",
                desc:  "Enroll students into a class stream",
                href:  `/school/${slug}/academics/streams`,
                color: "text-primary",
                bg:    "bg-primary/10",
              },
              {
                icon:  Repeat2,
                label: "Bulk Promotions",
                desc:  "Promote or repeat students to next year",
                href:  `/school/${slug}/dos/academics/bulk-promotions`,
                color: "text-violet-600 dark:text-violet-400",
                bg:    "bg-violet-50 dark:bg-violet-900/20",
              },
              {
                icon:  GraduationCap,
                label: "Add Student",
                desc:  "Register a new student",
                href:  `/school/${slug}/users/students`,
                color: "text-emerald-600 dark:text-emerald-400",
                bg:    "bg-emerald-50 dark:bg-emerald-900/20",
              },
              {
                icon:  FileText,
                label: "Report Cards",
                desc:  "View & publish report cards",
                href:  `/school/${slug}/academics/report-cards`,
                color: "text-orange-600 dark:text-orange-400",
                bg:    "bg-orange-50 dark:bg-orange-900/20",
              },
            ].map(({ icon: Icon, label, desc, href, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 p-4 rounded-xl border border-zinc-100 dark:border-slate-700/50
                           hover:border-zinc-300 dark:hover:border-slate-600 hover:shadow-sm transition-all"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-slate-500 mt-0.5 leading-tight">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-slate-600 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Enrollments ──────────────────────────────────────────────── */}
      {recentEnrollments.length > 0 && (
        <Card className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-800 dark:text-slate-200 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Recent Enrollments
              </CardTitle>
              <span className="text-xs text-zinc-400 dark:text-slate-500">{activeTerm?.name}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentEnrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {e.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-slate-200">{e.name}</p>
                      <p className="text-xs text-zinc-400 dark:text-slate-500">{e.admNo} · {e.className}</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-slate-500">
                    {format(new Date(e.createdAt), "dd MMM")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

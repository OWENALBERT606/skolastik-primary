// app/(dashboard)/school/[schoolId]/staff/components/StaffDashboard.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Users, BarChart2, Calendar, Activity, BookOpen,
  Megaphone, AlertCircle, LogOut, TrendingUp,
  FileWarning, CreditCard, UserCheck, Clock, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalStaff: number;
  activeStaff: number;
  onLeave: number;
  teachingStaff: number;
  nonTeachingStaff: number;
  expiringDocuments: number;
  pendingLoans: number;
  pendingLeaveRequests: number;
  pendingPayrollBatch: number;
  pendingDisciplinary: number;
}

interface Module {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  bg: string;
  border: string;
  badge?: string | null;
  badgeColor?: string;
}

// ─── Module Card ──────────────────────────────────────────────────────────────

function ModuleCard({ mod }: { mod: Module }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(mod.path)}
      className={`group relative w-full text-left bg-white dark:bg-[#0d1117] border ${mod.border} hover:border-opacity-80 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:-translate-y-0.5 flex flex-col gap-4 overflow-hidden`}
    >
      {/* Subtle hover glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${mod.bg} blur-3xl scale-150 pointer-events-none`} />

      <div className="relative flex items-start justify-between">
        <div className={`w-11 h-11 ${mod.bg} rounded-xl flex items-center justify-center border ${mod.border}`}>
          <mod.icon size={20} className={mod.color} />
        </div>
        {mod.badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${mod.badgeColor}`}>
            {mod.badge}
          </span>
        )}
      </div>

      <div className="relative">
        <p className="text-sm font-semibold text-blue-900 dark:text-white group-hover:opacity-80 transition-opacity">
          {mod.label}
        </p>
        <p className="text-xs text-blue-400 dark:text-slate-600 mt-0.5 leading-relaxed">
          {mod.description}
        </p>
      </div>

      <div className={`relative flex items-center gap-1 text-xs ${mod.color} opacity-0 group-hover:opacity-100 transition-all duration-200 -mt-1`}>
        Open <ChevronRight size={12} />
      </div>
    </button>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, color, bg, border, alert,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  alert?: boolean;
}) {
  return (
    <div className={`bg-white dark:bg-[#0d1117] border ${border} rounded-xl p-4 flex items-center gap-3 ${alert && Number(value) > 0 ? "ring-1 ring-red-500/20" : ""}`}>
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
        <p className="text-xs text-blue-400 dark:text-slate-500 leading-tight mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StaffDashboard({
  schoolId,
  stats,
}: {
  schoolId: string;
  stats: DashboardStats;
}) {
  const modules: Module[] = [
    {
      label: "Staff Directory",
      description: "All employees, roles and profiles",
      icon: Users,
      path: `/school/${schoolId}/staff`,
      color: "text-indigo-500 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-500/8",
      border: "border-indigo-200 dark:border-indigo-500/20",
      badge: `${stats.activeStaff} active`,
      badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    },
    {
      label: "Payroll",
      description: "Monthly batches, payslips & reports",
      icon: BarChart2,
      path: `/school/${schoolId}/staff/payroll`,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/8",
      border: "border-emerald-200 dark:border-emerald-500/20",
      badge: stats.pendingPayrollBatch > 0 ? `${stats.pendingPayrollBatch} pending` : null,
      badgeColor: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    },
    {
      label: "Leave",
      description: "Requests, balances & approvals",
      icon: Calendar,
      path: `/school/${schoolId}/staff/leave`,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/8",
      border: "border-amber-200 dark:border-amber-500/20",
      badge: stats.pendingLeaveRequests > 0 ? `${stats.pendingLeaveRequests} pending` : null,
      badgeColor: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    },
    {
      label: "Attendance",
      description: "Daily records & time tracking",
      icon: Activity,
      path: `/school/${schoolId}/staff/attendance`,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-500/8",
      border: "border-teal-200 dark:border-teal-500/20",
    },
    {
      label: "Training",
      description: "Programs & professional development",
      icon: BookOpen,
      path: `/school/${schoolId}/staff/training`,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/8",
      border: "border-blue-200 dark:border-blue-500/20",
    },
    {
      label: "Notice Board",
      description: "Announcements & communications",
      icon: Megaphone,
      path: `/school/${schoolId}/staff/notices`,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-500/8",
      border: "border-sky-200 dark:border-sky-500/20",
    },
    {
      label: "Disciplinary",
      description: "Cases, hearings & grievances",
      icon: AlertCircle,
      path: `/school/${schoolId}/staff/disciplinary`,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-500/8",
      border: "border-red-200 dark:border-red-500/20",
      badge: stats.pendingDisciplinary > 0 ? `${stats.pendingDisciplinary} open` : null,
      badgeColor: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    },
    {
      label: "Offboarding",
      description: "Exit interviews & clearances",
      icon: LogOut,
      path: `/school/${schoolId}/staff/offboarding`,
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-100 dark:bg-slate-500/8",
      border: "border-slate-200 dark:border-slate-700/60",
    },
  ];

  const kpis = [
    {
      label: "Total Staff",
      value: stats.totalStaff,
      icon: Users,
      color: "text-blue-600 dark:text-slate-300",
      bg: "bg-blue-100 dark:bg-slate-700/40",
      border: "border-blue-200 dark:border-slate-800/80",
    },
    {
      label: "Active",
      value: stats.activeStaff,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/20",
    },
    {
      label: "On Leave",
      value: stats.onLeave,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-200 dark:border-amber-500/20",
    },
    {
      label: "Expiring Docs",
      value: stats.expiringDocuments,
      icon: FileWarning,
      color: stats.expiringDocuments > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500",
      bg: stats.expiringDocuments > 0 ? "bg-red-50 dark:bg-red-500/10" : "bg-slate-100 dark:bg-slate-800/40",
      border: stats.expiringDocuments > 0 ? "border-red-200 dark:border-red-500/20" : "border-slate-200 dark:border-slate-800/80",
      alert: true,
    },
    {
      label: "Pending Loans",
      value: stats.pendingLoans,
      icon: CreditCard,
      color: stats.pendingLoans > 0 ? "text-orange-600 dark:text-orange-400" : "text-slate-400 dark:text-slate-500",
      bg: stats.pendingLoans > 0 ? "bg-orange-50 dark:bg-orange-500/10" : "bg-slate-100 dark:bg-slate-800/40",
      border: stats.pendingLoans > 0 ? "border-orange-200 dark:border-orange-500/20" : "border-slate-200 dark:border-slate-800/80",
      alert: true,
    },
  ];

  return (
    <div className="relative px-6 pt-10 pb-6 max-w-7xl mx-auto">
      {/* Heading */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/25 rounded-lg flex items-center justify-center">
            <TrendingUp size={15} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-blue-900 dark:text-white tracking-tight">
            Staff Management
          </h1>
        </div>
        <p className="text-sm text-blue-400 dark:text-slate-500 ml-10">
          Human resources overview across all modules
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
        {kpis.map(k => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs font-semibold text-blue-400 dark:text-slate-500 uppercase tracking-widest">
          Modules
        </p>
        <div className="h-px flex-1 bg-blue-100 dark:bg-slate-800/80" />
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {modules.map(mod => (
          <ModuleCard key={mod.label} mod={mod} />
        ))}
      </div>
    </div>
  );
}
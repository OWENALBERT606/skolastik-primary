// app/(student)/school/[slug]/student/dashboard/page.tsx

import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import Link                     from "next/link";
import {
  BookOpen, Download, GraduationCap, CalendarDays, ClipboardList,
  CheckCircle2, XCircle, Clock, ShieldCheck,
} from "lucide-react";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const authUser = await getAuthenticatedUser();
  if (!authUser?.id || authUser.loginAs !== "student") redirect("/login");

  // Resolve student record
  const student = await db.student.findFirst({
    where:  { userId: authUser.id },
    select: {
      id:          true,
      firstName:   true,
      lastName:    true,
      admissionNo: true,
      imageUrl:    true,
      gender:      true,
      schoolId:    true,
      school:      { select: { name: true, logo: true } },
    },
  });
  if (!student) redirect("/login");

  // Active enrollment
  const enrollment = await db.enrollment.findFirst({
    where:   { studentId: student.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      stream:      { select: { id: true, name: true, classYear: { select: { classTemplate: { select: { name: true } } } } } },
      term:        { select: { id: true, name: true, termNumber: true } },
      academicYear:{ select: { year: true } },
    },
  });

  // Enrolled subjects
  const subjectEnrollments = enrollment ? await db.studentSubjectEnrollment.findMany({
    where:   { enrollmentId: enrollment.id, status: "ACTIVE" },
    include: { streamSubject: { include: { subject: { select: { name: true } } } } },
  }) : [];

  // Recent attendance (last 14 days)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentAttendance = await db.studentAttendance.findMany({
    where:   { studentId: student.id, date: { gte: twoWeeksAgo } },
    orderBy: { date: "desc" },
    take:    14,
  });

  const attTotal   = recentAttendance.length;
  const attPresent = recentAttendance.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
  const attRate    = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : null;

  // Available resources count
  const resourceCount = enrollment?.stream ? await db.subjectResource.count({
    where: {
      schoolId:    student.schoolId,
      isPublished: true,
      OR: [
        { streamId: enrollment.stream.id },
        { subjectId: { in: subjectEnrollments.map(se => se.streamSubject.subjectId) }, streamId: null },
      ],
    },
  }) : 0;

  const className  = enrollment?.stream
    ? `${enrollment.stream.classYear.classTemplate.name} ${enrollment.stream.name}`
    : null;

  const STATUS_ICON: Record<string, React.ElementType> = {
    PRESENT: CheckCircle2,
    ABSENT:  XCircle,
    LATE:    Clock,
    EXCUSED: ShieldCheck,
  };
  const STATUS_COLOR: Record<string, string> = {
    PRESENT: "text-green-500",
    ABSENT:  "text-red-500",
    LATE:    "text-amber-500",
    EXCUSED: "text-blue-500",
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">

      {/* Welcome header */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        {student.imageUrl ? (
          <img src={student.imageUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {student.firstName[0]}{student.lastName[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Welcome back, {student.firstName}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {className ?? "No active class"}{enrollment ? ` · ${enrollment.term.name} ${enrollment.academicYear.year}` : ""}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Adm No: {student.admissionNo}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon:   BookOpen,
            label:  "Subjects",
            value:  subjectEnrollments.length,
            sub:    "enrolled",
            color:  "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
          },
          {
            icon:   Download,
            label:  "Resources",
            value:  resourceCount,
            sub:    "available",
            color:  "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
            href:   `/school/${slug}/student/resources`,
          },
          {
            icon:   CalendarDays,
            label:  "Attendance",
            value:  attRate !== null ? `${attRate}%` : "—",
            sub:    "last 2 weeks",
            color:  attRate !== null && attRate < 80
              ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
          },
          {
            icon:   GraduationCap,
            label:  "Results",
            value:  "View",
            sub:    "your results",
            color:  "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
            href:   `/school/${slug}/student/results`,
          },
        ].map(({ icon: Icon, label, value, sub, color, href }) => {
          const card = (
            <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 ${href ? "hover:border-primary/30 transition-colors cursor-pointer" : ""}`}>
              <div className={`inline-flex p-2 rounded-lg mb-2 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</p>
              <p className="text-[10px] text-slate-400">{sub}</p>
            </div>
          );
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Subjects */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> My Subjects
            </h2>
            <span className="text-xs text-slate-400">{subjectEnrollments.length} subjects</span>
          </div>
          {subjectEnrollments.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No subjects enrolled yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjectEnrollments.map((se, i) => (
                <div key={se.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {se.streamSubject.subject.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent attendance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" /> Recent Attendance
            </h2>
            <span className="text-xs text-slate-400">Last 14 days</span>
          </div>
          {recentAttendance.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No attendance records yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {recentAttendance.map(a => {
                const Icon  = STATUS_ICON[a.status]  ?? CheckCircle2;
                const color = STATUS_COLOR[a.status] ?? "text-slate-400";
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                    <span className="text-xs text-slate-400 w-24 shrink-0 tabular-nums">
                      {new Date(a.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span className={`text-xs font-semibold ${color}`}>{a.status}</span>
                    {a.notes && <span className="text-xs text-slate-400 truncate ml-auto">{a.notes}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Quick links */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Quick Access</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/school/${slug}/student/resources`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Learning Resources
          </Link>
          <Link
            href={`/school/${slug}/student/assignments`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <ClipboardList className="w-4 h-4" /> Assignments
          </Link>
          <Link
            href={`/school/${slug}/student/results`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <GraduationCap className="w-4 h-4" /> My Results
          </Link>
        </div>
      </div>

    </div>
  );
}

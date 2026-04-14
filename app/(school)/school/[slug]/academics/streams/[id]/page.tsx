import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Users, User, Calendar,
  ChevronRight, GraduationCap, ClipboardList,
} from "lucide-react";

// ── Data fetching ─────────────────────────────────────────────────────────

async function getStreamDetail(streamId: string) {
  return db.stream.findUnique({
    where: { id: streamId },
    include: {
      classYear: {
        include: {
          classTemplate: true,
          academicYear: {
            include: { terms: { orderBy: { termNumber: "asc" } } },
          },
        },
      },
      classHead: {
        select: { id: true, firstName: true, lastName: true, staffNo: true },
      },
      streamSubjects: {
        where:   { isActive: true },
        include: {
          subject: { select: { id: true, name: true, code: true, category: true } },
          term:    { select: { id: true, name: true, termNumber: true, isActive: true } },
          teacherAssignments: {
            where:   { status: "ACTIVE" },
            include: { teacher: { select: { id: true, firstName: true, lastName: true } } },
          },
          _count: { select: { studentEnrollments: true } },
        },
        orderBy: [
          { term:    { termNumber: "asc" } },
          { subject: { name: "asc" } },
        ],
      },
      enrollments: {
        where:   { status: "ACTIVE" },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, gender: true } },
          term:    { select: { id: true, name: true, isActive: true } },
        },
        orderBy: { student: { firstName: "asc" } },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function StreamDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug, id } = await params;
  const { tab = "subjects" } = await searchParams;

  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const school = await db.school.findUnique({
    where: { slug }, select: { id: true, slug: true },
  });
  if (!school) redirect("/login");

  const stream = await getStreamDetail(id);
  if (!stream) notFound();

  const classYear = stream.classYear;
  const year      = classYear.academicYear.year;
  const terms     = classYear.academicYear.terms;
  const activeTerm = terms.find(t => t.isActive) ?? terms[0];

  // Group stream subjects by term
  const subjectsByTerm = terms.map(term => ({
    term,
    subjects: stream.streamSubjects.filter(ss => ss.term.id === term.id),
  }));

  // Active enrollments
  const activeEnrollments = stream.enrollments.filter(
    e => e.term.id === activeTerm?.id
  );

  const uniqueSubjects = new Set(stream.streamSubjects.map(ss => ss.subjectId)).size;

  const tabs = [
    { key: "subjects",  label: "Subjects",  icon: BookOpen,      count: uniqueSubjects },
    { key: "students",  label: "Students",  icon: Users,         count: activeEnrollments.length },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back */}
      <Link
        href={`/school/${slug}/academics/classes`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Classes
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC2] rounded-xl shadow-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {classYear.classTemplate.name} — {stream.name}
            </h1>
            {classYear.classTemplate.code && (
              <span className="px-2.5 py-1 bg-[#5B9BD5]/10 text-[#5B9BD5] text-sm font-medium rounded-lg">
                {classYear.classTemplate.code}
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Academic Year {year} · {activeTerm?.name ?? ""}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users,         label: "Students",  value: activeEnrollments.length },
          { icon: BookOpen,      label: "Subjects",  value: uniqueSubjects },
          { icon: Calendar,      label: "Terms",     value: terms.length },
          { icon: GraduationCap, label: "Class",     value: classYear.classTemplate.name },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#5B9BD5]/10 rounded-lg">
                <s.icon className="w-4 h-4 text-[#5B9BD5]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-4">
          <div className="flex gap-1">
            {tabs.map(t => (
              <Link
                key={t.key}
                href={`/school/${slug}/academics/streams/${id}?tab=${t.key}`}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-[#5B9BD5] text-[#5B9BD5]"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded">
                  {t.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Subjects Tab */}
        {tab === "subjects" && (
          <div className="p-5 space-y-6">
            {subjectsByTerm.map(({ term, subjects }) => (
              <div key={term.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {term.name}
                  </h3>
                  {term.isActive && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                      Current
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{subjects.length} subjects</span>
                </div>

                {subjects.length === 0 ? (
                  <p className="text-sm text-slate-400 pl-6">No subjects for this term.</p>
                ) : (
                  <div className="space-y-2">
                    {subjects.map(ss => {
                      const teacher = ss.teacherAssignments[0]?.teacher;
                      return (
                        <Link
                          key={ss.id}
                          href={`/school/${slug}/academics/streams/${id}/subjects/${ss.id}`}
                          className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#5B9BD5]/50 hover:bg-[#5B9BD5]/5 dark:hover:bg-[#5B9BD5]/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#5B9BD5]/10 rounded-lg group-hover:bg-[#5B9BD5]/20 transition-colors">
                              <BookOpen className="w-4 h-4 text-[#5B9BD5]" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white group-hover:text-[#5B9BD5] transition-colors">
                                {ss.subject.name}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                {ss.subject.code && (
                                  <span className="text-xs text-slate-400 font-mono">{ss.subject.code}</span>
                                )}
                                <span className="text-xs text-slate-400">
                                  {ss._count.studentEnrollments} students
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {teacher ? (
                              <div className="hidden sm:flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#5B9BD5]/10 flex items-center justify-center">
                                  <User className="w-3 h-3 text-[#5B9BD5]" />
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {teacher.firstName} {teacher.lastName}
                                </span>
                              </div>
                            ) : (
                              <span className="hidden sm:block text-xs text-amber-500">No teacher</span>
                            )}

                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5B9BD5] text-white text-xs font-medium rounded-lg group-hover:bg-[#4A8BC2] transition-colors">
                              <ClipboardList className="w-3.5 h-3.5" />
                              Enter Marks
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Students Tab */}
        {tab === "students" && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeEnrollments.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No students enrolled in {activeTerm?.name}.</p>
              </div>
            ) : activeEnrollments.map(e => (
              <div key={e.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B9BD5]/20 to-[#5B9BD5]/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#5B9BD5]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {e.student.firstName} {e.student.lastName}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">{e.student.admissionNo}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  e.student.gender === "Male"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400"
                }`}>
                  {e.student.gender}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Class Head */}
      {stream.classHead && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Class Head Teacher</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC2] flex items-center justify-center text-white font-semibold text-sm">
              {stream.classHead.firstName[0]}{stream.classHead.lastName[0]}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white text-sm">
                {stream.classHead.firstName} {stream.classHead.lastName}
              </p>
              <p className="text-xs text-slate-500">{stream.classHead.staffNo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

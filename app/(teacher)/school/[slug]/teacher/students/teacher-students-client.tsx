"use client";

import { useState, useMemo } from "react";
import { Search, Users, GraduationCap, BookOpen, ChevronDown } from "lucide-react";
import Image from "next/image";

type Student = {
  enrollmentId: string; studentId: string;
  firstName: string; lastName: string;
  admissionNo: string; photo: string | null;
};

type SubjectGroup = {
  streamSubjectId: string; subjectName: string; subjectCode: string | null;
  paperNumber: number | null; paperName: string | null;
  className: string; streamName: string; streamId: string;
  termName: string; isActiveTerm: boolean;
  students: Student[];
};

interface Props {
  subjects: SubjectGroup[];
  slug: string;
}

function Avatar({ student }: { student: Student }) {
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  if (student.photo) {
    return (
      <Image src={student.photo} alt={`${student.firstName} ${student.lastName}`}
        width={36} height={36}
        className="w-9 h-9 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
}

export default function TeacherStudentsClient({ subjects, slug }: Props) {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [showPast, setShowPast] = useState(false);

  const activeSubjects = subjects.filter(s => s.isActiveTerm);
  const pastSubjects   = subjects.filter(s => !s.isActiveTerm);

  const visibleSubjects = showPast ? subjects : activeSubjects;

  // Build subject filter options
  const filterOptions = [
    { value: "all", label: "All Subjects" },
    ...visibleSubjects.map(s => ({
      value: s.streamSubjectId,
      label: `${s.subjectName}${s.paperNumber ? ` P${s.paperNumber}` : ""} — ${s.className} ${s.streamName}`,
    })),
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return visibleSubjects
      .filter(s => selectedSubject === "all" || s.streamSubjectId === selectedSubject)
      .map(s => ({
        ...s,
        students: s.students.filter(st =>
          !q ||
          st.firstName.toLowerCase().includes(q) ||
          st.lastName.toLowerCase().includes(q) ||
          st.admissionNo.toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.students.length > 0);
  }, [visibleSubjects, selectedSubject, search]);

  const totalStudents = useMemo(() => {
    const seen = new Set<string>();
    filtered.forEach(s => s.students.forEach(st => seen.add(st.studentId)));
    return seen.size;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-5">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-blue-100" />
          <div>
            <h1 className="text-xl font-bold">My Students</h1>
            <p className="text-blue-100 text-sm mt-0.5">
              {totalStudents} student{totalStudents !== 1 ? "s" : ""} across {visibleSubjects.length} subject{visibleSubjects.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or admission no…"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 min-w-[200px]"
        >
          {filterOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* No active subjects */}
      {activeSubjects.length === 0 && !showPast && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
          No subjects assigned for the active term.
        </div>
      )}

      {/* Subject groups */}
      {filtered.length === 0 && (search || selectedSubject !== "all") ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No students match your search</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map(sub => (
            <section key={sub.streamSubjectId}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  {sub.subjectName}
                  {sub.paperNumber && <span className="ml-1 text-slate-400 font-normal">— P{sub.paperNumber}</span>}
                </h2>
                <span className="text-xs text-slate-400">
                  {sub.className} {sub.streamName} · {sub.termName}
                </span>
                <span className="ml-auto text-xs text-slate-400">{sub.students.length} student{sub.students.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                {sub.students.map(st => (
                  <div key={st.enrollmentId} className="flex items-center gap-3 px-4 py-3">
                    <Avatar student={st} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {st.firstName} {st.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{st.admissionNo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Past terms toggle */}
      {pastSubjects.length > 0 && (
        <button
          onClick={() => setShowPast(v => !v)}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showPast ? "rotate-180" : ""}`} />
          <span className="font-medium">{showPast ? "Hide" : "Show"} Previous Terms</span>
          <span className="text-xs text-slate-400">({pastSubjects.length} subject{pastSubjects.length !== 1 ? "s" : ""})</span>
        </button>
      )}
    </div>
  );
}

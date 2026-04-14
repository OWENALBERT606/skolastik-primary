// app/school/[slug]/academics/streams/[streamId]/subjects/[subjectId]/components/subject-overview-tab.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Award,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { removeTeacherFromStreamSubject } from "@/actions/subject-management";
import { toast } from "sonner";
import { useState } from "react";
import AssignTeacherDialog from "./asign-teacher-dialog";

// ── UCE grade bands ────────────────────────────────────────────────────────

const UCE_GRADES = [
  { grade: "D1", label: "Distinction 1", min: 80, max: 100, bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", bar: "bg-emerald-500" },
  { grade: "D2", label: "Distinction 2", min: 70, max: 79,  bg: "bg-green-50 dark:bg-green-900/20",   border: "border-green-200 dark:border-green-800",   text: "text-green-700 dark:text-green-400",   bar: "bg-green-500" },
  { grade: "C3", label: "Credit 3",      min: 65, max: 69,  bg: "bg-teal-50 dark:bg-teal-900/20",     border: "border-teal-200 dark:border-teal-800",     text: "text-teal-700 dark:text-teal-400",     bar: "bg-teal-500" },
  { grade: "C4", label: "Credit 4",      min: 60, max: 64,  bg: "bg-blue-50 dark:bg-blue-900/20",     border: "border-blue-200 dark:border-blue-800",     text: "text-blue-700 dark:text-blue-400",     bar: "bg-blue-500" },
  { grade: "C5", label: "Credit 5",      min: 55, max: 59,  bg: "bg-blue-50 dark:bg-blue-900/20",     border: "border-blue-200 dark:border-blue-800",     text: "text-blue-700 dark:text-blue-400",     bar: "bg-blue-400" },
  { grade: "C6", label: "Credit 6",      min: 50, max: 54,  bg: "bg-blue-50 dark:bg-blue-900/20",     border: "border-blue-200 dark:border-blue-800",     text: "text-blue-600 dark:text-blue-300",     bar: "bg-blue-300" },
  { grade: "P7", label: "Pass 7",        min: 45, max: 49,  bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800", text: "text-yellow-700 dark:text-yellow-400", bar: "bg-yellow-500" },
  { grade: "P8", label: "Pass 8",        min: 40, max: 44,  bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", text: "text-orange-700 dark:text-orange-400", bar: "bg-orange-500" },
  { grade: "F9", label: "Fail 9",        min: 0,  max: 39,  bg: "bg-red-50 dark:bg-red-900/20",       border: "border-red-200 dark:border-red-800",       text: "text-red-700 dark:text-red-400",       bar: "bg-red-500" },
];

function getUCEGradeIndex(mark: number) {
  for (let i = 0; i < UCE_GRADES.length; i++) {
    if (mark >= UCE_GRADES[i].min) return i;
  }
  return UCE_GRADES.length - 1; // F9
}

// ────────────────────────────────────────────────────────────────────────────

interface SubjectOverviewTabProps {
  streamSubject: any;
  teachers:      any[];
  schoolId:      string;
  marksData:     any | null;
  onRefresh:     () => void;
  isTeacher:     boolean;
}

export default function SubjectOverviewTab({
  streamSubject,
  teachers,
  schoolId,
  marksData,
  onRefresh,
  isTeacher,
}: SubjectOverviewTabProps) {
  const [removingTeacher, setRemovingTeacher] = useState<string | null>(null);

  // ── Grade distribution from live studentSummaries ─────────────────────
  const summaries: any[] = marksData?.studentSummaries ?? [];
  const cfg = marksData?.assessmentConfig ?? null;

  // Counts per UCE grade band
  const gradeCounts = new Array(UCE_GRADES.length).fill(0);
  const marksForStats: number[] = [];

  for (const s of summaries) {
    if (s.totalMark !== null) {
      marksForStats.push(s.totalMark);
      gradeCounts[getUCEGradeIndex(s.totalMark)]++;
    }
  }

  const totalWithMarks = marksForStats.length;
  const classAvg = totalWithMarks > 0
    ? marksForStats.reduce((a, b) => a + b, 0) / totalWithMarks
    : null;

  // AOI average and Exam average
  const actualTopicCount = (marksData?.aoiTopics?.length ?? 0) as number;
  const aoiMarks = summaries
    .map((s) => {
      if (!cfg || s.aoiTotal === 0) return null;
      const aoiMaxPoints   = cfg.aoiMaxPoints ?? 3;
      // Use actual topic count so average reflects only topics that exist
      const maxAOIPossible = actualTopicCount * aoiMaxPoints;
      return maxAOIPossible > 0 ? (s.aoiTotal / maxAOIPossible) * (cfg.aoiWeight ?? 20) : null;
    })
    .filter((v): v is number => v !== null);

  const avgAOI = aoiMarks.length > 0
    ? aoiMarks.reduce((a, b) => a + b, 0) / aoiMarks.length
    : null;

  const handleRemoveTeacher = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to remove this teacher?")) return;
    setRemovingTeacher(assignmentId);
    try {
      const result = await removeTeacherFromStreamSubject({ assignmentId, schoolId });
      if (result.ok) { toast.success(result.message); onRefresh(); }
      else toast.error(result.message);
    } catch {
      toast.error("Failed to remove teacher");
    } finally {
      setRemovingTeacher(null);
    }
  };

  const subjectPapers    = streamSubject.subject?.papers || [];
  const hasMultiplePapers = subjectPapers.length > 1;

  return (
    <div className="space-y-6">
      {/* Subject Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#5B9BD5]" />
              Subject Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Subject Name</p>
              <p className="font-semibold text-lg text-slate-900 dark:text-white">
                {streamSubject.subject.name}
              </p>
            </div>

            {streamSubject.subject.code && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Subject Code</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {streamSubject.subject.code}
                </p>
              </div>
            )}

            {streamSubject.subjectPaper && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Paper</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {streamSubject.subjectPaper.name} (Paper {streamSubject.subjectPaper.paperNumber})
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Subject Type</p>
              <Badge
                className={
                  streamSubject.subjectType === "COMPULSORY"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                }
              >
                {streamSubject.subjectType}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Academic Term</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-slate-900 dark:text-white">
                  {streamSubject.term.name}
                </p>
              </div>
            </div>

            {streamSubject.subject.description && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  {streamSubject.subject.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#5B9BD5]" />
                Teachers Assigned
              </CardTitle>
              {!isTeacher && (
                <AssignTeacherDialog
                  streamSubjectId={streamSubject.id}
                  schoolId={schoolId}
                  subjectName={streamSubject.subject.name}
                  onSuccess={onRefresh}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teachers assigned yet</p>
            ) : (
              <div className="space-y-3">
                {streamSubject.teacherAssignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border group"
                  >
                    <div className="p-2 bg-[#5B9BD5]/10 rounded-full">
                      <GraduationCap className="h-4 w-4 text-[#5B9BD5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {assignment.teacher.firstName} {assignment.teacher.lastName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {assignment.teacher.staffNo}
                      </p>
                      {assignment.teacher.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {assignment.teacher.email}
                        </p>
                      )}
                    </div>
                    {!isTeacher && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveTeacher(assignment.id)}
                        disabled={removingTeacher === assignment.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#5B9BD5]" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalWithMarks === 0 ? (
            <p className="text-sm text-muted-foreground">
              No marks entered yet. Go to the Marks Entry tab to start entering marks.
            </p>
          ) : (
            <div className="space-y-6">

              {/* Class averages summary */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px] bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Class Average</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {classAvg !== null ? `${classAvg.toFixed(1)}%` : "—"}
                  </p>
                </div>
                {avgAOI !== null && (
                  <div className="flex-1 min-w-[140px] bg-blue-50 dark:bg-blue-950/30 rounded-lg px-4 py-3 border border-blue-100 dark:border-blue-900">
                    <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      Avg AOI (/{cfg?.aoiWeight ?? 20})
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                      {avgAOI.toFixed(1)}
                    </p>
                  </div>
                )}
                <div className="flex-1 min-w-[140px] bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Students with Marks</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {totalWithMarks}
                    <span className="text-sm font-normal text-slate-400 ml-1">
                      / {streamSubject.studentEnrollments.length}
                    </span>
                  </p>
                </div>
              </div>

              {/* UCE Grade Distribution grid */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  UCE Grade Distribution
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                  {UCE_GRADES.map((g, i) => (
                    <div
                      key={g.grade}
                      className={`text-center p-2.5 rounded-lg border ${g.bg} ${g.border}`}
                    >
                      <p className={`text-lg font-bold ${g.text}`}>{gradeCounts[i]}</p>
                      <p className={`text-xs font-semibold ${g.text}`}>{g.grade}</p>
                      <p className="text-xs text-slate-400 leading-tight mt-0.5">
                        {g.min}–{g.max}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance distribution bars */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Distribution
                </p>
                <div className="space-y-2">
                  {UCE_GRADES.map((g, i) => {
                    if (gradeCounts[i] === 0) return null;
                    const pct = Math.round((gradeCounts[i] / totalWithMarks) * 100);
                    return (
                      <div key={g.grade}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600 dark:text-slate-400 w-8">{g.grade}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 ml-2">{g.label}</span>
                          <span className={`text-sm font-medium ${g.text}`}>
                            {gradeCounts[i]} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`${g.bar} h-2 rounded-full transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject Papers (if multi-paper) */}
      {hasMultiplePapers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#5B9BD5]" />
              Subject Papers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {subjectPapers.map((paper: any) => (
                <div
                  key={paper.id}
                  className={`p-4 rounded-lg border ${
                    paper.id === streamSubject.subjectPaper?.id
                      ? "bg-[#5B9BD5]/10 border-[#5B9BD5]"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{paper.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Paper {paper.paperNumber}</p>
                    </div>
                    {paper.id === streamSubject.subjectPaper?.id && (
                      <Badge className="bg-[#5B9BD5] text-white">Current</Badge>
                    )}
                  </div>
                  {paper.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {paper.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

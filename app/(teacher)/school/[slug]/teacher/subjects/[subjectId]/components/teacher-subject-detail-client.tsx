"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button }                from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Users, GraduationCap, Award, Lock } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubjectOverviewTab from "@/app/(school)/school/[slug]/academics/streams/[id]/subjects/[subjectId]/components/subject-overview-tab";
import SubjectStudentsTab from "@/app/(school)/school/[slug]/academics/streams/[id]/subjects/[subjectId]/components/subject-students-tab";
import SubjectMarksTab   from "@/app/(school)/school/[slug]/academics/streams/[id]/subjects/[subjectId]/components/subject-marks-tab";
import { getStreamSubjectMarksData } from "@/actions/stream-subject-marks";

interface TeacherSubjectDetailClientProps {
  streamSubject:    any;
  schoolId:         string;
  schoolSlug:       string;
  streamId:         string;
  userId:           string;
  totalStudents:    number;
  withResults:      number;
  averageMark:      number;
  uniqueTeachers:   any[];
  isLocked:         boolean;
  initialMarksData: any;
}

export default function TeacherSubjectDetailClient({
  streamSubject,
  schoolId,
  schoolSlug,
  streamId,
  userId,
  totalStudents,
  withResults,
  averageMark,
  uniqueTeachers,
  isLocked,
  initialMarksData,
}: TeacherSubjectDetailClientProps) {
  const router = useRouter();

  const [marksData, setMarksData]       = useState<any>(initialMarksData ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMarksData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await getStreamSubjectMarksData(streamSubject.id);
      if (result.ok && result.data) setMarksData(result.data);
    } finally {
      setIsRefreshing(false);
    }
  }, [streamSubject.id]);

  const handleRefresh = () => router.refresh();

  if (!streamSubject || !streamSubject.subject) {
    return (
      <div className="p-6">
        <p className="text-red-600">No subject data found</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" asChild>
          <Link href={`/school/${schoolSlug}/teacher/dashboard`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            {streamSubject.subject.name}
            {streamSubject.subjectPaper && (
              <span className="text-base sm:text-xl text-muted-foreground ml-2">
                — {streamSubject.subjectPaper.name}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {streamSubject.stream?.name} ·{" "}
            {streamSubject.stream?.classYear?.classTemplate?.name} ·{" "}
            {streamSubject.term?.name}
          </p>
        </div>
      </div>

      {/* Lock status banner */}
      {isLocked && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 mb-4">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Mark entry is locked</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              This class/term is currently locked. Ask your school administrator to unlock it.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              Enrolled Students
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {totalStudents}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active enrollments</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Award className="h-4 w-4 shrink-0" />
              With Results
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-400">
              {withResults}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {totalStudents > 0
                ? `${Math.round((withResults / totalStudents) * 100)}%`
                : "0%"}{" "}
              complete
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0" />
              Average Mark
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-400">
              {Math.round(averageMark)}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Class average</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 shrink-0" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-orange-700 dark:text-orange-400">
              {uniqueTeachers.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            <span className="hidden sm:inline">Students ({totalStudents})</span>
            <span className="sm:hidden">Students</span>
          </TabsTrigger>
          <TabsTrigger
            value="marks"
            className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            <span className="hidden sm:inline">Marks Entry</span>
            <span className="sm:hidden">Marks</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SubjectOverviewTab
            streamSubject={streamSubject}
            teachers={uniqueTeachers}
            schoolId={schoolId}
            marksData={marksData}
            onRefresh={handleRefresh}
            isTeacher={true}
          />
        </TabsContent>

        <TabsContent value="students">
          <SubjectStudentsTab
            streamSubject={streamSubject}
            schoolSlug={schoolSlug}
            schoolId={schoolId}
            marksData={marksData}
            onRefresh={handleRefresh}
            isTeacher={true}
          />
        </TabsContent>

        <TabsContent value="marks">
          <SubjectMarksTab
            streamSubject={streamSubject}
            schoolId={schoolId}
            userId={userId}
            marksData={marksData}
            isRefreshing={isRefreshing}
            onRefresh={refreshMarksData}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

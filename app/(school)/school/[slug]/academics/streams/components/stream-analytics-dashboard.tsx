// app/school/[slug]/academics/streams/[id]/components/stream-analytics-dashboard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  User as UserIcon,
  TrendingUp,
  Award,
  Target,
} from "lucide-react";
import OverviewSection from "./over-view-section";
import PerformanceSection from "./perfomance-section";
import SubjectsSection from "./subjects-section";
import StudentsSection from "./students-section";
import TeachersSection from "./teachers-section";
import TrendsSection from "./trends-section";

interface StreamAnalyticsDashboardProps {
  analytics: any;
}

export default function StreamAnalyticsDashboard({
  analytics,
}: StreamAnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stream Header - Print friendly */}
      <Card className="print-avoid-break">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">
                {analytics.stream.name}
              </CardTitle>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {analytics.stream.className} - {analytics.stream.academicYear}
              </p>
            </div>
            {analytics.stream.classHead && (
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Class Head
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {analytics.stream.classHead.firstName}{" "}
                  {analytics.stream.classHead.lastName}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {analytics.stream.classHead.staffNo}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics - Enhanced with colors */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print-avoid-break">
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Students
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {analytics.overview.totalStudents}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {analytics.overview.maleStudents} male,{" "}
              {analytics.overview.femaleStudents} female
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Subjects
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {analytics.overview.uniqueSubjects}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {analytics.overview.totalSubjects} total assignments
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Teachers
            </CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <UserIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {analytics.overview.totalTeachers}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Across {analytics.overview.terms} term(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Avg Performance
            </CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {analytics.performanceOverTime.length > 0
                ? Math.round(
                    analytics.performanceOverTime.reduce(
                      (sum: number, term: any) => sum + term.averageMark,
                      0
                    ) / analytics.performanceOverTime.length
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Across all subjects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg no-print">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger
            value="subjects"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            Subjects
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            Students
          </TabsTrigger>
          <TabsTrigger
            value="teachers"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            Teachers
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 print-show-all">
          <div className="print-avoid-break">
            <OverviewSection analytics={analytics} />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 print-show-all">
          <div className="page-break print-avoid-break">
            <PerformanceSection analytics={analytics} />
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4 print-show-all">
          <div className="page-break print-avoid-break">
            <SubjectsSection analytics={analytics} />
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4 print-show-all">
          <div className="page-break print-avoid-break">
            <StudentsSection analytics={analytics} />
          </div>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4 print-show-all">
          <div className="page-break print-avoid-break">
            <TeachersSection analytics={analytics} />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 print-show-all">
          <div className="page-break print-avoid-break">
            <TrendsSection analytics={analytics} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
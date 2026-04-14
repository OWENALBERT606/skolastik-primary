// // app/school/[slug]/academics/streams/[id]/components/analytics/overview-section.tsx
// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Users, Calendar, BookOpen, Award } from "lucide-react";

// export default function OverviewSection({ analytics }: { analytics: any }) {
//   return (
//     <div className="space-y-6">
//       {/* Add print-only header */}
//       <div className="print-only mb-4">
//         <h2 className="text-xl font-bold">Overview Section</h2>
//       </div>

//       {/* Gender Distribution */}
//       <Card className="print-avoid-break">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Users className="h-5 w-5 text-[#5B9BD5]" />
//             Gender Distribution
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
//                 <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
//                   Male Students
//                 </p>
//                 <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
//                   {analytics.overview.maleStudents}
//                 </p>
//                 <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
//                   {analytics.overview.totalStudents > 0
//                     ? Math.round(
//                         (analytics.overview.maleStudents /
//                           analytics.overview.totalStudents) *
//                           100
//                       )
//                     : 0}
//                   % of total
//                 </p>
//               </div>

//               <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
//                 <p className="text-sm text-pink-600 dark:text-pink-400 mb-1">
//                   Female Students
//                 </p>
//                 <p className="text-3xl font-bold text-pink-700 dark:text-pink-400">
//                   {analytics.overview.femaleStudents}
//                 </p>
//                 <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
//                   {analytics.overview.totalStudents > 0
//                     ? Math.round(
//                         (analytics.overview.femaleStudents /
//                           analytics.overview.totalStudents) *
//                           100
//                       )
//                     : 0}
//                   % of total
//                 </p>
//               </div>
//             </div>

//             {/* Visual bar */}
//             <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
//               <div className="flex h-full">
//                 <div
//                   className="bg-blue-500"
//                   style={{
//                     width: `${
//                       analytics.overview.totalStudents > 0
//                         ? (analytics.overview.maleStudents /
//                             analytics.overview.totalStudents) *
//                           100
//                         : 0
//                     }%`,
//                   }}
//                 />
//                 <div
//                   className="bg-pink-500"
//                   style={{
//                     width: `${
//                       analytics.overview.totalStudents > 0
//                         ? (analytics.overview.femaleStudents /
//                             analytics.overview.totalStudents) *
//                           100
//                         : 0
//                     }%`,
//                   }}
//                 />
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Rest of your overview section content */}
//       {/* Add print-avoid-break class to each card */}
//     </div>
//   );
// }


// app/school/[slug]/academics/streams/[id]/components/analytics/overview-section.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FileText, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OverviewSection({ analytics }: { analytics: any }) {
  // ✅ Calculate multi-paper statistics
  const totalPapers = analytics.overview.totalSubjects || 0;
  const uniqueSubjects = analytics.overview.uniqueSubjects || 0;
  const multiPaperCount = totalPapers - uniqueSubjects;
  const hasMultiplePapers = multiPaperCount > 0;

  return (
    <div className="space-y-6">
      {/* Print-only header */}
      <div className="print-only mb-4">
        <h2 className="text-xl font-bold">Overview Section</h2>
      </div>

      {/* Gender Distribution */}
      <Card className="print-avoid-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#5B9BD5]" />
            Gender Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                  Male Students
                </p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {analytics.overview.maleStudents}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {analytics.overview.totalStudents > 0
                    ? Math.round(
                        (analytics.overview.maleStudents /
                          analytics.overview.totalStudents) *
                          100
                      )
                    : 0}
                  % of total
                </p>
              </div>

              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                <p className="text-sm text-pink-600 dark:text-pink-400 mb-1">
                  Female Students
                </p>
                <p className="text-3xl font-bold text-pink-700 dark:text-pink-400">
                  {analytics.overview.femaleStudents}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {analytics.overview.totalStudents > 0
                    ? Math.round(
                        (analytics.overview.femaleStudents /
                          analytics.overview.totalStudents) *
                          100
                      )
                    : 0}
                  % of total
                </p>
              </div>
            </div>

            {/* Visual bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
              <div className="flex h-full">
                <div
                  className="bg-blue-500"
                  style={{
                    width: `${
                      analytics.overview.totalStudents > 0
                        ? (analytics.overview.maleStudents /
                            analytics.overview.totalStudents) *
                          100
                        : 0
                    }%`,
                  }}
                />
                <div
                  className="bg-pink-500"
                  style={{
                    width: `${
                      analytics.overview.totalStudents > 0
                        ? (analytics.overview.femaleStudents /
                            analytics.overview.totalStudents) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ ENHANCED: Subject Enrollment Overview with Multi-Paper Stats */}
      <Card className="print-avoid-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#5B9BD5]" />
            Subject Enrollment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Unique Subjects
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                {uniqueSubjects}
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Total Papers
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                {totalPapers}
              </p>
              {hasMultiplePapers && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {multiPaperCount} multi-paper
                </p>
              )}
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  Enrollments
                </p>
              </div>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                {analytics.overview.totalSubjectEnrollments || 0}
              </p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Avg per Student
                </p>
              </div>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                {analytics.overview.totalStudents > 0
                  ? Math.round(
                      (analytics.overview.totalSubjectEnrollments || 0) /
                        analytics.overview.totalStudents
                    )
                  : 0}
              </p>
            </div>
          </div>

          {/* ✅ Multi-Paper Info Card */}
          {hasMultiplePapers && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                    Multi-Paper Subjects
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    This stream has {multiPaperCount} multi-paper subject(s), resulting in{" "}
                    {totalPapers} total paper assignments across {uniqueSubjects} unique subjects.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Term Distribution with Paper Info */}
      <Card className="print-avoid-break">
        <CardHeader>
          <CardTitle>Term Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.overview.termDistribution?.map((term: any) => (
              <div
                key={term.termId}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {term.termName}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                    <span>{term.subjects} subjects</span>
                    {term.totalPapers > term.subjects && (
                      <>
                        <span>•</span>
                        <span>{term.totalPapers} papers</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{term.enrollments} enrollments</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{term.subjects} subjects</Badge>
                  {term.totalPapers > term.subjects && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {term.totalPapers} papers
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
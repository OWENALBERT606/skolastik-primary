// // app/school/[slug]/academics/streams/[streamId]/subjects/[subjectId]/components/subject-overview-tab.tsx
// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
//   BookOpen,
//   GraduationCap,
//   Calendar,
//   FileText,
//   Award,
//   TrendingUp,
// } from "lucide-react";

// interface SubjectOverviewTabProps {
//   streamSubject: any;
//   teachers: any[];
// }

// export default function SubjectOverviewTab({
//   streamSubject,
//   teachers,
// }: SubjectOverviewTabProps) {
//   // Calculate grade distribution
//   const gradeDistribution = streamSubject.studentEnrollments.reduce(
//     (acc: any, se: any) => {
//       const mark = se.subjectResult?.totalMark || 0;
//       if (mark >= 80) acc.distinction++;
//       else if (mark >= 70) acc.credit++;
//       else if (mark >= 60) acc.merit++;
//       else if (mark >= 50) acc.pass++;
//       else if (mark > 0) acc.fail++;
//       return acc;
//     },
//     { distinction: 0, credit: 0, merit: 0, pass: 0, fail: 0 }
//   );

//   const totalWithMarks = Object.values(gradeDistribution).reduce(
//     (sum: any, count: any) => sum + count,
//     0
//   ) as number;

//   return (
//     <div className="space-y-6">
//       {/* Subject Information */}
//       <div className="grid gap-4 md:grid-cols-2">
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <BookOpen className="h-5 w-5 text-[#5B9BD5]" />
//               Subject Information
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div>
//               <p className="text-sm text-slate-600 dark:text-slate-400">
//                 Subject Name
//               </p>
//               <p className="font-semibold text-lg text-slate-900 dark:text-white">
//                 {streamSubject.subject.name}
//               </p>
//             </div>

//             {streamSubject.subject.code && (
//               <div>
//                 <p className="text-sm text-slate-600 dark:text-slate-400">
//                   Subject Code
//                 </p>
//                 <p className="font-medium text-slate-900 dark:text-white">
//                   {streamSubject.subject.code}
//                 </p>
//               </div>
//             )}

//             {streamSubject.subjectPaper && (
//               <div>
//                 <p className="text-sm text-slate-600 dark:text-slate-400">
//                   Paper
//                 </p>
//                 <p className="font-medium text-slate-900 dark:text-white">
//                   {streamSubject.subjectPaper.name} (Paper{" "}
//                   {streamSubject.subjectPaper.paperNumber})
//                 </p>
//               </div>
//             )}

//             <div>
//               <p className="text-sm text-slate-600 dark:text-slate-400">
//                 Subject Type
//               </p>
//               <Badge
//                 className={
//                   streamSubject.subjectType === "COMPULSORY"
//                     ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
//                     : streamSubject.subjectType === "OPTIONAL"
//                     ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
//                     : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
//                 }
//               >
//                 {streamSubject.subjectType}
//               </Badge>
//             </div>

//             <div>
//               <p className="text-sm text-slate-600 dark:text-slate-400">
//                 Academic Term
//               </p>
//               <div className="flex items-center gap-2 mt-1">
//                 <Calendar className="h-4 w-4 text-muted-foreground" />
//                 <p className="font-medium text-slate-900 dark:text-white">
//                   {streamSubject.term.name}
//                 </p>
//               </div>
//             </div>

//             {streamSubject.subject.description && (
//               <div>
//                 <p className="text-sm text-slate-600 dark:text-slate-400">
//                   Description
//                 </p>
//                 <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
//                   {streamSubject.subject.description}
//                 </p>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <GraduationCap className="h-5 w-5 text-[#5B9BD5]" />
//               Teachers Assigned
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             {teachers.length === 0 ? (
//               <p className="text-sm text-muted-foreground">
//                 No teachers assigned yet
//               </p>
//             ) : (
//               <div className="space-y-4">
//                 {teachers.map((teacher) => (
//                   <div
//                     key={teacher.id}
//                     className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
//                   >
//                     <div className="p-2 bg-[#5B9BD5]/10 rounded-full">
//                       <GraduationCap className="h-4 w-4 text-[#5B9BD5]" />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium text-slate-900 dark:text-white">
//                         {teacher.firstName} {teacher.lastName}
//                       </p>
//                       <p className="text-sm text-slate-600 dark:text-slate-400">
//                         {teacher.staffNo}
//                       </p>
//                       {teacher.email && (
//                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
//                           {teacher.email}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Performance Overview */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <TrendingUp className="h-5 w-5 text-[#5B9BD5]" />
//             Performance Overview
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {totalWithMarks === 0 ? (
//             <p className="text-sm text-muted-foreground">
//               No marks entered yet
//             </p>
//           ) : (
//             <div className="space-y-4">
//               {/* Grade Distribution */}
//               <div>
//                 <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
//                   Grade Distribution
//                 </p>
//                 <div className="grid grid-cols-5 gap-3">
//                   <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
//                     <Award className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
//                     <p className="text-2xl font-bold text-green-700 dark:text-green-400">
//                       {gradeDistribution.distinction}
//                     </p>
//                     <p className="text-xs text-green-600 dark:text-green-400">
//                       Distinction
//                     </p>
//                     <p className="text-xs text-slate-500 dark:text-slate-400">
//                       80-100%
//                     </p>
//                   </div>

//                   <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
//                     <Award className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
//                     <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
//                       {gradeDistribution.credit}
//                     </p>
//                     <p className="text-xs text-blue-600 dark:text-blue-400">
//                       Credit
//                     </p>
//                     <p className="text-xs text-slate-500 dark:text-slate-400">
//                       70-79%
//                     </p>
//                   </div>

//                   <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
//                     <Award className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
//                     <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
//                       {gradeDistribution.merit}
//                     </p>
//                     <p className="text-xs text-blue-600 dark:text-blue-400">
//                       Merit
//                     </p>
//                     <p className="text-xs text-slate-500 dark:text-slate-400">
//                       60-69%
//                     </p>
//                   </div>

//                   <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
//                     <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
//                     <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
//                       {gradeDistribution.pass}
//                     </p>
//                     <p className="text-xs text-yellow-600 dark:text-yellow-400">
//                       Pass
//                     </p>
//                     <p className="text-xs text-slate-500 dark:text-slate-400">
//                       50-59%
//                     </p>
//                   </div>

//                   <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
//                     <Award className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
//                     <p className="text-2xl font-bold text-red-700 dark:text-red-400">
//                       {gradeDistribution.fail}
//                     </p>
//                     <p className="text-xs text-red-600 dark:text-red-400">
//                       Fail
//                     </p>
//                     <p className="text-xs text-slate-500 dark:text-slate-400">
//                       0-49%
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Performance Bars */}
//               <div>
//                 <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
//                   Performance Distribution
//                 </p>
//                 <div className="space-y-2">
//                  {(Object.entries(gradeDistribution) as [string, number][]).map(([grade, count]) => {
//   const percentage =
//     totalWithMarks > 0
//       ? Math.round((count / totalWithMarks) * 100)
//       : 0;
  
//   const colors: Record<string, { bg: string; text: string }> = {
//     distinction: {
//       bg: "bg-green-500",
//       text: "text-green-700 dark:text-green-400",
//     },
//     credit: {
//       bg: "bg-blue-500",
//       text: "text-blue-700 dark:text-blue-400",
//     },
//     merit: {
//       bg: "bg-blue-500",
//       text: "text-blue-700 dark:text-blue-400",
//     },
//     pass: {
//       bg: "bg-yellow-500",
//       text: "text-yellow-700 dark:text-yellow-400",
//     },
//     fail: {
//       bg: "bg-red-500",
//       text: "text-red-700 dark:text-red-400",
//     },
//   };

//   return (
//     <div key={grade}>
//       <div className="flex items-center justify-between mb-1">
//         <span className="text-sm capitalize text-slate-600 dark:text-slate-400">
//           {grade}
//         </span>
//         <span
//           className={`text-sm font-medium ${colors[grade].text}`}
//         >
//           {count} ({percentage}%)
//         </span>
//       </div>
//       <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
//         <div
//           className={`${colors[grade].bg} h-2 rounded-full transition-all`}
//           style={{ width: `${percentage}%` }}
//         />
//       </div>
//     </div>
//   );
// })}
//                 </div>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Subject Papers (if multi-paper) */}
//       {streamSubject.subject.papers.length > 1 && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <FileText className="h-5 w-5 text-[#5B9BD5]" />
//               Subject Papers
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid gap-3 md:grid-cols-2">
//               {streamSubject.subject.papers.map((paper: any) => (
//                 <div
//                   key={paper.id}
//                   className={`p-4 rounded-lg border ${
//                     paper.id === streamSubject.subjectPaper?.id
//                       ? "bg-[#5B9BD5]/10 border-[#5B9BD5]"
//                       : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
//                   }`}
//                 >
//                   <div className="flex items-start justify-between">
//                     <div>
//                       <p className="font-semibold text-slate-900 dark:text-white">
//                         {paper.name}
//                       </p>
//                       <p className="text-sm text-slate-600 dark:text-slate-400">
//                         Paper {paper.paperNumber}
//                       </p>
//                     </div>
//                     {paper.id === streamSubject.subjectPaper?.id && (
//                       <Badge className="bg-[#5B9BD5] text-white">
//                         Current
//                       </Badge>
//                     )}
//                   </div>
//                   {paper.description && (
//                     <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
//                       {paper.description}
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }




// app/school/[slug]/academics/streams/[streamId]/subjects/[subjectId]/components/subject-overview-tab.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Award,
  TrendingUp,
  Layers,
  Hash,
} from "lucide-react";

interface SubjectOverviewTabProps {
  streamSubject: any;
  teachers: any[];
}

export default function SubjectOverviewTab({
  streamSubject,
  teachers,
}: SubjectOverviewTabProps) {
  // Calculate grade distribution
  const gradeDistribution = streamSubject.studentEnrollments.reduce(
    (acc: any, se: any) => {
      const mark = se.subjectResult?.totalMark || 0;
      if (mark >= 80) acc.distinction++;
      else if (mark >= 70) acc.credit++;
      else if (mark >= 60) acc.merit++;
      else if (mark >= 50) acc.pass++;
      else if (mark > 0) acc.fail++;
      return acc;
    },
    { distinction: 0, credit: 0, merit: 0, pass: 0, fail: 0 }
  );

  const totalWithMarks = Object.values(gradeDistribution).reduce(
    (sum: any, count: any) => sum + count,
    0
  ) as number;

  // ✅ Check if subject has multiple papers
  const hasMultiplePapers = streamSubject.subject.papers?.length > 1;
  const totalPapers = streamSubject.subject.papers?.length || 1;

  return (
    <div className="space-y-6">
      {/* ✅ ENHANCED: Subject Information with Paper Details */}
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
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Subject Name
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-semibold text-lg text-slate-900 dark:text-white">
                  {streamSubject.subject.name}
                </p>
                {hasMultiplePapers && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <Layers className="h-3 w-3 mr-1" />
                    {totalPapers} Papers
                  </Badge>
                )}
              </div>
            </div>

            {streamSubject.subject.code && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Subject Code
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {streamSubject.subject.code}
                </p>
              </div>
            )}

            {/* ✅ ENHANCED: Current Paper Info */}
            {streamSubject.subjectPaper && (
              <div className="p-3 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 rounded-lg border border-[#5B9BD5]/20">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Current Paper
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {streamSubject.subjectPaper.name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Paper {streamSubject.subjectPaper.paperNumber}
                    </Badge>
                    {streamSubject.subjectPaper.paperCode && (
                      <Badge
                        variant="outline"
                        className="font-mono text-xs bg-white dark:bg-slate-800"
                      >
                        {streamSubject.subjectPaper.paperCode}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Max Marks:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        {streamSubject.subjectPaper.maxMarks}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Weight:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        {streamSubject.subjectPaper.weight}x
                      </span>
                    </div>
                  </div>
                  {streamSubject.subjectPaper.aoiCount > 0 && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <Hash className="h-3 w-3 inline mr-1" />
                      {streamSubject.subjectPaper.aoiCount} AOI units
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Subject Type
              </p>
              <Badge
                className={
                  streamSubject.subjectType === "COMPULSORY"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : streamSubject.subjectType === "OPTIONAL"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                }
              >
                {streamSubject.subjectType}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Academic Term
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-slate-900 dark:text-white">
                  {streamSubject.term.name}
                </p>
              </div>
            </div>

            {streamSubject.subject.description && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Description
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  {streamSubject.subject.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#5B9BD5]" />
              Teachers Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No teachers assigned yet
              </p>
            ) : (
              <div className="space-y-4">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="p-2 bg-[#5B9BD5]/10 rounded-full">
                      <GraduationCap className="h-4 w-4 text-[#5B9BD5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {teacher.firstName} {teacher.lastName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {teacher.staffNo}
                      </p>
                      {teacher.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {teacher.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview - existing code stays the same */}
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
              No marks entered yet
            </p>
          ) : (
            <div className="space-y-4">
              {/* Grade Distribution */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Grade Distribution
                </p>
                <div className="grid grid-cols-5 gap-3">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {gradeDistribution.distinction}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Distinction
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      80-100%
                    </p>
                  </div>

                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Award className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {gradeDistribution.credit}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Credit
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      70-79%
                    </p>
                  </div>

                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Award className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {gradeDistribution.merit}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Merit
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      60-69%
                    </p>
                  </div>

                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                      {gradeDistribution.pass}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Pass
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      50-59%
                    </p>
                  </div>

                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <Award className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {gradeDistribution.fail}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Fail
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      0-49%
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Bars - existing code */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Performance Distribution
                </p>
                <div className="space-y-2">
                  {(Object.entries(gradeDistribution) as [string, number][]).map(([grade, count]) => {
                    const percentage =
                      totalWithMarks > 0
                        ? Math.round((count / totalWithMarks) * 100)
                        : 0;
                    
                    const colors: Record<string, { bg: string; text: string }> = {
                      distinction: {
                        bg: "bg-green-500",
                        text: "text-green-700 dark:text-green-400",
                      },
                      credit: {
                        bg: "bg-blue-500",
                        text: "text-blue-700 dark:text-blue-400",
                      },
                      merit: {
                        bg: "bg-blue-500",
                        text: "text-blue-700 dark:text-blue-400",
                      },
                      pass: {
                        bg: "bg-yellow-500",
                        text: "text-yellow-700 dark:text-yellow-400",
                      },
                      fail: {
                        bg: "bg-red-500",
                        text: "text-red-700 dark:text-red-400",
                      },
                    };

                    return (
                      <div key={grade}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm capitalize text-slate-600 dark:text-slate-400">
                            {grade}
                          </span>
                          <span className={`text-sm font-medium ${colors[grade].text}`}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`${colors[grade].bg} h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
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

      {/* ✅ ENHANCED: Subject Papers Display */}
      {hasMultiplePapers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#5B9BD5]" />
              All Subject Papers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {streamSubject.subject.papers.map((paper: any) => {
                const isCurrent = paper.id === streamSubject.subjectPaper?.id;
                
                return (
                  <div
                    key={paper.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isCurrent
                        ? "bg-[#5B9BD5]/10 border-[#5B9BD5] dark:bg-[#5B9BD5]/20"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {paper.name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Paper {paper.paperNumber}
                          </Badge>
                          {paper.paperCode && (
                            <Badge
                              variant="outline"
                              className="font-mono text-xs bg-white dark:bg-slate-900"
                            >
                              {paper.paperCode}
                            </Badge>
                          )}
                        </div>
                        {isCurrent && (
                          <Badge className="bg-[#5B9BD5] text-white text-xs mb-2">
                            Current Paper
                          </Badge>
                        )}
                      </div>
                    </div>
                    {paper.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {paper.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Max:</span>
                        <span className="ml-1 font-semibold text-slate-900 dark:text-white">
                          {paper.maxMarks}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Weight:</span>
                        <span className="ml-1 font-semibold text-slate-900 dark:text-white">
                          {paper.weight}x
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={paper.isActive ? "default" : "secondary"}
                      className={`mt-2 text-xs ${
                        paper.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : ""
                      }`}
                    >
                      {paper.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
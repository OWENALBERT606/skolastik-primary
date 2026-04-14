// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import { BookOpen, Users, TrendingUp } from "lucide-react";

// export default function SubjectsSection({ analytics }: { analytics: any }) {
//   return (
//     <>
//       {/* Subject Enrollment Overview */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Subject Enrollment & Performance</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Subject</TableHead>
//                 <TableHead>Paper/Term</TableHead>
//                 <TableHead>Enrolled</TableHead>
//                 <TableHead>With Results</TableHead>
//                 <TableHead>Avg Mark</TableHead>
//                 <TableHead>Teachers</TableHead>
//                 <TableHead>Completion</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {analytics.subjectStats.map((subject: any) => {
//                 const completionRate =
//                   (subject.withResults / subject.totalEnrolled) * 100;

//                 return (
//                   <TableRow key={`${subject.subjectId}-${subject.termName}`}>
//                     <TableCell className="font-medium">
//                       <div>
//                         <p>{subject.subjectName}</p>
//                         {subject.subjectCode && (
//                           <p className="text-xs text-muted-foreground">
//                             {subject.subjectCode}
//                           </p>
//                         )}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="space-y-1">
//                         {subject.paperName && (
//                           <Badge variant="outline">{subject.paperName}</Badge>
//                         )}
//                         <p className="text-xs text-muted-foreground">
//                           {subject.termName}
//                         </p>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-1">
//                         <Users className="h-4 w-4 text-muted-foreground" />
//                         {subject.totalEnrolled}
//                       </div>
//                     </TableCell>
//                     <TableCell>{subject.withResults}</TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <span
//                           className={`font-bold ${
//                             subject.averageMark >= 75
//                               ? "text-green-600"
//                               : subject.averageMark >= 65
//                               ? "text-blue-600"
//                               : subject.averageMark >= 50
//                               ? "text-yellow-600"
//                               : "text-red-600"
//                           }`}
//                         >
//                           {subject.averageMark}%
//                         </span>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="space-y-1">
//                         {subject.teachers.slice(0, 2).map((teacher: any) => (
//                           <p
//                             key={teacher.id}
//                             className="text-xs text-muted-foreground"
//                           >
//                             {teacher.firstName} {teacher.lastName}
//                           </p>
//                         ))}
//                         {subject.teachers.length > 2 && (
//                           <p className="text-xs text-muted-foreground">
//                             +{subject.teachers.length - 2} more
//                           </p>
//                         )}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="space-y-1">
//                         <Progress value={completionRate} className="h-2" />
//                         <p className="text-xs text-muted-foreground">
//                           {completionRate.toFixed(0)}%
//                         </p>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 );
//               })}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Gender Distribution by Subject */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Gender Distribution by Subject</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={400}>
//             <BarChart data={analytics.genderBySubject}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="subjectName" angle={-45} textAnchor="end" height={100} />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="male" fill="#3b82f6" name="Male" />
//               <Bar dataKey="female" fill="#ec4899" name="Female" />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       {/* Subject Summary Cards */}
//       <div className="grid gap-4 md:grid-cols-3">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Most Popular Subject
//             </CardTitle>
//             <BookOpen className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             {analytics.subjectPerformanceComparison.length > 0 && (
//               <>
//                 <div className="text-2xl font-bold">
//                   {
//                     [...analytics.subjectPerformanceComparison].sort(
//                       (a, b) => b.totalEnrolled - a.totalEnrolled
//                     )[0].subjectName
//                   }
//                 </div>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   {
//                     [...analytics.subjectPerformanceComparison].sort(
//                       (a, b) => b.totalEnrolled - a.totalEnrolled
//                     )[0].totalEnrolled
//                   }{" "}
//                   students enrolled
//                 </p>
//               </>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Best Performing
//             </CardTitle>
//             <TrendingUp className="h-4 w-4 text-green-500" />
//           </CardHeader>
//           <CardContent>
//             {analytics.subjectPerformanceComparison.length > 0 && (
//               <>
//                 <div className="text-2xl font-bold">
//                   {
//                     [...analytics.subjectPerformanceComparison].sort(
//                       (a, b) => b.averageMark - a.averageMark
//                     )[0].subjectName
//                   }
//                 </div>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   {
//                     [...analytics.subjectPerformanceComparison].sort(
//                       (a, b) => b.averageMark - a.averageMark
//                     )[0].averageMark
//                   }
//                   % average
//                 </p>
//               </>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Needs Attention
//             </CardTitle>
//             <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
//           </CardHeader>
//           <CardContent>
//             {analytics.subjectPerformanceComparison.length > 0 && (
//               <>
//                 <div className="text-2xl font-bold">
//                   {
//                     [...analytics.subjectPerformanceComparison].sort(
//                       (a, b) => a.averageMark - b.averageMark
//                     )[0].subjectName
//                   }
//                 </div>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   {
//                     [...analytics.subjectPerformanceComparison].sort(
//                       (a, b) => a.averageMark - b.averageMark
//                     )[0].averageMark
//                   }
//                   % average
//                 </p>
//               </>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </>
//   );
// }





// app/school/[slug]/academics/streams/[id]/components/analytics/subjects-section.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BookOpen, Users, TrendingUp, FileText, Layers } from "lucide-react";

export default function SubjectsSection({ analytics }: { analytics: any }) {
  // ✅ Calculate multi-paper statistics
  const subjectGroups = new Map<string, {
    subjectId: string;
    subjectName: string;
    subjectCode: string | null;
    papers: any[];
    totalEnrolled: number;
    totalWithResults: number;
    avgMark: number;
  }>();

  analytics.subjectStats?.forEach((stat: any) => {
    if (!subjectGroups.has(stat.subjectId)) {
      subjectGroups.set(stat.subjectId, {
        subjectId: stat.subjectId,
        subjectName: stat.subjectName,
        subjectCode: stat.subjectCode,
        papers: [],
        totalEnrolled: 0,
        totalWithResults: 0,
        avgMark: 0,
      });
    }
    
    const group = subjectGroups.get(stat.subjectId)!;
    group.papers.push(stat);
    group.totalEnrolled += stat.totalEnrolled;
    group.totalWithResults += stat.withResults;
  });

  // Calculate weighted average for multi-paper subjects
  subjectGroups.forEach((group) => {
    if (group.papers.length > 0) {
      const totalMarks = group.papers.reduce(
        (sum, p) => sum + (p.averageMark * p.totalEnrolled),
        0
      );
      group.avgMark = group.totalEnrolled > 0 
        ? Math.round(totalMarks / group.totalEnrolled)
        : 0;
    }
  });

  const subjectGroupsArray = Array.from(subjectGroups.values());
  const multiPaperSubjects = subjectGroupsArray.filter((g) => g.papers.length > 1);

  return (
    <>
      {/* ✅ Multi-Paper Summary */}
      {multiPaperSubjects.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
              <Layers className="h-5 w-5" />
              Multi-Paper Subject Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Multi-Paper Subjects
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {multiPaperSubjects.length}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Total Papers
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {multiPaperSubjects.reduce((sum, s) => sum + s.papers.length, 0)}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Avg Enrollments
                </p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {multiPaperSubjects.length > 0
                    ? Math.round(
                        multiPaperSubjects.reduce((sum, s) => sum + s.totalEnrolled, 0) /
                          multiPaperSubjects.length
                      )
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Avg Performance
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {multiPaperSubjects.length > 0
                    ? Math.round(
                        multiPaperSubjects.reduce((sum, s) => sum + s.avgMark, 0) /
                          multiPaperSubjects.length
                      )
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ ENHANCED: Subject Enrollment & Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Enrollment & Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Papers</TableHead>
                  <TableHead>Paper/Term</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">With Results</TableHead>
                  <TableHead className="text-center">Avg Mark</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.subjectStats?.map((subject: any) => {
                  const completionRate =
                    subject.totalEnrolled > 0
                      ? (subject.withResults / subject.totalEnrolled) * 100
                      : 0;

                  // Check if this subject has multiple papers
                  const subjectGroup = subjectGroups.get(subject.subjectId);
                  const isMultiPaper = subjectGroup && subjectGroup.papers.length > 1;

                  return (
                    <TableRow key={`${subject.subjectId}-${subject.termName}-${subject.paperName || 'single'}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {subject.subjectName}
                            </p>
                            {subject.subjectCode && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {subject.subjectCode}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isMultiPaper ? (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <Layers className="h-3 w-3 mr-1" />
                            {subjectGroup.papers.length}
                          </Badge>
                        ) : (
                          <Badge variant="outline">1</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {subject.paperName && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {subject.paperName}
                              </Badge>
                              {subject.paperCode && (
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs bg-[#5B9BD5]/10 text-[#5B9BD5]"
                                >
                                  {subject.paperCode}
                                </Badge>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {subject.termName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-slate-400" />
                          <span className="font-medium">{subject.totalEnrolled}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{subject.withResults}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`font-bold text-lg ${
                              subject.averageMark >= 75
                                ? "text-green-600 dark:text-green-400"
                                : subject.averageMark >= 65
                                ? "text-blue-600 dark:text-blue-400"
                                : subject.averageMark >= 50
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {subject.averageMark}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {subject.teachers?.slice(0, 2).map((teacher: any) => (
                            <p
                              key={teacher.id}
                              className="text-xs text-slate-600 dark:text-slate-400"
                            >
                              {teacher.firstName} {teacher.lastName}
                            </p>
                          ))}
                          {subject.teachers?.length > 2 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              +{subject.teachers.length - 2} more
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[100px]">
                          <Progress value={completionRate} className="h-2" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                            {completionRate.toFixed(0)}%
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gender Distribution by Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.genderBySubject}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subjectName" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="male" fill="#3b82f6" name="Male" />
              <Bar dataKey="female" fill="#ec4899" name="Female" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ✅ ENHANCED: Subject Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Most Popular Subject
            </CardTitle>
            <BookOpen className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            {subjectGroupsArray.length > 0 && (
              <>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {
                    [...subjectGroupsArray].sort(
                      (a, b) => b.totalEnrolled - a.totalEnrolled
                    )[0].subjectName
                  }
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {[...subjectGroupsArray].sort(
                      (a, b) => b.totalEnrolled - a.totalEnrolled
                    )[0].totalEnrolled} students
                  </p>
                  {[...subjectGroupsArray].sort(
                    (a, b) => b.totalEnrolled - a.totalEnrolled
                  )[0].papers.length > 1 && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                      {[...subjectGroupsArray].sort(
                        (a, b) => b.totalEnrolled - a.totalEnrolled
                      )[0].papers.length}P
                    </Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Best Performing
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {subjectGroupsArray.length > 0 && (
              <>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {
                    [...subjectGroupsArray].sort(
                      (a, b) => b.avgMark - a.avgMark
                    )[0].subjectName
                  }
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {[...subjectGroupsArray].sort(
                      (a, b) => b.avgMark - a.avgMark
                    )[0].avgMark}% average
                  </p>
                  {[...subjectGroupsArray].sort(
                    (a, b) => b.avgMark - a.avgMark
                  )[0].papers.length > 1 && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                      {[...subjectGroupsArray].sort(
                        (a, b) => b.avgMark - a.avgMark
                      )[0].papers.length}P
                    </Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Needs Attention
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
          </CardHeader>
          <CardContent>
            {subjectGroupsArray.length > 0 && (
              <>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {
                    [...subjectGroupsArray].sort(
                      (a, b) => a.avgMark - b.avgMark
                    )[0].subjectName
                  }
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {[...subjectGroupsArray].sort(
                      (a, b) => a.avgMark - b.avgMark
                    )[0].avgMark}% average
                  </p>
                  {[...subjectGroupsArray].sort(
                    (a, b) => a.avgMark - b.avgMark
                  )[0].papers.length > 1 && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                      {[...subjectGroupsArray].sort(
                        (a, b) => a.avgMark - b.avgMark
                      )[0].papers.length}P
                    </Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
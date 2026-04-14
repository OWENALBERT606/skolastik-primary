// // "use client";

// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Badge } from "@/components/ui/badge";
// // import { User, Mail, Phone, Calendar, BookOpen } from "lucide-react";

// // export default function StreamOverviewTab({ stream }: { stream: any }) {
// //   return (
// //     <div className="grid gap-4 md:grid-cols-2">
// //       {/* Stream Information */}
// //       <Card>
// //         <CardHeader>
// //           <CardTitle>Stream Information</CardTitle>
// //         </CardHeader>
// //         <CardContent className="space-y-4">
// //           <div>
// //             <p className="text-sm text-muted-foreground">Stream Name</p>
// //             <p className="font-medium">{stream.name}</p>
// //           </div>
// //           <div>
// //             <p className="text-sm text-muted-foreground">Class</p>
// //             <p className="font-medium">
// //               {stream.classYear.classTemplate.name}
// //               {stream.classYear.classTemplate.code &&
// //                 ` (${stream.classYear.classTemplate.code})`}
// //             </p>
// //           </div>
// //           <div>
// //             <p className="text-sm text-muted-foreground">Academic Year</p>
// //             <p className="font-medium flex items-center gap-2">
// //               {stream.classYear.academicYear.year}
// //               {stream.classYear.academicYear.isActive && (
// //                 <Badge variant="default">Active</Badge>
// //               )}
// //             </p>
// //           </div>
// //           <div>
// //             <p className="text-sm text-muted-foreground">Terms</p>
// //             <div className="flex flex-wrap gap-2 mt-1">
// //               {stream.classYear.academicYear.terms.map((term: any) => (
// //                 <Badge key={term.id} variant="outline">
// //                   {term.name}
// //                 </Badge>
// //               ))}
// //             </div>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Class Head Information */}
// //       <Card>
// //         <CardHeader>
// //           <CardTitle>Class Head</CardTitle>
// //         </CardHeader>
// //         <CardContent>
// //           {stream.classHead ? (
// //             <div className="space-y-4">
// //               <div className="flex items-center gap-3">
// //                 <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
// //                   <User className="h-6 w-6 text-primary" />
// //                 </div>
// //                 <div>
// //                   <p className="font-medium">
// //                     {stream.classHead.firstName} {stream.classHead.lastName}
// //                   </p>
// //                   <p className="text-sm text-muted-foreground">
// //                     Staff No: {stream.classHead.staffNo}
// //                   </p>
// //                 </div>
// //               </div>
// //               <div className="space-y-2">
// //                 <div className="flex items-center gap-2 text-sm">
// //                   <Mail className="h-4 w-4 text-muted-foreground" />
// //                   <a
// //                     href={`mailto:${stream.classHead.email}`}
// //                     className="hover:underline"
// //                   >
// //                     {stream.classHead.email}
// //                   </a>
// //                 </div>
// //                 <div className="flex items-center gap-2 text-sm">
// //                   <Phone className="h-4 w-4 text-muted-foreground" />
// //                   <a
// //                     href={`tel:${stream.classHead.phone}`}
// //                     className="hover:underline"
// //                   >
// //                     {stream.classHead.phone}
// //                   </a>
// //                 </div>
// //               </div>
// //             </div>
// //           ) : (
// //             <div className="text-center py-8">
// //               <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
// //               <p className="text-sm text-muted-foreground">
// //                 No class head assigned
// //               </p>
// //             </div>
// //           )}
// //         </CardContent>
// //       </Card>

// //       {/* Subject Distribution */}
// //       <Card className="md:col-span-2">
// //         <CardHeader>
// //           <CardTitle>Subject Distribution by Term</CardTitle>
// //         </CardHeader>
// //         <CardContent>
// //           <div className="space-y-4">
// //             {stream.classYear.academicYear.terms.map((term: any) => {
// //               const termSubjects =
// //                 stream.streamSubjects?.filter(
// //                   (ss: any) => ss.term.id === term.id
// //                 ) || [];

// //               return (
// //                 <div
// //                   key={term.id}
// //                   className="flex items-center justify-between p-3 border rounded-lg"
// //                 >
// //                   <div>
// //                     <p className="font-medium">{term.name}</p>
// //                     <p className="text-sm text-muted-foreground">
// //                       {new Date(term.startDate).toLocaleDateString()} -{" "}
// //                       {new Date(term.endDate).toLocaleDateString()}
// //                     </p>
// //                   </div>
// //                   <div className="flex items-center gap-2">
// //                     <BookOpen className="h-4 w-4 text-muted-foreground" />
// //                     <span className="font-bold">{termSubjects.length}</span>
// //                     <span className="text-sm text-muted-foreground">
// //                       subjects
// //                     </span>
// //                   </div>
// //                 </div>
// //               );
// //             })}
// //           </div>
// //         </CardContent>
// //       </Card>
// //     </div>
// //   );
// // }




// // app/school/[slug]/academics/streams/[id]/components/stream-overview-tab.tsx
// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
//   Calendar,
//   Users,
//   BookOpen,
//   UserCheck,
//   GraduationCap,
// } from "lucide-react";

// type StreamOverviewProps = {
//   stream: any;
// };

// export default function StreamOverviewTab({ stream }: StreamOverviewProps) {
//   // Group subjects by term
//   const subjectsByTerm = stream.streamSubjects.reduce((acc: any, ss: any) => {
//     if (!acc[ss.term.id]) {
//       acc[ss.term.id] = {
//         term: ss.term,
//         subjects: [],
//       };
//     }
//     acc[ss.term.id].subjects.push(ss);
//     return acc;
//   }, {});

//   const terms = Object.values(subjectsByTerm).sort(
//     (a: any, b: any) => a.term.termNumber - b.term.termNumber
//   );

//   return (
//     <div className="space-y-6">
//       {/* Stream Information */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Stream Information</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="grid gap-4 md:grid-cols-2">
//             <div>
//               <div className="text-sm font-medium text-muted-foreground">
//                 Stream Name
//               </div>
//               <div className="text-lg font-semibold">{stream.name}</div>
//             </div>

//             <div>
//               <div className="text-sm font-medium text-muted-foreground">
//                 Class
//               </div>
//               <div className="text-lg font-semibold">
//                 {stream.classYear.classTemplate.name}
//               </div>
//             </div>

//             <div>
//               <div className="text-sm font-medium text-muted-foreground">
//                 Academic Year
//               </div>
//               <div className="text-lg font-semibold">
//                 {stream.classYear.academicYear.year}
//               </div>
//             </div>

//             <div>
//               <div className="text-sm font-medium text-muted-foreground">
//                 Class Head
//               </div>
//               <div className="text-lg font-semibold">
//                 {stream.classHead
//                   ? `${stream.classHead.firstName} ${stream.classHead.lastName}`
//                   : "Not assigned"}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Statistics */}
//       <div className="grid gap-4 md:grid-cols-3">
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-blue-100 rounded-lg">
//                 <Users className="h-6 w-6 text-blue-600" />
//               </div>
//               <div>
//                 <div className="text-2xl font-bold">
//                   {stream._count.enrollments}
//                 </div>
//                 <div className="text-sm text-muted-foreground">
//                   Enrolled Students
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-green-100 rounded-lg">
//                 <BookOpen className="h-6 w-6 text-green-600" />
//               </div>
//               <div>
//                 <div className="text-2xl font-bold">
//                   {stream.streamSubjects.length}
//                 </div>
//                 <div className="text-sm text-muted-foreground">
//                   Subject Assignments
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-blue-100 rounded-lg">
//                 <GraduationCap className="h-6 w-6 text-blue-600" />
//               </div>
//               <div>
//                 <div className="text-2xl font-bold">
//                   {
//                     new Set(
//                       stream.streamSubjects.flatMap((ss: any) =>
//                         ss.teacherAssignments.map((ta: any) => ta.teacher.id)
//                       )
//                     ).size
//                   }
//                 </div>
//                 <div className="text-sm text-muted-foreground">
//                   Assigned Teachers
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Terms and Subjects */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Subjects by Term</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {terms.map((termGroup: any) => (
//             <div key={termGroup.term.id}>
//               <div className="flex items-center gap-2 mb-3">
//                 <Calendar className="h-4 w-4 text-muted-foreground" />
//                 <h3 className="font-semibold">{termGroup.term.name}</h3>
//                 <Badge variant="outline">{termGroup.subjects.length} subjects</Badge>
//               </div>

//               <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
//                 {termGroup.subjects.map((subject: any) => (
//                   <Card key={subject.id} className="border">
//                     <CardContent className="pt-4">
//                       <div className="flex items-start justify-between">
//                         <div className="flex-1">
//                           <div className="font-medium">
//                             {subject.subject.name}
//                             {subject.subjectPaper && (
//                               <span className="text-sm text-muted-foreground ml-1">
//                                 ({subject.subjectPaper.name})
//                               </span>
//                             )}
//                           </div>
//                           <div className="text-sm text-muted-foreground mt-1">
//                             {subject.teacherAssignments.length > 0
//                               ? `${subject.teacherAssignments[0].teacher.firstName} ${subject.teacherAssignments[0].teacher.lastName}`
//                               : "No teacher assigned"}
//                           </div>
//                           <div className="flex items-center gap-2 mt-2">
//                             <Badge
//                               variant="secondary"
//                               className="text-xs"
//                             >
//                               {subject.subjectType}
//                             </Badge>
//                             <div className="flex items-center gap-1 text-xs text-muted-foreground">
//                               <Users className="h-3 w-3" />
//                               {subject._count.studentEnrollments}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }





// app/school/[slug]/academics/streams/[id]/components/stream-overview-tab.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Users,
  Building2,
  Award,
  Clock,
} from "lucide-react";
import Link from "next/link";
import TransferHistorySection from "./transfer-history-component";

interface StreamOverviewTabProps {
  stream: any;
  schoolSlug: string;
}

export default function StreamOverviewTab({
  stream,
  schoolSlug,
}: StreamOverviewTabProps) {
  // Group subjects by term
  const subjectsByTerm = stream.streamSubjects?.reduce((acc: any, ss: any) => {
    if (!acc[ss.term.id]) {
      acc[ss.term.id] = {
        term: ss.term,
        subjects: [],
      };
    }
    acc[ss.term.id].subjects.push(ss);
    return acc;
  }, {});

  const termsArray = Object.values(subjectsByTerm || {});

  // Get unique subjects count
  const uniqueSubjects = new Set(
    stream.streamSubjects?.map((ss: any) => ss.subjectId)
  ).size;

  // Calculate gender distribution
  const genderDistribution = stream.enrollments?.reduce(
    (acc: any, enrollment: any) => {
      const gender = enrollment.student.gender;
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Class Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#5B9BD5]" />
              Stream Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Stream Name
              </p>
              <p className="font-semibold text-lg text-slate-900 dark:text-white">
                {stream.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Class
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {stream.classYear.classTemplate.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Academic Year
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-slate-900 dark:text-white">
                  {stream.classYear.academicYear.year}
                </p>
                {stream.classYear.academicYear.isActive && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </Badge>
                )}
              </div>
            </div>

            {stream.classHead && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Stream Head
                </p>
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="p-2 bg-[#5B9BD5]/10 rounded-full">
                    <GraduationCap className="h-4 w-4 text-[#5B9BD5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {stream.classHead.firstName} {stream.classHead.lastName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stream.classHead.staffNo}
                    </p>
                    {stream.classHead.email && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {stream.classHead.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#5B9BD5]" />
              Student Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {stream._count.enrollments}
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                  Subjects
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {uniqueSubjects}
                </p>
              </div>
            </div>

            {genderDistribution && Object.keys(genderDistribution).length > 0 && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Gender Distribution
                </p>
                <div className="space-y-2">
                  {Object.entries(genderDistribution).map(
                    ([gender, count]: [string, any]) => {
                      const percentage = stream._count.enrollments
                        ? Math.round(
                            (count / stream._count.enrollments) * 100
                          )
                        : 0;
                      return (
                        <div key={gender}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {gender}
                            </span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                gender === "Male"
                                  ? "bg-blue-500"
                                  : "bg-pink-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Enrollment Status
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-green-50 dark:bg-green-900/20 rounded text-center">
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {
                      stream.enrollments?.filter(
                        (e: any) => e.status === "ACTIVE"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Active
                  </p>
                </div>
                <div className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 rounded text-center">
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-400">
                    {
                      stream.enrollments?.filter(
                        (e: any) => e.status !== "ACTIVE"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Inactive
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <TransferHistorySection streamId={stream.id} />
      {/* Academic Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#5B9BD5]" />
            Academic Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {stream.classYear.academicYear.terms.map((term: any) => (
              <div
                key={term.id}
                className={`p-4 rounded-lg border ${
                  term.isActive
                    ? "bg-[#5B9BD5]/10 border-[#5B9BD5]"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {term.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Term {term.termNumber}
                    </p>
                  </div>
                  {term.isActive && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(term.startDate).toLocaleDateString()} -{" "}
                    {new Date(term.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subjects by Term */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#5B9BD5]" />
            Subjects by Term
          </CardTitle>
        </CardHeader>
        <CardContent>
          {termsArray.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No subjects assigned yet
            </p>
          ) : (
            <div className="space-y-6">
              {termsArray.map((termGroup: any) => {
                // Group subjects by subject (handling multi-paper)
                const subjectGroups = new Map();
                termGroup.subjects.forEach((ss: any) => {
                  if (!subjectGroups.has(ss.subject.id)) {
                    subjectGroups.set(ss.subject.id, {
                      subject: ss.subject,
                      papers: [],
                      enrollmentCount: 0,
                    });
                  }
                  const group = subjectGroups.get(ss.subject.id);
                  group.papers.push({
                    id: ss.id,
                    paper: ss.subjectPaper,
                    enrollmentCount: ss._count?.studentEnrollments || 0,
                  });
                  group.enrollmentCount += ss._count?.studentEnrollments || 0;
                });

                return (
                  <div key={termGroup.term.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {termGroup.term.name}
                      </h3>
                      <Badge variant="outline">
                        {subjectGroups.size} subject(s)
                      </Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {Array.from(subjectGroups.values()).map((group: any) => (
                        <div
                          key={group.subject.id}
                          className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#5B9BD5] transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white truncate">
                                {group.subject.name}
                              </p>
                              {group.subject.code && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {group.subject.code}
                                </p>
                              )}
                            </div>
                            {group.papers.length > 1 && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs"
                              >
                                {group.papers.length} papers
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Users className="h-3 w-3" />
                              <span>{group.enrollmentCount} students</span>
                            </div>
                            <Link
                              href={`/school/${schoolSlug}/academics/streams/${stream.id}/subjects/${group.papers[0].id}`}
                              className="text-[#5B9BD5] hover:underline text-xs font-medium"
                            >
                              View →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Students */}
      {stream.enrollments && stream.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#5B9BD5]" />
                Recent Enrollments
              </CardTitle>
              <Link
                href={`/school/${schoolSlug}/academics/streams/${stream.id}?tab=students`}
                className="text-sm text-[#5B9BD5] hover:underline"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stream.enrollments.slice(0, 5).map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#5B9BD5]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#5B9BD5] font-semibold">
                        {enrollment.student.firstName[0]}
                        {enrollment.student.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {enrollment.student.firstName}{" "}
                        {enrollment.student.lastName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {enrollment.student.admissionNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        enrollment.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                      }
                    >
                      {enrollment.status}
                    </Badge>
                    <Link
                      href={`/school/${schoolSlug}/users/students/${enrollment.student.id}`}
                    >
                      <button className="text-[#5B9BD5] hover:underline text-sm">
                        View
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
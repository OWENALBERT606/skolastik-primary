




// // // app/school/[slug]/academics/streams/[id]/components/stream-subjects-tab.tsx
// // "use client";

// // import { useState } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "@/components/ui/table";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import { BookOpen, Users, FileText, ChevronRight } from "lucide-react";
// // import Link from "next/link";

// // type StreamSubject = {
// //   id: string;
// //   subjectType: string;
// //   subject: {
// //     id: string;
// //     name: string;
// //     code: string | null;
// //     papers: Array<{
// //       id: string;
// //       paperNumber: number;
// //       name: string;
// //     }>;
// //   };
// //   subjectPaper: {
// //     id: string;
// //     paperNumber: number;
// //     name: string;
// //   } | null;
// //   term: {
// //     id: string;
// //     name: string;
// //     termNumber: number;
// //   };
// //   teacherAssignments: Array<{
// //     teacher: {
// //       id: string;
// //       firstName: string;
// //       lastName: string;
// //       staffNo: string;
// //     };
// //   }>;
// //   paperTeachers: Array<{
// //     teacher: {
// //       id: string;
// //       firstName: string;
// //       lastName: string;
// //       staffNo: string;
// //     };
// //     paper: {
// //       id: string;
// //       name: string;
// //     };
// //   }>;
// //   _count: {
// //     studentEnrollments: number;
// //   };
// // };

// // interface StreamSubjectsTabProps {
// //   streamId: string;
// //   streamSubjects: StreamSubject[];
// //   schoolId: string;
// //   activeTerm?: {
// //     id: string;
// //     name: string;
// //   } | null;
// // }

// // const subjectTypeColors: Record<string, string> = {
// //   COMPULSORY: "bg-blue-100 text-blue-800",
// //   OPTIONAL: "bg-blue-100 text-blue-800",
// //   SUBSIDIARY: "bg-green-100 text-green-800",
// // };

// // export default function StreamSubjectsTab({
// //   streamId,
// //   streamSubjects,
// //   schoolId,
// //   activeTerm,
// // }: StreamSubjectsTabProps) {
// //   const [selectedTerm, setSelectedTerm] = useState<string>(
// //     activeTerm?.id || "all"
// //   );

// //   // Get unique terms
// //   const terms = Array.from(
// //     new Map(
// //       streamSubjects.map((ss) => [ss.term.id, ss.term])
// //     ).values()
// //   ).sort((a, b) => a.termNumber - b.termNumber);

// //   // Filter by term
// //   const filteredSubjects =
// //     selectedTerm === "all"
// //       ? streamSubjects
// //       : streamSubjects.filter((ss) => ss.term.id === selectedTerm);

// //   // Group subjects by subject (for multi-paper handling)
// //   const groupedSubjects = filteredSubjects.reduce((acc, ss) => {
// //     const key = `${ss.subject.id}-${ss.term.id}`;
// //     if (!acc[key]) {
// //       acc[key] = {
// //         subject: ss.subject,
// //         term: ss.term,
// //         subjectType: ss.subjectType,
// //         papers: [],
// //       };
// //     }
// //     acc[key].papers.push(ss);
// //     return acc;
// //   }, {} as Record<string, any>);

// //   const subjects = Object.values(groupedSubjects);

// //   // Calculate statistics
// //   const totalSubjects = subjects.length;
// //   const compulsoryCount = subjects.filter(
// //     (s) => s.subjectType === "COMPULSORY"
// //   ).length;
// //   const optionalCount = subjects.filter(
// //     (s) => s.subjectType === "OPTIONAL"
// //   ).length;
// //   const totalEnrollments = filteredSubjects.reduce(
// //     (sum, ss) => sum + ss._count.studentEnrollments,
// //     0
// //   );

// //   return (
// //     <div className="space-y-4">
// //       {/* Summary Cards */}
// //       <div className="grid gap-4 md:grid-cols-4">
// //         <Card>
// //           <CardHeader className="pb-2">
// //             <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="text-2xl font-bold">{totalSubjects}</div>
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardHeader className="pb-2">
// //             <CardTitle className="text-sm font-medium">Compulsory</CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="text-2xl font-bold text-blue-600">
// //               {compulsoryCount}
// //             </div>
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardHeader className="pb-2">
// //             <CardTitle className="text-sm font-medium">Optional</CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="text-2xl font-bold text-blue-600">
// //               {optionalCount}
// //             </div>
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardHeader className="pb-2">
// //             <CardTitle className="text-sm font-medium">
// //               Total Enrollments
// //             </CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="text-2xl font-bold">{totalEnrollments}</div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       {/* Subjects Table */}
// //       <Card>
// //         <CardHeader>
// //           <div className="flex items-center justify-between">
// //             <CardTitle>Stream Subjects</CardTitle>
// //             <Select value={selectedTerm} onValueChange={setSelectedTerm}>
// //               <SelectTrigger className="w-[200px]">
// //                 <SelectValue placeholder="Select term" />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 <SelectItem value="all">All Terms</SelectItem>
// //                 {terms.map((term) => (
// //                   <SelectItem key={term.id} value={term.id}>
// //                     {term.name}
// //                   </SelectItem>
// //                 ))}
// //               </SelectContent>
// //             </Select>
// //           </div>
// //         </CardHeader>
// //         <CardContent>
// //           {subjects.length === 0 ? (
// //             <div className="text-center py-8 text-muted-foreground">
// //               No subjects found for selected term
// //             </div>
// //           ) : (
// //             <Table>
// //               <TableHeader>
// //                 <TableRow>
// //                   <TableHead>Subject</TableHead>
// //                   <TableHead>Code</TableHead>
// //                   <TableHead>Type</TableHead>
// //                   <TableHead>Papers</TableHead>
// //                   <TableHead>Teachers</TableHead>
// //                   <TableHead>Enrolled</TableHead>
// //                   <TableHead>Term</TableHead>
// //                   <TableHead className="text-right">Actions</TableHead>
// //                 </TableRow>
// //               </TableHeader>
// //               <TableBody>
// //                 {subjects.map((subjectGroup) => {
// //                   const multiPaper = subjectGroup.papers.length > 1;
// //                   const firstPaper = subjectGroup.papers[0];

// //                   // Get all teachers for this subject
// //                   const allTeachers = new Set(
// //                     subjectGroup.papers.flatMap((p: any) => [
// //                       ...p.teacherAssignments.map(
// //                         (ta: any) =>
// //                           `${ta.teacher.firstName} ${ta.teacher.lastName}`
// //                       ),
// //                       ...p.paperTeachers.map(
// //                         (pt: any) =>
// //                           `${pt.teacher.firstName} ${pt.teacher.lastName} (${pt.paper.name})`
// //                       ),
// //                     ])
// //                   );

// //                   const totalEnrolled = subjectGroup.papers.reduce(
// //                     (sum: number, p: any) => sum + p._count.studentEnrollments,
// //                     0
// //                   );

// //                   return (
// //                     <TableRow key={`${subjectGroup.subject.id}-${subjectGroup.term.id}`}>
// //                       <TableCell className="font-medium">
// //                         <div className="flex items-center gap-2">
// //                           <BookOpen className="h-4 w-4 text-muted-foreground" />
// //                           {subjectGroup.subject.name}
// //                         </div>
// //                       </TableCell>
// //                       <TableCell>
// //                         {subjectGroup.subject.code && (
// //                           <Badge variant="outline">
// //                             {subjectGroup.subject.code}
// //                           </Badge>
// //                         )}
// //                       </TableCell>
// //                       <TableCell>
// //                         <Badge
// //                           className={
// //                             subjectTypeColors[subjectGroup.subjectType] ||
// //                             "bg-gray-100 text-gray-800"
// //                           }
// //                         >
// //                           {subjectGroup.subjectType}
// //                         </Badge>
// //                       </TableCell>
// //                       <TableCell>
// //                         {multiPaper ? (
// //                           <div className="flex flex-wrap gap-1">
// //                             {subjectGroup.papers.map((p: any) => (
// //                               <Badge key={p.id} variant="secondary" className="text-xs">
// //                                 {p.subjectPaper?.name || "Main"}
// //                               </Badge>
// //                             ))}
// //                           </div>
// //                         ) : (
// //                           <span className="text-sm text-muted-foreground">
// //                             Single paper
// //                           </span>
// //                         )}
// //                       </TableCell>
// //                       <TableCell>
// //                         <div className="flex flex-col gap-1">
// //                           {Array.from(allTeachers).slice(0, 2).map((teacher, idx) => (
// //                             <div
// //                               key={idx}
// //                               className="text-sm text-muted-foreground"
// //                             >
// //                               {/* {teacher.firstName} {teacher.lastName || teacher} */}
// //                             </div>
// //                           ))}
// //                           {allTeachers.size > 2 && (
// //                             <span className="text-xs text-muted-foreground">
// //                               +{allTeachers.size - 2} more
// //                             </span>
// //                           )}
// //                           {allTeachers.size === 0 && (
// //                             <span className="text-sm text-muted-foreground">
// //                               No teacher assigned
// //                             </span>
// //                           )}
// //                         </div>
// //                       </TableCell>
// //                       <TableCell>
// //                         <div className="flex items-center gap-1">
// //                           <Users className="h-4 w-4 text-muted-foreground" />
// //                           <span className="font-medium">{totalEnrolled}</span>
// //                         </div>
// //                       </TableCell>
// //                       <TableCell>
// //                         <Badge variant="outline">{subjectGroup.term.name}</Badge>
// //                       </TableCell>
// //                       <TableCell className="text-right">
// //                         <Button variant="ghost" size="sm" asChild>
// //                           <Link
// //                             href={`/school/${schoolId}/academics/streams/${streamId}/subjects/${firstPaper.id}`}
// //                           >
// //                             <FileText className="h-4 w-4 mr-2" />
// //                             Manage
// //                             <ChevronRight className="h-4 w-4 ml-1" />
// //                           </Link>
// //                         </Button>
// //                       </TableCell>
// //                     </TableRow>
// //                   );
// //                 })}
// //               </TableBody>
// //             </Table>
// //           )}
// //         </CardContent>
// //       </Card>
// //     </div>
// //   );
// // }
















// // app/school/[slug]/academics/streams/[id]/components/stream-subjects-tab.tsx
// "use client";

// import { useState, useMemo } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Search,
//   BookOpen,
//   Users,
//   GraduationCap,
//   Eye,
//   Filter,
// } from "lucide-react";
// import Link from "next/link";

// interface StreamSubjectsTabProps {
//   streamId: string;
//   streamSubjects: any[];
//   schoolId: string;
//   schoolSlug: string;
//   activeTerm: any;
// }

// export default function StreamSubjectsTab({
//   streamId,
//   streamSubjects,
//   schoolId,
//   schoolSlug,
//   activeTerm,
// }: StreamSubjectsTabProps) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterTerm, setFilterTerm] = useState<string>("all");
//   const [filterType, setFilterType] = useState<string>("all");

//   console.log("stream subjects", streamSubjects);

// const groupedSubjects = useMemo(() => {
//     const groups = new Map();

//     // streamSubjects?.forEach((ss) => {
//     //   if (!ss?.subject || !ss?.term) return;
//     //   const key = `${ss.subject.id}-${ss.term.id}`;
//     //   if (!groups.has(key)) {
//     //     groups.set(key, {
//     //       subject: ss.subject,
//     //       term: ss.term,
//     //       subjectType: ss.subjectType,
//     //       papers: [],
//     //       totalEnrollments: 0,
//     //       teachers: new Set(),
//     //     });
//     //   }

//     //   const group = groups.get(key);
//     //   group.papers.push({
//     //     id: ss.id,
//     //     paper: ss.subjectPaper,
//     //     enrollmentCount: ss._count?.studentEnrollments || 0,
//     //     teachers: [
//     //       ...ss.teacherAssignments.map((ta: any) => ta.teacher),
//     //       ...ss.paperTeachers.map((pt: any) => pt.teacher),
//     //     ],
//     //   });
//     //   group.totalEnrollments += ss._count?.studentEnrollments || 0;

//     //   // Add teachers to set
//     //   ss.teacherAssignments.forEach((ta: any) =>
//     //     group.teachers.add(`${ta.teacher.firstName} ${ta.teacher.lastName}`)
//     //   );
//     //   ss.paperTeachers.forEach((pt: any) =>
//     //     group.teachers.add(`${pt.teacher.firstName} ${pt.teacher.lastName}`)
//     //   );
//     // });


//     streamSubjects?.forEach((ss) => {
//   if (!ss?.subject || !ss?.term) return;

//   const key = `${ss.subject.id}-${ss.term.id}`;

//   if (!groups.has(key)) {
//     groups.set(key, {
//       subject: ss.subject,
//       term: ss.term,
//       subjectType: ss.subjectType,
//       papers: [],
//       totalEnrollments: 0,
//       teachers: new Set(),
//     });
//   }

//   const group = groups.get(key);

//   group.papers.push({
//     id: ss.id,
//     paper: ss.subjectPaper,
//     enrollmentCount: ss._count?.studentEnrollments || 0,
//     teachers: [
//       ...(ss.teacherAssignments || []).map((ta: any) => ta.teacher),
//       ...(ss.paperTeachers || []).map((pt: any) => pt.teacher),
//     ],
//   });

//   group.totalEnrollments += ss._count?.studentEnrollments || 0;

//   (ss.teacherAssignments || []).forEach((ta: any) =>
//     group.teachers.add(`${ta.teacher.firstName} ${ta.teacher.lastName}`)
//   );

//   (ss.paperTeachers || []).forEach((pt: any) =>
//     group.teachers.add(`${pt.teacher.firstName} ${pt.teacher.lastName}`)
//   );
// });

//     return Array.from(groups.values());
//   }, [streamSubjects]);

//   // Filter subjects
//   const filteredSubjects = groupedSubjects.filter((group) => {
//     const matchesSearch =
//       group.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       group.subject.code?.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesTerm =
//       filterTerm === "all" || group.term.id === filterTerm;

//     const matchesType =
//       filterType === "all" || group.subjectType === filterType;

//     return matchesSearch && matchesTerm && matchesType;
//   });

//   // Get unique terms
//   const terms = useMemo(() => {
//     const uniqueTerms = new Map();
//     streamSubjects?.forEach((ss) => {
//       if (!uniqueTerms.has(ss.term.id)) {
//         uniqueTerms.set(ss.term.id, ss.term);
//       }
//     });
//     return Array.from(uniqueTerms.values());
//   }, [streamSubjects]);

//   // Calculate stats
//   const stats = useMemo(() => {
//     const compulsory = groupedSubjects.filter(
//       (g) => g.subjectType === "COMPULSORY"
//     ).length;
//     const optional = groupedSubjects.filter(
//       (g) => g.subjectType === "OPTIONAL"
//     ).length;
//     const totalEnrollments = groupedSubjects.reduce(
//       (sum, g) => sum + g.totalEnrollments,
//       0
//     );

//     return {
//       total: groupedSubjects.length,
//       compulsory,
//       optional,
//       totalEnrollments,
//     };
//   }, [groupedSubjects]);

//   return (
//     <div className="space-y-4">
//       {/* Summary Cards */}
//       <div className="grid gap-4 md:grid-cols-4">
//         <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
//               <BookOpen className="h-4 w-4" />
//               Total Subjects
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-slate-900 dark:text-white">
//               {stats.total}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900">
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
//               Compulsory
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-700 dark:text-green-400">
//               {stats.compulsory}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
//               Optional
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
//               {stats.optional}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900">
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
//               <Users className="h-4 w-4" />
//               Total Enrollments
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
//               {stats.totalEnrollments}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardHeader>
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search subjects..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-9"
//               />
//             </div>
//             <Select value={filterTerm} onValueChange={setFilterTerm}>
//               <SelectTrigger className="w-full sm:w-48">
//                 <Filter className="h-4 w-4 mr-2" />
//                 <SelectValue placeholder="All Terms" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Terms</SelectItem>
//                 {terms.map((term) => (
//                   <SelectItem key={term.id} value={term.id}>
//                     {term.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             <Select value={filterType} onValueChange={setFilterType}>
//               <SelectTrigger className="w-full sm:w-48">
//                 <SelectValue placeholder="All Types" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Types</SelectItem>
//                 <SelectItem value="COMPULSORY">Compulsory</SelectItem>
//                 <SelectItem value="OPTIONAL">Optional</SelectItem>
//                 <SelectItem value="SUBSIDIARY">Subsidiary</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </CardHeader>
//         <CardContent>
//           {filteredSubjects.length === 0 ? (
//             <div className="text-center py-12 text-muted-foreground">
//               <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
//               {searchTerm || filterTerm !== "all" || filterType !== "all"
//                 ? "No subjects found matching your filters"
//                 : "No subjects assigned to this stream"}
//             </div>
//           ) : (
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Subject</TableHead>
//                   <TableHead>Term</TableHead>
//                   <TableHead>Type</TableHead>
//                   <TableHead>Papers</TableHead>
//                   <TableHead>Enrollments</TableHead>
//                   <TableHead>Teachers</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredSubjects.map((group, index) => (
//                   <TableRow key={index}>
//                     <TableCell>
//                       <div>
//                         <p className="font-medium text-slate-900 dark:text-white">
//                           {group.subject.name}
//                         </p>
//                         {group.subject.code && (
//                           <p className="text-xs text-muted-foreground">
//                             {group.subject.code}
//                           </p>
//                         )}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant="outline">{group.term.name}</Badge>
//                     </TableCell>
//                     <TableCell>
//                       <Badge
//                         className={
//                           group.subjectType === "COMPULSORY"
//                             ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
//                             : group.subjectType === "OPTIONAL"
//                             ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
//                             : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
//                         }
//                       >
//                         {group.subjectType}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>
//                       {group.papers.length > 1 ? (
//                         <div className="flex flex-col gap-1">
//                           {group.papers.map((paper: any, idx: number) => (
//                             <div
//                               key={idx}
//                               className="text-xs text-muted-foreground"
//                             >
//                               {paper.paper?.name || `Single Paper`}
//                             </div>
//                           ))}
//                         </div>
//                       ) : (
//                         <span className="text-sm">
//                           {group.papers[0]?.paper?.name || "Single Paper"}
//                         </span>
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-1">
//                         <Users className="h-4 w-4 text-muted-foreground" />
//                         <span className="font-medium">
//                           {group.totalEnrollments}
//                         </span>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       {group.teachers.size > 0 ? (
//                         <div className="flex flex-col gap-1">
//                           {Array.from(group.teachers)
//                             .slice(0, 2)
//                             .map((teacher, idx) => (
//                               <div
//                                 key={idx}
//                                 className="text-xs text-muted-foreground flex items-center gap-1"
//                               >
//                                 <GraduationCap className="h-3 w-3" />
//                                 {teacher as string}
//                               </div>
//                             ))}
//                           {group.teachers.size > 2 && (
//                             <span className="text-xs text-muted-foreground">
//                               +{group.teachers.size - 2} more
//                             </span>
//                           )}
//                         </div>
//                       ) : (
//                         <span className="text-xs text-muted-foreground">
//                           No teacher assigned
//                         </span>
//                       )}
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <Link
//                         href={`/school/${schoolSlug}/academics/streams/${streamId}/subjects/${group.papers[0].id}`}
//                       >
//                         <Button variant="ghost" size="sm">
//                           <Eye className="h-4 w-4 mr-1" />
//                           View
//                         </Button>
//                       </Link>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }





// app/school/[slug]/academics/streams/[id]/components/stream-subjects-tab.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Search,
  UserPlus,
  Users,
  GraduationCap,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import AssignTeacherDialog from "./assign-teacher-dialog";

interface StreamSubjectsTabProps {
  streamId: string;
  streamSubjects: any[];
  schoolId: string;
  schoolSlug: string;
  activeTerm: any;
}

export default function StreamSubjectsTab({
  streamId,
  streamSubjects,
  schoolId,
  schoolSlug,
  activeTerm,
}: StreamSubjectsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(activeTerm?.id || "all");
  const [subjectTypeFilter, setSubjectTypeFilter] = useState("all");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStreamSubject, setSelectedStreamSubject] = useState<any>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // ✅ Group stream subjects by subject (handling multi-paper)
  const subjectGroups = new Map<string, {
    subject: any;
    papers: Array<{
      id: string;
      paper: any;
      term: any;
      subjectType: string;
      teacherAssignments: any[];
      _count: any;
    }>;
  }>();

  streamSubjects.forEach((ss) => {
    if (!subjectGroups.has(ss.subject.id)) {
      subjectGroups.set(ss.subject.id, {
        subject: ss.subject,
        papers: [],
      });
    }
    subjectGroups.get(ss.subject.id)!.papers.push({
      id: ss.id,
      paper: ss.subjectPaper,
      term: ss.term,
      subjectType: ss.subjectType,
      teacherAssignments: ss.teacherAssignments,
      _count: ss._count,
    });
  });

  // ✅ Filter logic
  const filteredGroups = Array.from(subjectGroups.values()).filter((group) => {
    const matchesSearch = group.subject.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesTerm = selectedTerm === "all" || 
      group.papers.some((p) => p.term.id === selectedTerm);
    
    const matchesType = subjectTypeFilter === "all" ||
      group.papers.some((p) => p.subjectType === subjectTypeFilter);
    
    return matchesSearch && matchesTerm && matchesType;
  });

  // ✅ Calculate statistics
  const totalUniqueSubjects = subjectGroups.size;
  const totalPapers = streamSubjects.length;
  const multiPaperCount = totalPapers - totalUniqueSubjects;

  const toggleSubjectExpansion = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const handleAssignTeacher = (streamSubject: any) => {
    setSelectedStreamSubject(streamSubject);
    setAssignDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#5B9BD5]" />
                Stream Subjects
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {totalUniqueSubjects} subject(s)
                {multiPaperCount > 0 && ` • ${totalPapers} total papers`}
              </p>
            </div>

            {/* ✅ Enhanced stats badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {totalUniqueSubjects} Subjects
              </Badge>
              {multiPaperCount > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {totalPapers} Papers
                </Badge>
              )}
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {streamSubjects.filter((ss) => ss.teacherAssignments.length > 0).length} Assigned
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {activeTerm && (
                  <SelectItem value={activeTerm.id}>
                    {activeTerm.name} (Active)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={subjectTypeFilter} onValueChange={setSubjectTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Subject Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="COMPULSORY">Compulsory</SelectItem>
                <SelectItem value="OPTIONAL">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Subject Groups */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                {searchTerm ? "No subjects found matching your search" : "No subjects assigned yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => {
                const isExpanded = expandedSubjects.has(group.subject.id);
                const hasMultiplePapers = group.papers.length > 1;
                const totalEnrollments = group.papers.reduce(
                  (sum, p) => sum + (p._count?.studentEnrollments || 0),
                  0
                );

                return (
                  <div
                    key={group.subject.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-[#5B9BD5] transition-colors"
                  >
                    {/* ✅ Subject Header */}
                    <div className="p-4 bg-white dark:bg-slate-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {group.subject.name}
                            </h3>
                            {group.subject.code && (
                              <Badge variant="outline" className="text-xs">
                                {group.subject.code}
                              </Badge>
                            )}
                            {hasMultiplePapers && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                {group.papers.length} Papers
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{totalEnrollments} enrollments</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{group.papers.length} paper(s)</span>
                            </div>
                          </div>
                        </div>

                        {hasMultiplePapers && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSubjectExpansion(group.subject.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Collapse
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Expand Papers
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* ✅ Papers List */}
                    <div
                      className={`border-t border-slate-200 dark:border-slate-700 ${
                        hasMultiplePapers && !isExpanded ? "hidden" : ""
                      }`}
                    >
                      <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {group.papers.map((paper) => {
                          const currentTeacher = paper.teacherAssignments[0]?.teacher;

                          return (
                            <div
                              key={paper.id}
                              className="p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    {paper.paper ? (
                                      <>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                          {paper.paper.name}
                                        </span>
                                        {paper.paper.paperCode && (
                                          <Badge
                                            variant="outline"
                                            className="font-mono text-xs bg-[#5B9BD5]/10 text-[#5B9BD5] border-[#5B9BD5]/20"
                                          >
                                            {paper.paper.paperCode}
                                          </Badge>
                                        )}
                                      </>
                                    ) : (
                                      <span className="font-medium text-slate-900 dark:text-white">
                                        Single Paper
                                      </span>
                                    )}
                                    <Badge
                                      variant={
                                        paper.subjectType === "COMPULSORY"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {paper.subjectType}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {paper.term.name}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      <span>
                                        {paper._count?.studentEnrollments || 0} students
                                      </span>
                                    </div>
                                    {paper.paper && (
                                      <>
                                        <span>•</span>
                                        <span>
                                          Max: {paper.paper.maxMarks} marks
                                        </span>
                                        <span>•</span>
                                        <span>Weight: {paper.paper.weight}x</span>
                                      </>
                                    )}
                                  </div>

                                  {currentTeacher && (
                                    <div className="flex items-center gap-2 mt-2 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                      <GraduationCap className="h-4 w-4 text-[#5B9BD5]" />
                                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {currentTeacher.firstName} {currentTeacher.lastName}
                                      </span>
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        ({currentTeacher.staffNo})
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssignTeacher({ ...paper, subject: group.subject, subjectPaper: paper.paper })}
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    {currentTeacher ? "Reassign" : "Assign"}
                                  </Button>
                                  <Link
                                    href={`/school/${schoolSlug}/academics/streams/${streamId}/subjects/${paper.id}`}
                                  >
                                    <Button variant="ghost" size="sm" className="w-full">
                                      View Details →
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ✅ Collapsed View for Multi-Paper */}
                    {hasMultiplePapers && !isExpanded && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">
                            {group.papers.length} papers •{" "}
                            {group.papers.filter((p) => p.teacherAssignments.length > 0).length}{" "}
                            assigned
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSubjectExpansion(group.subject.id)}
                            className="text-[#5B9BD5] hover:text-[#4A8BC2]"
                          >
                            Show All Papers →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Teacher Dialog */}
      {selectedStreamSubject && (
        <AssignTeacherDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          streamSubject={selectedStreamSubject}
          schoolId={schoolId}
        />
      )}
    </>
  );
}
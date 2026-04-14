// // // app/school/[slug]/academics/streams/[id]/components/stream-students-tab.tsx
// // "use client";

// // import { useState } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "@/components/ui/table";
// // import {
// //   DropdownMenu,
// //   DropdownMenuContent,
// //   DropdownMenuItem,
// //   DropdownMenuTrigger,
// //   DropdownMenuSeparator,
// // } from "@/components/ui/dropdown-menu";
// // import {
// //   AlertDialog,
// //   AlertDialogAction,
// //   AlertDialogCancel,
// //   AlertDialogContent,
// //   AlertDialogDescription,
// //   AlertDialogFooter,
// //   AlertDialogHeader,
// //   AlertDialogTitle,
// // } from "@/components/ui/alert-dialog";
// // import { Badge } from "@/components/ui/badge";
// // import {
// //   Search,
// //   MoreVertical,
// //   Trash2,
// //   UserCog,
// //   Eye,
// //   BookOpen,
// // } from "lucide-react";
// // import { toast } from "sonner";
// // import Link from "next/link";
// // import { removeStudentFromStream, updateEnrollmentStatus } from "@/actions/enrollments-2";

// // type Enrollment = {
// //   id: string;
// //   status: string;
// //   enrollmentType: string;
// //   student: {
// //     id: string;
// //     firstName: string;
// //     lastName: string;
// //     admissionNo: string;
// //     gender: string;
// //   };
// //   term: {
// //     id: string;
// //     name: string;
// //   };
// // };

// // interface StreamStudentsTabProps {
// //   streamId: string;
// //   enrollments: Enrollment[];
// //   schoolId: string;
// // }

// // const statusColors: Record<string, string> = {
// //   ACTIVE: "bg-green-100 text-green-800",
// //   PROMOTED: "bg-blue-100 text-blue-800",
// //   REPEATED: "bg-yellow-100 text-yellow-800",
// //   TRANSFERRED: "bg-blue-100 text-blue-800",
// //   DROPPED: "bg-red-100 text-red-800",
// //   GRADUATED: "bg-indigo-100 text-indigo-800",
// // };

// // const enrollmentTypeColors: Record<string, string> = {
// //   NEW: "bg-emerald-100 text-emerald-800",
// //   CONTINUING: "bg-blue-100 text-blue-800",
// //   TRANSFER: "bg-orange-100 text-orange-800",
// //   REPEAT: "bg-amber-100 text-amber-800",
// // };

// // export default function StreamStudentsTab({
// //   streamId,
// //   enrollments,
// //   schoolId,
// // }: StreamStudentsTabProps) {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
// //   const [showRemoveDialog, setShowRemoveDialog] = useState(false);
// //   const [isLoading, setIsLoading] = useState(false);

// //   // Filter enrollments based on search
// //   const filteredEnrollments = enrollments.filter((enrollment) => {
// //     const searchLower = searchTerm.toLowerCase();
// //     return (
// //       enrollment.student.firstName.toLowerCase().includes(searchLower) ||
// //       enrollment.student.lastName.toLowerCase().includes(searchLower) ||
// //       enrollment.student.admissionNo.toLowerCase().includes(searchLower)
// //     );
// //   });

// //   // Group by status
// //   const activeStudents = filteredEnrollments.filter(
// //     (e) => e.status === "ACTIVE"
// //   ).length;
// //   const inactiveStudents = filteredEnrollments.filter(
// //     (e) => e.status !== "ACTIVE"
// //   ).length;

// //   const handleRemoveStudent = async () => {
// //     if (!selectedEnrollment) return;

// //     setIsLoading(true);
// //     const result = await removeStudentFromStream(selectedEnrollment.id);

// //     if (result.ok) {
// //       toast.success(result.message);
// //       setShowRemoveDialog(false);
// //       window.location.reload();
// //     } else {
// //       toast.error(result.message);
// //     }
// //     setIsLoading(false);
// //   };

// //   const handleUpdateStatus = async (
// //     enrollmentId: string,
// //     newStatus: "ACTIVE" | "PROMOTED" | "REPEATED" | "TRANSFERRED" | "DROPPED" | "GRADUATED"
// //   ) => {
// //     setIsLoading(true);
// //     const result = await updateEnrollmentStatus(enrollmentId, newStatus);

// //     if (result.ok) {
// //       toast.success(result.message);
// //       window.location.reload();
// //     } else {
// //       toast.error(result.message);
// //     }
// //     setIsLoading(false);
// //   };

// //   return (
// //     <div className="space-y-4">
// //       {/* Summary Cards */}
// //       <div className="grid gap-4 md:grid-cols-3">
// //         <Card>
// //           <CardHeader className="pb-2">
// //             <CardTitle className="text-sm font-medium">Total Students</CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="text-2xl font-bold">{enrollments.length}</div>
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardHeader className="pb-2">
// //             <CardTitle className="text-sm font-medium">Active</CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="text-2xl font-bold text-green-600">
// //               {activeStudents}
// //             </div>
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardHeader className="pb-2">
// //             <CardTitle className="text-sm font-medium">Inactive</CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="text-2xl font-bold text-gray-600">
// //               {inactiveStudents}
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       {/* Students Table */}
// //       <Card>
// //         <CardHeader>
// //           <div className="flex items-center justify-between">
// //             <CardTitle>Enrolled Students</CardTitle>
// //             <div className="flex items-center gap-2">
// //               <div className="relative w-64">
// //                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
// //                 <Input
// //                   placeholder="Search students..."
// //                   value={searchTerm}
// //                   onChange={(e) => setSearchTerm(e.target.value)}
// //                   className="pl-8"
// //                 />
// //               </div>
// //             </div>
// //           </div>
// //         </CardHeader>
// //         <CardContent>
// //           {filteredEnrollments.length === 0 ? (
// //             <div className="text-center py-8 text-muted-foreground">
// //               {searchTerm
// //                 ? "No students found matching your search"
// //                 : "No students enrolled in this stream"}
// //             </div>
// //           ) : (
// //             <Table>
// //               <TableHeader>
// //                 <TableRow>
// //                   <TableHead>Admission No</TableHead>
// //                   <TableHead>Student Name</TableHead>
// //                   <TableHead>Gender</TableHead>
// //                   <TableHead>Type</TableHead>
// //                   <TableHead>Status</TableHead>
// //                   <TableHead>Term</TableHead>
// //                   <TableHead className="text-right">Actions</TableHead>
// //                 </TableRow>
// //               </TableHeader>
// //               <TableBody>
// //                 {filteredEnrollments.map((enrollment) => (
// //                   <TableRow key={enrollment.id}>
// //                     <TableCell className="font-medium">
// //                       {enrollment.student.admissionNo}
// //                     </TableCell>
// //                     <TableCell>
// //                       {enrollment.student.firstName} {enrollment.student.lastName}
// //                     </TableCell>
// //                     <TableCell>
// //                       <Badge variant="outline">{enrollment.student.gender}</Badge>
// //                     </TableCell>
// //                     <TableCell>
// //                       <Badge
// //                         className={
// //                           enrollmentTypeColors[enrollment.enrollmentType] ||
// //                           "bg-gray-100 text-gray-800"
// //                         }
// //                       >
// //                         {enrollment.enrollmentType}
// //                       </Badge>
// //                     </TableCell>
// //                     <TableCell>
// //                       <Badge
// //                         className={
// //                           statusColors[enrollment.status] ||
// //                           "bg-gray-100 text-gray-800"
// //                         }
// //                       >
// //                         {enrollment.status}
// //                       </Badge>
// //                     </TableCell>
// //                     <TableCell>{enrollment.term.name}</TableCell>
// //                     <TableCell className="text-right">
// //                       <DropdownMenu>
// //                         <DropdownMenuTrigger asChild>
// //                           <Button variant="ghost" size="sm">
// //                             <MoreVertical className="h-4 w-4" />
// //                           </Button>
// //                         </DropdownMenuTrigger>
// //                         <DropdownMenuContent align="end">
// //                           <DropdownMenuItem asChild>
// //                             <Link
// //                               href={`/school/${schoolId}/students/${enrollment.student.id}`}
// //                             >
// //                               <Eye className="h-4 w-4 mr-2" />
// //                               View Student
// //                             </Link>
// //                           </DropdownMenuItem>
// //                           <DropdownMenuItem asChild>
// //                             <Link
// //                               href={`/school/${schoolId}/students/${enrollment.student.id}/subjects`}
// //                             >
// //                               <BookOpen className="h-4 w-4 mr-2" />
// //                               Subject Enrollments
// //                             </Link>
// //                           </DropdownMenuItem>
// //                           <DropdownMenuSeparator />
// //                           <DropdownMenuItem
// //                             onClick={() =>
// //                               handleUpdateStatus(enrollment.id, "ACTIVE")
// //                             }
// //                             disabled={enrollment.status === "ACTIVE"}
// //                           >
// //                             <UserCog className="h-4 w-4 mr-2" />
// //                             Mark as Active
// //                           </DropdownMenuItem>
// //                           <DropdownMenuItem
// //                             onClick={() =>
// //                               handleUpdateStatus(enrollment.id, "DROPPED")
// //                             }
// //                             disabled={enrollment.status === "DROPPED"}
// //                           >
// //                             <UserCog className="h-4 w-4 mr-2" />
// //                             Mark as Dropped
// //                           </DropdownMenuItem>
// //                           <DropdownMenuSeparator />
// //                           <DropdownMenuItem
// //                             onClick={() => {
// //                               setSelectedEnrollment(enrollment);
// //                               setShowRemoveDialog(true);
// //                             }}
// //                             className="text-red-600"
// //                           >
// //                             <Trash2 className="h-4 w-4 mr-2" />
// //                             Remove from Stream
// //                           </DropdownMenuItem>
// //                         </DropdownMenuContent>
// //                       </DropdownMenu>
// //                     </TableCell>
// //                   </TableRow>
// //                 ))}
// //               </TableBody>
// //             </Table>
// //           )}
// //         </CardContent>
// //       </Card>

// //       {/* Remove Confirmation Dialog */}
// //       <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
// //         <AlertDialogContent>
// //           <AlertDialogHeader>
// //             <AlertDialogTitle>Remove Student from Stream?</AlertDialogTitle>
// //             <AlertDialogDescription>
// //               Are you sure you want to remove{" "}
// //               <strong>
// //                 {selectedEnrollment?.student.firstName}{" "}
// //                 {selectedEnrollment?.student.lastName}
// //               </strong>{" "}
// //               from this stream? This action cannot be undone and will also remove
// //               all their subject enrollments. Any marks entered will need to be
// //               deleted first.
// //             </AlertDialogDescription>
// //           </AlertDialogHeader>
// //           <AlertDialogFooter>
// //             <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
// //             <AlertDialogAction
// //               onClick={handleRemoveStudent}
// //               disabled={isLoading}
// //               className="bg-red-600 hover:bg-red-700"
// //             >
// //               {isLoading ? "Removing..." : "Remove Student"}
// //             </AlertDialogAction>
// //           </AlertDialogFooter>
// //         </AlertDialogContent>
// //       </AlertDialog>
// //     </div>
// //   );
// // }







// // app/school/[slug]/academics/streams/[id]/components/stream-students-tab.tsx
// "use client";

// import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import {
//   Search,
//   MoreVertical,
//   Trash2,
//   UserCog,
//   Eye,
//   ArrowRightLeft,
// } from "lucide-react";
// import { toast } from "sonner";
// import Link from "next/link";
// import TransferStudentModal from "./transfer-student-modal";
// import { removeStudentFromStream, updateEnrollmentStatus } from "@/actions/enrollments-2";

// interface StreamStudentsTabProps {
//   streamId: string;
//   enrollments: any[];
//   schoolId: string;
//   schoolSlug: string;
//   classYearId: string;
// }

// const statusColors: Record<string, string> = {
//   ACTIVE: "bg-green-100 text-green-800",
//   PROMOTED: "bg-blue-100 text-blue-800",
//   REPEATED: "bg-yellow-100 text-yellow-800",
//   TRANSFERRED: "bg-blue-100 text-blue-800",
//   DROPPED: "bg-red-100 text-red-800",
//   GRADUATED: "bg-indigo-100 text-indigo-800",
// };

// export default function StreamStudentsTab({
//   streamId,
//   enrollments,
//   schoolId,
//   schoolSlug,
//   classYearId,
// }: StreamStudentsTabProps) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
//   const [showRemoveDialog, setShowRemoveDialog] = useState(false);
//   const [showTransferModal, setShowTransferModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   // Filter enrollments based on search
//   const filteredEnrollments = enrollments.filter((enrollment) => {
//     const searchLower = searchTerm.toLowerCase();
//     return (
//       enrollment.student.firstName.toLowerCase().includes(searchLower) ||
//       enrollment.student.lastName.toLowerCase().includes(searchLower) ||
//       enrollment.student.admissionNo.toLowerCase().includes(searchLower)
//     );
//   });

//   // Group by status
//   const activeStudents = filteredEnrollments.filter(
//     (e) => e.status === "ACTIVE"
//   ).length;
//   const inactiveStudents = filteredEnrollments.filter(
//     (e) => e.status !== "ACTIVE"
//   ).length;

//   const handleRemoveStudent = async () => {
//     if (!selectedEnrollment) return;

//     setIsLoading(true);
//     const result = await removeStudentFromStream(selectedEnrollment.id);

//     if (result.ok) {
//       toast.success(result.message);
//       setShowRemoveDialog(false);
//       window.location.reload();
//     } else {
//       toast.error(result.message);
//     }
//     setIsLoading(false);
//   };

//   const handleUpdateStatus = async (
//     enrollmentId: string,
//     newStatus: "ACTIVE" | "PROMOTED" | "REPEATED" | "TRANSFERRED" | "DROPPED" | "GRADUATED"
//   ) => {
//     setIsLoading(true);
//     const result = await updateEnrollmentStatus(enrollmentId, newStatus);

//     if (result.ok) {
//       toast.success(result.message);
//       window.location.reload();
//     } else {
//       toast.error(result.message);
//     }
//     setIsLoading(false);
//   };

//   return (
//     <div className="space-y-4">
//       {/* Summary Cards */}
//       <div className="grid gap-4 md:grid-cols-3">
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Total Students</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{enrollments.length}</div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Active</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-600">
//               {activeStudents}
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Inactive</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-gray-600">
//               {inactiveStudents}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Students Table */}
//       <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle>Enrolled Students</CardTitle>
//             <div className="flex items-center gap-2">
//               <div className="relative w-64">
//                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search students..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-8"
//                 />
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           {filteredEnrollments.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               {searchTerm
//                 ? "No students found matching your search"
//                 : "No students enrolled in this stream"}
//             </div>
//           ) : (
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Admission No</TableHead>
//                   <TableHead>Student Name</TableHead>
//                   <TableHead>Gender</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Term</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredEnrollments.map((enrollment) => (
//                   <TableRow key={enrollment.id}>
//                     <TableCell className="font-medium">
//                       {enrollment.student.admissionNo}
//                     </TableCell>
//                     <TableCell>
//                       {enrollment.student.firstName} {enrollment.student.lastName}
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant="outline">{enrollment.student.gender}</Badge>
//                     </TableCell>
//                     <TableCell>
//                       <Badge
//                         className={
//                           statusColors[enrollment.status] ||
//                           "bg-gray-100 text-gray-800"
//                         }
//                       >
//                         {enrollment.status}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>{enrollment.term?.name || "N/A"}</TableCell>
//                     <TableCell className="text-right">
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" size="sm">
//                             <MoreVertical className="h-4 w-4" />
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                           <DropdownMenuItem asChild>
//                             <Link
//                               href={`/school/${schoolSlug}/users/students/${enrollment.student.id}`}
//                             >
//                               <Eye className="h-4 w-4 mr-2" />
//                               View Student
//                             </Link>
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             onClick={() => {
//                               setSelectedEnrollment(enrollment);
//                               setShowTransferModal(true);
//                             }}
//                           >
//                             <ArrowRightLeft className="h-4 w-4 mr-2" />
//                             Transfer Stream
//                           </DropdownMenuItem>
//                           <DropdownMenuSeparator />
//                           <DropdownMenuItem
//                             onClick={() =>
//                               handleUpdateStatus(enrollment.id, "ACTIVE")
//                             }
//                             disabled={enrollment.status === "ACTIVE"}
//                           >
//                             <UserCog className="h-4 w-4 mr-2" />
//                             Mark as Active
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             onClick={() =>
//                               handleUpdateStatus(enrollment.id, "DROPPED")
//                             }
//                             disabled={enrollment.status === "DROPPED"}
//                           >
//                             <UserCog className="h-4 w-4 mr-2" />
//                             Mark as Dropped
//                           </DropdownMenuItem>
//                           <DropdownMenuSeparator />
//                           <DropdownMenuItem
//                             onClick={() => {
//                               setSelectedEnrollment(enrollment);
//                               setShowRemoveDialog(true);
//                             }}
//                             className="text-red-600"
//                           >
//                             <Trash2 className="h-4 w-4 mr-2" />
//                             Remove from Stream
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           )}
//         </CardContent>
//       </Card>

//       {/* Remove Confirmation Dialog */}
//       <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Remove Student from Stream?</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to remove{" "}
//               <strong>
//                 {selectedEnrollment?.student.firstName}{" "}
//                 {selectedEnrollment?.student.lastName}
//               </strong>{" "}
//               from this stream? This action cannot be undone and will also remove
//               all their subject enrollments. Any marks entered will need to be
//               deleted first.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleRemoveStudent}
//               disabled={isLoading}
//               className="bg-red-600 hover:bg-red-700"
//             >
//               {isLoading ? "Removing..." : "Remove Student"}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* Transfer Modal */}
//       {showTransferModal && selectedEnrollment && (
//         <TransferStudentModal
//           isOpen={showTransferModal}
//           onClose={() => {
//             setShowTransferModal(false);
//             setSelectedEnrollment(null);
//           }}
//           enrollment={selectedEnrollment}
//           currentStreamId={streamId}
//           classYearId={classYearId}
//           schoolId={schoolId}
//           onSuccess={() => {
//             setShowTransferModal(false);
//             setSelectedEnrollment(null);
//             window.location.reload();
//           }}
//         />
//       )}
//     </div>
//   );
// }




// app/school/[slug]/academics/streams/[id]/components/stream-students-tab.tsx
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  ArrowUpDown,
  UserX,
  FileText,
  BookOpen,
  ExternalLink,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface StreamStudentsTabProps {
  streamId: string;
  enrollments: any[];
  schoolId: string;
  schoolSlug: string;
  classYearId: string;
}

export default function StreamStudentsTab({
  streamId,
  enrollments,
  schoolId,
  schoolSlug,
  classYearId,
}: StreamStudentsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "admission" | "subjects">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ✅ Enhanced: Calculate multi-paper statistics per student
  const enrichedEnrollments = enrollments.map((enrollment) => {
    const subjectEnrollments = enrollment.subjectEnrollments || [];
    
    // Count unique subjects
    const uniqueSubjects = new Set(
      subjectEnrollments.map((se: any) => se.streamSubject?.subjectId)
    ).size;
    
    // Count total papers
    const totalPapers = subjectEnrollments.length;
    
    // Count compulsory vs optional
    const compulsoryCount = subjectEnrollments.filter(
      (se: any) => se.streamSubject?.subjectType === "COMPULSORY"
    ).length;
    
    const optionalCount = subjectEnrollments.filter(
      (se: any) => se.streamSubject?.subjectType === "OPTIONAL"
    ).length;

    // Calculate multi-paper subjects
    const subjectPaperMap = new Map<string, number>();
    subjectEnrollments.forEach((se: any) => {
      const subjectId = se.streamSubject?.subjectId;
      if (subjectId) {
        subjectPaperMap.set(subjectId, (subjectPaperMap.get(subjectId) || 0) + 1);
      }
    });
    
    const multiPaperSubjects = Array.from(subjectPaperMap.values()).filter(
      (count) => count > 1
    ).length;

    return {
      ...enrollment,
      stats: {
        uniqueSubjects,
        totalPapers,
        compulsoryCount,
        optionalCount,
        multiPaperSubjects,
        hasMultiplePapers: totalPapers > uniqueSubjects,
      },
    };
  });

  // Filter logic
  const filteredEnrollments = enrichedEnrollments.filter((enrollment) => {
    const student = enrollment.student;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.admissionNo.toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === "all" || enrollment.status === statusFilter;

    const matchesGender =
      genderFilter === "all" || student.gender === genderFilter;

    return matchesSearch && matchesStatus && matchesGender;
  });

  // Sort logic
  const sortedEnrollments = [...filteredEnrollments].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.student.firstName.localeCompare(b.student.firstName);
        break;
      case "admission":
        comparison = a.student.admissionNo.localeCompare(b.student.admissionNo);
        break;
      case "subjects":
        comparison = a.stats.totalPapers - b.stats.totalPapers;
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field: "name" | "admission" | "subjects") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // ✅ Calculate overall statistics
  const totalStudents = enrollments.length;
  const activeStudents = enrollments.filter((e) => e.status === "ACTIVE").length;
  const avgSubjects =
    totalStudents > 0
      ? Math.round(
          enrichedEnrollments.reduce((sum, e) => sum + e.stats.uniqueSubjects, 0) /
            totalStudents
        )
      : 0;
  const avgPapers =
    totalStudents > 0
      ? Math.round(
          enrichedEnrollments.reduce((sum, e) => sum + e.stats.totalPapers, 0) /
            totalStudents
        )
      : 0;
  const studentsWithMultiPaper = enrichedEnrollments.filter(
    (e) => e.stats.hasMultiplePapers
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#5B9BD5]" />
              Stream Students
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {totalStudents} student(s) • {activeStudents} active
            </p>
          </div>

          {/* ✅ Enhanced statistics badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            >
              Avg: {avgSubjects} subjects
            </Badge>
            {avgPapers > avgSubjects && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                Avg: {avgPapers} papers
              </Badge>
            )}
            {studentsWithMultiPaper > 0 && (
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              >
                <Layers className="h-3 w-3 mr-1" />
                {studentsWithMultiPaper} multi-paper
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="TRANSFERRED">Transferred</SelectItem>
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ✅ Enhanced Table */}
        {sortedEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              {searchTerm ? "No students found matching your search" : "No students enrolled yet"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort("admission")}
                      className="h-8 px-2"
                    >
                      Admission No
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort("name")}
                      className="h-8 px-2"
                    >
                      Student Name
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort("subjects")}
                      className="h-8 px-2"
                    >
                      Subjects/Papers
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Enrollment Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEnrollments.map((enrollment) => {
                  const student = enrollment.student;
                  const stats = enrollment.stats;

                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {student.admissionNo}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {student.firstName} {student.lastName}
                          </p>
                          {student.otherNames && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {student.otherNames}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            student.gender === "Male"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
                          }
                        >
                          {student.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            enrollment.status === "ACTIVE" ? "default" : "secondary"
                          }
                          className={
                            enrollment.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : ""
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {/* ✅ Enhanced subject/paper display */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm">
                              <BookOpen className="h-3 w-3 text-slate-500" />
                              <span className="font-medium text-slate-900 dark:text-white">
                                {stats.uniqueSubjects}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                subjects
                              </span>
                            </div>
                            {stats.hasMultiplePapers && (
                              <div className="flex items-center gap-1 text-sm">
                                <FileText className="h-3 w-3 text-blue-500" />
                                <span className="font-medium text-blue-700 dark:text-blue-400">
                                  {stats.totalPapers}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  papers
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{stats.compulsoryCount} compulsory</span>
                            {stats.optionalCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{stats.optionalCount} optional</span>
                              </>
                            )}
                          </div>
                          {stats.multiPaperSubjects > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 w-fit"
                            >
                              <Layers className="h-2 w-2 mr-1" />
                              {stats.multiPaperSubjects} multi-paper
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {enrollment.enrollmentType || "CONTINUING"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/school/${schoolSlug}/users/students/${student.id}`}
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ✅ Enhanced Summary Footer */}
        {sortedEnrollments.length > 0 && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">
                  Showing Students
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {sortedEnrollments.length} of {totalStudents}
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">
                  Average Subjects
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {avgSubjects} subjects
                </p>
              </div>
              {avgPapers > avgSubjects && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400 mb-1">
                    Average Papers
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {avgPapers} papers
                  </p>
                </div>
              )}
              {studentsWithMultiPaper > 0 && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400 mb-1">
                    Multi-Paper Students
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {studentsWithMultiPaper} ({Math.round((studentsWithMultiPaper / totalStudents) * 100)}%)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
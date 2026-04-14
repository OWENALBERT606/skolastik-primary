


// // app/school/[slug]/users/teachers/teachers-list-client.tsx
// "use client";

// import { useState, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Plus, Eye, Pencil, Trash2, UserCheck, UserX, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
// import { deleteTeacher, toggleTeacherStatus } from "@/actions/teachers";
// import toast from "react-hot-toast";
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
// import TeacherDialog from "./teacher-dialogue";

// type TeachersListClientProps = {
//   teachers: any[];
//   schoolId: string;
//   slug: string;
// };

// const ITEMS_PER_PAGE = 15;

// export default function TeachersListClient({
//   teachers,
//   schoolId,
//   slug,
// }: TeachersListClientProps) {
//   const router = useRouter();
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editingTeacher, setEditingTeacher] = useState<any>(null);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [teacherToDelete, setTeacherToDelete] = useState<any>(null);

//   // Filter states
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("all");
//   const [genderFilter, setGenderFilter] = useState<string>("all");

//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);

//   // Filtered teachers
//   const filteredTeachers = useMemo(() => {
//     return teachers.filter((teacher) => {
//       // Search filter
//       const searchLower = searchQuery.toLowerCase();
//       const matchesSearch =
//         searchQuery === "" ||
//         teacher.firstName.toLowerCase().includes(searchLower) ||
//         teacher.lastName.toLowerCase().includes(searchLower) ||
//         teacher.email.toLowerCase().includes(searchLower) ||
//         teacher.phone.includes(searchQuery) ||
//         teacher.staffNo.toLowerCase().includes(searchLower) ||
//         teacher.role.toLowerCase().includes(searchLower);

//       // Status filter
//       const matchesStatus =
//         statusFilter === "all" || teacher.status === statusFilter;

//       // Employment type filter
//       const matchesEmploymentType =
//         employmentTypeFilter === "all" ||
//         teacher.employmentType === employmentTypeFilter;

//       // Gender filter
//       const matchesGender =
//         genderFilter === "all" || teacher.gender === genderFilter;

//       return matchesSearch && matchesStatus && matchesEmploymentType && matchesGender;
//     });
//   }, [teachers, searchQuery, statusFilter, employmentTypeFilter, genderFilter]);

//   // Pagination calculations
//   const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
//   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//   const endIndex = startIndex + ITEMS_PER_PAGE;
//   const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

//   // Reset to page 1 when filters change
//   useMemo(() => {
//     setCurrentPage(1);
//   }, [searchQuery, statusFilter, employmentTypeFilter, genderFilter]);

//   // Check if any filters are active
//   const hasActiveFilters =
//     searchQuery !== "" ||
//     statusFilter !== "all" ||
//     employmentTypeFilter !== "all" ||
//     genderFilter !== "all";

//   // Clear all filters
//   const clearFilters = () => {
//     setSearchQuery("");
//     setStatusFilter("all");
//     setEmploymentTypeFilter("all");
//     setGenderFilter("all");
//     setCurrentPage(1);
//   };

//   // Pagination handlers
//   const goToPage = (page: number) => {
//     setCurrentPage(Math.max(1, Math.min(page, totalPages)));
//   };

//   const goToNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   const goToPreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   function formatTeacherForEdit(teacher: any) {
//     return {
//       ...teacher,
//       dateOfBirth: teacher.dateOfBirth
//         ? new Date(teacher.dateOfBirth).toISOString().split("T")[0]
//         : "",
//       dateOfHire: teacher.dateOfHire
//         ? new Date(teacher.dateOfHire).toISOString().split("T")[0]
//         : "",
//       previousSchools: Array.isArray(teacher.previousSchools)
//         ? teacher.previousSchools.join(", ")
//         : "",
//     };
//   }

//   function handleEdit(teacher: any) {
//     setEditingTeacher(formatTeacherForEdit(teacher));
//     setDialogOpen(true);
//   }

//   function handleCreate() {
//     setEditingTeacher(null);
//     setDialogOpen(true);
//   }

//   function handleCloseDialog() {
//     setDialogOpen(false);
//     setEditingTeacher(null);
//   }

//   async function handleDelete() {
//     if (!teacherToDelete) return;

//     const result = await deleteTeacher(teacherToDelete.id);
//     if (result.ok) {
//       toast.success(result.message);
//       router.refresh();
//     } else {
//       toast.error(result.message);
//     }
//     setDeleteDialogOpen(false);
//     setTeacherToDelete(null);
//   }

//   async function handleToggleStatus(teacher: any) {
//     const result = await toggleTeacherStatus(teacher.id, teacher.user.status);
//     if (result.ok) {
//       toast.success(result.message);
//       router.refresh();
//     } else {
//       toast.error(result.message);
//     }
//   }

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pages = [];
//     const maxVisiblePages = 5;

//     if (totalPages <= maxVisiblePages) {
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       if (currentPage <= 3) {
//         for (let i = 1; i <= 4; i++) {
//           pages.push(i);
//         }
//         pages.push("...");
//         pages.push(totalPages);
//       } else if (currentPage >= totalPages - 2) {
//         pages.push(1);
//         pages.push("...");
//         for (let i = totalPages - 3; i <= totalPages; i++) {
//           pages.push(i);
//         }
//       } else {
//         pages.push(1);
//         pages.push("...");
//         pages.push(currentPage - 1);
//         pages.push(currentPage);
//         pages.push(currentPage + 1);
//         pages.push("...");
//         pages.push(totalPages);
//       }
//     }

//     return pages;
//   };

//   return (
//     <div className="space-y-4">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
//         <div>
//           <h1 className="text-2xl font-bold dark:text-white">Teachers</h1>
//           <p className="text-muted-foreground dark:text-slate-400">
//             Manage your school's teaching staff
//           </p>
//         </div>
//         <Button
//           onClick={handleCreate}
//           className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
//         >
//           <Plus className="mr-2 h-4 w-4" />
//           Add Teacher
//         </Button>
//       </div>

//       {/* Search and Filters */}
//       <Card className="dark:bg-slate-800 dark:border-slate-700">
//         <CardContent className="pt-6">
//           <div className="space-y-4">
//             {/* Search Bar */}
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
//               <Input
//                 type="text"
//                 placeholder="Search by name, email, phone, staff number, or role..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
//               />
//             </div>

//             {/* Filter Row */}
//             <div className="flex flex-col md:flex-row gap-3">
//               <div className="flex-1">
//                 <Select value={statusFilter} onValueChange={setStatusFilter}>
//                   <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
//                     <SelectValue placeholder="Filter by status" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
//                     <SelectItem value="all" className="dark:text-white dark:focus:bg-slate-700">
//                       All Status
//                     </SelectItem>
//                     <SelectItem value="ACTIVE" className="dark:text-white dark:focus:bg-slate-700">
//                       Active
//                     </SelectItem>
//                     <SelectItem value="ON_LEAVE" className="dark:text-white dark:focus:bg-slate-700">
//                       On Leave
//                     </SelectItem>
//                     <SelectItem value="RESIGNED" className="dark:text-white dark:focus:bg-slate-700">
//                       Resigned
//                     </SelectItem>
//                     <SelectItem value="RETIRED" className="dark:text-white dark:focus:bg-slate-700">
//                       Retired
//                     </SelectItem>
//                     <SelectItem value="SUSPENDED" className="dark:text-white dark:focus:bg-slate-700">
//                       Suspended
//                     </SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="flex-1">
//                 <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
//                   <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
//                     <SelectValue placeholder="Filter by employment type" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
//                     <SelectItem value="all" className="dark:text-white dark:focus:bg-slate-700">
//                       All Types
//                     </SelectItem>
//                     <SelectItem value="fulltime" className="dark:text-white dark:focus:bg-slate-700">
//                       Full-time
//                     </SelectItem>
//                     <SelectItem value="parttime" className="dark:text-white dark:focus:bg-slate-700">
//                       Part-time
//                     </SelectItem>
//                     <SelectItem value="contract" className="dark:text-white dark:focus:bg-slate-700">
//                       Contract
//                     </SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="flex-1">
//                 <Select value={genderFilter} onValueChange={setGenderFilter}>
//                   <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
//                     <SelectValue placeholder="Filter by gender" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
//                     <SelectItem value="all" className="dark:text-white dark:focus:bg-slate-700">
//                       All Genders
//                     </SelectItem>
//                     <SelectItem value="male" className="dark:text-white dark:focus:bg-slate-700">
//                       Male
//                     </SelectItem>
//                     <SelectItem value="female" className="dark:text-white dark:focus:bg-slate-700">
//                       Female
//                     </SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {hasActiveFilters && (
//                 <Button
//                   variant="outline"
//                   onClick={clearFilters}
//                   className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
//                 >
//                   <X className="mr-2 h-4 w-4" />
//                   Clear
//                 </Button>
//               )}
//             </div>

//             {/* Results count */}
//             <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
//               <span>
//                 Showing {startIndex + 1}-{Math.min(endIndex, filteredTeachers.length)} of {filteredTeachers.length} teachers
//                 {filteredTeachers.length !== teachers.length && ` (filtered from ${teachers.length} total)`}
//               </span>
//               {hasActiveFilters && (
//                 <span className="flex items-center gap-1">
//                   <Filter className="h-4 w-4" />
//                   Filters applied
//                 </span>
//               )}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Empty State */}
//       {filteredTeachers.length === 0 ? (
//         <Card className="dark:bg-slate-800 dark:border-slate-700">
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3 mb-4">
//               {hasActiveFilters ? (
//                 <Filter className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//               ) : (
//                 <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//               )}
//             </div>
//             <p className="text-slate-600 dark:text-slate-400 mb-4">
//               {hasActiveFilters ? "No teachers match your filters" : "No teachers found"}
//             </p>
//             {hasActiveFilters ? (
//               <Button onClick={clearFilters} variant="outline">
//                 Clear Filters
//               </Button>
//             ) : (
//               <Button onClick={handleCreate}>
//                 <Plus className="mr-2 h-4 w-4" />
//                 Add Your First Teacher
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       ) : (
//         <>
//           {/* Teachers Table */}
//           <div className="border rounded-lg dark:border-slate-700 overflow-hidden">
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow className="dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
//                     <TableHead className="dark:text-slate-300 w-16">Photo</TableHead>
//                     <TableHead className="dark:text-slate-300">Staff No</TableHead>
//                     <TableHead className="dark:text-slate-300">Name</TableHead>
//                     <TableHead className="dark:text-slate-300">Email</TableHead>
//                     <TableHead className="dark:text-slate-300">Phone</TableHead>
//                     <TableHead className="dark:text-slate-300">Role</TableHead>
//                     <TableHead className="dark:text-slate-300">Status</TableHead>
//                     <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {paginatedTeachers.map((teacher) => (
//                     <TableRow
//                       key={teacher.id}
//                       className="dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
//                     >
//                       <TableCell>
//                         <Avatar className="h-10 w-10">
//                           <AvatarImage
//                             src={teacher.profilePhoto || undefined}
//                             alt={`${teacher.firstName} ${teacher.lastName}`}
//                           />
//                           <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-medium">
//                             {teacher.firstName[0]}
//                             {teacher.lastName[0]}
//                           </AvatarFallback>
//                         </Avatar>
//                       </TableCell>
//                       <TableCell className="font-mono text-sm dark:text-slate-300">
//                         {teacher.staffNo}
//                       </TableCell>
//                       <TableCell className="font-medium dark:text-white">
//                         <div className="flex flex-col">
//                           <span>
//                             {teacher.firstName} {teacher.lastName}
//                           </span>
//                           <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
//                             {teacher.gender}
//                           </span>
//                         </div>
//                       </TableCell>
//                       <TableCell className="dark:text-slate-300">{teacher.email}</TableCell>
//                       <TableCell className="dark:text-slate-300">{teacher.phone}</TableCell>
//                       <TableCell className="dark:text-slate-300">{teacher.role}</TableCell>
//                       <TableCell>
//                         <Badge
//                           variant={teacher.user.status ? "default" : "secondary"}
//                           className={
//                             teacher.status === "ACTIVE"
//                               ? "bg-green-600 dark:bg-green-700 text-white"
//                               : teacher.status === "ON_LEAVE"
//                               ? "bg-orange-600 dark:bg-orange-700 text-white"
//                               : "bg-slate-600 dark:bg-slate-700 text-white"
//                           }
//                         >
//                           {teacher.status}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex justify-end gap-2">
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             asChild
//                             title="View Details"
//                             className="dark:hover:bg-slate-700"
//                           >
//                             <Link href={`/school/${slug}/users/teachers/${teacher.id}`}>
//                               <Eye className="h-4 w-4 dark:text-slate-300" />
//                             </Link>
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             onClick={() => handleEdit(teacher)}
//                             title="Edit Teacher"
//                             className="dark:hover:bg-slate-700"
//                           >
//                             <Pencil className="h-4 w-4 dark:text-slate-300" />
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             onClick={() => handleToggleStatus(teacher)}
//                             title={teacher.user.status ? "Deactivate" : "Activate"}
//                             className="dark:hover:bg-slate-700"
//                           >
//                             {teacher.user.status ? (
//                               <UserX className="h-4 w-4 text-orange-500 dark:text-orange-400" />
//                             ) : (
//                               <UserCheck className="h-4 w-4 text-green-500 dark:text-green-400" />
//                             )}
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             onClick={() => {
//                               setTeacherToDelete(teacher);
//                               setDeleteDialogOpen(true);
//                             }}
//                             title="Delete Teacher"
//                             className="dark:hover:bg-slate-700"
//                           >
//                             <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           </div>

//           {/* Pagination */}
//           {totalPages > 1 && (
//             <Card className="dark:bg-slate-800 dark:border-slate-700">
//               <CardContent className="py-4">
//                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
//                   <div className="text-sm text-slate-600 dark:text-slate-400">
//                     Page {currentPage} of {totalPages}
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={goToPreviousPage}
//                       disabled={currentPage === 1}
//                       className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
//                     >
//                       <ChevronLeft className="h-4 w-4" />
//                       Previous
//                     </Button>

//                     <div className="flex gap-1">
//                       {getPageNumbers().map((page, index) =>
//                         page === "..." ? (
//                           <span
//                             key={`ellipsis-${index}`}
//                             className="px-3 py-1 text-slate-600 dark:text-slate-400"
//                           >
//                             ...
//                           </span>
//                         ) : (
//                           <Button
//                             key={page}
//                             variant={currentPage === page ? "default" : "outline"}
//                             size="sm"
//                             onClick={() => goToPage(page as number)}
//                             className={
//                               currentPage === page
//                                 ? "bg-blue-600 text-white hover:bg-blue-700"
//                                 : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
//                             }
//                           >
//                             {page}
//                           </Button>
//                         )
//                       )}
//                     </div>

//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={goToNextPage}
//                       disabled={currentPage === totalPages}
//                       className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
//                     >
//                       Next
//                       <ChevronRight className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </>
//       )}

//       {/* Teacher Dialog */}
//       <TeacherDialog
//         open={dialogOpen}
//         onOpenChange={handleCloseDialog}
//         editingId={editingTeacher?.id}
//         initialData={editingTeacher}
//         schoolId={schoolId}
//       />

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
//           <AlertDialogHeader>
//             <AlertDialogTitle className="dark:text-white">
//               Are you absolutely sure?
//             </AlertDialogTitle>
//             <AlertDialogDescription className="dark:text-slate-400">
//               This will permanently delete{" "}
//               <span className="font-semibold dark:text-white">
//                 {teacherToDelete?.firstName} {teacherToDelete?.lastName}
//               </span>{" "}
//               and their user account. This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel className="dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
//               Cancel
//             </AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDelete}
//               className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
//             >
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }




// app/school/[slug]/users/teachers/components/teacher-list-client.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History,
  AlertTriangle,
  UserPlus,
  ArrowRightLeft,
} from "lucide-react";
import {
  enrollTeacherForYear,
  bulkEnrollTeachersForYear,
  markTeacherAsLeft,
  getAssignmentsNeedingReassignment,
  deleteTeacher,
  toggleTeacherStatus,
} from "@/actions/teachers";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TeacherDialog from "./teacher-dialogue";
import TeacherEnrollmentDialog from "./teacher-enrollment-dialogue";
import TeacherExitDialog from "./teacher-exit-dialogue";
import ReassignmentQueueDialog from "./reassignment-dialogue";

type TeachersListClientProps = {
  teachers: any[];
  academicYears: any[];
  currentYear: any;
  schoolId: string;
  slug: string;
  userId: string;
  hideAddTeacher?: boolean;    // DOS mode — hide Add/Edit/Delete teacher buttons
  detailLinkPrefix?: string;   // e.g. `/school/${slug}/dos/teachers` (defaults to admin path)
};

const ITEMS_PER_PAGE = 15;

export default function TeachersListClient({
  teachers,
  academicYears,
  currentYear,
  schoolId,
  slug,
  userId,
  hideAddTeacher = false,
  detailLinkPrefix,
}: TeachersListClientProps) {
  const defaultDetailPrefix = `/school/${slug}/users/teachers`;
  const teacherDetailBase = detailLinkPrefix ?? defaultDetailPrefix;
  const router = useRouter();
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [enrollingTeacher, setEnrollingTeacher] = useState<any>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [exitingTeacher, setExitingTeacher] = useState<any>(null);
  const [reassignmentDialogOpen, setReassignmentDialogOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(currentYear?.id || "");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("active");

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      // Tab filter (active vs inactive)
      const matchesTab =
        activeTab === "active"
          ? teacher.currentStatus === "ACTIVE"
          : teacher.currentStatus !== "ACTIVE";

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        teacher.firstName.toLowerCase().includes(searchLower) ||
        teacher.lastName.toLowerCase().includes(searchLower) ||
        teacher.email.toLowerCase().includes(searchLower) ||
        teacher.phone.includes(searchQuery) ||
        teacher.staffNo.toLowerCase().includes(searchLower) ||
        teacher.role.toLowerCase().includes(searchLower);

      // Employment type filter
      const matchesEmploymentType =
        employmentTypeFilter === "all" ||
        teacher.employmentType === employmentTypeFilter;

      // Gender filter
      const matchesGender =
        genderFilter === "all" || teacher.gender === genderFilter;

      return matchesTab && matchesSearch && matchesEmploymentType && matchesGender;
    });
  }, [teachers, searchQuery, employmentTypeFilter, genderFilter, activeTab]);

  // Statistics
  const activeTeachers = teachers.filter((t) => t.currentStatus === "ACTIVE");
  const inactiveTeachers = teachers.filter((t) => t.currentStatus !== "ACTIVE");
  const enrolledThisYear = teachers.filter((t) =>
    t.yearEnrollments?.some(
      (e: any) => e.academicYearId === selectedAcademicYear && e.isActive
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, employmentTypeFilter, genderFilter, activeTab]);

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    employmentTypeFilter !== "all" ||
    genderFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setEmploymentTypeFilter("all");
    setGenderFilter("all");
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  function formatTeacherForEdit(teacher: any) {
    return {
      ...teacher,
      dateOfBirth: teacher.dateOfBirth
        ? new Date(teacher.dateOfBirth).toISOString().split("T")[0]
        : "",
      dateOfHire: teacher.dateOfHire
        ? new Date(teacher.dateOfHire).toISOString().split("T")[0]
        : "",
      previousSchools: Array.isArray(teacher.previousSchools)
        ? teacher.previousSchools.join(", ")
        : "",
    };
  }

  function handleEdit(teacher: any) {
    setEditingTeacher(formatTeacherForEdit(teacher));
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditingTeacher(null);
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingTeacher(null);
  }

  function handleEnroll(teacher: any) {
    setEnrollingTeacher(teacher);
    setEnrollmentDialogOpen(true);
  }

  function handleMarkAsLeft(teacher: any) {
    setExitingTeacher(teacher);
    setExitDialogOpen(true);
  }

  async function handleBulkEnroll() {
    if (!selectedAcademicYear) {
      toast.error("Please select an academic year");
      return;
    }

    const result = await bulkEnrollTeachersForYear(schoolId, selectedAcademicYear);
    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  async function handleDelete() {
    if (!teacherToDelete) return;

    const result = await deleteTeacher(teacherToDelete.id);
    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setDeleteDialogOpen(false);
    setTeacherToDelete(null);
  }

  async function handleToggleStatus(teacher: any) {
    const result = await toggleTeacherStatus(teacher.id, teacher.user.status);
    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  function getYearEnrollmentStatus(teacher: any) {
    const enrollment = teacher.yearEnrollments?.find(
      (e: any) => e.academicYearId === selectedAcademicYear
    );

    if (!enrollment) {
      return <Badge variant="secondary">Not Enrolled</Badge>;
    }

    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-600 text-white",
      ON_LEAVE: "bg-yellow-600 text-white",
      COMPLETED: "bg-blue-600 text-white",
      LEFT_MID_YEAR: "bg-red-600 text-white",
      TRANSFERRED: "bg-blue-600 text-white",
      SUSPENDED: "bg-orange-600 text-white",
    };

    return (
      <Badge className={statusColors[enrollment.status] || "bg-gray-600 text-white"}>
        {enrollment.status}
      </Badge>
    );
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Teacher Management</h1>
          <p className="text-muted-foreground dark:text-slate-400">
            Manage enrollments, assignments, and history
          </p>
        </div>
        <div className="flex gap-2">
          {!hideAddTeacher && (
            <Button
              variant="outline"
              onClick={() => setReassignmentDialogOpen(true)}
              className="dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Check Reassignments
            </Button>
          )}
          <Button
            onClick={handleBulkEnroll}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Bulk Enroll for {currentYear?.year}
          </Button>
          {!hideAddTeacher && (
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          )}
        </div>
      </div>

      {/* Academic Year Selector */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium dark:text-white">Academic Year:</label>
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="w-[200px] dark:bg-slate-900 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-600">
                {academicYears.map((year) => (
                  <SelectItem
                    key={year.id}
                    value={year.id}
                    className="dark:text-white dark:focus:bg-slate-700"
                  >
                    {year.year} {year.isActive && "(Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              Total Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{teachers.length}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              Active Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {activeTeachers.length}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              Enrolled This Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
              {enrolledThisYear.length}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              Inactive Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
              {inactiveTeachers.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="dark:bg-slate-800">
          <TabsTrigger value="active" className="dark:data-[state=active]:bg-slate-700">
            Active Teachers ({activeTeachers.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="dark:data-[state=active]:bg-slate-700">
            Inactive Teachers ({inactiveTeachers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {/* Search and Filters */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, email, phone, staff number, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-slate-900 dark:border-slate-600"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                    <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600">
                      <SelectValue placeholder="Filter by employment type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-600">
                      <SelectItem value="all" className="dark:text-white dark:focus:bg-slate-700">
                        All Types
                      </SelectItem>
                      <SelectItem value="fulltime" className="dark:text-white dark:focus:bg-slate-700">
                        Full-time
                      </SelectItem>
                      <SelectItem value="parttime" className="dark:text-white dark:focus:bg-slate-700">
                        Part-time
                      </SelectItem>
                      <SelectItem value="contract" className="dark:text-white dark:focus:bg-slate-700">
                        Contract
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600">
                      <SelectValue placeholder="Filter by gender" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-600">
                      <SelectItem value="all" className="dark:text-white dark:focus:bg-slate-700">
                        All Genders
                      </SelectItem>
                      <SelectItem value="male" className="dark:text-white dark:focus:bg-slate-700">
                        Male
                      </SelectItem>
                      <SelectItem value="female" className="dark:text-white dark:focus:bg-slate-700">
                        Female
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="dark:bg-slate-900">
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredTeachers.length)} of{" "}
                    {filteredTeachers.length} teachers
                  </span>
                  {hasActiveFilters && (
                    <span className="flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      Filters applied
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teachers Table */}
          {filteredTeachers.length === 0 ? (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3 mb-4">
                  {hasActiveFilters ? (
                    <Filter className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {hasActiveFilters ? "No teachers match your filters" : "No teachers found"}
                </p>
                {hasActiveFilters ? (
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                ) : (
                  !hideAddTeacher && (
                    <Button onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Teacher
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="border rounded-lg dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="dark:text-slate-300 w-16">Photo</TableHead>
                        <TableHead className="dark:text-slate-300">Staff No</TableHead>
                        <TableHead className="dark:text-slate-300">Name</TableHead>
                        <TableHead className="dark:text-slate-300">Email</TableHead>
                        <TableHead className="dark:text-slate-300">Year Status</TableHead>
                        <TableHead className="dark:text-slate-300">Assignments</TableHead>
                        <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTeachers.map((teacher) => (
                        <TableRow
                          key={teacher.id}
                          className="dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <TableCell>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={teacher.profilePhoto || undefined} />
                              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-medium">
                                {teacher.firstName[0]}
                                {teacher.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-mono text-sm dark:text-slate-300">
                            {teacher.staffNo}
                          </TableCell>
                          <TableCell className="font-medium dark:text-white">
                            {teacher.firstName} {teacher.lastName}
                          </TableCell>
                          <TableCell className="dark:text-slate-300">{teacher.email}</TableCell>
                          <TableCell>{getYearEnrollmentStatus(teacher)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="dark:border-slate-600">
                              {teacher.streamSubjectAssignments?.length || 0} assignments
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                title="View Details"
                                className="dark:hover:bg-slate-700"
                              >
                                <Link href={`${teacherDetailBase}/${teacher.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEnroll(teacher)}
                                title="Enroll for Year"
                                className="dark:hover:bg-slate-700"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                              {!hideAddTeacher && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(teacher)}
                                  title="Edit Teacher"
                                  className="dark:hover:bg-slate-700"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {!hideAddTeacher && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsLeft(teacher)}
                                  title="Mark as Left"
                                  className="text-red-600 dark:hover:bg-slate-700"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Page {currentPage} of {totalPages}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="dark:bg-slate-900"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {getPageNumbers().map((page, index) =>
                            page === "..." ? (
                              <span key={`ellipsis-${index}`} className="px-3 py-1 dark:text-slate-400">
                                ...
                              </span>
                            ) : (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(page as number)}
                                className={
                                  currentPage === page
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "dark:bg-slate-900"
                                }
                              >
                                {page}
                              </Button>
                            )
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="dark:bg-slate-900"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4 mt-4">
          {/* Similar structure for inactive teachers */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-slate-700">
                    <TableHead className="dark:text-slate-300">Staff No</TableHead>
                    <TableHead className="dark:text-slate-300">Name</TableHead>
                    <TableHead className="dark:text-slate-300">Status</TableHead>
                    <TableHead className="dark:text-slate-300">Exit Date</TableHead>
                    <TableHead className="dark:text-slate-300">Exit Reason</TableHead>
                    <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveTeachers.map((teacher) => (
                    <TableRow key={teacher.id} className="dark:border-slate-700">
                      <TableCell className="font-mono text-sm dark:text-slate-300">
                        {teacher.staffNo}
                      </TableCell>
                      <TableCell className="font-medium dark:text-white">
                        {teacher.firstName} {teacher.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-600 text-white">{teacher.currentStatus}</Badge>
                      </TableCell>
                      <TableCell className="dark:text-slate-300">
                        {teacher.exitDate
                          ? new Date(teacher.exitDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="dark:text-slate-300 max-w-xs truncate">
                        {teacher.exitReason || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          title="View Details"
                          className="dark:hover:bg-slate-700"
                        >
                          <Link href={`${teacherDetailBase}/${teacher.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TeacherDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        editingId={editingTeacher?.id}
        initialData={editingTeacher}
        schoolId={schoolId}
      />

      <TeacherEnrollmentDialog
        open={enrollmentDialogOpen}
        onOpenChange={setEnrollmentDialogOpen}
        teacher={enrollingTeacher}
        academicYears={academicYears}
        currentYear={currentYear}
      />

      <TeacherExitDialog
        open={exitDialogOpen}
        onOpenChange={setExitDialogOpen}
        teacher={exitingTeacher}
        academicYearId={selectedAcademicYear}
      />

      <ReassignmentQueueDialog
        open={reassignmentDialogOpen}
        onOpenChange={setReassignmentDialogOpen}
        schoolId={schoolId}
        teachers={activeTeachers}
        userId={userId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              This will permanently delete{" "}
              <span className="font-semibold dark:text-white">
                {teacherToDelete?.firstName} {teacherToDelete?.lastName}
              </span>{" "}
              and their user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
// "use client";

// import { useState } from "react";
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
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Badge } from "@/components/ui/badge";
// import {
//   Plus,
//   Search,
//   MoreHorizontal,
//   Eye,
//   Edit,
//   UserPlus,
//   Trash2,
//   Download,
//   Upload,
// } from "lucide-react";
// import Link from "next/link";
// import { format } from "date-fns";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import EditStudentDialog from "./edit-student-dialogue";
// import EnrollStudentDialog from "./enroll-student-dialogue";
// import DeleteStudentDialog from "./delete-student-dialogue";
// import AddStudentDialog from "./add-student-dialogue";

// // ════════════════════════════════════════════════════════════════════════════
// // TYPES
// // ════════════════════════════════════════════════════════════════════════════

// type Student = {
//   id: string;
//   admissionNo: string;
//   firstName: string;
//   lastName: string;
//   otherNames?: string | null;
//   gender: string;
//   dob: Date;
//   nationality: string;
//   imageUrl?: string | null;
//   isActive: boolean;
//   NIN?: string | null;
//   bloodGroup?: string | null;
//   village?: string | null;
//   religion?: string | null;
//   parentId: string; // ✅ Added this
//   medicalConditions?: string | null;
//   disability?: string | null;
//   previousSchool?: string | null;
//   parent: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     phone: string;
//   };
//   enrollments: Array<{
//     id: string;
//     status: string;
//     classYear: {
//       id: string;
//       classTemplate: {
//         id: string;
//         name: string;
//         code?: string | null;
//       };
//     };
//     stream?: {
//       id: string;
//       name: string;
//     } | null;
//     academicYear: {
//       id: string;
//       year: string;
//     };
//     term: {
//       id: string;
//       name: string;
//       termNumber: number;
//     };
//   }>;
// };

// type Parent = {
//   id: string;
//   firstName: string;
//   lastName: string;
//   phone: string;
//   email?: string | null;
// };

// type AcademicYear = {
//   id: string;
//   year: string;
//   isActive: boolean;
// };

// type ClassTemplate = {
//   id: string;
//   name: string;
//   code?: string | null;
//   level?: number | null;
// };

// type ClassYear = {
//   id: string;
//   name: string;
//   academicYearId: string;
//   classTemplate: {
//     id: string;
//     name: string;
//     code?: string | null;
//   };
//   streams: Array<{
//     id: string;
//     name: string;
//   }>;
// };

// export type ClassYearUI = {
//   id: string;
//   name: string;
//   academicYearId: string;
// };

// export type StreamUI = {
//   id: string;
//   name: string;
//   classYearId: string;
// };

// type Props = {
//   students: Student[];
//   parents: Parent[];
//   academicYears: AcademicYear[];
//   currentYear: AcademicYear | undefined;
//   classTemplates: ClassTemplate[];
//   classYears: ClassYearUI[];
//   streams: StreamUI[];
//   schoolId: string;
//   slug: string;
//   userId: string;
// };

// // ════════════════════════════════════════════════════════════════════════════
// // COMPONENT
// // ════════════════════════════════════════════════════════════════════════════

// export default function StudentsListClient({
//   students,
//   parents,
//   academicYears,
//   currentYear,
//   classTemplates,
//   classYears,
//   streams,
//   schoolId,
//   slug,
//   userId,
// }: Props) {
//   // ══════════════════════════════════════════════════════════════════════════
//   // STATE
//   // ══════════════════════════════════════════════════════════════════════════
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedClass, setSelectedClass] = useState<string>("all");
//   const [selectedGender, setSelectedGender] = useState<string>("all");
//   const [selectedStatus, setSelectedStatus] = useState<string>("all");

//   // Dialog states
//   const [addDialogOpen, setAddDialogOpen] = useState(false);
//   const [editDialogOpen, setEditDialogOpen] = useState(false);
//   const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

//   // ══════════════════════════════════════════════════════════════════════════
//   // COMPUTED VALUES
//   // ══════════════════════════════════════════════════════════════════════════

//   // Filter students based on search and filters
//   const filteredStudents = students.filter((student) => {
//     const matchesSearch =
//       student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       student.parent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       student.parent.lastName.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesClass =
//       selectedClass === "all" ||
//       student.enrollments[0]?.classYear.classTemplate.id === selectedClass;

//     const matchesGender =
//       selectedGender === "all" || student.gender === selectedGender;

//     const hasActiveEnrollment = student.enrollments.some(
//       (e) => e.status === "ACTIVE"
//     );
//     const matchesStatus =
//       selectedStatus === "all" ||
//       (selectedStatus === "enrolled" && hasActiveEnrollment) ||
//       (selectedStatus === "unenrolled" && !hasActiveEnrollment);

//     return matchesSearch && matchesClass && matchesGender && matchesStatus;
//   });

//   // Statistics
//   const stats = {
//     total: students.length,
//     active: students.filter((s) =>
//       s.enrollments.some((e) => e.status === "ACTIVE")
//     ).length,
//     male: students.filter((s) => s.gender === "MALE").length,
//     female: students.filter((s) => s.gender === "FEMALE").length,
//   };

//   // ══════════════════════════════════════════════════════════════════════════
//   // HELPER FUNCTIONS
//   // ══════════════════════════════════════════════════════════════════════════

//   const getStudentFullName = (student: Student) => {
//     return `${student.firstName} ${student.lastName}${
//       student.otherNames ? ` ${student.otherNames}` : ""
//     }`;
//   };

//   const getStudentStatus = (student: Student) => {
//     if (student.enrollments.length === 0) {
//       return { label: "Not Enrolled", variant: "secondary" as const };
//     }
//     const enrollment = student.enrollments[0];
//     if (enrollment.status === "ACTIVE") {
//       return { label: "Active", variant: "default" as const };
//     }
//     return { label: enrollment.status, variant: "secondary" as const };
//   };

//   // ══════════════════════════════════════════════════════════════════════════
//   // EVENT HANDLERS
//   // ══════════════════════════════════════════════════════════════════════════

//   const handleEdit = (student: Student) => {
//     setSelectedStudent(student);
//     setEditDialogOpen(true);
//   };

//   const handleEnroll = (student: Student) => {
//     setSelectedStudent(student);
//     setEnrollDialogOpen(true);
//   };

//   const handleDelete = (student: Student) => {
//     setSelectedStudent(student);
//     setDeleteDialogOpen(true);
//   };

//   // ══════════════════════════════════════════════════════════════════════════
//   // RENDER
//   // ══════════════════════════════════════════════════════════════════════════

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Students</h1>
//           <p className="text-muted-foreground">
//             Manage student registrations and enrollments
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button variant="outline" size="sm">
//             <Upload className="mr-2 h-4 w-4" />
//             Import
//           </Button>
//           <Button variant="outline" size="sm">
//             <Download className="mr-2 h-4 w-4" />
//             Export
//           </Button>
//           <Button onClick={() => setAddDialogOpen(true)} size="sm">
//             <Plus className="mr-2 h-4 w-4" />
//             Add Student
//           </Button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid gap-4 md:grid-cols-4">
//         <div className="rounded-lg border p-4">
//           <div className="text-2xl font-bold">{stats.total}</div>
//           <p className="text-sm text-muted-foreground">Total Students</p>
//         </div>
//         <div className="rounded-lg border p-4">
//           <div className="text-2xl font-bold">{stats.active}</div>
//           <p className="text-sm text-muted-foreground">Active Enrollments</p>
//         </div>
//         <div className="rounded-lg border p-4">
//           <div className="text-2xl font-bold">{stats.male}</div>
//           <p className="text-sm text-muted-foreground">Male Students</p>
//         </div>
//         <div className="rounded-lg border p-4">
//           <div className="text-2xl font-bold">{stats.female}</div>
//           <p className="text-sm text-muted-foreground">Female Students</p>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="flex items-center gap-4">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//           <Input
//             placeholder="Search by name, admission number, or parent..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         <Select value={selectedClass} onValueChange={setSelectedClass}>
//           <SelectTrigger className="w-[200px]">
//             <SelectValue placeholder="Filter by class" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Classes</SelectItem>
//             {classTemplates.map((template) => (
//               <SelectItem key={template.id} value={template.id}>
//                 {template.name}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//         <Select value={selectedGender} onValueChange={setSelectedGender}>
//           <SelectTrigger className="w-[150px]">
//             <SelectValue placeholder="Gender" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Genders</SelectItem>
//             <SelectItem value="MALE">Male</SelectItem>
//             <SelectItem value="FEMALE">Female</SelectItem>
//           </SelectContent>
//         </Select>
//         <Select value={selectedStatus} onValueChange={setSelectedStatus}>
//           <SelectTrigger className="w-[150px]">
//             <SelectValue placeholder="Status" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Status</SelectItem>
//             <SelectItem value="enrolled">Enrolled</SelectItem>
//             <SelectItem value="unenrolled">Not Enrolled</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Students Table */}
//       <div className="rounded-md border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Admission No.</TableHead>
//               <TableHead>Student Name</TableHead>
//               <TableHead>Gender</TableHead>
//               <TableHead>Date of Birth</TableHead>
//               <TableHead>Parent/Guardian</TableHead>
//               <TableHead>Current Class</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {filteredStudents.length === 0 ? (
//               <TableRow>
//                 <TableCell
//                   colSpan={8}
//                   className="text-center py-8 text-muted-foreground"
//                 >
//                   {students.length === 0
//                     ? "No students found. Add your first student to get started."
//                     : "No students match your search criteria."}
//                 </TableCell>
//               </TableRow>
//             ) : (
//               filteredStudents.map((student) => {
//                 const currentEnrollment = student.enrollments[0];
//                 const status = getStudentStatus(student);

//                 return (
//                   <TableRow key={student.id}>
//                     <TableCell className="font-medium">
//                       {student.admissionNo}
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-3">
//                         {student.imageUrl ? (
//                           <img
//                             src={student.imageUrl}
//                             alt={getStudentFullName(student)}
//                             className="h-8 w-8 rounded-full object-cover"
//                           />
//                         ) : (
//                           <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
//                             {student.firstName[0]}
//                             {student.lastName[0]}
//                           </div>
//                         )}
//                         <div>
//                           <div className="font-medium">
//                             {getStudentFullName(student)}
//                           </div>
//                         </div>
//                       </div>
//                     </TableCell>
//                     <TableCell>{student.gender}</TableCell>
//                     <TableCell>
//                       {format(new Date(student.dob), "dd MMM yyyy")}
//                     </TableCell>
//                     <TableCell>
//                       <div className="text-sm">
//                         <div className="font-medium">
//                           {student.parent.firstName} {student.parent.lastName}
//                         </div>
//                         <div className="text-muted-foreground">
//                           {student.parent.phone}
//                         </div>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       {currentEnrollment ? (
//                         <div className="text-sm">
//                           <div className="font-medium">
//                             {currentEnrollment.classYear.classTemplate.name}
//                             {currentEnrollment.stream &&
//                               ` - ${currentEnrollment.stream.name}`}
//                           </div>
//                           <div className="text-muted-foreground">
//                             {currentEnrollment.term.name},{" "}
//                             {currentEnrollment.academicYear.year}
//                           </div>
//                         </div>
//                       ) : (
//                         <span className="text-muted-foreground">-</span>
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant={status.variant}>{status.label}</Badge>
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" size="icon">
//                             <MoreHorizontal className="h-4 w-4" />
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                           <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                           <DropdownMenuSeparator />
//                           <DropdownMenuItem asChild>
//                             <Link
//                               href={`/school/${slug}/users/students/${student.id}`}
//                             >
//                               <Eye className="mr-2 h-4 w-4" />
//                               View Details
//                             </Link>
//                           </DropdownMenuItem>
//                           <DropdownMenuItem onClick={() => handleEdit(student)}>
//                             <Edit className="mr-2 h-4 w-4" />
//                             Edit Student
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             onClick={() => handleEnroll(student)}
//                           >
//                             <UserPlus className="mr-2 h-4 w-4" />
//                             Enroll in Class
//                           </DropdownMenuItem>
//                           <DropdownMenuSeparator />
//                           <DropdownMenuItem
//                             onClick={() => handleDelete(student)}
//                             className="text-destructive"
//                           >
//                             <Trash2 className="mr-2 h-4 w-4" />
//                             Delete Student
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </TableCell>
//                   </TableRow>
//                 );
//               })
//             )}
//           </TableBody>
//         </Table>
//       </div>

//       {/* Dialogs */}
//       <AddStudentDialog
//         open={addDialogOpen}
//         onOpenChange={setAddDialogOpen}
//         parents={parents}
//         classYears={classYears}
//         streams={streams}
//         schoolId={schoolId}
//         enrolledById={userId}
//       />

//       {selectedStudent && (
//         <>
//           <EditStudentDialog
//             open={editDialogOpen}
//             onOpenChange={setEditDialogOpen}
//             student={selectedStudent}
//             parents={parents}
//             schoolId={schoolId}
//           />

//           <EnrollStudentDialog
//             open={enrollDialogOpen}
//             onOpenChange={setEnrollDialogOpen}
//             student={selectedStudent}
//             academicYears={academicYears}
//             classYears={classYears}
//             schoolId={schoolId}
//           />

//           <DeleteStudentDialog
//             open={deleteDialogOpen}
//             onOpenChange={setDeleteDialogOpen}
//             student={selectedStudent}
//             schoolId={schoolId}
//           />
//         </>
//       )}
//     </div>
//   );
// }




"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  Trash2,
  Download,
  Upload,
  Users,
  UserCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Lazy-load heavy dialogs — they are only shown on user interaction so
// deferring their JS reduces the initial bundle for this route.
const AddStudentDialog    = dynamic(() => import("./add-student-dialogue"),    { ssr: false });
const EditStudentDialog   = dynamic(() => import("./edit-student-dialogue"),   { ssr: false });
const EnrollStudentDialog = dynamic(() => import("./enroll-student-dialogue"), { ssr: false });
const DeleteStudentDialog = dynamic(() => import("./delete-student-dialogue"), { ssr: false });
const BulkImportDialog    = dynamic(() => import("./bulk-import-dialog"),      { ssr: false });

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Student = {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  gender: string;
  dob: Date;
  nationality: string;
  imageUrl?: string | null;
  isActive: boolean;
  NIN?: string | null;
  bloodGroup?: string | null;
  village?: string | null;
  religion?: string | null;
  parentId: string;
  medicalConditions?: string | null;
  disability?: string | null;
  previousSchool?: string | null;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  enrollments: Array<{
    id: string;
    status: string;
    classYear: {
      id: string;
      classTemplate: { id: string; name: string; code?: string | null };
    };
    stream?: { id: string; name: string } | null;
    academicYear: { id: string; year: string };
    term: { id: string; name: string; termNumber: number };
  }>;
};

type Parent = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
};

type AcademicYear = {
  id: string;
  year: string;
  isActive: boolean;
};

type ClassTemplate = {
  id: string;
  name: string;
  code?: string | null;
  level?: number | null;
};

export type ClassYearUI = {
  id: string;
  name: string;
  academicYearId: string;
  classLevel?: string;
};

export type StreamUI = {
  id: string;
  name: string;
  classYearId: string;
};

type Props = {
  students: Student[];
  parents: Parent[];
  academicYears: AcademicYear[];
  currentYear: AcademicYear | undefined;
  classTemplates: ClassTemplate[];
  classYears: ClassYearUI[];
  streams: StreamUI[];
  schoolId: string;
  schoolCode: string;
  slug: string;
  userId: string;
};

// ════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] p-5 flex items-center gap-4">
      <div className={cn("rounded-lg p-2.5", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</div>
        <p className="text-sm text-zinc-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function StudentsListClient({
  students,
  parents,
  academicYears,
  currentYear,
  classTemplates,
  classYears,
  streams,
  schoolId,
  schoolCode,
  slug,
  userId,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.parent.firstName.toLowerCase().includes(q) ||
      s.parent.lastName.toLowerCase().includes(q);

    const matchClass =
      selectedClass === "all" ||
      s.enrollments[0]?.classYear.classTemplate.id === selectedClass;

    const matchGender =
      selectedGender === "all" || s.gender === selectedGender;

    const hasActive = s.enrollments.some((e) => e.status === "ACTIVE");
    const matchStatus =
      selectedStatus === "all" ||
      (selectedStatus === "enrolled" && hasActive) ||
      (selectedStatus === "unenrolled" && !hasActive);

    return matchSearch && matchClass && matchGender && matchStatus;
  });

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: students.length,
    active: students.filter((s) =>
      s.enrollments.some((e) => e.status === "ACTIVE")
    ).length,
    male: students.filter((s) => s.gender === "MALE").length,
    female: students.filter((s) => s.gender === "FEMALE").length,
  };

  const fullName = (s: Student) =>
    `${s.firstName} ${s.lastName}${s.otherNames ? ` ${s.otherNames}` : ""}`;

  const studentStatus = (s: Student) => {
    if (!s.enrollments.length)
      return { label: "Not Enrolled", variant: "secondary" as const };
    const e = s.enrollments[0];
    if (e.status === "ACTIVE") return { label: "Active", variant: "default" as const };
    return { label: e.status, variant: "secondary" as const };
  };

  const handleEdit = (s: Student) => { setSelectedStudent(s); setEditDialogOpen(true); };
  const handleEnroll = (s: Student) => { setSelectedStudent(s); setEnrollDialogOpen(true); };
  const handleDelete = (s: Student) => { setSelectedStudent(s); setDeleteDialogOpen(true); };

  const selectTrigger =
    "bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700/60 text-zinc-900 dark:text-white";
  const selectContent =
    "bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700/60";
  const selectItem =
    "text-zinc-900 dark:text-white focus:bg-zinc-50 dark:focus:bg-[#1a2236]";

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Students
          </h1>
          <p className="text-zinc-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            Manage student registrations and enrolments
            {currentYear && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {currentYear.year}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setBulkImportOpen(true)}
            className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] text-zinc-700 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-[#1a2236]"
          >
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>          <Button
            variant="outline" size="sm"
            className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] text-zinc-700 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-[#1a2236]"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Students"    value={stats.total}  icon={Users}      accent="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <StatCard label="Active Enrolments" value={stats.active} icon={UserCheck}  accent="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Male Students"     value={stats.male}   icon={User}       accent="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <StatCard label="Female Students"   value={stats.female} icon={User}       accent="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-slate-500" />
          <Input
            placeholder="Search by name, admission no. or parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-slate-500"
          />
        </div>

        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className={cn(selectTrigger, "w-[180px]")}>
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent className={selectContent}>
            <SelectItem value="all" className={selectItem}>All Classes</SelectItem>
            {classTemplates.map((t) => (
              <SelectItem key={t.id} value={t.id} className={selectItem}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedGender} onValueChange={setSelectedGender}>
          <SelectTrigger className={cn(selectTrigger, "w-[140px]")}>
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent className={selectContent}>
            <SelectItem value="all" className={selectItem}>All Genders</SelectItem>
            <SelectItem value="MALE" className={selectItem}>Male</SelectItem>
            <SelectItem value="FEMALE" className={selectItem}>Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className={cn(selectTrigger, "w-[150px]")}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className={selectContent}>
            <SelectItem value="all" className={selectItem}>All Status</SelectItem>
            <SelectItem value="enrolled" className={selectItem}>Enrolled</SelectItem>
            <SelectItem value="unenrolled" className={selectItem}>Not Enrolled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 dark:border-slate-700/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 dark:border-slate-700/60 bg-zinc-50 dark:bg-[#0d1117] hover:bg-zinc-50 dark:hover:bg-[#0d1117]">
              {["Admission No.", "Student Name", "Gender", "Date of Birth", "Parent/Guardian", "Current Class", "Status", ""].map((h, i) => (
                <TableHead
                  key={i}
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400",
                    h === "" && "text-right w-10"
                  )}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-zinc-400 dark:text-slate-500">
                  {students.length === 0
                    ? "No students yet. Add your first student to get started."
                    : "No students match your search criteria."}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => {
                const enrollment = student.enrollments[0];
                const status = studentStatus(student);

                return (
                  <TableRow
                    key={student.id}
                    className="border-zinc-100 dark:border-slate-700/40 hover:bg-zinc-50 dark:hover:bg-[#1a2236] transition-colors bg-white dark:bg-[#111827]"
                  >
                    {/* Admission No */}
                    <TableCell className="font-mono text-sm font-medium text-zinc-700 dark:text-slate-300">
                      {student.admissionNo}
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {student.imageUrl ? (
                          <img
                            src={student.imageUrl}
                            alt={fullName(student)}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-slate-700/60"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300 ring-2 ring-zinc-100 dark:ring-slate-700/60 shrink-0">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                        )}
                        <span className="font-medium text-zinc-900 dark:text-white text-sm">
                          {fullName(student)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Gender */}
                    <TableCell className="text-sm text-zinc-600 dark:text-slate-400">
                      {student.gender.charAt(0) + student.gender.slice(1).toLowerCase()}
                    </TableCell>

                    {/* DOB */}
                    <TableCell className="text-sm text-zinc-600 dark:text-slate-400">
                      {format(new Date(student.dob), "dd MMM yyyy")}
                    </TableCell>

                    {/* Parent */}
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-zinc-900 dark:text-white">
                          {student.parent.firstName} {student.parent.lastName}
                        </div>
                        <div className="text-zinc-500 dark:text-slate-400 text-xs">
                          {student.parent.phone}
                        </div>
                      </div>
                    </TableCell>

                    {/* Class */}
                    <TableCell>
                      {enrollment ? (
                        <div className="text-sm">
                          <div className="font-medium text-zinc-900 dark:text-white">
                            {enrollment.classYear.classTemplate.name}
                            {enrollment.stream && ` · ${enrollment.stream.name}`}
                          </div>
                          <div className="text-zinc-500 dark:text-slate-400 text-xs">
                            {enrollment.term.name}, {enrollment.academicYear.year}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 dark:text-slate-500 text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell>
                      <Badge
                        variant={status.variant}
                        className={cn(
                          "border-0 text-xs font-medium",
                          status.variant === "default"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-zinc-100 dark:bg-slate-700/50 text-zinc-600 dark:text-slate-400"
                        )}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            className="text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1a2236]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700/60"
                        >
                          <DropdownMenuLabel className="text-zinc-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-slate-700/60" />
                          <DropdownMenuItem asChild className="text-zinc-700 dark:text-slate-300 focus:bg-zinc-50 dark:focus:bg-[#1a2236] cursor-pointer">
                            <Link href={`/school/${slug}/users/students/${student.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(student)} className="text-zinc-700 dark:text-slate-300 focus:bg-zinc-50 dark:focus:bg-[#1a2236] cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit Student
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEnroll(student)} className="text-zinc-700 dark:text-slate-300 focus:bg-zinc-50 dark:focus:bg-[#1a2236] cursor-pointer">
                            <UserPlus className="mr-2 h-4 w-4" /> Enrol in Class
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-slate-700/60" />
                          <DropdownMenuItem onClick={() => handleDelete(student)} className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <AddStudentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        parents={parents}
        classYears={classYears}
        streams={streams}
        schoolId={schoolId}
        schoolCode={schoolCode}
        enrolledById={userId}
      />

      <BulkImportDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        schoolId={schoolId}
        userId={userId}
        slug={slug}
        classYears={classYears}
        streams={streams}
      />

      {selectedStudent && (
        <>
          <EditStudentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            student={selectedStudent}
            parents={parents}
            schoolId={schoolId}
          />
          <EnrollStudentDialog
            userId={userId}
            open={enrollDialogOpen}
            onOpenChange={setEnrollDialogOpen}
            student={selectedStudent}
            academicYears={academicYears}
            classYears={classYears}
            schoolId={schoolId}
          />
          <DeleteStudentDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            student={selectedStudent}
            schoolId={schoolId}
          />
        </>
      )}
    </div>
  );
}
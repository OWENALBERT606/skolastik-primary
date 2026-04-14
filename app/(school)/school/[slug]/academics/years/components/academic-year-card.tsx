// // components/academic-years/AcademicYearCard.tsx
// "use client";

// import { useState } from "react";
// import { AcademicYear } from "@prisma/client";
// import { Button } from "@/components/ui/button";
// import {
//   Calendar,
//   Users,
//   BookOpen,
//   MoreVertical,
//   Edit,
//   Trash2,
//   Eye,
//   Power,
//   CheckCircle2,
// } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Badge } from "@/components/ui/badge";
// import { toast } from "sonner";
// import { format } from "date-fns";
// import { toggleAcademicYearStatus } from "@/actions/years";
// import UpdateAcademicYearDialog from "./update-academic-year-dialogue";
// import DeleteAcademicYearDialog from "./delete-academic-year-dialogue";
// import AcademicYearDetailsDialog from "./academic-year-detail-dialogue";

// interface AcademicYearCardProps {
//   academicYear: any;
//   onUpdate: (year: any) => void;
//   onDelete: (id: string) => void;
// }

// export default function AcademicYearCard({
//   academicYear,
//   onUpdate,
//   onDelete,
// }: AcademicYearCardProps) {
//   const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
//   const [isToggling, setIsToggling] = useState(false);

//   const handleToggleStatus = async () => {
//     setIsToggling(true);
//     try {
//       const result = await toggleAcademicYearStatus(academicYear.id);
//       if (result.ok) {
//         onUpdate(result.data);
//         toast.success(
//           `Academic year ${result.data.isActive ? "activated" : "deactivated"} successfully`
//         );
//       } else {
//         toast.error(result.error);
//       }
//     } catch (error) {
//       toast.error("Failed to toggle status");
//     } finally {
//       setIsToggling(false);
//     }
//   };

//   const formatDate = (date: Date | null | undefined) => {
//     if (!date) return "Not set";
//     return format(new Date(date), "MMM dd, yyyy");
//   };

//   return (
//     <>
//       <div className="bg-white rounded-lg border hover:shadow-md transition-shadow">
//         <div className="p-6">
//           {/* Header */}
//           <div className="flex items-start justify-between mb-4">
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mb-2">
//                 <h3 className="text-xl font-bold text-gray-900">
//                   {academicYear.year}
//                 </h3>
//                 <Badge
//                   variant={academicYear.isActive ? "default" : "secondary"}
//                   className={
//                     academicYear.isActive
//                       ? "bg-green-100 text-green-800 hover:bg-green-100"
//                       : ""
//                   }
//                 >
//                   {academicYear.isActive ? (
//                     <>
//                       <CheckCircle2 className="w-3 h-3 mr-1" />
//                       Active
//                     </>
//                   ) : (
//                     "Inactive"
//                   )}
//                 </Badge>
//               </div>

//               {/* Dates */}
//               <div className="text-sm text-gray-600 space-y-1">
//                 <p>
//                   <span className="font-medium">Start:</span>{" "}
//                   {formatDate(academicYear.startDate)}
//                 </p>
//                 <p>
//                   <span className="font-medium">End:</span>{" "}
//                   {formatDate(academicYear.endDate)}
//                 </p>
//               </div>
//             </div>

//             {/* Actions Dropdown */}
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" size="icon">
//                   <MoreVertical className="w-4 h-4" />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end">
//                 <DropdownMenuItem onClick={() => setDetailsDialogOpen(true)}>
//                   <Eye className="w-4 h-4 mr-2" />
//                   View Details
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => setUpdateDialogOpen(true)}>
//                   <Edit className="w-4 h-4 mr-2" />
//                   Edit
//                 </DropdownMenuItem>
//                 <DropdownMenuItem
//                   onClick={handleToggleStatus}
//                   disabled={isToggling}
//                 >
//                   <Power className="w-4 h-4 mr-2" />
//                   {academicYear.isActive ? "Deactivate" : "Activate"}
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem
//                   onClick={() => setDeleteDialogOpen(true)}
//                   className="text-red-600"
//                   disabled={academicYear.stats?.hasData}
//                 >
//                   <Trash2 className="w-4 h-4 mr-2" />
//                   Delete
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-3 gap-4 pt-4 border-t">
//             <StatItem
//               icon={<BookOpen className="w-4 h-4 text-blue-600" />}
//               label="Terms"
//               value={academicYear.stats?.totalTerms || 0}
//             />
//             <StatItem
//               icon={<Users className="w-4 h-4 text-green-600" />}
//               label="Enrollments"
//               value={academicYear.stats?.totalEnrollments || 0}
//             />
//             <StatItem
//               icon={<Calendar className="w-4 h-4 text-blue-600" />}
//               label="Created"
//               value={format(new Date(academicYear.createdAt), "MMM yyyy")}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Dialogs */}
//       <UpdateAcademicYearDialog
//         open={updateDialogOpen}
//         onOpenChange={setUpdateDialogOpen}
//         academicYear={academicYear}
//         onSuccess={onUpdate}
//       />

//       <DeleteAcademicYearDialog
//         open={deleteDialogOpen}
//         onOpenChange={setDeleteDialogOpen}
//         academicYear={academicYear}
//         onSuccess={() => onDelete(academicYear.id)}
//       />

//       <AcademicYearDetailsDialog
//         open={detailsDialogOpen}
//         onOpenChange={setDetailsDialogOpen}
//         academicYearId={academicYear.id}
//       />
//     </>
//   );
// }

// function StatItem({
//   icon,
//   label,
//   value,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value: string | number;
// }) {
//   return (
//     <div className="text-center">
//       <div className="flex justify-center mb-1">{icon}</div>
//       <p className="text-xs text-gray-600">{label}</p>
//       <p className="text-sm font-semibold text-gray-900">{value}</p>
//     </div>
//   );
// }




// components/academic-years/AcademicYearCard.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  BookOpen,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Power,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { toggleAcademicYearStatus } from "@/actions/years";
import UpdateAcademicYearDialog from "./update-academic-year-dialogue";
import DeleteAcademicYearDialog from "./delete-academic-year-dialogue";
import AcademicYearDetailsDialog from "./academic-year-detail-dialogue";

interface AcademicYearCardProps {
  academicYear: any;
  onUpdate: (year: any) => void;
  onDelete: (id: string) => void;
}

export default function AcademicYearCard({
  academicYear,
  onUpdate,
  onDelete,
}: AcademicYearCardProps) {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const result = await toggleAcademicYearStatus(academicYear.id);
      if (result.ok) {
        onUpdate(result.data);
        toast.success(
          `Academic year ${result.data.isActive ? "activated" : "deactivated"} successfully`
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to toggle status");
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return format(new Date(date), "MMM dd, yyyy");
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md dark:hover:shadow-gray-800/40 transition-shadow">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {academicYear.year}
                </h3>

                <Badge
                  variant={academicYear.isActive ? "default" : "secondary"}
                  className={
                    academicYear.isActive
                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                      : "dark:bg-gray-800 dark:text-gray-300"
                  }
                >
                  {academicYear.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    "Inactive"
                  )}
                </Badge>
              </div>

              {/* Dates */}
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  <span className="font-medium">Start:</span>{" "}
                  {formatDate(academicYear.startDate)}
                </p>
                <p>
                  <span className="font-medium">End:</span>{" "}
                  {formatDate(academicYear.endDate)}
                </p>
              </div>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              >
                <DropdownMenuItem onClick={() => setDetailsDialogOpen(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setUpdateDialogOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleToggleStatus}
                  disabled={isToggling}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {academicYear.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 dark:text-red-400"
                  disabled={academicYear.stats?.hasData}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <StatItem
              icon={<BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              label="Terms"
              value={academicYear.stats?.totalTerms || 0}
            />
            <StatItem
              icon={<Users className="w-4 h-4 text-green-600 dark:text-green-400" />}
              label="Enrollments"
              value={academicYear.stats?.totalEnrollments || 0}
            />
            <StatItem
              icon={<Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              label="Created"
              value={format(new Date(academicYear.createdAt), "MMM yyyy")}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <UpdateAcademicYearDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        academicYear={academicYear}
        onSuccess={onUpdate}
      />

      <DeleteAcademicYearDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        academicYear={academicYear}
        onSuccess={() => onDelete(academicYear.id)}
      />

      <AcademicYearDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        academicYearId={academicYear.id}
      />
    </>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}

// components/academic-terms/AcademicTermCard.tsx
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
  ClipboardList,
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
import { toggleAcademicTermStatus } from "@/actions/terms";
import UpdateAcademicTermDialog from "./update-academic-term-dialogue";
import DeleteAcademicTermDialog from "./delete-academic-term-dialogue";
import AcademicTermDetailsDialog from "./academic-term-details";

interface AcademicTermCardProps {
  academicTerm: any;
  onUpdate: (term: any) => void;
  onDelete: (id: string) => void;
}

export default function AcademicTermCard({
  academicTerm,
  onUpdate,
  onDelete,
}: AcademicTermCardProps) {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const result = await toggleAcademicTermStatus(academicTerm.id);
      if (result.ok) {
        onUpdate(result.data);
        toast.success(
          `Academic term ${result.data.isActive ? "activated" : "deactivated"} successfully`
        );
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to toggle status");
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return format(new Date(date), "MMM dd, yyyy");
  };

  const getTermNumberBadge = (termNumber: number) => {
    const colors = {
      1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      2: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      3: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return colors[termNumber as keyof typeof colors] || colors[1];
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {academicTerm.name}
                </h3>
                <Badge
                  className={`${getTermNumberBadge(academicTerm.termNumber)}`}
                >
                  Term {academicTerm.termNumber}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant={academicTerm.isActive ? "default" : "secondary"}
                  className={
                    academicTerm.isActive
                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }
                >
                  {academicTerm.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    "Inactive"
                  )}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    academicTerm.academicYear.isActive
                      ? "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400"
                      : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-400"
                  }
                >
                  {academicTerm.academicYear.year}
                </Badge>
              </div>

              {/* Dates */}
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  <span className="font-medium">Start:</span>{" "}
                  {formatDate(academicTerm.startDate)}
                </p>
                <p>
                  <span className="font-medium">End:</span>{" "}
                  {formatDate(academicTerm.endDate)}
                </p>
              </div>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <DropdownMenuItem 
                  onClick={() => setDetailsDialogOpen(true)}
                  className="dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setUpdateDialogOpen(true)}
                  className="dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleToggleStatus}
                  disabled={isToggling}
                  className="dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                >
                  <Power className="w-4 h-4 mr-2" />
                  {academicTerm.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                  disabled={academicTerm.stats?.hasData}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <StatItem
              icon={<BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              label="Enrollments"
              value={academicTerm.stats?.totalEnrollments || 0}
            />
            <StatItem
              icon={<ClipboardList className="w-4 h-4 text-green-600 dark:text-green-400" />}
              label="Exams"
              value={academicTerm.stats?.totalExams || 0}
            />
            <StatItem
              icon={<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              label="Teachers"
              value={academicTerm.stats?.totalTeacherAssignments || 0}
            />
            <StatItem
              icon={<Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
              label="Configs"
              value={academicTerm.stats?.totalAssessmentConfigs || 0}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <UpdateAcademicTermDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        academicTerm={academicTerm}
        onSuccess={onUpdate}
      />

      <DeleteAcademicTermDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        academicTerm={academicTerm}
        onSuccess={() => onDelete(academicTerm.id)}
      />

      <AcademicTermDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        academicTermId={academicTerm.id}
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
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
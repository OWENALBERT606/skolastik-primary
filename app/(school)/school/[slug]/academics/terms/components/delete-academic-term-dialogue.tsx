// components/academic-terms/DeleteAcademicTermDialog.tsx
"use client";

import { useState } from "react";
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
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteAcademicTerm } from "@/actions/terms";

interface DeleteAcademicTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicTerm: any;
  onSuccess: () => void;
}

export default function DeleteAcademicTermDialog({
  open,
  onOpenChange,
  academicTerm,
  onSuccess,
}: DeleteAcademicTermDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const hasData = academicTerm?.stats?.hasData || false;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAcademicTerm(academicTerm.id);
      if (result.ok) {
        toast.success("Academic term deleted successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete academic term");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            Delete Academic Term
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-gray-600 dark:text-gray-400">
            {hasData ? (
              <>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  This academic term cannot be deleted!
                </p>
                <p>
                  The term <strong className="text-gray-900 dark:text-gray-100">{academicTerm.name}</strong> has associated data:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {academicTerm.stats?.totalEnrollments > 0 && (
                    <li>{academicTerm.stats.totalEnrollments} student enrollments</li>
                  )}
                  {academicTerm.stats?.totalExams > 0 && (
                    <li>{academicTerm.stats.totalExams} exams</li>
                  )}
                  {academicTerm.stats?.totalTeacherAssignments > 0 && (
                    <li>{academicTerm.stats.totalTeacherAssignments} teacher assignments</li>
                  )}
                </ul>
                <p className="text-sm">
                  To delete this term, you must first remove all associated data.
                </p>
              </>
            ) : (
              <>
                <p>
                  Are you sure you want to delete the academic term{" "}
                  <strong className="text-gray-900 dark:text-gray-100">{academicTerm.name}</strong> from{" "}
                  <strong className="text-gray-900 dark:text-gray-100">{academicTerm.academicYear?.year}</strong>?
                </p>
                <p className="text-sm">
                  This action cannot be undone. All associated data will be permanently deleted.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isDeleting}
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </AlertDialogCancel>
          {!hasData && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Academic Term
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
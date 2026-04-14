// components/academic-years/DeleteAcademicYearDialog.tsx
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
import { deleteAcademicYear } from "@/actions/years";

interface DeleteAcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear: any;
  onSuccess: () => void;
}

export default function DeleteAcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  onSuccess,
}: DeleteAcademicYearDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const hasData = academicYear?.stats?.hasData || false;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAcademicYear(academicYear.id);
      if (result.ok) {
        toast.success("Academic year deleted successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete academic year");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Delete Academic Year
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {hasData ? (
              <>
                <p className="font-semibold text-red-600">
                  This academic year cannot be deleted!
                </p>
                <p>
                  The academic year <strong>{academicYear.year}</strong> has{" "}
                  <strong>{academicYear.stats?.totalEnrollments || 0}</strong>{" "}
                  student enrollments and cannot be deleted.
                </p>
                <p className="text-sm">
                  To delete this year, you must first remove all associated
                  enrollments and data.
                </p>
              </>
            ) : (
              <>
                <p>
                  Are you sure you want to delete the academic year{" "}
                  <strong>{academicYear.year}</strong>?
                </p>
                <p className="text-sm">
                  This action cannot be undone. All terms and associated data
                  will be permanently deleted.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          {!hasData && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Academic Year
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
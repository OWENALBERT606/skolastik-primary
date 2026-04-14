"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteStudent } from "@/actions/students";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  schoolId: string;
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function DeleteStudentDialog({
  open,
  onOpenChange,
  student,
  schoolId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
   const result = await deleteStudent({ studentId: student.id, schoolId });

      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Delete student error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Student</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this student? This action will
            deactivate the student record.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">You are about to delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Name:</strong> {student.firstName} {student.lastName}
                </li>
                <li>
                  <strong>Admission No:</strong> {student.admissionNo}
                </li>
              </ul>
              <p className="text-sm mt-3">
                This will deactivate the student record but preserve all
                historical data including enrollments, marks, and reports.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
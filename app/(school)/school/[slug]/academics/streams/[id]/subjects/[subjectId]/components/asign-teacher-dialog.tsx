// app/school/[slug]/academics/streams/[streamId]/subjects/[subjectId]/components/assign-teacher-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  assignTeacherToStreamSubject,
  getAvailableTeachersForSubject,
} from "@/actions/subject-management";

interface AssignTeacherDialogProps {
  streamSubjectId: string;
  schoolId: string;
  subjectName: string;
  onSuccess: () => void;
}

export default function AssignTeacherDialog({
  streamSubjectId,
  schoolId,
  subjectName,
  onSuccess,
}: AssignTeacherDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadTeachers();
    }
  }, [open]);

  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      const data = await getAvailableTeachersForSubject({
        streamSubjectId,
        schoolId,
      });
      setTeachers(data);
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast.error("Failed to load teachers");
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTeacherId) {
      toast.error("Please select a teacher");
      return;
    }

    setIsLoading(true);
    try {
      const result = await assignTeacherToStreamSubject({
        streamSubjectId,
        teacherId: selectedTeacherId,
        schoolId,
      });

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setSelectedTeacherId("");
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to assign teacher");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GraduationCap className="h-4 w-4 mr-2" />
          Assign Teacher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#5B9BD5]" />
            Assign Teacher to {subjectName}
          </DialogTitle>
          <DialogDescription>
            Select a teacher to assign to this subject
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label htmlFor="teacher">
              Select Teacher <span className="text-red-500">*</span>
            </Label>
            {isLoadingTeachers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#5B9BD5]" />
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-600 dark:text-slate-400">
                No available teachers. All teachers may already be assigned.
              </div>
            ) : (
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.staffNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Teacher Details */}
          {selectedTeacher && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                Teacher Details
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-900 dark:text-blue-300">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </span>
                </div>
                {selectedTeacher.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-900 dark:text-blue-300">
                      {selectedTeacher.email}
                    </span>
                  </div>
                )}
                {selectedTeacher.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-900 dark:text-blue-300">
                      {selectedTeacher.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading || !selectedTeacherId}
            className="bg-[#5B9BD5] hover:bg-[#4A8BC2]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <GraduationCap className="h-4 w-4 mr-2" />
                Assign Teacher
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
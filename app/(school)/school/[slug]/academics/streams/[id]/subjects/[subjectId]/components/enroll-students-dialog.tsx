

// app/school/[slug]/academics/streams/[streamId]/subjects/[subjectId]/components/enroll-students-dialog.tsx
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  UserPlus,
  Loader2,
  Search,
  Users,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  enrollStudentsInSubject,
  getUnenrolledStudentsForSubject,
} from "@/actions/subject-management";

interface EnrollStudentsDialogProps {
  streamSubjectId: string;
  schoolId: string;
  subjectName: string;
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  streamSubjectIds?: string[];
  streamId?: string;
  termId?: string;
  unenrolledStudents?: any[];
  isMultiPaper?: boolean;
  papers?: any[];
}

export default function EnrollStudentsDialog({
  streamSubjectId,
  schoolId,
  subjectName,
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  streamSubjectIds,
  streamId,
  termId,
  unenrolledStudents,
  isMultiPaper,
  papers,
}: EnrollStudentsDialogProps) {
  // Internal state for self-managed mode
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const [isCompulsory, setIsCompulsory] = useState(false);

  const [students, setStudents] = useState<any[]>([]);

  // Use external control if provided, otherwise use internal state
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  // Determine if dialog is externally controlled
  const isExternallyControlled =
    externalOpen !== undefined || externalOnOpenChange !== undefined;

  useEffect(() => {
    if (open) {
      loadStudents();
    }
  }, [open]);

  const loadStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const data = await getUnenrolledStudentsForSubject({
        streamSubjectId,
        schoolId,
      });
      setStudents(data);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter((enrollment) => {
    const student = enrollment.student;
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.admissionNo.toLowerCase().includes(searchLower)
    );
  });

  const toggleStudent = (enrollmentId: string) => {
    setSelectedEnrollments((prev) =>
      prev.includes(enrollmentId)
        ? prev.filter((id) => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  const toggleAll = () => {
    if (selectedEnrollments.length === filteredStudents.length) {
      setSelectedEnrollments([]);
    } else {
      setSelectedEnrollments(filteredStudents.map((e) => e.id));
    }
  };

  const handleEnroll = async () => {
    if (selectedEnrollments.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setIsLoading(true);
    try {
      const result = await enrollStudentsInSubject({
        streamSubjectId,
        enrollmentIds: selectedEnrollments,
        isCompulsory,
        schoolId,
      });

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setSelectedEnrollments([]);
        setSearchTerm("");
        setIsCompulsory(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to enroll students");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only show trigger button when NOT externally controlled */}
      {!isExternallyControlled && (
        <DialogTrigger asChild>
          <Button size="sm" className="bg-[#5B9BD5] hover:bg-[#4A8BC2]">
            <UserPlus className="h-4 w-4 mr-2" />
            Enroll Students
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#5B9BD5]" />
            Enroll Students in {subjectName}
          </DialogTitle>
          <DialogDescription>
            Select students to enroll in this subject
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Compulsory Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="compulsory">Mark as Compulsory Subject</Label>
              <p className="text-xs text-muted-foreground">
                Students must complete this subject
              </p>
            </div>
            <Switch
              id="compulsory"
              checked={isCompulsory}
              onCheckedChange={setIsCompulsory}
            />
          </div>

          {isLoadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#5B9BD5]" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No students found matching your search"
                  : "All students are already enrolled"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border">
                <Checkbox
                  checked={
                    selectedEnrollments.length === filteredStudents.length &&
                    filteredStudents.length > 0
                  }
                  onCheckedChange={toggleAll}
                />
                <span className="font-medium text-sm">
                  Select All ({filteredStudents.length})
                </span>
                {selectedEnrollments.length > 0 && (
                  <Badge className="ml-auto bg-[#5B9BD5]">
                    {selectedEnrollments.length} selected
                  </Badge>
                )}
              </div>

              {/* Student List */}
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {filteredStudents.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedEnrollments.includes(enrollment.id)
                        ? "bg-[#5B9BD5]/10 border-[#5B9BD5]"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                    onClick={() => toggleStudent(enrollment.id)}
                  >
                    <Checkbox
                      checked={selectedEnrollments.includes(enrollment.id)}
                      onCheckedChange={() => toggleStudent(enrollment.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {enrollment.student.firstName}{" "}
                          {enrollment.student.lastName}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {enrollment.student.gender}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {enrollment.student.admissionNo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedEnrollments.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Enrollment Summary
                  </p>
                  <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <p>
                      • Enrolling <strong>{selectedEnrollments.length}</strong>{" "}
                      student(s)
                    </p>
                    <p>
                      • Type:{" "}
                      <strong>{isCompulsory ? "Compulsory" : "Optional"}</strong>
                    </p>
                    <p>• Students can start receiving marks immediately</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={isLoading || selectedEnrollments.length === 0}
            className="bg-[#5B9BD5] hover:bg-[#4A8BC2]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll {selectedEnrollments.length} Student(s)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
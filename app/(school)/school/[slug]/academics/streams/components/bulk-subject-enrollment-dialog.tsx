// app/school/[slug]/academics/streams/[id]/components/bulk-subject-enrollment-dialog.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Loader2,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { bulkEnrollStudentsInSubject } from "@/actions/enrollments";

interface BulkSubjectEnrollmentDialogProps {
  streamId: string;
  schoolId: string;
  activeTerm: any;
  onSuccess: () => void;
}

export default function BulkSubjectEnrollmentDialog({
  streamId,
  schoolId,
  activeTerm,
  onSuccess,
}: BulkSubjectEnrollmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      // Load stream subjects and enrollments
      const [streamSubjects, streamEnrollments] = await Promise.all([
        fetch(`/api/streams/${streamId}/subjects`).then((r) => r.json()),
        fetch(`/api/streams/${streamId}/enrollments`).then((r) => r.json()),
      ]);

      setSubjects(streamSubjects);
      setEnrollments(streamEnrollments);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Filter students who are not enrolled in selected subject
  const availableStudents = enrollments.filter((enrollment) => {
    if (!selectedSubjectId) return false;
    
    // Check if student is already enrolled in this subject
    const alreadyEnrolled = enrollment.subjectEnrollments.some(
      (se: any) => se.streamSubjectId === selectedSubjectId
    );
    
    return !alreadyEnrolled;
  });

  const toggleStudent = (enrollmentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(enrollmentId)
        ? prev.filter((id) => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === availableStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(availableStudents.map((e) => e.id));
    }
  };

  const handleEnroll = async () => {
    if (!selectedSubjectId) {
      toast.error("Please select a subject");
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setIsLoading(true);
    try {
      const result = await bulkEnrollStudentsInSubject({
        enrollmentIds: selectedStudents,
        streamSubjectId: selectedSubjectId,
        isCompulsory: false,
      });

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setSelectedStudents([]);
        setSelectedSubjectId("");
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

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          Bulk Subject Enrollment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#5B9BD5]" />
            Bulk Subject Enrollment
          </DialogTitle>
          <DialogDescription>
            Enroll multiple students in a subject at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#5B9BD5]" />
            </div>
          ) : (
            <>
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Select Subject <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedSubjectId}
                  onValueChange={(value) => {
                    setSelectedSubjectId(value);
                    setSelectedStudents([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subject.name}
                        {subject.subjectPaper && ` - ${subject.subjectPaper.name}`}
                        {" "}({subject._count.studentEnrollments} enrolled)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Selection */}
              {selectedSubjectId && (
                <>
                  {availableStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p className="font-medium text-lg mb-2">
                        All Students Enrolled
                      </p>
                      <p className="text-sm text-muted-foreground">
                        All active students are already enrolled in this subject
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label>Select Students to Enroll</Label>

                      {/* Select All */}
                      <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Checkbox
                          checked={
                            selectedStudents.length === availableStudents.length &&
                            availableStudents.length > 0
                          }
                          onCheckedChange={toggleAll}
                        />
                        <span className="font-medium text-sm">
                          Select All ({availableStudents.length})
                        </span>
                        {selectedStudents.length > 0 && (
                          <Badge className="ml-auto bg-[#5B9BD5]">
                            {selectedStudents.length} selected
                          </Badge>
                        )}
                      </div>

                      {/* Student List */}
                      <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                        {availableStudents.map((enrollment) => (
                          <div
                            key={enrollment.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedStudents.includes(enrollment.id)
                                ? "bg-[#5B9BD5]/10 border-[#5B9BD5]"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                            }`}
                            onClick={() => toggleStudent(enrollment.id)}
                          >
                            <Checkbox
                              checked={selectedStudents.includes(enrollment.id)}
                              onCheckedChange={() => toggleStudent(enrollment.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white">
                                {enrollment.student.firstName}{" "}
                                {enrollment.student.lastName}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {enrollment.student.admissionNo}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {enrollment.student.gender}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Enrollment Info */}
              {selectedStudents.length > 0 && selectedSubject && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                        Enrollment Summary
                      </p>
                      <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                        <p>
                          • Enrolling <strong>{selectedStudents.length}</strong>{" "}
                          student(s)
                        </p>
                        <p>
                          • In: <strong>{selectedSubject.subject.name}</strong>
                          {selectedSubject.subjectPaper &&
                            ` - ${selectedSubject.subjectPaper.name}`}
                        </p>
                        <p>• Status: Active</p>
                        <p>• Type: Optional (can be changed later)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
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
            disabled={
              isLoading ||
              selectedStudents.length === 0 ||
              !selectedSubjectId
            }
            className="bg-[#5B9BD5] hover:bg-[#4A8BC2]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Enroll {selectedStudents.length} Student(s)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
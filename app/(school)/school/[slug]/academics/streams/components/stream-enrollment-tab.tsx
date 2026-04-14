


// app/school/[slug]/academics/streams/[id]/components/stream-enrollment-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  UserPlus,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { enrollStudentsInStream, getAvailableStudentsForEnrollment } from "@/actions/enrollments";

interface StreamEnrollmentTabProps {
  streamId: string;
  classYearId: string;
  academicYearId: string;
  schoolId: string;
  activeTerm: any;
}

export default function StreamEnrollmentTab({
  streamId,
  classYearId,
  academicYearId,
  schoolId,
  activeTerm,
}: StreamEnrollmentTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrollmentType, setEnrollmentType] = useState<
    "NEW" | "CONTINUING" | "TRANSFER" | "REPEAT"
  >("CONTINUING");
  const [selectedTerm, setSelectedTerm] = useState(activeTerm?.id || "");
  const [autoEnrollSubjects, setAutoEnrollSubjects] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  useEffect(() => {
    if (activeTerm) {
      setSelectedTerm(activeTerm.id);
    }
  }, [activeTerm]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedTerm) return;

      setIsLoadingStudents(true);
      try {
        const students = await getAvailableStudentsForEnrollment({
          schoolId,
          termId: selectedTerm,
          classYearId,
        });
        setAvailableStudents(students);
      } catch (error) {
        console.error("Error loading students:", error);
        toast.error("Failed to load available students");
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, [selectedTerm, schoolId, classYearId]);

  // Filter students based on search
  const filteredStudents = availableStudents.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.admissionNo.toLowerCase().includes(searchLower)
    );
  });

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  const handleEnroll = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    if (!selectedTerm) {
      toast.error("Please select a term");
      return;
    }

    setIsLoading(true);
    try {
      const result = await enrollStudentsInStream({
        studentIds: selectedStudents,
        streamId,
        classYearId,
        academicYearId,
        termId: selectedTerm,
        enrollmentType,
        autoEnrollInSubjects: autoEnrollSubjects,
      });

      if (result.ok) {
        toast.success(result.message);
        setSelectedStudents([]);
        // Reload students
        const students = await getAvailableStudentsForEnrollment({
          schoolId,
          termId: selectedTerm,
          classYearId,
        });
        setAvailableStudents(students);
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
    <div className="space-y-6">
      {/* Enrollment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#5B9BD5]" />
            Enrollment Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="enrollmentType">Enrollment Type</Label>
              <Select
                value={enrollmentType}
                onValueChange={(value: any) => setEnrollmentType(value)}
              >
                <SelectTrigger id="enrollmentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New Student</SelectItem>
                  <SelectItem value="CONTINUING">Continuing</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="REPEAT">Repeating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Academic Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger id="term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {activeTerm && (
                    <SelectItem value={activeTerm.id}>
                      {activeTerm.name} (Active)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoEnroll"
                  checked={autoEnrollSubjects}
                  onCheckedChange={(checked) =>
                    setAutoEnrollSubjects(checked as boolean)
                  }
                />
                <label
                  htmlFor="autoEnroll"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Auto-enroll in compulsory subjects
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#5B9BD5]" />
              Available Students
              {selectedStudents.length > 0 && (
                <Badge className="ml-2 bg-[#5B9BD5]">
                  {selectedStudents.length} selected
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleEnroll}
                disabled={isLoading || selectedStudents.length === 0}
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
                    Enroll {selectedStudents.length} Student(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedTerm ? (
            <div className="text-center py-12 text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Please select a term to view available students</p>
            </div>
          ) : isLoadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#5B9BD5]" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p className="font-medium text-lg mb-2">No Students Available</p>
              <p className="text-sm">
                {searchTerm
                  ? "No students found matching your search"
                  : "All eligible students are already enrolled for this term"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <Checkbox
                  checked={selectedStudents.length === filteredStudents.length}
                  onCheckedChange={toggleAll}
                />
                <span className="font-medium text-sm">
                  Select All ({filteredStudents.length})
                </span>
              </div>

              {/* Student List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStudents.includes(student.id)
                        ? "bg-[#5B9BD5]/10 border-[#5B9BD5]"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {student.firstName} {student.lastName}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {student.gender}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                        <span>{student.admissionNo}</span>
                        {student.parent && (
                          <span>
                            Parent: {student.parent.firstName}{" "}
                            {student.parent.lastName}
                          </span>
                        )}
                      </div>
                      {student.enrollments && student.enrollments.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Previously in:{" "}
                          {student.enrollments[0].classYear.classTemplate.name}{" "}
                          - {student.enrollments[0].stream?.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Summary */}
      {selectedStudents.length > 0 && (
        <Card className="border-[#5B9BD5] bg-[#5B9BD5]/5">
          <CardHeader>
            <CardTitle className="text-[#5B9BD5]">
              Enrollment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Students to Enroll
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedStudents.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enrollment Type
                </p>
                <Badge className="mt-1">{enrollmentType}</Badge>
              </div>
              {autoEnrollSubjects && (
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="inline h-4 w-4 mr-1 text-green-600" />
                    Students will be automatically enrolled in all compulsory
                    subjects
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
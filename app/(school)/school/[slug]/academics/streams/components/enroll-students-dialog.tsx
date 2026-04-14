"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { enrollStudentsToStream } from "@/actions/enrollments";
import { toast } from "sonner";
import { Loader2, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveTerms, getUnenrolledStudents } from "@/actions/querries";

export default function EnrollStudentsDialog({
  open,
  onOpenChange,
  streamId,
  classYearId,
  academicYearId,
  schoolId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamId: string;
  classYearId: string;
  academicYearId: string;
  schoolId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [termId, setTermId] = useState("");

  useEffect(() => {
    if (open) {
      loadData();
      setSelectedStudents(new Set());
      setSearchQuery("");
      setTermId("");
    }
  }, [open, streamId]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [studentsData, termsData] = await Promise.all([
        getUnenrolledStudents(schoolId, classYearId),
        getActiveTerms(academicYearId),
      ]);
      setStudents(studentsData);
      setTerms(termsData);
      
      // Auto-select first term if available
      if (termsData.length > 0) {
        setTermId(termsData[0].id);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    if (!termId) {
      toast.error("Please select a term");
      return;
    }

    setLoading(true);

    try {
      const result = await enrollStudentsToStream({
        streamId,
        classYearId,
        academicYearId,
        termId,
        studentIds: Array.from(selectedStudents),
      });

      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to enroll students");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll Students to Stream</DialogTitle>
          <DialogDescription>
            Select students and term to enroll them into this stream
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Term Selection */}
            <div className="space-y-2">
              <Label htmlFor="termId">
                Term <span className="text-destructive">*</span>
              </Label>
              <Select value={termId} onValueChange={setTermId} required>
                <SelectTrigger id="termId">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} ({term.termNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Selected Count */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {selectedStudents.size} student(s) selected
                </span>
              </div>
              <Badge variant="outline">
                {filteredStudents.length} available
              </Badge>
            </div>

            {/* Students Table */}
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No students found"
                    : "No unenrolled students available"}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedStudents.size === filteredStudents.length
                          }
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={() => toggleStudent(student.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.admissionNo}
                        </TableCell>
                        <TableCell>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.gender}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedStudents.size === 0}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enroll {selectedStudents.size} Student(s)
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
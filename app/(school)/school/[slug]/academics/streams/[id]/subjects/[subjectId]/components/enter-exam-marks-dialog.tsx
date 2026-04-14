// app/school/[slug]/academics/streams/[streamId]/subjects/[streamSubjectId]/components/enter-exam-marks-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import { toast }  from "sonner";
import { Loader2, Save, FileText, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { saveExamMarks } from "@/actions/marks-entry";

type Exam = {
  id:       string;
  name:     string;
  examType: string;
  maxMarks: number;
  date?:    Date | null;
};

type StudentEnrollment = {
  id: string;
  enrollment: {
    student: {
      id:          string;
      admissionNo: string;
      firstName:   string;
      lastName:    string;
      otherNames?: string | null;
    };
  };
  examMarks: Array<{
    id:            string;
    marksObtained: number;
    exam:          { id: string };
  }>;
};

type Props = {
  open:           boolean;
  onOpenChange:   (open: boolean) => void;
  paperStreamSubject: {
    id:                 string;
    studentEnrollments: StudentEnrollment[];
    subjectPaper?: { id: string; name: string } | null;
  };
  exam:      Exam;
  schoolId:  string;
  userId:    string;
  isLocked?: boolean;
};

export default function EnterExamMarksDialog({
  open,
  onOpenChange,
  paperStreamSubject,
  exam,
  schoolId,
  userId: _userId,
  isLocked = false,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [marks, setMarks] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    paperStreamSubject.studentEnrollments.forEach((se) => {
      const existing = se.examMarks.find((m) => m.exam.id === exam.id);
      if (existing) init[se.id] = existing.marksObtained;
    });
    return init;
  });

  const handleMarkChange = (enrollmentId: string, mark: string) => {
    const num = parseFloat(mark);
    if (!isNaN(num) && num >= 0 && num <= exam.maxMarks) {
      setMarks((prev) => ({ ...prev, [enrollmentId]: num }));
    } else if (mark === "") {
      const { [enrollmentId]: _, ...rest } = marks;
      setMarks(rest);
    }
  };

  const onSubmit = async () => {
    if (Object.keys(marks).length === 0) {
      toast.error("Please enter at least one mark");
      return;
    }
    setIsLoading(true);
    try {
      const result = await saveExamMarks({
        examId:          exam.id,
        streamSubjectId: paperStreamSubject.id,
        marks:  Object.entries(marks).map(([enrollmentId, marksObtained]) => ({
          studentSubjectEnrollmentId: enrollmentId,
          marksObtained,
          outOf:         exam.maxMarks,
          subjectPaperId: paperStreamSubject.subjectPaper?.id,
        })),
        teacherId: null,  // no Teacher record for admin; enteredById left unset
        schoolId,
      });
      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to save marks");
    } finally {
      setIsLoading(false);
    }
  };

  const enteredCount = Object.keys(marks).length;
  const totalCount   = paperStreamSubject.studentEnrollments.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        FIX: DialogContent is now a flex column.
        Header + info bar are fixed height; table scrolls in the middle;
        footer is always pinned at the bottom regardless of viewport height.
      */}
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">

        {/* ── Header ──────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enter Exam Marks — {exam.name}
            {paperStreamSubject.subjectPaper && (
              <span className="text-muted-foreground font-normal text-base">
                — {paperStreamSubject.subjectPaper.name}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {exam.examType} · Maximum Marks: {exam.maxMarks}
          </DialogDescription>
        </DialogHeader>

        {/* ── Exam info bar ────────────────────────────────────────── */}
        <div className="px-6 py-3 bg-muted/50 border-b shrink-0">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Exam Type</p>
              <p className="font-semibold">{exam.examType}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Max Marks</p>
              <p className="font-semibold">{exam.maxMarks}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Entered</p>
              <p className="font-semibold">{enteredCount} / {totalCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Status</p>
              {isLocked ? (
                <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-0">
                  <Lock className="h-3 w-3 mr-1" /> Locked
                </Badge>
              ) : (
                <Badge variant="secondary">Open</Badge>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable student table — fills remaining height ─────── */}
        <ScrollArea className="flex-1 min-h-0">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead className="w-[160px]">Marks (/{exam.maxMarks})</TableHead>
                <TableHead className="w-[100px] text-center">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paperStreamSubject.studentEnrollments.map((se, i) => {
                const mark = marks[se.id];
                return (
                  <TableRow key={se.id}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell className="min-w-[180px]">
                      {se.enrollment.student.firstName} {se.enrollment.student.lastName}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {se.enrollment.student.admissionNo}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={exam.maxMarks}
                        step={0.5}
                        value={mark ?? ""}
                        onChange={(e) => handleMarkChange(se.id, e.target.value)}
                        placeholder="0"
                        disabled={isLocked}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {mark !== undefined && (
                        <Badge variant="outline">
                          {((mark / exam.maxMarks) * 100).toFixed(1)}%
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* ── Footer — always visible ───────────────────────────────── */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-background shrink-0">
          <p className="text-sm text-muted-foreground">
            {isLocked ? (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <Lock className="h-4 w-4" /> Marks are locked. Unlock in Settings to edit.
              </span>
            ) : (
              `${enteredCount} of ${totalCount} marks entered`
            )}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isLoading || enteredCount === 0 || isLocked}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Marks ({enteredCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
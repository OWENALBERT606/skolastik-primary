// enter-project-scores-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input }       from "@/components/ui/input";
import { Button }      from "@/components/ui/button";
import { Badge }       from "@/components/ui/badge";
import { ScrollArea }  from "@/components/ui/scroll-area";
import { toast }       from "sonner";
import { Loader2, Save, FolderOpen } from "lucide-react";
import { saveProjectScores } from "@/actions/marks-entry";

type StudentEnrollment = {
  id: string;
  enrollment: {
    student: {
      id:          string;
      admissionNo: string;
      firstName:   string;
      lastName:    string;
    };
  };
  subjectResult?: { projectScore?: number | null } | null;
};

type Props = {
  open:           boolean;
  onOpenChange:   (open: boolean) => void;
  streamSubjectId: string;
  enrollments:    StudentEnrollment[];
  projectMaxScore: number;
  projectWeight:   number;
  schoolId:        string;
  isLocked?:       boolean;
};

export default function EnterProjectScoresDialog({
  open, onOpenChange, streamSubjectId, enrollments,
  projectMaxScore, projectWeight, schoolId, isLocked = false,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    enrollments.forEach((se) => {
      const existing = se.subjectResult?.projectScore;
      if (existing != null) init[se.id] = existing;
    });
    return init;
  });

  const handleChange = (enrollmentId: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= projectMaxScore) {
      setScores((prev) => ({ ...prev, [enrollmentId]: num }));
    } else if (val === "") {
      const { [enrollmentId]: _, ...rest } = scores;
      setScores(rest);
    }
  };

  const onSubmit = async () => {
    if (Object.keys(scores).length === 0) {
      toast.error("Enter at least one score");
      return;
    }
    setIsLoading(true);
    try {
      const result = await saveProjectScores({
        streamSubjectId,
        projectMaxScore,
        scores: enrollments.map((se) => ({
          studentSubjectEnrollmentId: se.id,
          score: scores[se.id] ?? null,
        })),
        schoolId,
      });
      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to save project scores");
    } finally {
      setIsLoading(false);
    }
  };

  const enteredCount = Object.keys(scores).length;
  const totalCount   = enrollments.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-purple-600" />
            Enter Project Assessment Scores
          </DialogTitle>
          <DialogDescription>
            Score out of {projectMaxScore} · Contributes {projectWeight}% to final mark
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b shrink-0">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Max Score</p>
              <p className="font-semibold">{projectMaxScore}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Contribution</p>
              <p className="font-semibold text-purple-700 dark:text-purple-400">{projectWeight}%</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Entered</p>
              <p className="font-semibold">{enteredCount} / {totalCount}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Adm No</TableHead>
                <TableHead className="w-[160px]">Score (/{projectMaxScore})</TableHead>
                <TableHead className="w-[100px] text-center">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((se, i) => {
                const score = scores[se.id];
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
                        max={projectMaxScore}
                        step={0.5}
                        value={score ?? ""}
                        onChange={(e) => handleChange(se.id, e.target.value)}
                        placeholder="0"
                        disabled={isLocked}
                        className="focus-visible:ring-purple-400"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {score !== undefined && (
                        <Badge variant="outline" className="text-purple-700 dark:text-purple-400 border-purple-300">
                          {((score / projectMaxScore) * 100).toFixed(1)}%
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="flex justify-between items-center px-6 py-4 border-t bg-background shrink-0">
          <p className="text-sm text-muted-foreground">
            {enteredCount} of {totalCount} scores entered
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading || enteredCount === 0 || isLocked}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Scores ({enteredCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

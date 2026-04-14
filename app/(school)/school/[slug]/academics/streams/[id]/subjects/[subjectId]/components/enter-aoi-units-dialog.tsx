// app/school/[slug]/academics/streams/[streamId]/subjects/[streamSubjectId]/components/enter-aoi-units-dialog.tsx
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
import { Input }      from "@/components/ui/input";
import { Button }     from "@/components/ui/button";
import { Badge }      from "@/components/ui/badge";
import { toast }      from "sonner";
import { Loader2, Save, Hash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { saveAOIUnits } from "@/actions/marks-entry";

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
  aoiUnits: Array<{ id: string; unitNumber: number; score: number | null }>;
};

type Props = {
  open:           boolean;
  onOpenChange:   (open: boolean) => void;
  paperStreamSubject: {
    id:                 string;
    studentEnrollments: StudentEnrollment[];
    subjectPaper?: { id: string; name: string } | null;
  };
  maxUnits: number;
  schoolId: string;
  userId:   string;
};

export default function EnterAOIUnitsDialog({
  open,
  onOpenChange,
  paperStreamSubject,
  maxUnits,
  schoolId,
  userId: _userId, // reserved for future teacher attribution
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState<Record<string, Record<number, number>>>(() => {
    const init: Record<string, Record<number, number>> = {};
    paperStreamSubject.studentEnrollments.forEach((se) => {
      init[se.id] = {};
      se.aoiUnits.forEach((u) => {
        if (u.score !== null) init[se.id][u.unitNumber] = u.score;
      });
    });
    return init;
  });

  const handleUnitChange = (enrollmentId: string, unitNumber: number, value: string) => {
    const num = parseFloat(value);
    setUnits((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [unitNumber]: !isNaN(num) ? num : 0,
      },
    }));
  };

  const getAverage = (enrollmentId: string) => {
    const scores = Object.values(units[enrollmentId] ?? {}).filter((s) => s > 0);
    if (scores.length === 0) return null;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

  const onSubmit = async () => {
    const unitsData = Object.entries(units).flatMap(([enrollmentId, studentUnits]) =>
      Object.entries(studentUnits)
        .filter(([, score]) => score > 0)
        .map(([unitNumber, score]) => ({
          studentSubjectEnrollmentId: enrollmentId,
          unitNumber:     parseInt(unitNumber),
          score,
          subjectPaperId: paperStreamSubject.subjectPaper?.id ?? null,
        }))
    );

    if (unitsData.length === 0) {
      toast.error("Please enter at least one unit score");
      return;
    }

    setIsLoading(true);
    try {
      const result = await saveAOIUnits({
        units:     unitsData,
        teacherId: null,   // no Teacher record for admin; enteredById left unset
        schoolId,
      });
      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to save units");
    } finally {
      setIsLoading(false);
    }
  };

  const unitNumbers = Array.from({ length: maxUnits }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Enter AOI Units (U1 – U{maxUnits})
            {paperStreamSubject.subjectPaper && (
              <span className="text-muted-foreground font-normal text-base">
                — {paperStreamSubject.subjectPaper.name}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Enter unit scores per student (0 – 3 scale)
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable table */}
        <ScrollArea className="flex-1 min-h-0">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Admission No</TableHead>
                {unitNumbers.map((u) => (
                  <TableHead key={u} className="text-center w-[80px]">U{u}</TableHead>
                ))}
                <TableHead className="text-center w-[90px]">Avg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paperStreamSubject.studentEnrollments.map((se, i) => {
                const avg = getAverage(se.id);
                return (
                  <TableRow key={se.id}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell className="min-w-[180px]">
                      {se.enrollment.student.firstName} {se.enrollment.student.lastName}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {se.enrollment.student.admissionNo}
                    </TableCell>
                    {unitNumbers.map((u) => (
                      <TableCell key={u} className="p-1.5">
                        <Input
                          type="number"
                          min={0}
                          max={3}
                          step={0.1}
                          value={units[se.id]?.[u] ?? ""}
                          onChange={(e) => handleUnitChange(se.id, u, e.target.value)}
                          className="text-center"
                          placeholder="0"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      {avg && <Badge variant="secondary">{avg}</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Footer — always visible */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-background shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Save    className="mr-2 h-4 w-4" />
            }
            Save Units
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
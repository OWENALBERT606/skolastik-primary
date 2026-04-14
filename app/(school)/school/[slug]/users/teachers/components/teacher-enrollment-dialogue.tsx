// app/school/[slug]/users/teachers/components/teacher-enrollment-dialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { enrollTeacherForYear } from "@/actions/teachers";
import toast from "react-hot-toast";

type TeacherEnrollmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
  academicYears: any[];
  currentYear: any;
};

export default function TeacherEnrollmentDialog({
  open,
  onOpenChange,
  teacher,
  academicYears,
  currentYear,
}: TeacherEnrollmentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear?.id || "");
  const [remarks, setRemarks] = useState("");

  async function handleEnroll() {
    if (!teacher || !selectedYear) {
      toast.error("Please select an academic year");
      return;
    }

    setLoading(true);
    const result = await enrollTeacherForYear(teacher.id, selectedYear, remarks);

    if (result.ok) {
      toast.success(result.message);
      onOpenChange(false);
      setRemarks("");
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            Enroll {teacher?.firstName} {teacher?.lastName}
          </DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            Enroll this teacher for the selected academic year
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-white">Academic Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-600">
                {academicYears.map((year) => (
                  <SelectItem
                    key={year.id}
                    value={year.id}
                    className="dark:text-white dark:focus:bg-slate-700"
                  >
                    {year.year} {year.isActive && "(Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-white">Remarks (Optional)</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any special notes about this enrollment..."
              className="dark:bg-slate-900 dark:border-slate-600"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="dark:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enroll Teacher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
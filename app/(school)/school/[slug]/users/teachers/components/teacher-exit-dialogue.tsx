// app/school/[slug]/users/teachers/components/teacher-exit-dialog.tsx
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { markTeacherAsLeft } from "@/actions/teachers";

type TeacherExitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
  academicYearId: string;
};

export default function TeacherExitDialog({
  open,
  onOpenChange,
  teacher,
  academicYearId,
}: TeacherExitDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exitStatus, setExitStatus] = useState<"RESIGNED" | "RETIRED" | "TERMINATED">("RESIGNED");
  const [exitDate, setExitDate] = useState(new Date().toISOString().split("T")[0]);
  const [exitReason, setExitReason] = useState("");

  async function handleMarkAsLeft() {
    if (!teacher || !academicYearId) {
      toast.error("Missing required information");
      return;
    }

    if (!exitReason.trim()) {
      toast.error("Please provide an exit reason");
      return;
    }

    setLoading(true);
    const result = await markTeacherAsLeft(
      teacher.id,
      academicYearId,
      new Date(exitDate),
      exitReason,
      exitStatus
    );

    if (result.ok) {
      toast.success(result.message);
      onOpenChange(false);
      setExitReason("");
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
          <DialogTitle className="text-red-600 dark:text-red-500">
            Mark Teacher as Left
          </DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            This will deactivate the teacher and mark all their assignments for reassignment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                  Warning: This action will:
                </p>
                <ul className="text-sm text-orange-800 dark:text-orange-300 list-disc list-inside space-y-1">
                  <li>Mark the teacher as inactive</li>
                  <li>Set all active assignments to "ON_HOLD"</li>
                  <li>Require reassignment of all their classes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-white">
              Exit Status <span className="text-red-500">*</span>
            </Label>
            <Select value={exitStatus} onValueChange={(v: any) => setExitStatus(v)}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-600">
                <SelectItem value="RESIGNED" className="dark:text-white dark:focus:bg-slate-700">
                  Resigned
                </SelectItem>
                <SelectItem value="RETIRED" className="dark:text-white dark:focus:bg-slate-700">
                  Retired
                </SelectItem>
                <SelectItem value="TERMINATED" className="dark:text-white dark:focus:bg-slate-700">
                  Terminated
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-white">
              Exit Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="dark:bg-slate-900 dark:border-slate-600"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-white">
              Exit Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={exitReason}
              onChange={(e) => setExitReason(e.target.value)}
              placeholder="Explain the reason for leaving..."
              className="dark:bg-slate-900 dark:border-slate-600"
              rows={4}
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
            onClick={handleMarkAsLeft}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark as Left
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
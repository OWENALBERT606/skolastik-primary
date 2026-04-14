// app/school/[slug]/academics/streams/[id]/components/transfer-student-modal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { getStreamsByClassYear } from "@/actions/streams";
import { transferStudentToStream } from "@/actions/enrollments";

interface TransferStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: any;
  currentStreamId: string;
  classYearId: string;
  schoolId: string;
  onSuccess: () => void;
}

export default function TransferStudentModal({
  isOpen,
  onClose,
  enrollment,
  currentStreamId,
  classYearId,
  schoolId,
  onSuccess,
}: TransferStudentModalProps) {
  const [targetStreamId, setTargetStreamId] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streams, setStreams] = useState<any[]>([]);
  const [isLoadingStreams, setIsLoadingStreams] = useState(true);

  useEffect(() => {
    const loadStreams = async () => {
      setIsLoadingStreams(true);
      try {
        const availableStreams = await getStreamsByClassYear(classYearId);
        // Filter out current stream
        setStreams(availableStreams.filter((s) => s.id !== currentStreamId));
      } catch (error) {
        console.error("Error loading streams:", error);
        toast.error("Failed to load available streams");
      } finally {
        setIsLoadingStreams(false);
      }
    };

    if (isOpen) {
      loadStreams();
    }
  }, [isOpen, classYearId, currentStreamId]);

  const handleTransfer = async () => {
    if (!targetStreamId) {
      toast.error("Please select a target stream");
      return;
    }

    setIsLoading(true);
    try {
      const result = await transferStudentToStream({
        enrollmentId: enrollment.id,
        targetStreamId,
        reason: reason || "Stream transfer",
      });

      if (result.ok) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to transfer student");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-[#5B9BD5]" />
            Transfer Student to Another Stream
          </DialogTitle>
          <DialogDescription>
            Transfer{" "}
            <strong>
              {enrollment.student.firstName} {enrollment.student.lastName}
            </strong>{" "}
            to a different stream within the same class.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Stream Info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current Stream
            </p>
            <p className="font-medium text-slate-900 dark:text-white">
              {enrollment.stream?.name}
            </p>
          </div>

          {/* Target Stream Selection */}
          <div className="space-y-2">
            <Label htmlFor="targetStream">
              Target Stream <span className="text-red-500">*</span>
            </Label>
            {isLoadingStreams ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#5B9BD5]" />
              </div>
            ) : streams.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-600 dark:text-slate-400">
                No other streams available in this class
              </div>
            ) : (
              <Select value={targetStreamId} onValueChange={setTargetStreamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      {stream.name} ({stream._count.enrollments} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Transfer Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Transfer (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for transfer..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Warning */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              <strong>Note:</strong> This will update the student's enrollment
              record. Their subject enrollments will be preserved, but may need
              to be reviewed if subjects differ between streams.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={isLoading || !targetStreamId || streams.length === 0}
            className="bg-[#5B9BD5] hover:bg-[#4A8BC2]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer Student
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
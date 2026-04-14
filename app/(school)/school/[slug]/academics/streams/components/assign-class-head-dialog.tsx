// app/school/[slug]/academics/streams/[id]/components/assign-class-head-dialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserCog, Loader2, GraduationCap, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { getAvailableClassHeads, updateStream } from "@/actions/streams";

interface AssignClassHeadDialogProps {
  stream: any;
  schoolId: string;
  classYearId: string;
  onSuccess: () => void;
}

export default function AssignClassHeadDialog({
  stream,
  schoolId,
  classYearId,
  onSuccess,
}: AssignClassHeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    stream.classHead?.id || ""
  );
  const [notes, setNotes] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadTeachers();
    }
  }, [open]);

  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      const availableTeachers = await getAvailableClassHeads(
        schoolId,
        classYearId,
        stream.id
      );
      setTeachers(availableTeachers);
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast.error("Failed to load available teachers");
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTeacherId && stream.classHead) {
      // Removing class head
      setIsLoading(true);
      try {
        const result = await updateStream(stream.id, {
          classHeadId: null,
        });

        if (result.ok) {
          toast.success("Class head removed successfully");
          setOpen(false);
          onSuccess();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to remove class head");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!selectedTeacherId) {
      toast.error("Please select a teacher");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateStream(stream.id, {
        classHeadId: selectedTeacherId,
      });

      if (result.ok) {
        toast.success(
          stream.classHead
            ? "Class head reassigned successfully"
            : "Class head assigned successfully"
        );
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to assign class head");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="h-4 w-4 mr-2" />
          {stream.classHead ? "Change Class Head" : "Assign Class Head"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#5B9BD5]" />
            {stream.classHead ? "Reassign Class Head" : "Assign Class Head"}
          </DialogTitle>
          <DialogDescription>
            Assign a teacher to be the head of {stream.name} stream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Class Head */}
          {stream.classHead && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-400 mb-2">
                Current Class Head
              </p>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-900 dark:text-amber-300">
                    {stream.classHead.firstName} {stream.classHead.lastName}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {stream.classHead.staffNo}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label htmlFor="teacher">
              {stream.classHead ? "New Class Head" : "Select Teacher"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {isLoadingTeachers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#5B9BD5]" />
              </div>
            ) : teachers.length === 0 && !stream.classHead ? (
              <div className="text-center py-4 text-sm text-slate-600 dark:text-slate-400">
                No available teachers. All teachers may already be assigned as
                class heads.
              </div>
            ) : (
              <Select
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      stream.classHead
                        ? "Select new teacher or leave to remove"
                        : "Select a teacher"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {stream.classHead && (
                    <SelectItem value="">Remove Class Head</SelectItem>
                  )}
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.staffNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Teacher Details */}
          {selectedTeacher && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                Teacher Details
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-900 dark:text-blue-300">
                    {selectedTeacher.email || "No email"}
                  </span>
                </div>
                {selectedTeacher.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-900 dark:text-blue-300">
                      {selectedTeacher.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this assignment..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading || (teachers.length === 0 && !stream.classHead)}
            className="bg-[#5B9BD5] hover:bg-[#4A8BC2]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {stream.classHead ? "Reassigning..." : "Assigning..."}
              </>
            ) : (
              <>
                <UserCog className="h-4 w-4 mr-2" />
                {selectedTeacherId
                  ? stream.classHead
                    ? "Reassign Class Head"
                    : "Assign Class Head"
                  : "Remove Class Head"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
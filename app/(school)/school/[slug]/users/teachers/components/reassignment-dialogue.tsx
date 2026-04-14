// app/school/[slug]/users/teachers/components/reassignment-queue-dialog.tsx
"use client";

import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRightLeft, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import {
  getAssignmentsNeedingReassignment,
  // reassignStreamSubjectTeacher,
} from "@/actions/teachers";
import toast from "react-hot-toast";

type ReassignmentQueueDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  teachers: any[];
  userId: string;
};

export default function ReassignmentQueueDialog({
  open,
  onOpenChange,
  schoolId,
  teachers,
  userId,
}: ReassignmentQueueDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [newTeacherId, setNewTeacherId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    if (open) {
      loadAssignments();
    }
  }, [open]);

  async function loadAssignments() {
    setLoading(true);
    const result = await getAssignmentsNeedingReassignment(schoolId);
    if (result.ok && result.data) {
  // setAssignments(result.data);
} else {
  setAssignments([]); // Fallback to empty array
}
    setLoading(false);
  }

  function handleSelectAssignment(assignment: any) {
    setSelectedAssignment(assignment);
    setNewTeacherId("");
    setReassignReason(`${assignment.teacher.firstName} ${assignment.teacher.lastName} ${assignment.teacher.exitReason || 'left'}`);
    setReassignDialogOpen(true);
  }

  async function handleReassign() {
    if (!selectedAssignment || !newTeacherId) {
      toast.error("Please select a teacher");
      return;
    }

    if (!reassignReason.trim()) {
      toast.error("Please provide a reason for reassignment");
      return;
    }

    setReassigning(true);
    // const result = await reassignStreamSubjectTeacher(
    //   selectedAssignment.streamId,
    //   selectedAssignment.subjectId,
    //   selectedAssignment.termId,
    //   newTeacherId,
    //   reassignReason,
    //   userId
    // );

    // if (result.ok) {
    //   toast.success(result.message);
    //   setReassignDialogOpen(false);
    //   setSelectedAssignment(null);
    //   setNewTeacherId("");
    //   setReassignReason("");
    //   loadAssignments(); // Reload the list
    //   router.refresh();
    // } else {
    //   toast.error(result.message);
    // }
    setReassigning(false);
  }

  return (
    <>
      {/* Main Queue Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="dark:text-white">
                  Assignments Needing Reassignment
                </DialogTitle>
                <DialogDescription className="dark:text-slate-400">
                  These assignments need to be reassigned to other teachers
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAssignments}
                disabled={loading}
                className="dark:bg-slate-700"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : assignments.length === 0 ? (
            <Card className="dark:bg-slate-900 dark:border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500 mb-4" />
                <p className="text-lg font-medium dark:text-white mb-2">
                  All Assignments Up to Date
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  No assignments need reassignment at this time
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                      {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} need
                      {assignments.length !== 1 ? "" : "s"} attention
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                      Please reassign these classes to ensure continuity of instruction
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="dark:text-slate-300">Previous Teacher</TableHead>
                      <TableHead className="dark:text-slate-300">Subject</TableHead>
                      <TableHead className="dark:text-slate-300">Class/Stream</TableHead>
                      <TableHead className="dark:text-slate-300">Term</TableHead>
                      <TableHead className="dark:text-slate-300">Students</TableHead>
                      <TableHead className="dark:text-slate-300">Status</TableHead>
                      <TableHead className="text-right dark:text-slate-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow
                        key={assignment.id}
                        className="dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="dark:text-white">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {assignment.teacher.firstName} {assignment.teacher.lastName}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {assignment.teacher.exitReason}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium dark:text-white">
                          {assignment.subject.name}
                        </TableCell>
                        <TableCell className="dark:text-slate-300">
                          <div className="flex flex-col">
                            <span>{assignment.stream.classYear.classTemplate.name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {assignment.stream.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="dark:text-slate-300">{assignment.term.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="dark:border-slate-600">
                            {assignment.studentEnrollments?.length || 0} students
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-600 text-white">
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSelectAssignment(assignment)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            Reassign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="dark:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassignment Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Reassign Subject</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Assign this subject to a new teacher
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-4">
              {/* Assignment Details */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Subject:</span>
                    <p className="font-medium dark:text-white">{selectedAssignment.subject.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Class:</span>
                    <p className="font-medium dark:text-white">
                      {selectedAssignment.stream.classYear.classTemplate.name} -{" "}
                      {selectedAssignment.stream.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Previous Teacher:</span>
                    <p className="font-medium dark:text-white">
                      {selectedAssignment.teacher.firstName} {selectedAssignment.teacher.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Students Affected:</span>
                    <p className="font-medium dark:text-white">
                      {selectedAssignment.studentEnrollments?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* New Teacher Selection */}
              <div className="space-y-2">
                <Label className="dark:text-white">
                  New Teacher <span className="text-red-500">*</span>
                </Label>
                <Select value={newTeacherId} onValueChange={setNewTeacherId}>
                  <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600">
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-600">
                    {teachers
                      .filter((t) => t.id !== selectedAssignment.teacherId)
                      .map((teacher) => (
                        <SelectItem
                          key={teacher.id}
                          value={teacher.id}
                          className="dark:text-white dark:focus:bg-slate-700"
                        >
                          {teacher.firstName} {teacher.lastName} ({teacher.staffNo})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select an active teacher to take over this assignment
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label className="dark:text-white">
                  Reason for Reassignment <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Explain why this reassignment is needed..."
                  className="dark:bg-slate-900 dark:border-slate-600"
                  rows={3}
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Note:</strong> All {selectedAssignment.studentEnrollments?.length || 0}{" "}
                  students will be automatically transferred to the new teacher. The assignment
                  history will be preserved.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReassignDialogOpen(false)}
              disabled={reassigning}
              className="dark:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassign}
              disabled={reassigning || !newTeacherId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {reassigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reassignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
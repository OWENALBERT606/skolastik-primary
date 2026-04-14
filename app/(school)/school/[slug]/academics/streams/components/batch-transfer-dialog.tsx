// app/school/[slug]/academics/streams/[id]/components/batch-transfer-dialog.tsx
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowRightLeft, 
  Loader2, 
  Search, 
  Users,
  AlertCircle,
  CheckCircle 
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/prisma/db";
import { getStreamsByClassYear } from "@/actions/streams";
import { batchTransferStudents } from "@/actions/enrollments";

interface BatchTransferDialogProps {
  targetStreamId: string;
  classYearId: string;
  schoolId: string;
  onSuccess: () => void;
}

export default function BatchTransferDialog({
  targetStreamId,
  classYearId,
  schoolId,
  onSuccess,
}: BatchTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  const [sourceStreamId, setSourceStreamId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  
  const [streams, setStreams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadStreams();
    }
  }, [open]);

  useEffect(() => {
    if (sourceStreamId) {
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [sourceStreamId]);

  const loadStreams = async () => {
    setIsLoadingStreams(true);
    try {
      const allStreams = await getStreamsByClassYear(classYearId);
      // Filter out target stream
      setStreams(allStreams.filter((s) => s.id !== targetStreamId));
    } catch (error) {
      console.error("Error loading streams:", error);
      toast.error("Failed to load streams");
    } finally {
      setIsLoadingStreams(false);
    }
  };

  const loadStudents = async () => {
    setIsLoadingStudents(true);
    try {
      // Fetch students from source stream
      const enrollments = await db.enrollment.findMany({
        where: {
          streamId: sourceStreamId,
          status: "ACTIVE",
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              gender: true,
            },
          },
          term: true,
        },
        orderBy: {
          student: {
            firstName: "asc",
          },
        },
      });
      
      setStudents(enrollments);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter((enrollment) => {
    const student = enrollment.student;
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.admissionNo.toLowerCase().includes(searchLower)
    );
  });

  const toggleStudent = (enrollmentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(enrollmentId)
        ? prev.filter((id) => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((e) => e.id));
    }
  };

  const handleTransfer = async () => {
    if (!sourceStreamId) {
      toast.error("Please select a source stream");
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setIsLoading(true);
    try {
      const result = await batchTransferStudents({
        enrollmentIds: selectedStudents,
        targetStreamId,
        reason: reason || "Batch stream transfer",
      });

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setSelectedStudents([]);
        setSourceStreamId("");
        setReason("");
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to transfer students");
    } finally {
      setIsLoading(false);
    }
  };

  const sourceStream = streams.find((s) => s.id === sourceStreamId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Transfer Students Here
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-[#5B9BD5]" />
            Transfer Students to This Stream
          </DialogTitle>
          <DialogDescription>
            Select students from another stream to transfer to this stream
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Source Stream Selection */}
          <div className="space-y-2">
            <Label htmlFor="sourceStream">
              Transfer From <span className="text-red-500">*</span>
            </Label>
            {isLoadingStreams ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#5B9BD5]" />
              </div>
            ) : (
              <Select value={sourceStreamId} onValueChange={setSourceStreamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source stream" />
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

          {/* Student Selection */}
          {sourceStreamId && (
            <>
              <div className="space-y-2">
                <Label>Select Students to Transfer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {isLoadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#5B9BD5]" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {searchTerm
                      ? "No students found matching your search"
                      : "No active students in this stream"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Select All */}
                  <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Checkbox
                      checked={
                        selectedStudents.length === filteredStudents.length &&
                        filteredStudents.length > 0
                      }
                      onCheckedChange={toggleAll}
                    />
                    <span className="font-medium text-sm">
                      Select All ({filteredStudents.length})
                    </span>
                    {selectedStudents.length > 0 && (
                      <Badge className="ml-auto bg-[#5B9BD5]">
                        {selectedStudents.length} selected
                      </Badge>
                    )}
                  </div>

                  {/* Student List */}
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                    {filteredStudents.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStudents.includes(enrollment.id)
                            ? "bg-[#5B9BD5]/10 border-[#5B9BD5]"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                        onClick={() => toggleStudent(enrollment.id)}
                      >
                        <Checkbox
                          checked={selectedStudents.includes(enrollment.id)}
                          onCheckedChange={() => toggleStudent(enrollment.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {enrollment.student.firstName}{" "}
                              {enrollment.student.lastName}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {enrollment.student.gender}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {enrollment.student.admissionNo} • Term:{" "}
                            {enrollment.term.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Transfer Reason */}
          {selectedStudents.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="reason">Transfer Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for transfer..."
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Transfer Summary */}
          {selectedStudents.length > 0 && sourceStream && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Transfer Summary
                  </p>
                  <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <p>
                      • Transferring <strong>{selectedStudents.length}</strong>{" "}
                      student(s)
                    </p>
                    <p>
                      • From: <strong>{sourceStream.name}</strong>
                    </p>
                    <p>
                      • Subject enrollments and marks will be preserved
                    </p>
                    <p>
                      • Enrollment status will be updated to "TRANSFERRED"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={isLoading || selectedStudents.length === 0}
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
                Transfer {selectedStudents.length} Student(s)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
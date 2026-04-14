// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { assignTeacherToStreamSubject } from "@/actions/stream-subjects";
// import { getAvailableTeachersForSubject } from "@/actions/teachers";
// import { toast } from "sonner";
// import { Loader2 } from "lucide-react";
// import { Badge } from "@/components/ui/badge";

// type StreamSubject = {
//   id: string;
//   subject: {
//     name: string;
//     code?: string | null;
//   };
//   subjectPaper?: {
//     paperNumber: number;
//     name: string;
//   } | null;
//   term: {
//     name: string;
//   };
//   teacherAssignments: Array<{
//     teacher: {
//       id: string;
//       firstName: string;
//       lastName: string;
//     };
//   }>;
// };

// export default function AssignTeacherDialog({
//   open,
//   onOpenChange,
//   streamSubject,
//   schoolId,
// }: {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   streamSubject: StreamSubject;
//   schoolId: string;
// }) {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [loadingTeachers, setLoadingTeachers] = useState(true);
//   const [teachers, setTeachers] = useState<any[]>([]);
//   const [teacherId, setTeacherId] = useState("");
//   const [notes, setNotes] = useState("");

//   const currentTeacher = streamSubject.teacherAssignments[0]?.teacher;
//   const isReassignment = !!currentTeacher;

//   useEffect(() => {
//     if (open) {
//       loadTeachers();
//       setTeacherId("");
//       setNotes("");
//     }
//   }, [open, streamSubject.id]);

//   const loadTeachers = async () => {
//     setLoadingTeachers(true);
//     try {
//       const data = await getAvailableTeachersForSubject(
//         schoolId,
//         streamSubject.subject.name
//       );
//       setTeachers(data);
//     } catch (error) {
//       toast.error("Failed to load teachers");
//     } finally {
//       setLoadingTeachers(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!teacherId) {
//       toast.error("Please select a teacher");
//       return;
//     }

//     setLoading(true);

//     try {
//       const result = await assignTeacherToStreamSubject({
//         streamSubjectId: streamSubject.id,
//         teacherId,
//         notes: notes.trim() || undefined,
//         isReassignment,
//       });

//       if (result.ok) {
//         toast.success(result.message);
//         onOpenChange(false);
//         router.refresh();
//       } else {
//         toast.error(result.message);
//       }
//     } catch (error) {
//       toast.error("Failed to assign teacher");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>
//             {isReassignment ? "Reassign Teacher" : "Assign Teacher"}
//           </DialogTitle>
//           <DialogDescription>
//             {isReassignment
//               ? `Reassign a new teacher to ${streamSubject.subject.name}`
//               : `Assign a teacher to ${streamSubject.subject.name}`}
//           </DialogDescription>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {/* Subject Info */}
//           <div className="p-3 bg-muted rounded-lg space-y-2">
//             <div className="flex items-center justify-between">
//               <span className="text-sm font-medium">Subject:</span>
//               <span className="font-semibold">{streamSubject.subject.name}</span>
//             </div>
//             {streamSubject.subjectPaper && (
//               <div className="flex items-center justify-between">
//                 <span className="text-sm font-medium">Paper:</span>
//                 <Badge variant="outline">
//                   Paper {streamSubject.subjectPaper.paperNumber}
//                 </Badge>
//               </div>
//             )}
//             <div className="flex items-center justify-between">
//               <span className="text-sm font-medium">Term:</span>
//               <span>{streamSubject.term.name}</span>
//             </div>
//           </div>

//           {/* Current Teacher */}
//           {currentTeacher && (
//             <div className="p-3 border border-orange-200 bg-orange-50 dark:bg-orange-950 rounded-lg">
//               <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
//                 Current Teacher
//               </p>
//               <p className="text-sm">
//                 {currentTeacher.firstName} {currentTeacher.lastName}
//               </p>
//             </div>
//           )}

//           {/* Teacher Selection */}
//           <div className="space-y-2">
//             <Label htmlFor="teacherId">
//               {isReassignment ? "New Teacher" : "Teacher"}{" "}
//               <span className="text-destructive">*</span>
//             </Label>
//             {loadingTeachers ? (
//               <div className="h-10 w-full bg-muted animate-pulse rounded" />
//             ) : (
//               <Select value={teacherId} onValueChange={setTeacherId} required>
//                 <SelectTrigger id="teacherId">
//                   <SelectValue placeholder="Select teacher" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {teachers.length === 0 ? (
//                     <div className="p-2 text-sm text-muted-foreground">
//                       No available teachers
//                     </div>
//                   ) : (
//                     teachers.map((teacher) => (
//                       <SelectItem key={teacher.id} value={teacher.id}>
//                         {teacher.firstName} {teacher.lastName} ({teacher.staffNo})
//                       </SelectItem>
//                     ))
//                   )}
//                 </SelectContent>
//               </Select>
//             )}
//             <p className="text-xs text-muted-foreground">
//               {teachers.length} teacher(s) available
//             </p>
//           </div>

//           {/* Notes */}
//           {isReassignment && (
//             <div className="space-y-2">
//               <Label htmlFor="notes">Reassignment Notes (Optional)</Label>
//               <Textarea
//                 id="notes"
//                 value={notes}
//                 onChange={(e) => setNotes(e.target.value)}
//                 placeholder="Reason for reassignment..."
//                 rows={3}
//               />
//             </div>
//           )}

//           {/* Actions */}
//           <div className="flex gap-3 justify-end pt-4">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => onOpenChange(false)}
//               disabled={loading}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={loading || teachers.length === 0}>
//               {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
//               {isReassignment ? "Reassign Teacher" : "Assign Teacher"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }





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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { assignTeacherToStreamSubject } from "@/actions/stream-subjects";
import { getAvailableTeachersForSubject } from "@/actions/teachers";
import { toast } from "sonner";
import { Loader2, FileText, BookOpen, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StreamSubject = {
  id: string;
  subject: {
    name: string;
    code?: string | null;
  };
  subjectPaper?: {
    paperNumber: number;
    name: string;
    paperCode?: string | null;
    maxMarks?: number;
    weight?: number;
  } | null;
  term: {
    name: string;
  };
  teacherAssignments: Array<{
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
      staffNo?: string;
    };
  }>;
};

export default function AssignTeacherDialog({
  open,
  onOpenChange,
  streamSubject,
  schoolId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamSubject: StreamSubject;
  schoolId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [notes, setNotes] = useState("");

  const currentTeacher = streamSubject.teacherAssignments[0]?.teacher;
  const isReassignment = !!currentTeacher;

  useEffect(() => {
    if (open) {
      loadTeachers();
      setTeacherId("");
      setNotes("");
    }
  }, [open, streamSubject.id]);

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const data = await getAvailableTeachersForSubject(
        schoolId,
        streamSubject.subject.name
      );
      setTeachers(data || []); // ✅ Ensure array
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast.error("Failed to load teachers");
      setTeachers([]); // ✅ Set empty array on error
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherId) {
      toast.error("Please select a teacher");
      return;
    }

    setLoading(true);

    try {
      const result = await assignTeacherToStreamSubject({
        streamSubjectId: streamSubject.id,
        teacherId,
        notes: notes.trim() || undefined,
        isReassignment,
      });

      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to assign teacher");
      }
    } catch (error) {
      console.error("Error assigning teacher:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#5B9BD5]" />
            {isReassignment ? "Reassign Teacher" : "Assign Teacher"}
          </DialogTitle>
          <DialogDescription>
            {isReassignment
              ? `Reassign a new teacher to this subject`
              : `Assign a teacher to this subject`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ✅ ENHANCED: Subject Info with Paper Code */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Subject:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {streamSubject.subject.name}
                </span>
                {streamSubject.subject.code && (
                  <Badge variant="outline" className="text-xs">
                    {streamSubject.subject.code}
                  </Badge>
                )}
              </div>
            </div>

            {/* ✅ Enhanced Paper Display */}
            {streamSubject.subjectPaper && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-[#5B9BD5]" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Paper Details:
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Paper {streamSubject.subjectPaper.paperNumber}
                    </Badge>
                    <span className="text-slate-700 dark:text-slate-300">
                      {streamSubject.subjectPaper.name}
                    </span>
                  </div>
                  {streamSubject.subjectPaper.paperCode && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-600 dark:text-slate-400">Code:</span>
                      <Badge
                        variant="outline"
                        className="font-mono bg-[#5B9BD5]/10 text-[#5B9BD5] border-[#5B9BD5]/20"
                      >
                        {streamSubject.subjectPaper.paperCode}
                      </Badge>
                    </div>
                  )}
                  {streamSubject.subjectPaper.maxMarks && (
                    <div className="text-slate-600 dark:text-slate-400">
                      Max: <span className="font-medium text-slate-900 dark:text-white">
                        {streamSubject.subjectPaper.maxMarks}
                      </span>
                    </div>
                  )}
                  {streamSubject.subjectPaper.weight && (
                    <div className="text-slate-600 dark:text-slate-400">
                      Weight: <span className="font-medium text-slate-900 dark:text-white">
                        {streamSubject.subjectPaper.weight}x
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Term:
                </span>
              </div>
              <Badge variant="outline">{streamSubject.term.name}</Badge>
            </div>
          </div>

          {/* Current Teacher */}
          {currentTeacher && (
            <div className="p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                Current Teacher
              </p>
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900 dark:text-white">
                  {currentTeacher.firstName} {currentTeacher.lastName}
                </p>
                {currentTeacher.staffNo && (
                  <Badge variant="outline" className="text-xs">
                    {currentTeacher.staffNo}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label htmlFor="teacherId">
              {isReassignment ? "New Teacher" : "Select Teacher"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {loadingTeachers ? (
              <div className="flex items-center justify-center h-10 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded">
                <Loader2 className="h-4 w-4 animate-spin text-[#5B9BD5]" />
              </div>
            ) : (
              <>
                <Select value={teacherId} onValueChange={setTeacherId} required>
                  <SelectTrigger id="teacherId">
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.length === 0 ? (
                      <div className="p-3 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No available teachers
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          All teachers may already be assigned
                        </p>
                      </div>
                    ) : (
                      teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          <div className="flex items-center gap-2">
                            <span>
                              {teacher.firstName} {teacher.lastName}
                            </span>
                            {teacher.staffNo && (
                              <span className="text-xs text-slate-500">
                                ({teacher.staffNo})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {teachers.length} teacher(s) available for assignment
                </p>
              </>
            )}
          </div>

          {/* Notes */}
          {isReassignment && (
            <div className="space-y-2">
              <Label htmlFor="notes">Reassignment Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter reason for teacher reassignment..."
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* ✅ Info Box for Multi-Paper */}
          {streamSubject.subjectPaper && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-400">
                <strong>Note:</strong> This assignment is specific to{" "}
                {streamSubject.subjectPaper.name}. Other papers of this subject may
                have different teachers assigned.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
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
              disabled={loading || teachers.length === 0 || !teacherId}
              className="bg-[#5B9BD5] hover:bg-[#4A8BC2]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isReassignment ? "Reassigning..." : "Assigning..."}
                </>
              ) : (
                <>
                  {isReassignment ? "Reassign Teacher" : "Assign Teacher"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
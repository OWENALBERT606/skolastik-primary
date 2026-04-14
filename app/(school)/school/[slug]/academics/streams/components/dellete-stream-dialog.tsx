// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { deleteStream } from "@/actions/streams";
// import { toast } from "sonner";
// import { Loader2, AlertTriangle } from "lucide-react";

// type Stream = {
//   id: string;
//   name: string;
//   classYear: {
//     classTemplate: { name: string };
//   };
// };

// interface DeleteStreamDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   stream: Stream;
// }

// export default function DeleteStreamDialog({
//   open,
//   onOpenChange,
//   stream,
// }: DeleteStreamDialogProps) {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const handleDelete = async () => {
//     setLoading(true);

//     try {
//       const result = await deleteStream(stream.id);

//       if (result.ok) {
//         toast.success(result.message);
//         onOpenChange(false);
//         router.refresh();
//       } else {
//         toast.error(result.message);
//       }
//     } catch (error) {
//       toast.error("Failed to delete stream");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AlertDialog open={open} onOpenChange={onOpenChange}>
//       <AlertDialogContent>
//         <AlertDialogHeader>
//           <div className="flex items-center gap-2">
//             <AlertTriangle className="h-5 w-5 text-destructive" />
//             <AlertDialogTitle>Delete Stream?</AlertDialogTitle>
//           </div>
//           <AlertDialogDescription className="space-y-2">
//             <p>
//               Are you sure you want to delete{" "}
//               <span className="font-semibold text-foreground">
//                 {stream.name}
//               </span>{" "}
//               from{" "}
//               <span className="font-semibold text-foreground">
//                 {stream.classYear.classTemplate.name}
//               </span>
//               ?
//             </p>
//             <p className="text-destructive">
//               This action cannot be undone. All associated data including subject
//               assignments and teacher allocations will be permanently removed.
//             </p>
//           </AlertDialogDescription>
//         </AlertDialogHeader>
//         <AlertDialogFooter>
//           <Button
//             variant="outline"
//             onClick={() => onOpenChange(false)}
//             disabled={loading}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="destructive"
//             onClick={handleDelete}
//             disabled={loading}
//           >
//             {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
//             Delete Stream
//           </Button>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// }






// components/streams/delete-stream-dialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteStream } from "@/actions/streams";
import { toast } from "sonner";
import { Loader2, AlertTriangle, FileText, Users, BookOpen } from "lucide-react";

type Stream = {
  id: string;
  name: string;
  classYear: {
    classTemplate: { name: string };
  };
  _count?: {
    enrollments: number;
    streamSubjects: number;
  };
  streamSubjects?: Array<{
    subject: {
      name: string;
      papers?: Array<{ paperCode: string | null; name: string }>;
    };
    subjectPaper?: {
      paperCode: string | null;
      name: string;
    } | null;
  }>;
};

interface DeleteStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stream: Stream;
}

export default function DeleteStreamDialog({
  open,
  onOpenChange,
  stream,
}: DeleteStreamDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ✅ Calculate statistics
  const enrollmentCount = stream._count?.enrollments || 0;
  const subjectCount = stream._count?.streamSubjects || 0;
  
  // ✅ Count unique subjects vs total papers
  const uniqueSubjects = new Set(
    stream.streamSubjects?.map((ss) => ss.subject.name) || []
  ).size;
  const totalPapers = stream.streamSubjects?.length || 0;
  const hasMultiplePapers = totalPapers > uniqueSubjects;

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteStream(stream.id);

      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete stream");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle>Delete Stream?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {stream.name}
              </span>{" "}
              from{" "}
              <span className="font-semibold text-foreground">
                {stream.classYear.classTemplate.name}
              </span>
              ?
            </p>

            {/* ✅ Enhanced warnings with stats */}
            {(enrollmentCount > 0 || subjectCount > 0) && (
              <div className="space-y-2 mt-3">
                {enrollmentCount > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Users className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                        {enrollmentCount} student enrollment(s)
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        All student enrollments and their subject enrollments will be removed
                      </p>
                    </div>
                  </div>
                )}

                {subjectCount > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                        {uniqueSubjects} unique subject(s)
                        {hasMultiplePapers && ` (${totalPapers} total papers)`}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        All subject assignments and teacher allocations will be removed
                      </p>
                      {/* ✅ Show multi-paper info */}
                      {hasMultiplePapers && (
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                          Includes multi-paper subjects
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-destructive font-medium mt-3">
              ⚠️ This action cannot be undone
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Stream
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
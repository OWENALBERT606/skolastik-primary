// // components/academic-years/AcademicYearDetailsDialog.tsx
// "use client";

// import { useEffect, useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Calendar,
//   Users,
//   BookOpen,
//   Clock,
//   CheckCircle2,
//   Loader2,
//   FileText,
// } from "lucide-react";
// import { format } from "date-fns";
// import { getAcademicYearById } from "@/actions/years";

// interface AcademicYearDetailsDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   academicYearId: string;
// }

// export default function AcademicYearDetailsDialog({
//   open,
//   onOpenChange,
//   academicYearId,
// }: AcademicYearDetailsDialogProps) {
//   const [academicYear, setAcademicYear] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (open && academicYearId) {
//       loadAcademicYear();
//     }
//   }, [open, academicYearId]);

//   const loadAcademicYear = async () => {
//     setIsLoading(true);
//     try {
//       const result = await getAcademicYearById(academicYearId);
//       if (result.ok) {
//         setAcademicYear(result.data);
//       }
//     } catch (error) {
//       console.error("Failed to load academic year:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatDate = (date: Date | null | undefined) => {
//     if (!date) return "Not set";
//     return format(new Date(date), "MMMM dd, yyyy");
//   };

//   if (isLoading) {
//     return (
//       <Dialog open={open} onOpenChange={onOpenChange}>
//         <DialogContent className="sm:max-w-[700px]">
//           <div className="flex items-center justify-center py-12">
//             <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
//           </div>
//         </DialogContent>
//       </Dialog>
//     );
//   }

//   if (!academicYear) {
//     return null;
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
//         <DialogHeader>
//           <div className="flex items-center justify-between">
//             <DialogTitle className="text-2xl">
//               Academic Year {academicYear.year}
//             </DialogTitle>
//             <Badge
//               variant={academicYear.isActive ? "default" : "secondary"}
//               className={
//                 academicYear.isActive
//                   ? "bg-green-100 text-green-800"
//                   : ""
//               }
//             >
//               {academicYear.isActive ? (
//                 <>
//                   <CheckCircle2 className="w-3 h-3 mr-1" />
//                   Active
//                 </>
//               ) : (
//                 "Inactive"
//               )}
//             </Badge>
//           </div>
//           <DialogDescription>
//             Detailed information about this academic year
//           </DialogDescription>
//         </DialogHeader>

//         <Tabs defaultValue="overview" className="mt-4">
//           <TabsList className="grid w-full grid-cols-3">
//             <TabsTrigger value="overview">Overview</TabsTrigger>
//             <TabsTrigger value="terms">
//               Terms ({academicYear.terms?.length || 0})
//             </TabsTrigger>
//             <TabsTrigger value="statistics">Statistics</TabsTrigger>
//           </TabsList>

//           {/* Overview Tab */}
//           <TabsContent value="overview" className="space-y-6 mt-6">
//             {/* Basic Information */}
//             <div className="space-y-4">
//               <h3 className="font-semibold text-lg">Basic Information</h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <InfoItem
//                   icon={<Calendar className="w-4 h-4 text-blue-600" />}
//                   label="Academic Year"
//                   value={academicYear.year}
//                 />
//                 <InfoItem
//                   icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
//                   label="Status"
//                   value={academicYear.isActive ? "Active" : "Inactive"}
//                 />
//               </div>
//             </div>

//             <Separator />

//             {/* Date Information */}
//             <div className="space-y-4">
//               <h3 className="font-semibold text-lg">Date Information</h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <InfoItem
//                   icon={<Clock className="w-4 h-4 text-blue-600" />}
//                   label="Start Date"
//                   value={formatDate(academicYear.startDate)}
//                 />
//                 <InfoItem
//                   icon={<Clock className="w-4 h-4 text-blue-600" />}
//                   label="End Date"
//                   value={formatDate(academicYear.endDate)}
//                 />
//               </div>
//             </div>

//             <Separator />

//             {/* School Information */}
//             {academicYear.school && (
//               <div className="space-y-4">
//                 <h3 className="font-semibold text-lg">School Information</h3>
//                 <div className="bg-gray-50 rounded-lg p-4">
//                   <p className="font-medium text-gray-900">
//                     {academicYear.school.name}
//                   </p>
//                   <p className="text-sm text-gray-600 mt-1">
//                     Slug: {academicYear.school.slug}
//                   </p>
//                 </div>
//               </div>
//             )}

//             <Separator />

//             {/* Metadata */}
//             <div className="space-y-4">
//               <h3 className="font-semibold text-lg">Metadata</h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <InfoItem
//                   icon={<Calendar className="w-4 h-4 text-gray-600" />}
//                   label="Created At"
//                   value={format(
//                     new Date(academicYear.createdAt),
//                     "MMM dd, yyyy HH:mm"
//                   )}
//                 />
//                 <InfoItem
//                   icon={<Calendar className="w-4 h-4 text-gray-600" />}
//                   label="Updated At"
//                   value={format(
//                     new Date(academicYear.updatedAt),
//                     "MMM dd, yyyy HH:mm"
//                   )}
//                 />
//               </div>
//             </div>
//           </TabsContent>

//           {/* Terms Tab */}
//           <TabsContent value="terms" className="mt-6">
//             {academicYear.terms && academicYear.terms.length > 0 ? (
//               <div className="space-y-3">
//                 {academicYear.terms.map((term: any) => (
//                   <div
//                     key={term.id}
//                     className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow"
//                   >
//                     <div className="flex items-start justify-between mb-2">
//                       <div>
//                         <h4 className="font-semibold text-gray-900">
//                           {term.name}
//                         </h4>
//                         <p className="text-sm text-gray-600">
//                           Term {term.termNumber}
//                         </p>
//                       </div>
//                       <Badge
//                         variant={term.isActive ? "default" : "secondary"}
//                         className={
//                           term.isActive ? "bg-green-100 text-green-800" : ""
//                         }
//                       >
//                         {term.isActive ? "Active" : "Inactive"}
//                       </Badge>
//                     </div>
//                     <div className="grid grid-cols-2 gap-2 text-sm">
//                       <p className="text-gray-600">
//                         <span className="font-medium">Start:</span>{" "}
//                         {formatDate(term.startDate)}
//                       </p>
//                       <p className="text-gray-600">
//                         <span className="font-medium">End:</span>{" "}
//                         {formatDate(term.endDate)}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-12 bg-gray-50 rounded-lg">
//                 <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
//                 <p className="text-gray-600">No terms created yet</p>
//                 <p className="text-sm text-gray-500 mt-1">
//                   Terms will appear here once created
//                 </p>
//               </div>
//             )}
//           </TabsContent>

//           {/* Statistics Tab */}
//           <TabsContent value="statistics" className="mt-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <StatCard
//                 icon={<BookOpen className="w-6 h-6 text-blue-600" />}
//                 label="Total Terms"
//                 value={academicYear.terms?.length || 0}
//                 bgColor="bg-blue-50"
//               />
//               <StatCard
//                 icon={<Users className="w-6 h-6 text-green-600" />}
//                 label="Total Enrollments"
//                 value={academicYear.enrollments?.length || 0}
//                 bgColor="bg-green-50"
//               />
//               <StatCard
//                 icon={<FileText className="w-6 h-6 text-blue-600" />}
//                 label="Grading Configs"
//                 value={academicYear.gradingConfigs?.length || 0}
//                 bgColor="bg-blue-50"
//               />
//               <StatCard
//                 icon={<Calendar className="w-6 h-6 text-orange-600" />}
//                 label="Duration"
//                 value={
//                   academicYear.startDate && academicYear.endDate
//                     ? `${Math.ceil(
//                         (new Date(academicYear.endDate).getTime() -
//                           new Date(academicYear.startDate).getTime()) /
//                           (1000 * 60 * 60 * 24)
//                       )} days`
//                     : "Not set"
//                 }
//                 bgColor="bg-orange-50"
//               />
//             </div>
//           </TabsContent>
//         </Tabs>
//       </DialogContent>
//     </Dialog>
//   );
// }

// function InfoItem({
//   icon,
//   label,
//   value,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value: string;
// }) {
//   return (
//     <div className="flex items-start gap-3">
//       <div className="mt-0.5">{icon}</div>
//       <div>
//         <p className="text-sm text-gray-600">{label}</p>
//         <p className="font-medium text-gray-900">{value}</p>
//       </div>
//     </div>
//   );
// }

// function StatCard({
//   icon,
//   label,
//   value,
//   bgColor,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value: number | string;
//   bgColor: string;
// }) {
//   return (
//     <div className="bg-white rounded-lg border p-6">
//       <div className="flex items-center gap-4">
//         <div className={`${bgColor} p-3 rounded-lg`}>{icon}</div>
//         <div>
//           <p className="text-sm text-gray-600">{label}</p>
//           <p className="text-2xl font-bold text-gray-900">{value}</p>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  BookOpen,
  Clock,
  CheckCircle2,
  Loader2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { getAcademicYearById } from "@/actions/years";

interface AcademicYearDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYearId: string;
}

export default function AcademicYearDetailsDialog({
  open,
  onOpenChange,
  academicYearId,
}: AcademicYearDetailsDialogProps) {
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && academicYearId) {
      loadAcademicYear();
    }
  }, [open, academicYearId]);

  const loadAcademicYear = async () => {
    setIsLoading(true);
    try {
      const result = await getAcademicYearById(academicYearId);
      if (result.ok) {
        setAcademicYear(result.data);
      }
    } catch (error) {
      console.error("Failed to load academic year:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return format(new Date(date), "MMMM dd, yyyy");
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="z-50 sm:max-w-[700px] bg-background text-foreground">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!academicYear) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-50 sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-background text-foreground"
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-2xl">
              Academic Year {academicYear.year}
            </DialogTitle>
            <Badge
              variant={academicYear.isActive ? "default" : "secondary"}
              className={
                academicYear.isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : ""
              }
            >
              {academicYear.isActive ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              ) : (
                "Inactive"
              )}
            </Badge>
          </div>
          <DialogDescription>
            Detailed information about this academic year
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="terms">
              Terms ({academicYear.terms?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  label="Academic Year"
                  value={academicYear.year}
                />
                <InfoItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
                  label="Status"
                  value={academicYear.isActive ? "Active" : "Inactive"}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Date Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  label="Start Date"
                  value={formatDate(academicYear.startDate)}
                />
                <InfoItem
                  icon={<Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  label="End Date"
                  value={formatDate(academicYear.endDate)}
                />
              </div>
            </div>

            <Separator />

            {academicYear.school && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">School Information</h3>
                <div className="rounded-lg p-4 bg-muted">
                  <p className="font-medium">{academicYear.school.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Slug: {academicYear.school.slug}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                  label="Created At"
                  value={format(new Date(academicYear.createdAt), "MMM dd, yyyy HH:mm")}
                />
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                  label="Updated At"
                  value={format(new Date(academicYear.updatedAt), "MMM dd, yyyy HH:mm")}
                />
              </div>
            </div>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms" className="mt-6">
            {academicYear.terms && academicYear.terms.length > 0 ? (
              <div className="space-y-3">
                {academicYear.terms.map((term: any) => (
                  <div
                    key={term.id}
                    className="rounded-lg border p-4 bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{term.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Term {term.termNumber}
                        </p>
                      </div>
                      <Badge
                        variant={term.isActive ? "default" : "secondary"}
                        className={
                          term.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : ""
                        }
                      >
                        {term.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Start:</span> {formatDate(term.startDate)}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">End:</span> {formatDate(term.endDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-lg bg-muted">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No terms created yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Terms will appear here once created
                </p>
              </div>
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                icon={<BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                label="Total Terms"
                value={academicYear.terms?.length || 0}
                bgColor="bg-blue-50 dark:bg-blue-950"
              />
              <StatCard
                icon={<Users className="w-6 h-6 text-green-600 dark:text-green-400" />}
                label="Total Enrollments"
                value={academicYear.enrollments?.length || 0}
                bgColor="bg-green-50 dark:bg-green-950"
              />
              <StatCard
                icon={<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                label="Grading Configs"
                value={academicYear.gradingConfigs?.length || 0}
                bgColor="bg-blue-50 dark:bg-blue-950"
              />
              <StatCard
                icon={<Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
                label="Duration"
                value={
                  academicYear.startDate && academicYear.endDate
                    ? `${Math.ceil(
                        (new Date(academicYear.endDate).getTime() -
                          new Date(academicYear.startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )} days`
                    : "Not set"
                }
                bgColor="bg-orange-50 dark:bg-orange-950"
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bgColor: string;
}) {
  return (
    <div className="rounded-lg border p-6 bg-card">
      <div className="flex items-center gap-4">
        <div className={`${bgColor} p-3 rounded-lg`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

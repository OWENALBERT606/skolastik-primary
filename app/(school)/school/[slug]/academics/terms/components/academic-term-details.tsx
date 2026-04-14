// components/academic-terms/AcademicTermDetailsDialog.tsx
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
  ClipboardList,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { getAcademicTermById } from "@/actions/terms";

interface AcademicTermDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicTermId: string;
}

export default function AcademicTermDetailsDialog({
  open,
  onOpenChange,
  academicTermId,
}: AcademicTermDetailsDialogProps) {
  const [academicTerm, setAcademicTerm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && academicTermId) {
      loadAcademicTerm();
    }
  }, [open, academicTermId]);

  const loadAcademicTerm = async () => {
    setIsLoading(true);
    try {
      const result = await getAcademicTermById(academicTermId);
      if (result.ok) {
        setAcademicTerm(result.data);
      }
    } catch (error) {
      console.error("Failed to load academic term:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return format(new Date(date), "MMMM dd, yyyy");
  };

  const getTermNumberBadge = (termNumber: number) => {
    const colors = {
      1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      2: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      3: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return colors[termNumber as keyof typeof colors] || colors[1];
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!academicTerm) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl text-gray-900 dark:text-gray-100">
              {academicTerm.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getTermNumberBadge(academicTerm.termNumber)}>
                Term {academicTerm.termNumber}
              </Badge>
              <Badge
                variant={academicTerm.isActive ? "default" : "secondary"}
                className={
                  academicTerm.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }
              >
                {academicTerm.isActive ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </>
                ) : (
                  "Inactive"
                )}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Detailed information about this academic term
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-900">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              Overview
            </TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  label="Term Name"
                  value={academicTerm.name}
                />
                <InfoItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
                  label="Term Number"
                  value={`Term ${academicTerm.termNumber}`}
                />
                <InfoItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
                  label="Status"
                  value={academicTerm.isActive ? "Active" : "Inactive"}
                />
                <InfoItem
                  icon={<BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  label="Academic Year"
                  value={academicTerm.academicYear.year}
                />
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            {/* Date Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Date Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  label="Start Date"
                  value={formatDate(academicTerm.startDate)}
                />
                <InfoItem
                  icon={<Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  label="End Date"
                  value={formatDate(academicTerm.endDate)}
                />
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                  label="Duration"
                  value={
                    academicTerm.startDate && academicTerm.endDate
                      ? `${Math.ceil(
                          (new Date(academicTerm.endDate).getTime() -
                            new Date(academicTerm.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )} days`
                      : "Not set"
                  }
                />
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            {/* School Information */}
            {academicTerm.academicYear?.school && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">School Information</h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {academicTerm.academicYear.school.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Slug: {academicTerm.academicYear.school.slug}
                  </p>
                </div>
              </div>
            )}

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            {/* Metadata */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                  label="Created At"
                  value={format(
                    new Date(academicTerm.createdAt),
                    "MMM dd, yyyy HH:mm"
                  )}
                />
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                  label="Updated At"
                  value={format(
                    new Date(academicTerm.updatedAt),
                    "MMM dd, yyyy HH:mm"
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                label="Total Enrollments"
                value={academicTerm._count?.enrollments || 0}
                bgColor="bg-blue-50 dark:bg-blue-900/20"
              />
              <StatCard
                icon={<ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />}
                label="Total Exams"
                value={academicTerm._count?.exams || 0}
                bgColor="bg-green-50 dark:bg-green-900/20"
              />
              <StatCard
                icon={<BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                label="Teacher Assignments"
                value={academicTerm._count?.streamSubjectTeachers || 0}
                bgColor="bg-blue-50 dark:bg-blue-900/20"
              />
              <StatCard
                icon={<Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
                label="Assessment Configs"
                value={academicTerm._count?.assessmentConfigs || 0}
                bgColor="bg-orange-50 dark:bg-orange-900/20"
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
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`${bgColor} p-3 rounded-lg transition-colors`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  );
}
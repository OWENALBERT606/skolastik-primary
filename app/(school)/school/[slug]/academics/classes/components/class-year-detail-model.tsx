// components/dashboard/classes/class-year-detail-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Layers,
  Loader2,
  Users,
  X,
  Book,
  GraduationCap,
  Settings,
} from "lucide-react";
import { getClassYearById } from "@/actions/classes";
import { StreamsTab }  from "./streams-tab";
import { SubjectsTab } from "./subjects-tab";
import { StudentsTab } from "./students-tab";
import { SettingsTab } from "../../streams/[id]/subjects/[subjectId]/components/settings-tab";
// FIX [2]: Correct import path — SettingsTab lives alongside the other class tabs

interface ClassYearDetailModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  classYearId: string;
  schoolId:    string;
  schoolSlug:  string;
  userId?:     string;
}

// FIX [1]: Add "settings" to the Tab union type
type Tab = "overview" | "streams" | "subjects" | "students" | "settings";

export function ClassYearDetailModal({
  isOpen,
  onClose,
  classYearId,
  schoolId,
  schoolSlug,
  userId,
}: ClassYearDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [classYear, setClassYear] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadClassYear();
    }
  }, [isOpen, classYearId]);

  const loadClassYear = async () => {
    setIsLoading(true);
    try {
      const data = await getClassYearById(classYearId);
      setClassYear(data);
    } catch (error) {
      console.error("Error loading class year:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadClassYear();
    router.refresh();
  };

  if (!isOpen) return null;

  // Shared tab button class builder
  const tabClass = (tab: Tab) =>
    `px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
      activeTab === tab
        ? "border-[#5B9BD5] text-[#5B9BD5]"
        : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-6xl w-full shadow-xl border border-slate-200 dark:border-slate-700 my-8 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#5B9BD5]" />
              <span className="text-slate-600 dark:text-slate-400">Loading...</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC2] rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {classYear?.classTemplate.name}
                  </h2>
                  {classYear?.classTemplate.code && (
                    <span className="px-2.5 py-1 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 text-[#5B9BD5] text-sm font-medium rounded-lg">
                      {classYear.classTemplate.code}
                    </span>
                  )}
                  {classYear?.isActive === false && (
                    <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-lg">
                      Inactive
                    </span>
                  )}
                  {classYear?.isActive === true && (
                    <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Academic Year: {classYear?.academicYear.year}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-6">
          <div className="flex gap-1">
            <button onClick={() => setActiveTab("overview")} className={tabClass("overview")}>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Overview
              </div>
            </button>

            <button onClick={() => setActiveTab("streams")} className={tabClass("streams")}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Streams
                {classYear && (
                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded">
                    {classYear._count.streams}
                  </span>
                )}
              </div>
            </button>

            <button onClick={() => setActiveTab("subjects")} className={tabClass("subjects")}>
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4" />
                Subjects
                {classYear && (
                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded">
                    {classYear._count.classSubjects}
                  </span>
                )}
              </div>
            </button>

            <button onClick={() => setActiveTab("students")} className={tabClass("students")}>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Students
                {classYear && (
                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded">
                    {classYear._count.enrollments}
                  </span>
                )}
              </div>
            </button>

            {/* FIX [1]: "settings" is now a valid Tab value */}
            <button onClick={() => setActiveTab("settings")} className={tabClass("settings")}>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#5B9BD5]" />
            </div>
          ) : (
            <>
              {activeTab === "overview" && <OverviewTab classYear={classYear} />}

              {activeTab === "streams" && (
                <StreamsTab
                  classYear={classYear}
                  schoolId={schoolId}
                  onUpdate={refreshData}
                  schoolSlug={schoolSlug}
                />
              )}

              {activeTab === "subjects" && (
                <SubjectsTab
                  classYear={classYear}
                  schoolId={schoolId}
                  onUpdate={refreshData}
                />
              )}

              {activeTab === "students" && (
                <StudentsTab
                  schoolSlug={schoolSlug}
                  classYear={classYear}
                  schoolId={schoolId}
                  onUpdate={refreshData}
                />
              )}

              {activeTab === "settings" && (
                <SettingsTab
                  classYear={classYear}
                  schoolId={schoolId}
                  userId={userId}
                  onUpdate={refreshData}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ════════════════════════════════════════════════════════════════════════════

function OverviewTab({ classYear }: { classYear: any }) {
  if (!classYear) return null;

  const uniqueSubjects = classYear._count?.classSubjects ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Streams</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {classYear._count.streams}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Students</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {classYear._count.enrollments}
                {classYear.maxStudents && (
                  <span className="text-base text-slate-500 dark:text-slate-400">
                    /{classYear.maxStudents}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Subjects</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {uniqueSubjects}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Terms</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {classYear.academicYear.terms.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Information */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Class Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Class Template</p>
            <p className="text-base font-medium text-slate-900 dark:text-white">
              {classYear.classTemplate.name}
              {classYear.classTemplate.code && ` (${classYear.classTemplate.code})`}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Academic Year</p>
            <p className="text-base font-medium text-slate-900 dark:text-white">
              {classYear.academicYear.year}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Maximum Students</p>
            <p className="text-base font-medium text-slate-900 dark:text-white">
              {classYear.maxStudents || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</p>
            <p className="text-base font-medium">
              {classYear.isActive ? (
                <span className="text-green-600 dark:text-green-400">Active</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Inactive</span>
              )}
            </p>
          </div>
        </div>
        {classYear.remarks && (
          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Remarks</p>
            <p className="text-base text-slate-900 dark:text-white">{classYear.remarks}</p>
          </div>
        )}
      </div>

      {/* Academic Terms */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Academic Terms</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {classYear.academicYear.terms.map((term: any) => (
            <div key={term.id} className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#5B9BD5]" />
                <span className="font-medium text-slate-900 dark:text-white">{term.name}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(term.startDate).toLocaleDateString()} —{" "}
                {new Date(term.endDate).toLocaleDateString()}
              </p>
              {term.isActive && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                  Current Term
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Streams List */}
      {classYear.streams.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Streams ({classYear.streams.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classYear.streams.map((stream: any) => {
              const uniqueSubjectIds = new Set(
                stream.streamSubjects?.map((ss: any) => ss.subjectId) || []
              );
              return (
                <div key={stream.id} className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-[#5B9BD5]" />
                    <span className="font-medium text-slate-900 dark:text-white">{stream.name}</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <p>{stream._count?.enrollments || 0} students</p>
                    <p>{uniqueSubjectIds.size} subjects</p>
                  </div>
                  {stream.classHead && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                      Head: {stream.classHead.firstName} {stream.classHead.lastName}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
// components/dashboard/classes/classes-list.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Book,
  BookOpen,
  Calendar,
  ChevronRight,
  Eye,
  FolderOpen,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Copy,
} from "lucide-react";
import { deleteClassTemplate, deleteClassYear, copyClassesToNewYear } from "@/actions/classes";
import { toast } from "sonner";
import { ClassYearFormModal } from "./class-year-model";
import { ClassYearDetailModal } from "./class-year-detail-model";
import { ClassTemplateFormModal } from "./class-template-form-model";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  staffNo: string;
};

type ClassTemplate = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  level: number | null;
  _count: {
    classYears: number;
  };
};

type AcademicYear = {
  id: string;
  year: string;
  isActive: boolean;
  terms: Array<{
    id: string;
    name: string;
    termNumber: number;
  }>;
};

type ClassYear = {
  id: string;
  classTemplateId: string;
  academicYearId: string;
  maxStudents: number | null;
  classTeacherId: string | null;
  remarks: string | null;
  isActive: boolean;
  classLevel: string;
  classTemplate: {
    id: string;
    name: string;
    code: string | null;
    level: number | null;
  };
  academicYear: {
    id: string;
    year: string;
  };
  streams: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    enrollments: number;
    streams: number;
    classSubjects: number;
  };
};

interface ClassesListProps {
  classTemplates: ClassTemplate[];
  classYears: ClassYear[];
  academicYears: AcademicYear[];
  activeAcademicYear: AcademicYear;
  selectedYearId: string;
  teachers: Teacher[];
  schoolId: string;
  schoolSlug: string;
  userId?: string;
}

type ViewMode = "templates" | "years";

export function ClassesList({
  classTemplates,
  classYears,
  academicYears,
  activeAcademicYear,
  selectedYearId,
  schoolSlug,
  teachers,
  schoolId,
  userId,
}: ClassesListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("years");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState<ClassTemplate | null>(null);
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState<ClassTemplate | null>(null);
  
  const [showAddClassYearModal, setShowAddClassYearModal] = useState(false);
  const [showEditClassYearModal, setShowEditClassYearModal] = useState<ClassYear | null>(null);
  const [showDeleteClassYearModal, setShowDeleteClassYearModal] = useState<ClassYear | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<ClassYear | null>(null);
  
  const [showCopyModal, setShowCopyModal] = useState(false);
  
  // Loading states
  const [isDeletingTemplate, setIsDeletingTemplate] = useState<string | null>(null);
  const [isDeletingClassYear, setIsDeletingClassYear] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const selectedYear = academicYears.find((y) => y.id === selectedYearId) || activeAcademicYear;

  // Filter data
  const filteredTemplates = classTemplates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClassYears = classYears.filter((classYear) =>
    classYear.classTemplate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classYear.classTemplate.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle academic year change
  const handleYearChange = (yearId: string) => {
    router.push(`/school/${schoolSlug}/academics/classes?yearId=${yearId}`);
  };

  // Handle delete template
  const handleDeleteTemplate = async (template: ClassTemplate) => {
    setIsDeletingTemplate(template.id);
    try {
      const result = await deleteClassTemplate(template.id);
      if (result?.ok) {
        toast.success(result.message);
        setShowDeleteTemplateModal(null);
        router.refresh();
      } else {
        toast.error(result?.message || "Failed to delete class template");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeletingTemplate(null);
    }
  };

  // Handle delete class year
  const handleDeleteClassYear = async (classYear: ClassYear) => {
    setIsDeletingClassYear(classYear.id);
    try {
      const result = await deleteClassYear(classYear.id);
      if (result?.ok) {
        toast.success(result.message);
        setShowDeleteClassYearModal(null);
        router.refresh();
      } else {
        toast.error(result?.message || "Failed to delete class");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeletingClassYear(null);
    }
  };

  // Handle copy classes
  const handleCopyClasses = async () => {
    if (academicYears.length < 2) {
      toast.error("Need at least 2 academic years to copy classes");
      return;
    }

    const previousYear = academicYears.find((y) => y.id !== selectedYearId);
    if (!previousYear) return;

    setIsCopying(true);
    try {
      const result = await copyClassesToNewYear(
        previousYear.id,
        selectedYearId,
        schoolId
      );
      if (result?.ok) {
        toast.success(result.message);
        setShowCopyModal(false);
        router.refresh();
      } else {
        toast.error(result?.message || "Failed to copy classes");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Classes Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage class templates and yearly class instances
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === "years" && classTemplates.length > 0 && (
            <button
              onClick={() => setShowCopyModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Copy className="w-5 h-5" />
              <span>Copy from Previous Year</span>
            </button>
          )}
          <button
            onClick={() => {
              if (viewMode === "templates") {
                setShowAddTemplateModal(true);
              } else {
                setShowAddClassYearModal(true);
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>{viewMode === "templates" ? "Add Template" : "Add Class"}</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode("years")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "years"
                  ? "bg-white dark:bg-slate-700 text-[#5B9BD5] shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Class Years
              </div>
            </button>
            <button
              onClick={() => setViewMode("templates")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "templates"
                  ? "bg-white dark:bg-slate-700 text-[#5B9BD5] shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Templates
              </div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Academic Year Filter (only in years view) */}
            {viewMode === "years" && (
              <div className="relative min-w-[200px]">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <select
                  value={selectedYearId}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none"
                >
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.year} {year.isActive ? "(Active)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>
                {viewMode === "templates"
                  ? `${classTemplates.length} templates`
                  : `${classYears.length} classes`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "templates" ? (
        <TemplatesView
          templates={filteredTemplates}
          onEdit={(template) => setShowEditTemplateModal(template)}
          onDelete={(template) => setShowDeleteTemplateModal(template)}
        />
      ) : (
        <ClassYearsView
          classYears={filteredClassYears}
          selectedYear={selectedYear}
          onEdit={(classYear) => setShowEditClassYearModal(classYear)}
          onDelete={(classYear) => setShowDeleteClassYearModal(classYear)}
          onViewDetails={(classYear) => setShowDetailModal(classYear)}
        />
      )}

      {/* Modals */}
      {/* Add Template Modal */}
      <ClassTemplateFormModal
        isOpen={showAddTemplateModal}
        onClose={() => setShowAddTemplateModal(false)}
        schoolId={schoolId}
        mode="create"
      />

      {/* Edit Template Modal */}
      {showEditTemplateModal && (
        <ClassTemplateFormModal
          isOpen={true}
          onClose={() => setShowEditTemplateModal(null)}
          schoolId={schoolId}
          template={showEditTemplateModal}
          mode="edit"
        />
      )}

      {/* Delete Template Modal */}
      {showDeleteTemplateModal && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteTemplateModal(null)}
          onConfirm={() => handleDeleteTemplate(showDeleteTemplateModal)}
          isDeleting={isDeletingTemplate === showDeleteTemplateModal.id}
          title="Delete Class Template"
          message={
            <>
              Are you sure you want to delete the class template{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {showDeleteTemplateModal.name}
              </span>
              ?
            </>
          }
          warningMessage={
            showDeleteTemplateModal._count.classYears > 0
              ? `This template has been used in ${showDeleteTemplateModal._count.classYears} academic year(s). You must delete those class years first.`
              : undefined
          }
        />
      )}

      {/* Add Class Year Modal */}
      <ClassYearFormModal
        isOpen={showAddClassYearModal}
        onClose={() => setShowAddClassYearModal(false)}
        schoolId={schoolId}
        classTemplates={classTemplates}
        academicYears={academicYears}
        teachers={teachers}
        mode="create"
      />

      {/* Edit Class Year Modal */}
      {showEditClassYearModal && (
        <ClassYearFormModal
          isOpen={true}
          onClose={() => setShowEditClassYearModal(null)}
          schoolId={schoolId}
          classTemplates={classTemplates}
          academicYears={academicYears}
          teachers={teachers}
          classYear={showEditClassYearModal}
          mode="edit"
        />
      )}

      {/* Delete Class Year Modal */}
      {showDeleteClassYearModal && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteClassYearModal(null)}
          onConfirm={() => handleDeleteClassYear(showDeleteClassYearModal)}
          isDeleting={isDeletingClassYear === showDeleteClassYearModal.id}
          title="Delete Class"
          message={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {showDeleteClassYearModal.classTemplate.name} ({showDeleteClassYearModal.academicYear.year})
              </span>
              ?
            </>
          }
          warningMessage={
            showDeleteClassYearModal._count.enrollments > 0 ||
            showDeleteClassYearModal._count.streams > 0
              ? `This class has ${showDeleteClassYearModal._count.enrollments} enrollments and ${showDeleteClassYearModal._count.streams} streams. Remove these first.`
              : undefined
          }
        />
      )}

      {/* Class Year Detail Modal */}
      {showDetailModal && (
        <ClassYearDetailModal
          isOpen={true}
          onClose={() => setShowDetailModal(null)}
          classYearId={showDetailModal.id}
          schoolId={schoolId}
          schoolSlug={schoolSlug}
          userId={userId}
        />
      )}

      {/* Copy Classes Modal */}
      {showCopyModal && (
        <CopyClassesModal
          isOpen={showCopyModal}
          onClose={() => setShowCopyModal(false)}
          onConfirm={handleCopyClasses}
          isCopying={isCopying}
          academicYears={academicYears}
          selectedYearId={selectedYearId}
        />
      )}
    </div>
  );
}

// Templates View Component
function TemplatesView({
  templates,
  onEdit,
  onDelete,
}: {
  templates: ClassTemplate[];
  onEdit: (template: ClassTemplate) => void;
  onDelete: (template: ClassTemplate) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
        <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No class templates yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Create a class template to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={() => onEdit(template)}
          onDelete={() => onDelete(template)}
        />
      ))}
    </div>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: ClassTemplate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#5B9BD5]/10 to-[#5B9BD5]/5 dark:from-[#5B9BD5]/20 dark:to-[#5B9BD5]/10 rounded-lg">
            <FolderOpen className="w-5 h-5 text-[#5B9BD5]" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-[#5B9BD5] transition-colors">
              {template.name}
            </h3>
            {template.code && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                {template.code}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {template.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
        {template.level && (
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>Level {template.level}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{template._count.classYears} year(s)</span>
        </div>
      </div>
    </div>
  );
}

// Class Years View Component
function ClassYearsView({
  classYears,
  selectedYear,
  onEdit,
  onDelete,
  onViewDetails,
}: {
  classYears: ClassYear[];
  selectedYear: AcademicYear;
  onEdit: (classYear: ClassYear) => void;
  onDelete: (classYear: ClassYear) => void;
  onViewDetails: (classYear: ClassYear) => void;
}) {
  if (classYears.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No classes for {selectedYear.year}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Create a class or copy from a previous year to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {classYears.map((classYear) => (
        <ClassYearCard
          key={classYear.id}
          classYear={classYear}
          onEdit={() => onEdit(classYear)}
          onDelete={() => onDelete(classYear)}
          onViewDetails={() => onViewDetails(classYear)}
        />
      ))}
    </div>
  );
}

// Class Year Card Component
function ClassYearCard({
  classYear,
  onEdit,
  onDelete,
  onViewDetails,
}: {
  classYear: ClassYear;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#5B9BD5]/10 to-[#5B9BD5]/5 dark:from-[#5B9BD5]/20 dark:to-[#5B9BD5]/10 rounded-lg">
            <BookOpen className="w-5 h-5 text-[#5B9BD5]" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-[#5B9BD5] transition-colors">
              {classYear.classTemplate.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {classYear.classTemplate.code && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {classYear.classTemplate.code}
                </span>
              )}
              {!classYear.isActive && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onViewDetails();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {classYear.remarks && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {classYear.remarks}
        </p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Students:</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {classYear._count.enrollments}
            {classYear.maxStudents && ` / ${classYear.maxStudents}`}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Streams:</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {classYear._count.streams}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Subjects:</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {classYear._count.classSubjects}
          </span>
        </div>
      </div>

      <button
        onClick={onViewDetails}
        className="flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-[#5B9BD5] hover:text-[#4A8BC2] hover:bg-[#5B9BD5]/5 dark:hover:bg-[#5B9BD5]/10 rounded-lg transition-colors"
      >
        View Details
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Delete Confirm Modal Component
function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  title,
  message,
  warningMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title: string;
  message: React.ReactNode;
  warningMessage?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This action cannot be undone
            </p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-2">{message}</p>
        {warningMessage && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              ⚠️ {warningMessage}
            </p>
          </div>
        )}
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Copy Classes Modal Component
function CopyClassesModal({
  isOpen,
  onClose,
  onConfirm,
  isCopying,
  academicYears,
  selectedYearId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCopying: boolean;
  academicYears: AcademicYear[];
  selectedYearId: string;
}) {
  if (!isOpen) return null;

  const targetYear = academicYears.find((y) => y.id === selectedYearId);
  const sourceYears = academicYears.filter((y) => y.id !== selectedYearId);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 rounded-full">
            <Copy className="w-6 h-6 text-[#5B9BD5]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Copy Classes
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Copy all classes from a previous year
            </p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-slate-600 dark:text-slate-400 mb-3">
            This will copy all class definitions from the most recent previous
            year to{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {targetYear?.year}
            </span>
            .
          </p>
          {sourceYears.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Copying from:{" "}
                <span className="font-medium text-slate-900 dark:text-white">
                  {sourceYears[0].year}
                </span>
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isCopying}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isCopying}
            className="px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isCopying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Classes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
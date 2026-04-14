// components/dashboard/classes/class-year-form-modal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { createClassYear, updateClassYear } from "@/actions/classes";
import { toast } from "sonner";

type ClassTemplate = {
  id: string;
  name: string;
  code: string | null;
  level: number | null;
};

type AcademicYear = {
  id: string;
  year: string;
  isActive: boolean;
};

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  staffNo: string;
};

type ClassYear = {
  id: string;
  classTemplateId: string;
  academicYearId: string;
  maxStudents: number | null;
  classTeacherId: string | null;
  remarks: string | null;
  isActive: boolean;
  classTemplate: {
    id: string;
    name: string;
  };
  academicYear: {
    id: string;
    year: string;
  };
};

interface ClassYearFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  classTemplates: ClassTemplate[];
  academicYears: AcademicYear[];
  teachers: Teacher[];
  classYear?: ClassYear;
  mode: "create" | "edit";
}

export function ClassYearFormModal({
  isOpen,
  onClose,
  schoolId,
  classTemplates,
  academicYears,
  teachers,
  classYear,
  mode,
}: ClassYearFormModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    classTemplateId: classYear?.classTemplateId || "",
    academicYearId: classYear?.academicYearId || "",
    maxStudents: classYear?.maxStudents?.toString() || "",
    classTeacherId: classYear?.classTeacherId || "",
    remarks: classYear?.remarks || "",
    isActive: classYear?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const data = {
          classTemplateId: formData.classTemplateId,
          academicYearId: formData.academicYearId,
          maxStudents: formData.maxStudents
            ? parseInt(formData.maxStudents)
            : undefined,
          classTeacherId: formData.classTeacherId || undefined,
          remarks: formData.remarks || undefined,
        };

        const result = await createClassYear(data);

        if (result?.ok) {
          toast.success(result.message);
          onClose();
          router.refresh();
        } else {
          toast.error(result?.message || "Failed to create class");
        }
      } else {
        const data = {
          maxStudents: formData.maxStudents
            ? parseInt(formData.maxStudents)
            : undefined,
          classTeacherId: formData.classTeacherId || null,
          remarks: formData.remarks || undefined,
          isActive: formData.isActive,
        };

        const result = await updateClassYear(classYear!.id, data);

        if (result?.ok) {
          toast.success(result.message);
          onClose();
          router.refresh();
        } else {
          toast.error(result?.message || "Failed to update class");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-700 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {mode === "create" ? "Add Class" : "Edit Class"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Class Template */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Class Template <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.classTemplateId}
              onChange={(e) =>
                setFormData({ ...formData, classTemplateId: e.target.value })
              }
              required
              disabled={mode === "edit"}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a class template</option>
              {classTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.code && ` (${template.code})`}
                  {template.level && ` - Level ${template.level}`}
                </option>
              ))}
            </select>
            {classTemplates.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Please create a class template first
              </p>
            )}
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.academicYearId}
              onChange={(e) =>
                setFormData({ ...formData, academicYearId: e.target.value })
              }
              required
              disabled={mode === "edit"}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select an academic year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year} {year.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Max Students */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Maximum Students
            </label>
            <input
              type="number"
              value={formData.maxStudents}
              onChange={(e) =>
                setFormData({ ...formData, maxStudents: e.target.value })
              }
              placeholder="e.g., 50"
              min="1"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Class Teacher */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Class Teacher/Coordinator
            </label>
            <select
              value={formData.classTeacherId}
              onChange={(e) =>
                setFormData({ ...formData, classTeacherId: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">No teacher assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstName} {teacher.lastName} ({teacher.staffNo})
                </option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              placeholder="Optional remarks..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Active Status (Edit mode only) */}
          {mode === "edit" && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#5B9BD5] focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Class is active
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || classTemplates.length === 0}
              className="px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>{mode === "create" ? "Create Class" : "Update Class"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
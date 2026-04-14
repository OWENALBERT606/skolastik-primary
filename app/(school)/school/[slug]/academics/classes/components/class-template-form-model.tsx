// components/dashboard/classes/class-template-form-modal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { createClassTemplate, updateClassTemplate } from "@/actions/classes";
import { toast } from "sonner";

type ClassTemplate = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  level: number | null;
};

interface ClassTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  template?: ClassTemplate;
  mode: "create" | "edit";
}

export function ClassTemplateFormModal({
  isOpen,
  onClose,
  schoolId,
  template,
  mode,
}: ClassTemplateFormModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || "",
    code: template?.code || "",
    description: template?.description || "",
    level: template?.level?.toString() || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        level: formData.level ? parseInt(formData.level) : undefined,
        schoolId,
      };

      const result =
        mode === "create"
          ? await createClassTemplate(data)
          : await updateClassTemplate(template!.id, data);

      if (result?.ok) {
        toast.success(result.message);
        onClose();
        router.refresh();
      } else {
        toast.error(result?.message || "Operation failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {mode === "create" ? "Add Class Template" : "Edit Class Template"}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Form 6, Senior 4, P.7"
              required
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Class Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="e.g., F6, S4, P7"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Level
            </label>
            <input
              type="number"
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: e.target.value })
              }
              placeholder="e.g., 6, 4, 7"
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>{mode === "create" ? "Create Template" : "Update Template"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// components/dashboard/subjects/edit-subject-modal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Book,
  Check,
  FileText,
  Hash,
  Loader2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  staffNo: string;
};

type Subject = {
  id: string;
  name: string;
  prefix: string | null;
  description: string | null;
  headTeacherId: string | null;
  schoolId: string;
};

interface EditSubjectModalProps {
  subject: Subject;
  teachers: Teacher[];
}

export function EditSubjectModal({ subject, teachers }: EditSubjectModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: subject.name || "",
    prefix: subject.prefix || "",
    description: subject.description || "",
    headTeacherId: subject.headTeacherId || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Subject name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Subject name must be at least 2 characters";
    }

    if (formData.prefix && formData.prefix.length > 10) {
      newErrors.prefix = "Prefix must not exceed 10 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    if (!isSubmitting) {
      router.back();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // try {
    //   const result = await updateSubject(subject.id, {
    //     name: formData.name.trim(),
    //     prefix: formData.prefix.trim() || undefined,
    //     description: formData.description.trim() || undefined,
    //     headTeacherId: formData.headTeacherId || null,
    //   });

    //   if (result) {
    //     toast.success("Subject updated successfully");
    //     router.push(`/dashboard/subjects/${subject.id}`);
    //   } else {
    //     toast.error("Failed to update subject");
    //   }
    // } catch (error) {
    //   toast.error("An unexpected error occurred");
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC2] rounded-lg">
              <Book className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Edit Subject
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Update subject information
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Subject Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Subject Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Mathematics, English Language"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                    errors.name
                      ? "border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500"
                      : "border-slate-200 dark:border-slate-600 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5]"
                  }`}
                  required
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Subject Prefix */}
            <div>
              <label
                htmlFor="prefix"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Subject Code/Prefix
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  id="prefix"
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleChange}
                  placeholder="e.g., MATH, ENG, SCI"
                  maxLength={10}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                    errors.prefix
                      ? "border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500"
                      : "border-slate-200 dark:border-slate-600 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5]"
                  }`}
                />
              </div>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                A short code for the subject (optional)
              </p>
              {errors.prefix && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.prefix}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the subject..."
                  rows={3}
                  maxLength={500}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                    errors.description
                      ? "border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500"
                      : "border-slate-200 dark:border-slate-600 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5]"
                  }`}
                />
              </div>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Head Teacher */}
            <div>
              <label
                htmlFor="headTeacherId"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Head Teacher (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <select
                  id="headTeacherId"
                  name="headTeacherId"
                  value={formData.headTeacherId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors appearance-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Select a head teacher (optional)</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.staffNo})
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                You can assign a head teacher later if needed
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
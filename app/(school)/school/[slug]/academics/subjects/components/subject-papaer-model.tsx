
// components/dashboard/subjects/subject-paper-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  FileText,
  Hash,
  Loader2,
  Scale,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createSubjectPaper, updateSubjectPaper } from "@/actions/subject-papers";

type SubjectPaper = {
  id: string;
  paperNumber: number;
  name: string;
  description: string | null;
  paperCode: string | null; // ✅ Add paper code
  maxMarks: number;
  weight: number;
};

interface SubjectPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  subjectId: string;
  subjectName: string;
  existingPapers: SubjectPaper[];
  paper?: SubjectPaper;
  mode: "create" | "edit";
}

export function SubjectPaperModal({
  isOpen,
  onClose,
  onSuccess,
  subjectId,
  subjectName,
  existingPapers,
  paper,
  mode,
}: SubjectPaperModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Include paper code in form state
  const [formData, setFormData] = useState({
    paperNumber: paper?.paperNumber || getNextPaperNumber(existingPapers),
    name: paper?.name || "",
    paperCode: paper?.paperCode || "", // ✅ Add this
    description: paper?.description || "",
    maxMarks: paper?.maxMarks || 100,
    weight: paper?.weight || 1.0,
  });

  useEffect(() => {
    if (isOpen) {
      console.log("🟢 SubjectPaperModal opened", {
        mode,
        subjectId,
        subjectName,
        existingPapers,
        formData,
      });
    }
  }, [isOpen]);

  function getNextPaperNumber(papers: SubjectPaper[]): number {
    if (papers.length === 0) return 1;
    const maxNumber = Math.max(...papers.map((p) => p.paperNumber));
    return maxNumber + 1;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    console.log("📝 Form field changed:", { name, value, type });
    
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? ""
            : name === "weight"
            ? parseFloat(value)
            : parseInt(value, 10)
          : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    console.log("🔍 Validating form...", formData);
    const newErrors: Record<string, string> = {};

    // Paper Number validation
    if (!formData.paperNumber || formData.paperNumber < 1) {
      newErrors.paperNumber = "Paper number must be at least 1";
    } else {
      const isDuplicate = existingPapers.some(
        (p) =>
          p.paperNumber === formData.paperNumber &&
          (mode === "create" || p.id !== paper?.id)
      );
      if (isDuplicate) {
        newErrors.paperNumber = `Paper ${formData.paperNumber} already exists`;
      }
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Paper name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Paper name must be at least 2 characters";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Paper name must not exceed 100 characters";
    }

    // ✅ Paper code validation
    if (formData.paperCode && formData.paperCode.trim().length > 20) {
      newErrors.paperCode = "Paper code must not exceed 20 characters";
    }

    // Description validation
    if (formData.description && formData.description.trim().length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    // Max Marks validation
    if (!formData.maxMarks || formData.maxMarks < 1) {
      newErrors.maxMarks = "Max marks must be at least 1";
    } else if (formData.maxMarks > 1000) {
      newErrors.maxMarks = "Max marks must not exceed 1000";
    }

    // Weight validation
    if (!formData.weight || formData.weight <= 0) {
      newErrors.weight = "Weight must be greater than 0";
    } else if (formData.weight > 10) {
      newErrors.weight = "Weight must not exceed 10";
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log("✅ Validation result:", { isValid, errors: newErrors });
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("🚀 Form submit triggered!");
    e.preventDefault();
    e.stopPropagation();

    console.log("📊 Submit data:", {
      mode,
      subjectId,
      formData,
      existingPapers,
    });

    if (!validateForm()) {
      console.log("❌ Validation failed, aborting submission");
      toast.error("Please fix the form errors");
      return;
    }

    console.log("✅ Validation passed, proceeding with submission");
    setIsSubmitting(true);

    try {
      let result;

      if (mode === "create") {
        const payload = {
          subjectId,
          paperNumber: formData.paperNumber,
          name: formData.name.trim(),
          paperCode: formData.paperCode.trim() || null, // ✅ Include paper code
          description: formData.description.trim() || null,
          maxMarks: formData.maxMarks,
          weight: formData.weight,
        };

        console.log("📤 Calling createSubjectPaper with:", payload);
        result = await createSubjectPaper(payload);
        console.log("📥 createSubjectPaper response:", result);
      } else if (paper) {
        const payload = {
          name: formData.name.trim(),
          paperCode: formData.paperCode.trim() || null, // ✅ Include paper code
          description: formData.description.trim() || null,
          maxMarks: formData.maxMarks,
          weight: formData.weight,
        };

        console.log("📤 Calling updateSubjectPaper with:", paper.id, payload);
        result = await updateSubjectPaper(paper.id, payload);
        console.log("📥 updateSubjectPaper response:", result);
      }

      if (result?.ok) {
        console.log("✅ Success! Refreshing data...");
        toast.success(result.message);
        handleClose();
        
        if (onSuccess) {
          console.log("🔄 Calling onSuccess callback");
          onSuccess();
        }
        
        router.refresh();
      } else {
        console.log("❌ Server returned error:", result?.message);
        toast.error(result?.message || "Failed to save paper");
      }
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
      console.log("🏁 Submission complete");
    }
  };

  const handleClose = () => {
    console.log("🚪 Closing modal");
    if (!isSubmitting) {
      setErrors({});
      if (mode === "create") {
        setFormData({
          paperNumber: getNextPaperNumber(existingPapers),
          name: "",
          paperCode: "", // ✅ Reset paper code
          description: "",
          maxMarks: 100,
          weight: 1.0,
        });
      }
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    console.log("🖱️ Backdrop clicked");
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    console.log("🖱️ Modal content clicked");
    e.stopPropagation();
  };

  if (!isOpen) {
    console.log("❌ Modal not open, returning null");
    return null;
  }

  console.log("✅ Rendering modal");

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

      {/* Modal */}
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC2] rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {mode === "create" ? "Add Subject Paper" : "Edit Paper"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {mode === "create"
                  ? `Add a paper/component to ${subjectName}`
                  : `Update paper information`}
              </p>
            </div>
          </div>
          <button
            type="button"
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
            {/* Paper Number */}
            <div>
              <label
                htmlFor="paperNumber"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Paper Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="number"
                  id="paperNumber"
                  name="paperNumber"
                  value={formData.paperNumber}
                  onChange={handleChange}
                  min="1"
                  max="99"
                  disabled={mode === "edit"}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.paperNumber
                      ? "border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500"
                      : "border-slate-200 dark:border-slate-600 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5]"
                  }`}
                  required
                  autoFocus={mode === "create"}
                />
              </div>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                The sequential number for this paper (e.g., 1 for Paper 1)
              </p>
              {errors.paperNumber && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.paperNumber}
                </p>
              )}
            </div>

            {/* Paper Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Paper Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Paper 1, Paper 2, Practical, Theory"
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

            {/* ✅ Paper Code Field - NEW */}
            <div>
              <label
                htmlFor="paperCode"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Paper Code
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  id="paperCode"
                  name="paperCode"
                  value={formData.paperCode}
                  onChange={handleChange}
                  placeholder="e.g., 535/1, 535/2, or MATH-P1"
                  maxLength={20}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                    errors.paperCode
                      ? "border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500"
                      : "border-slate-200 dark:border-slate-600 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5]"
                  }`}
                />
              </div>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Optional unique code for this paper (e.g., 535/1 for UNEB format)
              </p>
              {errors.paperCode && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.paperCode}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of what this paper covers..."
                rows={3}
                maxLength={500}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                  errors.description
                    ? "border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500"
                    : "border-slate-200 dark:border-slate-600 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5]"
                }`}
              />
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formData.description?.length || 0}/500 characters
                </p>
              </div>
              {errors.description && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Max Marks and Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="maxMarks"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Max Marks <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    id="maxMarks"
                    name="maxMarks"
                    value={formData.maxMarks}
                    onChange={handleChange}
                    min="1"
                    max="1000"
                    placeholder="100"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                      errors.maxMarks
                        ? "border-red-300 dark:border-red-500"
                        : "border-slate-200 dark:border-slate-600 focus:ring-[#5B9BD5]/20 focus:border-[#5B9BD5]"
                    }`}
                    required
                  />
                </div>
                {errors.maxMarks && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.maxMarks}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="weight"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Weight <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0.1"
                    max="10"
                    step="0.1"
                    placeholder="1.0"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                      errors.weight
                        ? "border-red-300 dark:border-red-500"
                        : "border-slate-200 dark:border-slate-600 focus:ring-[#5B9BD5]/20 focus:border-[#5B9BD5]"
                    }`}
                    required
                  />
                </div>
                {errors.weight && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.weight}
                  </p>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex gap-3">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                    About Weight & Paper Codes
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                    Weight determines how much this paper contributes to the final subject mark. Equal weights (1.0) mean all papers count equally.
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Paper codes (e.g., 535/1, 535/2) help identify papers in reports and UNEB formats.
                  </p>
                </div>
              </div>
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
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {mode === "create" ? "Create Paper" : "Save Changes"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
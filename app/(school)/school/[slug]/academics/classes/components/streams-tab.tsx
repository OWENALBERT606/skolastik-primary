// components/dashboard/classes/detail-tabs/streams-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
  X,
  BookOpen,
  ChevronRight,
  Eye,
  GraduationCap,
  UserCog,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import {
  createStream,
  updateStream,
  deleteStream,
  getAvailableClassHeads,
} from "@/actions/streams";

interface StreamsTabProps {
  classYear: any;
  schoolId: string;
  schoolSlug: string;
  onUpdate: () => void;
}

export function StreamsTab({
  classYear,
  schoolId,
  schoolSlug,
  onUpdate,
}: StreamsTabProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<any>(null);
  const [showAssignHeadModal, setShowAssignHeadModal] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (stream: any) => {
    setIsDeleting(stream.id);
    try {
      const result = await deleteStream(stream.id);
      if (result?.ok) {
        toast.success(result.message);
        setShowDeleteModal(null);
        onUpdate();
      } else {
        toast.error(result?.message || "Failed to delete stream");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Streams
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage streams/divisions for this class
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Stream
        </button>
      </div>

      {/* Streams Grid */}
      {classYear.streams.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No streams yet
          </h4>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Create streams to organize students within this class
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Stream
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classYear.streams.map((stream: any) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              schoolSlug={schoolSlug}
              onEdit={() => setShowEditModal(stream)}
              onDelete={() => setShowDeleteModal(stream)}
              onAssignHead={() => setShowAssignHeadModal(stream)}
            />
          ))}
        </div>
      )}

      {/* Add Stream Modal */}
      {showAddModal && (
        <StreamFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          classYearId={classYear.id}
          schoolId={schoolId}
          onSuccess={() => {
            setShowAddModal(false);
            onUpdate();
          }}
        />
      )}

      {/* Edit Stream Modal */}
      {showEditModal && (
        <StreamFormModal
          isOpen={true}
          onClose={() => setShowEditModal(null)}
          classYearId={classYear.id}
          schoolId={schoolId}
          stream={showEditModal}
          onSuccess={() => {
            setShowEditModal(null);
            onUpdate();
          }}
        />
      )}

      {/* Assign Class Head Modal */}
      {showAssignHeadModal && (
        <AssignClassHeadModal
          stream={showAssignHeadModal}
          classYearId={classYear.id}
          schoolId={schoolId}
          onClose={() => setShowAssignHeadModal(null)}
          onSuccess={() => {
            setShowAssignHeadModal(null);
            onUpdate();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Delete Stream
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Are you sure you want to delete stream{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {showDeleteModal.name}
              </span>
              ?
            </p>
            {showDeleteModal._count?.enrollments > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  ⚠️ This stream has {showDeleteModal._count.enrollments} enrolled
                  student(s). Please reassign them first.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={isDeleting === showDeleteModal.id}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={isDeleting === showDeleteModal.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting === showDeleteModal.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Stream
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STREAM CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════

function StreamCard({
  stream,
  schoolSlug,
  onEdit,
  onDelete,
  onAssignHead,
}: {
  stream: any;
  schoolSlug: string;
  onEdit: () => void;
  onDelete: () => void;
  onAssignHead: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  // ✅ Count unique subjects (handles multi-paper subjects correctly)
  const uniqueSubjectIds = new Set(
    stream.streamSubjects?.map((ss: any) => ss.subjectId) || []
  );
  const subjectCount = uniqueSubjectIds.size;
  const studentCount = stream._count?.enrollments || 0;

  // Debug log
  console.log(`Stream ${stream.name}:`, {
    streamSubjectsTotal: stream.streamSubjects?.length || 0,
    uniqueSubjects: subjectCount,
    students: studentCount,
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#5B9BD5]/10 to-[#5B9BD5]/5 dark:from-[#5B9BD5]/20 dark:to-[#5B9BD5]/10 rounded-lg">
            <Layers className="w-5 h-5 text-[#5B9BD5]" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-[#5B9BD5] transition-colors">
              {stream.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Stream ID: {stream.id.slice(0, 8)}...
            </p>
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
                <Link
                  href={`/school/${schoolSlug}/academics/streams/${stream.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full"
                  onClick={() => setShowMenu(false)}
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
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
                    onAssignHead();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors w-full"
                >
                  <UserCog className="w-4 h-4" />
                  Assign Class Head
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
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

      {/* Stream Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Users className="w-4 h-4" />
            <span>Students</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">
            {studentCount}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <BookOpen className="w-4 h-4" />
            <span>Subjects</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">
            {subjectCount}
          </span>
        </div>
      </div>

      {/* Class Head */}
      {stream.classHead && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mb-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            Stream Head
          </p>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-[#5B9BD5]" />
            <div>
              <span className="text-sm font-medium text-slate-900 dark:text-white block">
                {stream.classHead.firstName} {stream.classHead.lastName}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {stream.classHead.staffNo}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* View Details Link */}
      <Link
        href={`/school/${schoolSlug}/academics/streams/${stream.id}`}
        className="flex items-center justify-between w-full px-3 py-2 mt-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group/link"
      >
        <span className="text-sm font-medium text-[#5B9BD5] group-hover/link:text-[#4A8BC2]">
          View Details
        </span>
        <ChevronRight className="w-4 h-4 text-[#5B9BD5] group-hover/link:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STREAM FORM MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════

function StreamFormModal({
  isOpen,
  onClose,
  classYearId,
  schoolId,
  stream,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  classYearId: string;
  schoolId: string;
  stream?: any;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: stream?.name || "",
    classHeadId: stream?.classHeadId || "",
  });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // Load available teachers
  useEffect(() => {
    const loadTeachers = async () => {
      setIsLoadingTeachers(true);
      try {
        const availableTeachers = await getAvailableClassHeads(
          schoolId,
          classYearId,
          stream?.id
        );
        setTeachers(availableTeachers);
      } catch (error) {
        console.error("Error loading teachers:", error);
        toast.error("Failed to load teachers");
      } finally {
        setIsLoadingTeachers(false);
      }
    };

    if (isOpen) {
      loadTeachers();
    }
  }, [isOpen, schoolId, classYearId, stream?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Stream name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        name: formData.name,
        classYearId,
        schoolId,
        classHeadId: formData.classHeadId || undefined,
      };

      const result = stream
        ? await updateStream(stream.id, {
            name: formData.name,
            classHeadId: formData.classHeadId || null,
          })
        : await createStream(data);

      if (result?.ok) {
        toast.success(result.message);
        onSuccess();
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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {stream ? "Edit Stream" : "Add Stream"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Stream Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., East, West, A, B"
              required
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Stream Head (Optional)
            </label>
            {isLoadingTeachers ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#5B9BD5]" />
              </div>
            ) : (
              <select
                value={formData.classHeadId}
                onChange={(e) =>
                  setFormData({ ...formData, classHeadId: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">No stream head assigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName} ({teacher.staffNo})
                  </option>
                ))}
              </select>
            )}
          </div>

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
                  {stream ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{stream ? "Update Stream" : "Create Stream"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ASSIGN CLASS HEAD MODAL
// ═══════════════════════════════════════════════════════════════════════

function AssignClassHeadModal({
  stream,
  classYearId,
  schoolId,
  onClose,
  onSuccess,
}: {
  stream: any;
  classYearId: string;
  schoolId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(stream.classHeadId || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getAvailableClassHeads(schoolId, classYearId, stream.id)
      .then((list) => {
        // Also include the currently assigned head even if they'd normally be filtered
        let merged = list;
        if (stream.classHead) {
          const already = list.find((t: any) => t.id === stream.classHead.id);
          if (!already) merged = [stream.classHead, ...list];
        }
        setTeachers(merged);
      })
      .catch(() => toast.error("Failed to load teachers"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateStream(stream.id, {
        name: stream.name,
        classHeadId: selectedId || null,
      });
      if (result?.ok) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result?.message || "Failed to update");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <UserCog className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Assign Class Head
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stream: {stream.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Current assignment info */}
          {stream.classHead ? (
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Currently assigned</p>
                <p className="text-sm text-slate-900 dark:text-white font-semibold truncate">
                  {stream.classHead.firstName} {stream.classHead.lastName}
                  <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({stream.classHead.staffNo})
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No class head assigned</p>
            </div>
          )}

          {/* Teacher picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Class Head
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => setSelectedId("")}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    selectedId === ""
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    No class head
                  </span>
                  {selectedId === "" && <Check className="w-4 h-4 text-indigo-500" />}
                </button>

                {teachers.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-3">
                    No available teachers found. All teachers may already be assigned as class heads.
                  </p>
                )}

                {teachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => setSelectedId(teacher.id)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      selectedId === teacher.id
                        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <GraduationCap className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {teacher.firstName} {teacher.lastName}
                        <span className="ml-1.5 text-xs text-slate-400">({teacher.staffNo})</span>
                      </span>
                    </span>
                    {selectedId === teacher.id && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UserCog className="w-4 h-4" />
                  Save Assignment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
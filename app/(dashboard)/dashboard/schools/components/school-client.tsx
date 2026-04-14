"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  getAllSchools,
  createSchool,
  updateSchoolById,
  deleteSchool,
  forceDeleteSchool,
  toggleSchoolStatus,
} from "@/actions/schools";
import { SchoolFormData, SchoolFormModal, UserOption } from "./school-form-model";
import { SchoolTable } from "./schooltable";
import { DeleteConfirmModal } from "./delete-confirm-model";
import { SchoolDetailsModal } from "./school-detail-model";

// ── Types ─────────────────────────────────────────────────────────────────────

type GetAllSchoolsReturn = Awaited<ReturnType<typeof getAllSchools>>;
type SchoolsArray = NonNullable<GetAllSchoolsReturn["data"]>;
export type SchoolWithCounts = SchoolsArray[number];

interface SchoolsClientProps {
  initialSchools: SchoolWithCounts[];
  userId: string;
  users: UserOption[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SchoolsClient({
  initialSchools,
  userId,
  users,
}: SchoolsClientProps) {
  const [schools, setSchools] = useState<SchoolWithCounts[]>(initialSchools);
  const [filtered, setFiltered] = useState<SchoolWithCounts[]>(initialSchools);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal state
  const [selected, setSelected] = useState<SchoolWithCounts | null>(null);
  const [modal, setModal] = useState<
    "create" | "edit" | "delete" | "details" | null
  >(null);

  // Search filter
  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      schools.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      )
    );
  }, [query, schools]);

  // Re-fetch helper
  const refresh = async () => {
    const res = await getAllSchools();
    if (res.ok && res.data) setSchools(res.data as SchoolWithCounts[]);
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };

  // ── CRUD handlers ────────────────────────────────────────────────────────

  const handleCreate = async (data: SchoolFormData) => {
    setLoading(true);
    try {
      const res = await createSchool(data);
      if (res.ok) {
        await refresh();
        closeModal();
        toast.success("School created successfully");
      } else {
        toast.error(res.message || "Failed to create school");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: SchoolFormData) => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await updateSchoolById(selected.id, data);
      if (res.ok && res.data) {
        setSchools((prev) =>
          prev.map((s) =>
            s.id === selected.id ? { ...s, ...res.data } : s
          )
        );
        closeModal();
        toast.success("School updated successfully");
      } else {
        toast.error(res.message || "Failed to update school");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (force = false) => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = force
        ? await forceDeleteSchool(selected.id)
        : await deleteSchool(selected.id);

      if (res.ok) {
        setSchools((prev) => prev.filter((s) => s.id !== selected.id));
        closeModal();
        toast.success("School deleted successfully");
      } else if ((res as any).requiresConfirmation) {
        toast.warning(res.message ?? "School has data", {
          description: "Use force delete to remove all associated data.",
        });
      } else {
        toast.error(res.message || "Failed to delete school");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (school: SchoolWithCounts) => {
    try {
      const res = await toggleSchoolStatus(school.id);
      if (res.ok && res.data) {
        setSchools((prev) =>
          prev.map((s) =>
            s.id === school.id ? { ...s, isActive: res.data!.isActive } : s
          )
        );
        toast.success(
          `School ${res.data.isActive ? "activated" : "deactivated"}`
        );
      } else {
        toast.error(res.message || "Failed to toggle status");
      }
    } catch {
      toast.error("An unexpected error occurred");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Schools
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {schools.length} school{schools.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <button
            onClick={() => setModal("create")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add School
          </button>
        </div>

        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, slug or code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Table */}
        <SchoolTable
          schools={filtered}
          onView={(s) => { setSelected(s); setModal("details"); }}
          onEdit={(s) => { setSelected(s); setModal("edit"); }}
          onDelete={(s) => { setSelected(s); setModal("delete"); }}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {modal === "create" && (
        <SchoolFormModal
          title="Create New School"
          users={users}
          loading={loading}
          onClose={closeModal}
          onSubmit={handleCreate}
        />
      )}

      {modal === "edit" && selected && (
        <SchoolFormModal
          title="Edit School"
          school={selected}
          users={users}
          loading={loading}
          onClose={closeModal}
          onSubmit={handleUpdate}
        />
      )}

      {modal === "delete" && selected && (
        <DeleteConfirmModal
          school={selected}
          loading={loading}
          onClose={closeModal}
          onConfirm={() => handleDelete(false)}
          onForceDelete={() => handleDelete(true)}
        />
      )}

      {modal === "details" && selected && (
        <SchoolDetailsModal
          school={selected}
          onClose={closeModal}
          onEdit={() => setModal("edit")}
        />
      )}
    </div>
  );
}
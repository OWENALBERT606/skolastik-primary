/**
 * Parents Management Client Component - TABLE VIEW - CORRECTED
 * Full CRUD with dark mode and table layout
 * Path: app/school/[slug]/users/parents/components/parents-management-client.tsx
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  AlertCircle,
  X,
  Save,
  User,
  Lock,
  EyeIcon,
  EyeOff,
  Loader2,
  Moon,
  Sun,
  Key,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  createParentWithUser,
  toggleParentStatus,
} from "@/actions/parents";
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
import { DeleteParentDialog, EditParentDialog, ResetPasswordDialog } from "./parent-dialogue-components";


interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string;
  altNo: string | null;
  title: string | null;
  relationship: string | null;
  gender: string | null;
  dob: string | null;
  idNo: string | null;
  occupation: string | null;
  address: string | null;
  village: string | null;
  country: string | null;
  religion: string | null;
  imageUrl: string | null;
  user: {
    id: string;
    status: boolean;
    isVerfied: boolean;
  };
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    enrollments: Array<{
      classYear: {
        classTemplate: {
          name: string;
        };
      };
      stream: {
        name: string;
      } | null;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ParentsPageProps {
  initialParents: Parent[];
  schoolId: string;
  schoolName: string;
  slug: string;
  userId: string;
}

type DialogType = "create" | "edit" | "delete" | "password" | null;
type SortField = "name" | "email" | "phone" | "relationship" | "students" | "status";
type SortOrder = "asc" | "desc";

export default function ParentsManagementClient({
  initialParents,
  schoolId,
  schoolName,
  slug,
  userId,
}: ParentsPageProps) {
  const router = useRouter();

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = stored === "dark" || (!stored && prefersDark);
    setIsDark(useDark);
    document.documentElement.classList.toggle("dark", useDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  const [parents, setParents] = useState<Parent[]>(
    Array.isArray(initialParents) ? initialParents : []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relationships = useMemo(() => {
    if (!parents || parents.length === 0) return [];
    const unique = new Set(
      parents.map((p) => p.relationship).filter(Boolean) as string[]
    );
    return Array.from(unique).sort();
  }, [parents]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedParents = useMemo(() => {
    if (!parents || parents.length === 0) return [];

    let filtered = parents.filter((parent) => {
      const matchesSearch =
        parent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.phone.includes(searchTerm) ||
        (parent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (parent.students?.length > 0 && parent.students.some(
          (s) =>
            s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.admissionNo.includes(searchTerm)
        ));

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? parent.user.status
          : !parent.user.status;

      const matchesRelationship =
        relationshipFilter === "all" ? true : parent.relationship === relationshipFilter;

      return matchesSearch && matchesStatus && matchesRelationship;
    });

    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "name":
          aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
          bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case "email":
          aVal = (a.email || "").toLowerCase();
          bVal = (b.email || "").toLowerCase();
          break;
        case "phone":
          aVal = a.phone;
          bVal = b.phone;
          break;
        case "relationship":
          aVal = (a.relationship || "").toLowerCase();
          bVal = (b.relationship || "").toLowerCase();
          break;
        case "students":
          aVal = a.students.length;
          bVal = b.students.length;
          break;
        case "status":
          aVal = a.user.status ? 1 : 0;
          bVal = b.user.status ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [parents, searchTerm, statusFilter, relationshipFilter, sortField, sortOrder]);

  const stats = useMemo(() => {
    if (!parents || !Array.isArray(parents) || parents.length === 0) {
      return { total: 0, active: 0, withMultipleChildren: 0, withoutChildren: 0 };
    }
    return {
      total: parents.length,
      active: parents.filter((p) => p?.user?.status).length,
      withMultipleChildren: parents.filter((p) => p?.students?.length > 1).length,
      withoutChildren: parents.filter((p) => p?.students?.length === 0).length,
    };
  }, [parents]);

  const openCreateDialog = () => { setSelectedParent(null); setError(null); setActiveDialog("create"); };
  const openEditDialog = (parent: Parent) => { setSelectedParent(parent); setError(null); setActiveDialog("edit"); };
  const openDeleteDialog = (parent: Parent) => { setSelectedParent(parent); setError(null); setActiveDialog("delete"); };
  const openPasswordDialog = (parent: Parent) => { setSelectedParent(parent); setError(null); setActiveDialog("password"); };
  const closeDialog = () => { setActiveDialog(null); setSelectedParent(null); setError(null); setLoading(false); };

  const handleToggleStatus = async (parent: Parent) => {
    setLoading(true);
    try {
      const result = await toggleParentStatus(parent.id);
      if (result.ok) {
        setParents((prev) =>
          prev.map((p) =>
            p.id === parent.id ? { ...p, user: { ...p.user, status: !p.user.status } } : p
          )
        );
        router.refresh();
      } else {
        setError(result.message || "Failed to update status");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950">

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Parents
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{schoolName}</p>
                </div>
              </div>

              {/* Statistics */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span> Total
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.active}</span> Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.withMultipleChildren}</span> Multiple Children
                  </span>
                </div>
                {stats.withoutChildren > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      <span className="font-semibold">{stats.withoutChildren}</span> Without Children
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                )}
              </button>

              <button
                onClick={openCreateDialog}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center gap-2 font-medium"
              >
                <UserPlus className="w-5 h-5" />
                Add Parent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, phone, email, or student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3
                           bg-white dark:bg-slate-700/50
                           border border-slate-200 dark:border-slate-600
                           rounded-xl
                           text-slate-900 dark:text-slate-100
                           placeholder:text-slate-400 dark:placeholder:text-slate-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                           dark:focus:ring-blue-400/20 dark:focus:border-blue-400
                           transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl border transition-all flex items-center gap-2 font-medium ${
                showFilters
                  ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/60">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Account Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2
                             bg-white dark:bg-slate-700/50
                             border border-slate-200 dark:border-slate-600
                             rounded-lg
                             text-slate-900 dark:text-slate-100
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                             dark:focus:ring-blue-400/20 dark:focus:border-blue-400"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Relationship
                </label>
                <select
                  value={relationshipFilter}
                  onChange={(e) => setRelationshipFilter(e.target.value)}
                  className="w-full px-4 py-2
                             bg-white dark:bg-slate-700/50
                             border border-slate-200 dark:border-slate-600
                             rounded-lg
                             text-slate-900 dark:text-slate-100
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                             dark:focus:ring-blue-400/20 dark:focus:border-blue-400"
                >
                  <option value="all">All Relationships</option>
                  {relationships.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {filteredAndSortedParents.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {parents.length}
          </span>{" "}
          parents
        </div>

        {/* Parents Table */}
        {filteredAndSortedParents.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No parents found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchTerm || statusFilter !== "all" || relationshipFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first parent"}
            </p>
            {!searchTerm && statusFilter === "all" && relationshipFilter === "all" && (
              <button
                onClick={openCreateDialog}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
              >
                <UserPlus className="w-5 h-5" />
                Add First Parent
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/60">
                  <tr>
                    {(["name", "email", "relationship", "students", "status"] as SortField[]).map((field, i) => (
                      <th
                        key={field}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleSort(field)}
                      >
                        <div className="flex items-center gap-2">
                          {["Parent", "Contact", "Relationship", "Children", "Status"][i]}
                          <SortIcon field={field} />
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {filteredAndSortedParents.map((parent) => (
                    <ParentRow
                      key={parent.id}
                      parent={parent}
                      slug={slug}
                      onEdit={() => openEditDialog(parent)}
                      onDelete={() => openDeleteDialog(parent)}
                      onToggleStatus={() => handleToggleStatus(parent)}
                      onResetPassword={() => openPasswordDialog(parent)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── DIALOGS ──────────────────────────────────────────────────────── */}
      {activeDialog === "create" && (
        <CreateParentDialog
          schoolId={schoolId}
          onClose={closeDialog}
          onSuccess={(newParent) => {
            setParents((prev) => [{ ...newParent, students: (newParent as any).students ?? [] }, ...prev]);
            closeDialog();
            router.refresh();
          }}
        />
      )}

      {activeDialog === "edit" && selectedParent && (
        <EditParentDialog
          parent={{ ...selectedParent, dob: selectedParent.dob ? new Date(selectedParent.dob) : null } as any}
          onClose={closeDialog}
          onSuccess={(updatedParent: any) => {
            setParents((prev) => prev.map((p) => (p.id === updatedParent.id ? updatedParent : p)));
            closeDialog();
            router.refresh();
          }}
        />
      )}

      {activeDialog === "delete" && selectedParent && (
        <DeleteParentDialog
          parent={{ ...selectedParent, dob: selectedParent.dob ? new Date(selectedParent.dob) : null } as any}
          onClose={closeDialog}
          onSuccess={() => {
            setParents((prev) => prev.filter((p) => p.id !== selectedParent.id));
            closeDialog();
            router.refresh();
          }}
        />
      )}

      {activeDialog === "password" && selectedParent && (
        <ResetPasswordDialog
          parent={{ ...selectedParent, dob: selectedParent.dob ? new Date(selectedParent.dob) : null } as any}
          onClose={closeDialog}
          onSuccess={closeDialog}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PARENT ROW COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface ParentRowProps {
  parent: Parent;
  slug: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
}

function ParentRow({ parent, slug, onEdit, onDelete, onToggleStatus, onResetPassword }: ParentRowProps) {
  const [showActions, setShowActions] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const DROPDOWN_HEIGHT = 220;

  const handleToggle = () => {
    if (!showActions && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= DROPDOWN_HEIGHT
        ? rect.bottom + window.scrollY + 4
        : rect.top + window.scrollY - DROPDOWN_HEIGHT - 4;
      setDropdownPos({
        top,
        right: window.innerWidth - rect.right,
      });
    }
    setShowActions((v) => !v);
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">

      {/* Parent Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {parent.imageUrl ? (
            <img
              src={parent.imageUrl}
              alt={parent.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-slate-100 dark:ring-slate-700">
              {parent.firstName[0]}{parent.lastName[0]}
            </div>
          )}
          <div>
            <Link
              href={`/school/${slug}/users/parents/${parent.id}`}
              className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {parent.firstName} {parent.lastName}
            </Link>
            {parent.occupation && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{parent.occupation}</p>
            )}
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          {parent.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="truncate max-w-xs">{parent.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{parent.phone}</span>
          </div>
        </div>
      </td>

      {/* Relationship */}
      <td className="px-6 py-4">
        {parent.relationship ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
            {parent.relationship}
          </span>
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
        )}
      </td>

      {/* Children */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {parent.students.length}
          </span>
          {parent.students.length > 0 && (
            <Link
              href={`/school/${slug}/users/parents/${parent.id}`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              View
            </Link>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {parent.user.status ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-700 dark:text-green-400 font-medium">Active</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Inactive</span>
            </>
          )}
          {parent.user.isVerfied && (
            <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="relative inline-block">
          <button
            ref={btnRef}
            onClick={handleToggle}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div
                className="fixed w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/60 py-2 z-50"
                style={{ top: dropdownPos.top, right: dropdownPos.right }}
              >
                <Link
                  href={`/school/${slug}/users/parents/${parent.id}`}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
                <button
                  onClick={() => { setShowActions(false); onEdit(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => { setShowActions(false); onToggleStatus(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300"
                >
                  {parent.user.status ? (
                    <><UserX className="w-4 h-4" />Deactivate</>
                  ) : (
                    <><UserCheck className="w-4 h-4" />Activate</>
                  )}
                </button>
                <button
                  onClick={() => { setShowActions(false); onResetPassword(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300"
                >
                  <Key className="w-4 h-4" />
                  Reset Password
                </button>
                <hr className="my-2 border-slate-200 dark:border-slate-700/60" />
                <button
                  onClick={() => { setShowActions(false); onDelete(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE PARENT DIALOG
// ════════════════════════════════════════════════════════════════════════════

interface CreateParentDialogProps {
  schoolId: string;
  onClose: () => void;
  onSuccess: (parent: Parent) => void;
}

function CreateParentDialog({ schoolId, onClose, onSuccess }: CreateParentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<FileWithMetadata[]>();

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "", title: "", relationship: "",
    gender: "", dob: "", altNo: "", idNo: "", occupation: "",
    address: "", village: "", country: "Uganda", religion: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.firstName.trim()) return setError("First name is required");
    if (!formData.lastName.trim()) return setError("Last name is required");
    if (!formData.email.trim()) return setError("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setError("Invalid email format");
    if (!formData.phone.trim()) return setError("Phone number is required");
    if (!formData.password) return setError("Password is required");
    if (formData.password.length < 8) return setError("Password must be at least 8 characters");
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const submitData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        schoolId,
        title: formData.title || null,
        relationship: formData.relationship || null,
        gender: formData.gender || null,
        dob: formData.dob || null,
        altNo: formData.altNo || null,
        idNo: formData.idNo || null,
        occupation: formData.occupation || null,
        address: formData.address || null,
        village: formData.village || null,
        country: formData.country || "Uganda",
        religion: formData.religion || null,
      };

      if (photoFiles && photoFiles.length > 0) {
        submitData.imageUrl = photoFiles[0]?.publicUrl || null;
      }

      const result = await createParentWithUser(submitData);
      if (result.ok && result.data) {
        onSuccess(result.data as any);
      } else {
        setError(result.message || "Failed to create parent");
      }
    } catch (err: any) {
      console.error("Error creating parent:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Shared input class
  const inputCls = "w-full px-4 py-2 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 dark:focus:border-blue-400 transition-all";
  const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2";
  const sectionTitleCls = "text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2";

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Add New Parent
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Profile Photo */}
          <div>
            <h3 className={sectionTitleCls}>Profile Photo</h3>
            <Dropzone
              provider="cloudflare-r2"
              variant="avatar"
              maxFiles={1}
              maxSize={1024 * 1024 * 5}
              onFilesChange={setPhotoFiles}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              JPG, PNG or GIF. Max size 5MB
            </p>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className={sectionTitleCls}>
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Title</label>
                <select name="title" value={formData.title} onChange={handleChange} className={inputCls}>
                  <option value="">Select title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputCls} placeholder="Enter first name" />
              </div>
              <div>
                <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputCls} placeholder="Enter last name" />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={inputCls}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Relationship to Student</label>
                <select name="relationship" value={formData.relationship} onChange={handleChange} className={inputCls}>
                  <option value="">Select relationship</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Grandfather">Grandfather</option>
                  <option value="Grandmother">Grandmother</option>
                  <option value="Uncle">Uncle</option>
                  <option value="Aunt">Aunt</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className={sectionTitleCls}>
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} placeholder="parent@example.com" />
              </div>
              <div>
                <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} placeholder="0700000000" />
              </div>
              <div>
                <label className={labelCls}>Alternative Phone</label>
                <input type="tel" name="altNo" value={formData.altNo} onChange={handleChange} className={inputCls} placeholder="0750000000" />
              </div>
              <div>
                <label className={labelCls}>National ID / Passport</label>
                <input type="text" name="idNo" value={formData.idNo} onChange={handleChange} className={inputCls} placeholder="CM12345678" />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className={sectionTitleCls}>
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Occupation</label>
                <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} className={inputCls} placeholder="Engineer, Teacher, etc." />
              </div>
              <div>
                <label className={labelCls}>Religion</label>
                <select name="religion" value={formData.religion} onChange={handleChange} className={inputCls}>
                  <option value="">Select religion</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Village/Town</label>
                <input type="text" name="village" value={formData.village} onChange={handleChange} className={inputCls} placeholder="Kampala" />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} className={inputCls} placeholder="Uganda" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Physical Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Enter complete physical address"
                />
              </div>
            </div>
          </div>

          {/* Login Credentials */}
          <div>
            <h3 className={sectionTitleCls}>
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Login Credentials
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              These credentials will be used for parent portal login
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`${inputCls} pr-10`}
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={inputCls}
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Creating...</>
              ) : (
                <><Save className="w-5 h-5" />Create Parent</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
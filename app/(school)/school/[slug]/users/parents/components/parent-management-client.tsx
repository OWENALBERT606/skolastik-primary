/**
 * Parents Management Client Component - TABLE VIEW - FIXED
 * Proper type handling for dates + Toast notifications
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users, Search, Filter, UserPlus, Mail, Phone, Briefcase, CheckCircle2,
  MoreVertical, Edit, Trash2, Eye, UserCheck, UserX, AlertCircle, X, Save,
  User, Lock, EyeIcon, EyeOff, Loader2, Moon, Sun, Key, ChevronDown, ChevronUp,
  Router,
} from "lucide-react";
import { createParentWithUser, toggleParentStatus } from "@/actions/parents";
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
import { DeleteParentDialog, EditParentDialog, ResetPasswordDialog } from "./parent-dialogue-components";

// Interface for parent as received from server (dates as strings)
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
  dob: string | null; // String from server
  idNo: string | null;
  occupation: string | null;
  address: string | null;
  village: string | null;
  country: string | null;
  religion: string | null;
  imageUrl: string | null;
  user: { id: string; status: boolean; isVerfied: boolean };
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    enrollments: Array<{
      classYear: { classTemplate: { name: string } };
      stream: { name: string } | null;
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
  initialParents, schoolId, schoolName, slug, userId,
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

  const [parents, setParents] = useState<Parent[]>(Array.isArray(initialParents) ? initialParents : []);
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
    const unique = new Set(parents.map((p) => p.relationship).filter(Boolean) as string[]);
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
          (s) => s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.admissionNo.includes(searchTerm)
        ));
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "active" ? parent.user.status : !parent.user.status;
      const matchesRelationship = relationshipFilter === "all" ? true : parent.relationship === relationshipFilter;
      return matchesSearch && matchesStatus && matchesRelationship;
    });
    
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
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
    const loadingToast = toast.loading("Updating status...");
    
    try {
      const result = await toggleParentStatus(parent.id);
      if (result.ok) {
        setParents((prev) => prev.map((p) => 
          p.id === parent.id ? { ...p, user: { ...p.user, status: !p.user.status } } : p
        ));
        
        toast.success(
          `Parent ${parent.user.status ? 'deactivated' : 'activated'}`,
          {
            id: loadingToast,
            description: `${parent.firstName} ${parent.lastName}`,
          }
        );
        router.refresh();
      } else {
        toast.error("Failed to update status", {
          id: loadingToast,
          description: result.message,
        });
        setError(result.message || "Failed to update status");
      }
    } catch (err: any) {
      toast.error("An error occurred", {
        id: loadingToast,
        description: err.message,
      });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Parents</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{schoolName}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{stats.total}</span> Total
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{stats.active}</span> Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{stats.withMultipleChildren}</span> Multiple Children
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
              <button onClick={toggleDarkMode} className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                {isDark ? <Sun className="w-5 h-5 text-slate-700 dark:text-slate-300" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </button>
              <button onClick={openCreateDialog} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-500/30">
                <UserPlus className="w-5 h-5" />
                Add Parent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Search, Filters, Table */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, phone, email, or student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl border transition-all flex items-center gap-2 font-medium ${
                showFilters
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Relationship</label>
                <select
                  value={relationshipFilter}
                  onChange={(e) => setRelationshipFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
          Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredAndSortedParents.length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{parents.length}</span> parents
        </div>

        {/* Parents Table - Use your existing table from the full component */}
        {filteredAndSortedParents.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No parents found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchTerm || statusFilter !== "all" || relationshipFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first parent"}
            </p>
            {!searchTerm && statusFilter === "all" && relationshipFilter === "all" && (
              <button onClick={openCreateDialog} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                <UserPlus className="w-5 h-5" />
                Add First Parent
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Add your full table here from the original component */}
            <p className="p-4 text-slate-600 dark:text-slate-400">Table content goes here - copy from your original component</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
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
          parent={{
            ...selectedParent,
            dob: selectedParent.dob ? new Date(selectedParent.dob) : null,
          } as any}
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
          parent={{
            ...selectedParent,
            dob: selectedParent.dob ? new Date(selectedParent.dob) : null,
          } as any}
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
          parent={{
            ...selectedParent,
            dob: selectedParent.dob ? new Date(selectedParent.dob) : null,
          } as any}
          onClose={closeDialog} 
          onSuccess={closeDialog} 
        />
      )}
    </div>
  );
}

// ==========================================
// CREATE PARENT DIALOG - WITH PROPER TYPE HANDLING
// ==========================================

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
    firstName: "", 
    lastName: "", 
    email: "", 
    phone: "", 
    password: "", 
    confirmPassword: "",
    title: "", 
    relationship: "", 
    gender: "", 
    dob: "", 
    altNo: "", 
    idNo: "", 
    occupation: "",
    address: "", 
    village: "", 
    country: "Uganda", 
    religion: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.firstName.trim()) { setError("First name is required"); return; }
    if (!formData.lastName.trim()) { setError("Last name is required"); return; }
    if (!formData.email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError("Invalid email format"); return; }
    if (!formData.phone.trim()) { setError("Phone number is required"); return; }
    if (!formData.password) { setError("Password is required"); return; }
    if (formData.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Creating parent...");

    try {
      const submitData: any = {
        firstName: formData.firstName.trim(), 
        lastName: formData.lastName.trim(),
        email: formData.email.trim(), 
        phone: formData.phone.trim(), 
        password: formData.password,
        schoolId: schoolId, 
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
        // Success toast
        toast.success("Parent created successfully!", {
          id: loadingToast,
          description: `${formData.firstName} ${formData.lastName} has been added.`,
        });

        
        onSuccess(result.data as any); 
      } else { 
        // Error toast
        toast.error("Failed to create parent", {
          id: loadingToast,
          description: result.message || "Please try again.",
        });
        setError(result.message || "Failed to create parent"); 
      }
    } catch (err: any) {
      // Error toast
      toast.error("An error occurred", {
        id: loadingToast,
        description: err.message || "Please try again.",
      });
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Parent</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Profile Photo */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile Photo</h3>
            <Dropzone 
              provider="cloudflare-r2" 
              variant="avatar" 
              maxFiles={1} 
              maxSize={1024 * 1024 * 5} 
              onFilesChange={setPhotoFiles} 
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">JPG, PNG or GIF. Max size 5MB</p>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title
                </label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Relationship to Student
                </label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="parent@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="0700000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alternative Phone
                </label>
                <input
                  type="tel"
                  name="altNo"
                  value={formData.altNo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="0750000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  National ID / Passport
                </label>
                <input
                  type="text"
                  name="idNo"
                  value={formData.idNo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="CM12345678"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Engineer, Teacher, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Religion
                </label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select religion</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Village/Town
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Kampala"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Uganda"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Physical Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Enter complete physical address"
                />
              </div>
            </div>
          </div>

          {/* Login Credentials */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Login Credentials
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              These credentials will be used for parent portal login
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-2 pr-10 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Minimum 8 characters"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
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
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Parent
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
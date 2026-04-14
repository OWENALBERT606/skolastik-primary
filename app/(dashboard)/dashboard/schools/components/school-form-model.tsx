"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Search, ChevronDown } from "lucide-react";
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
import type { SchoolWithCounts } from "./school-client";

export interface UserOption {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
}

export interface SchoolFormData {
  name: string;
  slug: string;
  code: string;        // NEW: required unique school code
  adminId: string;
  motto?: string;
  address?: string;
  contact?: string;
  contact2?: string;
  contact3?: string;
  email?: string;
  email2?: string;
  website?: string;
  logo?: string | null;
  isActive: boolean;
}

interface SchoolFormModalProps {
  title: string;
  school?: SchoolWithCounts;
  users: UserOption[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: SchoolFormData) => void;
}

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const generateCode = (name: string) =>
  name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.slice(0, 4))
    .join("-")
    .slice(0, 12);

export const SchoolFormModal: React.FC<SchoolFormModalProps> = ({
  title,
  school,
  users,
  loading,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<SchoolFormData>({
    name: "",
    slug: "",
    code: "",
    adminId: "",
    motto: "",
    address: "",
    contact: "",
    contact2: "",
    contact3: "",
    email: "",
    email2: "",
    website: "",
    logo: null,
    isActive: true,
  });

  const [logoFiles, setLogoFiles] = useState<FileWithMetadata[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const selectedUser = users.find((u) => u.id === form.adminId);

  // Populate on edit
  useEffect(() => {
    if (school) {
      setForm({
        name: school.name ?? "",
        slug: school.slug ?? "",
        code: school.code ?? "",
        adminId: (school as any).admin?.id ?? "",
        motto: school.motto ?? "",
        address: school.address ?? "",
        contact: school.contact ?? "",
        contact2: school.contact2 ?? "",
        contact3: school.contact3 ?? "",
        email: school.email ?? "",
        email2: school.email2 ?? "",
        website: school.website ?? "",
        logo: school.logo ?? null,
        isActive: school.isActive ?? true,
      });
    }
  }, [school]);

  // Auto-generate slug + code on name change (new schools only)
  useEffect(() => {
    if (!school && form.name) {
      setForm((prev) => ({
        ...prev,
        slug: generateSlug(form.name),
        code: generateCode(form.name),
      }));
    }
  }, [form.name, school]);

  // Logo upload
  useEffect(() => {
    if (logoFiles[0]?.publicUrl) {
      setForm((prev) => ({ ...prev, logo: logoFiles[0].publicUrl! }));
    }
  }, [logoFiles]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (field: keyof SchoolFormData, value: string | boolean | null) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    set(
      name as keyof SchoolFormData,
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.adminId) {
      alert("Please select a school admin");
      return;
    }
    if (!form.code.trim()) {
      alert("School code is required");
      return;
    }
    onSubmit(form);
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-white dark:bg-zinc-900 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── Name + Slug + Code ── */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g., St. Mary's High School"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  placeholder="st-marys-high"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-0.5">URL-friendly identifier</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  School Code <span className="text-red-500">*</span>
                </label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  placeholder="e.g., SOMA-2025"
                  className={`${inputCls} font-mono uppercase`}
                />
                <p className="text-xs text-gray-400 mt-0.5">Used for staff/student login</p>
              </div>
            </div>
          </div>

          {/* ── Admin selector ── */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              School Admin <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-left hover:border-blue-400 transition-colors"
            >
              {selectedUser ? (
                <div className="flex items-center gap-2">
                  {selectedUser.image ? (
                    <img src={selectedUser.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-gray-900 dark:text-white font-medium">
                    {selectedUser.name}
                  </span>
                  <span className="text-gray-400 text-xs">{selectedUser.email}</span>
                </div>
              ) : (
                <span className="text-gray-400">Select admin...</span>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute z-30 w-full mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-56 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-gray-100 dark:border-zinc-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Search users..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          set("adminId", u.id);
                          setDropdownOpen(false);
                          setUserSearch("");
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors ${
                          form.adminId === u.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        {u.image ? (
                          <img src={u.image} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {u.name}
                          </div>
                          <div className="text-xs text-gray-400 truncate">{u.email}</div>
                        </div>
                        {u.role && (
                          <span className="text-xs text-blue-500 dark:text-blue-400 flex-shrink-0">
                            {u.role}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-xs text-gray-400 py-4">No users found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Motto ── */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Motto
            </label>
            <input
              name="motto"
              value={form.motto}
              onChange={handleChange}
              placeholder="e.g., Excellence in Education"
              className={inputCls}
            />
          </div>

          {/* ── Logo ── */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              School Logo
            </label>
            <Dropzone
              provider="cloudflare-r2"
              variant="avatar"
              maxFiles={1}
              maxSize={5 * 1024 * 1024}
              accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
              onFilesChange={setLogoFiles}
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">PNG/JPG/WEBP, max 5MB</p>
          </div>

          {/* ── Contact ── */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Contact Information
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="contact" placeholder="Primary phone" value={form.contact} onChange={handleChange} className={inputCls} />
              <input name="contact2" placeholder="Secondary phone" value={form.contact2} onChange={handleChange} className={inputCls} />
              <input name="contact3" placeholder="Tertiary phone" value={form.contact3} onChange={handleChange} className={inputCls} />
              <input name="email" type="email" placeholder="Primary email" value={form.email} onChange={handleChange} className={inputCls} />
              <input name="email2" type="email" placeholder="Secondary email" value={form.email2} onChange={handleChange} className={inputCls} />
              <input name="website" placeholder="Website URL" value={form.website} onChange={handleChange} className={inputCls} />
            </div>
            <textarea
              name="address"
              rows={2}
              placeholder="School address"
              value={form.address}
              onChange={handleChange}
              className={`${inputCls} mt-3 resize-none`}
            />
          </div>

          {/* ── Active ── */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active school</span>
          </label>
        </form>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 dark:border-zinc-700 px-6 py-4 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="school-form"
            disabled={loading}
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : school ? "Update School" : "Create School"}
          </button>
        </div>
      </div>
    </div>
  );
};
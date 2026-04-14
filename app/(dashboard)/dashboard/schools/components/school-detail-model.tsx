"use client";

import React from "react";
import {
  X, Edit, Building2, Users, GraduationCap, BookOpen,
  Phone, Mail, Globe, MapPin, Hash, UserCheck,
} from "lucide-react";
import { SchoolWithCounts } from "./school-client";

interface SchoolDetailsModalProps {
  school: SchoolWithCounts;
  onClose: () => void;
  onEdit: () => void;
}

export const SchoolDetailsModal: React.FC<SchoolDetailsModalProps> = ({
  school,
  onClose,
  onEdit,
}) => {
  const admin = (school as any).admin;

  const stats = [
    { icon: Users, label: "Students", value: school._count.students, color: "blue" },
    { icon: GraduationCap, label: "Teachers", value: school._count.teachers, color: "green" },
    { icon: BookOpen, label: "Classes", value: school._count.classTemplates, color: "purple" },
    { icon: Users, label: "Parents", value: school._count.parents, color: "orange" },
  ] as const;

  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    purple: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {school.logo ? (
              <img
                src={school.logo}
                alt={school.name}
                className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {school.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {school.name}
              </h2>
              <p className="text-xs text-gray-400">/{school.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                school.isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {school.isActive ? "Active" : "Inactive"}
            </span>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-medium transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* School code badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 font-mono text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              <Hash className="w-3.5 h-3.5" />
              {school.code}
            </span>
            <span className="text-xs text-gray-400">Login code for staff &amp; students</span>
          </div>

          {/* Motto */}
          {school.motto && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg px-4 py-3">
              <p className="text-center text-sm text-blue-800 dark:text-blue-300 italic">
                "{school.motto}"
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className={`rounded-xl p-3 ${colorMap[color]}`}
              >
                <Icon className="w-5 h-5 mb-1 opacity-80" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs opacity-75">{label}</p>
              </div>
            ))}
          </div>

          {/* Admin */}
          {admin && (
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Administrator
              </h3>
              <div className="flex items-center gap-3">
                {admin.image ? (
                  <img src={admin.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {admin.name?.charAt(0).toUpperCase() ?? "A"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {admin.name}
                  </p>
                  <p className="text-xs text-gray-400">{admin.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          {(school.contact || school.contact2 || school.contact3 ||
            school.email || school.email2 || school.website || school.address) && (
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Phone, label: "Primary Phone", value: school.contact },
                  { icon: Phone, label: "Secondary Phone", value: school.contact2 },
                  { icon: Phone, label: "Tertiary Phone", value: school.contact3 },
                  { icon: Mail, label: "Primary Email", value: school.email },
                  { icon: Mail, label: "Secondary Email", value: school.email2 },
                  { icon: Globe, label: "Website", value: school.website },
                ].filter((item) => item.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
                    </div>
                  </div>
                ))}
                {school.address && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Address</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{school.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Created at */}
          <p className="text-xs text-gray-400 text-right">
            Created {new Date((school as any).createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};
"use client";

import React, { useState } from "react";
import { Eye, Edit, Trash2, ToggleLeft, ToggleRight, Building2, Hash } from "lucide-react";
import { SchoolWithCounts } from "./school-client";

interface SchoolTableProps {
  schools: SchoolWithCounts[];
  onEdit: (s: SchoolWithCounts) => void;
  onDelete: (s: SchoolWithCounts) => void;
  onView: (s: SchoolWithCounts) => void;
  onToggleStatus: (s: SchoolWithCounts) => void | Promise<void>;
}

const SchoolLogo: React.FC<{ logo: string | null; name: string }> = ({ logo, name }) => {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={`${name} logo`}
      className="w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
      onError={() => setErr(true)}
    />
  );
};

export const SchoolTable: React.FC<SchoolTableProps> = ({
  schools,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
}) => {
  if (schools.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-16 text-center">
        <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">No schools found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">School</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stats</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {schools.map((school) => (
              <tr
                key={school.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {/* School */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <SchoolLogo logo={school.logo} name={school.name} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {school.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">/{school.slug}</p>
                    </div>
                  </div>
                </td>

                {/* Code */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs text-gray-700 dark:text-gray-300">
                    <Hash className="w-3 h-3" />
                    {school.code}
                  </span>
                </td>

                {/* Admin */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    {(school as any).admin?.image ? (
                      <img
                        src={(school as any).admin.image}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {(school as any).admin?.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        {(school as any).admin?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {(school as any).admin?.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                    {school.contact && <p>{school.contact}</p>}
                    {school.email && <p className="text-gray-400">{school.email}</p>}
                    {!school.contact && !school.email && <p className="text-gray-300">—</p>}
                  </div>
                </td>

                {/* Stats */}
                <td className="px-4 py-3">
                  <div className="text-xs space-y-0.5">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">{school._count.students}</span>
                      <span className="text-gray-400"> students</span>
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">{school._count.teachers}</span>
                      <span className="text-gray-400"> teachers</span>
                    </p>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleStatus(school)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      school.isActive
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {school.isActive ? (
                      <><ToggleRight className="w-3 h-3" /> Active</>
                    ) : (
                      <><ToggleLeft className="w-3 h-3" /> Inactive</>
                    )}
                  </button>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(school)}
                      className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(school)}
                      className="p-1.5 rounded text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(school)}
                      className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
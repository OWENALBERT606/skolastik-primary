"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { SchoolWithCounts } from "./school-client";

interface DeleteConfirmModalProps {
  school: SchoolWithCounts;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onForceDelete: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  school,
  loading,
  onClose,
  onConfirm,
  onForceDelete,
}) => {
  const hasData =
    school._count.students > 0 || school._count.teachers > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Delete School
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {school.name}
            </span>
            ?
          </p>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Students", value: school._count.students },
              { label: "Teachers", value: school._count.teachers },
              { label: "Parents", value: school._count.parents },
            ].map(({ label, value }) => (
              <div
                key={label}
                className={`rounded-lg p-3 text-center ${
                  value > 0
                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                    : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <p className={`text-lg font-bold ${value > 0 ? "text-amber-700 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
                  {value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {hasData ? (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                This school has existing data. A normal delete will be blocked.
                Use <strong>Force Delete</strong> to permanently remove the school
                and all associated records. This cannot be undone.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This action cannot be undone. The school and all related
                configuration will be permanently deleted.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 dark:border-zinc-700 px-6 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>

          {hasData ? (
            <button
              onClick={onForceDelete}
              disabled={loading}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
            >
              {loading ? "Deleting..." : "Force Delete"}
            </button>
          ) : (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
            >
              {loading ? "Deleting..." : "Delete School"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
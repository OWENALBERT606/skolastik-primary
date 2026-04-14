// components/schools/SchoolCard.tsx

import React from 'react';
import { Building2, Users, GraduationCap, BookOpen, Edit, Trash2, Eye } from 'lucide-react';
import { School } from '@/types/schools';

interface SchoolCardProps {
  school: School;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onToggleStatus: () => void;
}

export const SchoolCard: React.FC<SchoolCardProps> = ({
  school,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{school.name}</h3>
              <p className="text-sm text-gray-500">/{school.slug}</p>
            </div>
          </div>
          <button
            onClick={onToggleStatus}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              school.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {school.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>

        {/* Motto */}
        {school.motto && (
          <p className="text-sm text-gray-600 italic mb-4">"{school.motto}"</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Students</p>
              <p className="text-sm font-semibold text-gray-900">{school._count.students}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Teachers</p>
              <p className="text-sm font-semibold text-gray-900">{school._count.teachers}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Classes</p>
              <p className="text-sm font-semibold text-gray-900">{school._count.classTemplates}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Parents</p>
              <p className="text-sm font-semibold text-gray-900">{school._count.parents}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
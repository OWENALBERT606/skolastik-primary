


// components/dashboard/classes/detail-tabs/students-tab.tsx
"use client";

import { useState } from "react";
import {
  GraduationCap,
  Search,
  Users,
  Download,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface StudentsTabProps {
  classYear: any;
  schoolId: string;
  schoolSlug: string; // ✅ ADD THIS
  onUpdate: () => void;
}

export function StudentsTab({
  classYear,
  schoolId,
  schoolSlug, 
  onUpdate,
}: StudentsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStream, setFilterStream] = useState<string>("all");
  const [filterTerm, setFilterTerm] = useState<string>("all");

  // Get all enrollments from the classYear
  const allEnrollments = classYear.enrollments || [];

  // Filter students based on search and filters
  const filteredStudents = allEnrollments.filter((enrollment: any) => {
    const student = enrollment.student;
    
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStream =
      filterStream === "all" || enrollment.streamId === filterStream;

    const matchesTerm =
      filterTerm === "all" || enrollment.termId === filterTerm;

    return matchesSearch && matchesStream && matchesTerm;
  });

  // Calculate stats
  const totalStudents = allEnrollments.length;
  const capacityPercentage = classYear.maxStudents
    ? Math.round((totalStudents / classYear.maxStudents) * 100)
    : 0;
  const avgPerStream =
    classYear._count.streams > 0
      ? Math.round(totalStudents / classYear._count.streams)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total Students
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalStudents}
              </p>
            </div>
          </div>
        </div>

        {classYear.maxStudents && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Capacity
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {capacityPercentage}%
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Avg per Stream
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {avgPerStream}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={filterStream}
            onChange={(e) => setFilterStream(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Streams</option>
            {classYear.streams?.map((stream: any) => (
              <option key={stream.id} value={stream.id}>
                {stream.name}
              </option>
            ))}
          </select>

          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 focus:border-[#5B9BD5] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Terms</option>
            {classYear.academicYear?.terms?.map((term: any) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>

          <button className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Students List/Table */}
      {totalStudents === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No students enrolled
          </h4>
          <p className="text-slate-600 dark:text-slate-400">
            Students will appear here once they are enrolled in this class
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Admission No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Stream
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Term
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStudents.map((enrollment: any) => {
                  const student = enrollment.student;
                  return (
                    <tr
                      key={enrollment.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {student.admissionNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {student.gender}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {enrollment.stream?.name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {enrollment.term?.name || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            enrollment.status === "ACTIVE"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/school/${schoolSlug}/users/students/${student.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#5B9BD5] hover:bg-[#5B9BD5]/10 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">
                No students found matching "{searchTerm}"
              </p>
            </div>
          )}

          {filteredStudents.length === 0 && !searchTerm && (filterStream !== "all" || filterTerm !== "all") && (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">
                No students found with selected filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
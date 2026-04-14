// components/academic-terms/AcademicTermsList.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, BookOpen, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AcademicTermCard from "./term-card";
import CreateAcademicTermDialog from "./academic-term-dialogue";


interface AcademicTermsListProps {
  initialData: any[];
  schoolId: string;
}

export default function AcademicTermsList({
  initialData,
  schoolId,
}: AcademicTermsListProps) {
  const [academicTerms, setAcademicTerms] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Get unique academic years for filter
  const academicYears = Array.from(
    new Set(academicTerms.map((term) => term.academicYear.year))
  ).sort((a, b) => b.localeCompare(a));

  // Filter academic terms
  const filteredTerms = academicTerms.filter((term) => {
    const matchesSearch = term.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && term.isActive) ||
      (filterStatus === "inactive" && !term.isActive);
    const matchesYear =
      filterYear === "all" || term.academicYear.year === filterYear;

    return matchesSearch && matchesStatus && matchesYear;
  });

  const handleTermCreated = (newTerm: any) => {
    setAcademicTerms((prev) => [newTerm, ...prev]);
    setCreateDialogOpen(false);
  };

  const handleTermUpdated = (updatedTerm: any) => {
    setAcademicTerms((prev) =>
      prev.map((term) => (term.id === updatedTerm.id ? updatedTerm : term))
    );
  };

  const handleTermDeleted = (deletedId: string) => {
    setAcademicTerms((prev) => prev.filter((term) => term.id !== deletedId));
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <Input
            placeholder="Search academic terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:w-64 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />

          {/* Filter by Status */}
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="sm:w-40 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectItem value="all">All Terms</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter by Academic Year */}
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="sm:w-40 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Filter by year" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectItem value="all">All Years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Create Button */}
        <Button 
          onClick={() => setCreateDialogOpen(true)} 
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Academic Term
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          label="Total Terms"
          value={academicTerms.length}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-green-600 dark:text-green-400" />}
          label="Active Terms"
          value={academicTerms.filter((t) => t.isActive).length}
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          label="Total Enrollments"
          value={academicTerms.reduce((sum, t) => sum + (t.stats?.totalEnrollments || 0), 0)}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          label="Total Exams"
          value={academicTerms.reduce((sum, t) => sum + (t.stats?.totalExams || 0), 0)}
          bgColor="bg-orange-50 dark:bg-orange-900/20"
        />
      </div>

      {/* Academic Terms List */}
      {filteredTerms.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery || filterStatus !== "all" || filterYear !== "all"
              ? "No academic terms found"
              : "No academic terms yet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || filterStatus !== "all" || filterYear !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first academic term"}
          </p>
          {!searchQuery && filterStatus === "all" && filterYear === "all" && (
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Academic Term
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTerms.map((term) => (
            <AcademicTermCard
              key={term.id}
              academicTerm={term}
              onUpdate={handleTermUpdated}
              onDelete={handleTermDeleted}
            />
          ))}
        </div>
      )}

      <CreateAcademicTermDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        schoolId={schoolId}
        onSuccess={handleTermCreated}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`${bgColor} p-3 rounded-lg transition-colors`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  );
}
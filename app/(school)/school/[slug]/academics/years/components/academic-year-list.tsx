// components/academic-years/AcademicYearsList.tsx
"use client";

import { useState } from "react";
import { AcademicYear } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AcademicYearCard from "./academic-year-card";
import CreateAcademicYearDialog from "./academic-year-dialogue";

interface AcademicYearsListProps {
  initialData: any[];
  schoolId: string;
}

export default function AcademicYearsList({
  initialData,
  schoolId,
}: AcademicYearsListProps) {
  const [academicYears, setAcademicYears] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredYears = academicYears.filter((year) => {
    const matchesSearch = year.year
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && year.isActive) ||
      (filterStatus === "inactive" && !year.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleYearCreated = (newYear: any) => {
    setAcademicYears((prev) => [newYear, ...prev]);
    setCreateDialogOpen(false);
  };

  const handleYearUpdated = (updatedYear: any) => {
    setAcademicYears((prev) =>
      prev.map((year) => (year.id === updatedYear.id ? updatedYear : year))
    );
  };

  const handleYearDeleted = (deletedId: string) => {
    setAcademicYears((prev) => prev.filter((year) => year.id !== deletedId));
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <Input
            placeholder="Search academic years..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:w-64 bg-background text-foreground"
          />

          {/* Filter */}
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="sm:w-40 bg-background text-foreground border-gray-200 dark:border-gray-800">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Button */}
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Academic Year
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          label="Total Years"
          value={academicYears.length}
          bgColor="bg-blue-50 dark:bg-blue-950"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-green-600 dark:text-green-400" />}
          label="Active Year"
          value={academicYears.filter((y) => y.isActive).length}
          bgColor="bg-green-50 dark:bg-green-950"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          label="Total Enrollments"
          value={academicYears.reduce((sum, y) => sum + (y.stats?.totalEnrollments || 0), 0)}
          bgColor="bg-blue-50 dark:bg-blue-950"
        />
      </div>

      {/* Academic Years List */}
      {filteredYears.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery || filterStatus !== "all"
              ? "No academic years found"
              : "No academic years yet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first academic year"}
          </p>
          {!searchQuery && filterStatus === "all" && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Academic Year
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredYears.map((year) => (
            <AcademicYearCard
              key={year.id}
              academicYear={year}
              onUpdate={handleYearUpdated}
              onDelete={handleYearDeleted}
            />
          ))}
        </div>
      )}

      <CreateAcademicYearDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        schoolId={schoolId}
        onSuccess={handleYearCreated}
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
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-4">
        <div className={`${bgColor} p-3 rounded-lg`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

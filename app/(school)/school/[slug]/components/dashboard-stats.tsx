// components/school/dashboard-stats.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  CalendarDays,
  Layers,
  GitBranch,
  Library,
} from "lucide-react";

interface SchoolWithCounts {
  id: string;
  name: string;
  _count?: {
    students?: number;
    teachers?: number;
    classes?: number;
    parents?: number;
    academicYears?: number;
    subjects?: number;
    streams?: number;
    staff?: number;
  };
}

interface DashboardStatsProps {
  school: SchoolWithCounts;
}

export function DashboardStats({ school }: DashboardStatsProps) {
  const c = school?._count ?? {};

  const stats = [
    {
      title: "Total Students",
      value: c.students ?? 0,
      sub: "Enrolled students",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Teachers",
      value: c.teachers ?? 0,
      sub: "Teaching staff",
      icon: GraduationCap,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Staff",
      value: c.staff ?? 0,
      sub: "Non-teaching staff",
      icon: Users,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Parents",
      value: c.parents ?? 0,
      sub: "Registered guardians",
      icon: UserCheck,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Classes",
      value: c.classes ?? 0,
      sub: "Active class levels",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Streams",
      value: c.streams ?? 0,
      sub: "Class streams",
      icon: GitBranch,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      title: "Subjects",
      value: c.subjects ?? 0,
      sub: "On curriculum",
      icon: Library,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      title: "Academic Years",
      value: c.academicYears ?? 0,
      sub: "Years recorded",
      icon: CalendarDays,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
              {stat.title}
            </CardTitle>
            <div className={`p-1.5 rounded-md ${stat.bg}`}>
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-card-foreground">
              {stat.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
              {stat.sub}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
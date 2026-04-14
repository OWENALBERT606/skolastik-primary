


// components/school/dashboard-stats.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, TrendingUp, UserCheck, School } from "lucide-react";

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
  };
}

interface DashboardStatsProps {
  school: SchoolWithCounts;
}

export function DashboardStats({ school }: DashboardStatsProps) {
  // Safely access counts with fallback to 0
  const studentsCount = school?._count?.students ?? 0;
  const teachersCount = school?._count?.teachers ?? 0;
  const classesCount = school?._count?.classes ?? 0;
  const parentsCount = school?._count?.parents ?? 0;

  const stats = [
    {
      title: "Total Students",
      value: studentsCount,
      change: "Enrolled students",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Teachers",
      value: teachersCount,
      change: "Staff members",
      icon: GraduationCap,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Classes",
      value: classesCount,
      change: "All levels",
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Parents",
      value: parentsCount,
      change: "Registered",
      icon: UserCheck,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {stat.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
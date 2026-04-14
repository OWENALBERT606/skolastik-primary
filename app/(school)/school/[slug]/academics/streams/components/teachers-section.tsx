"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, BookOpen, AlertTriangle } from "lucide-react";

export default function TeachersSection({ analytics }: { analytics: any }) {
  const workloadData = analytics.teacherWorkload.map((teacher: any) => ({
    name: teacher.teacherName.split(" ")[0],
    students: teacher.totalStudents,
    subjects: teacher.subjects.length,
  }));

  const getWorkloadStatus = (totalStudents: number) => {
    if (totalStudents > 150) return { status: "High", color: "destructive" };
    if (totalStudents > 100) return { status: "Moderate", color: "default" };
    return { status: "Normal", color: "secondary" };
  };

  return (
    <>
      {/* Teacher Workload Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Workload Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="students"
                fill="#8884d8"
                name="Total Students"
              />
              <Bar
                yAxisId="right"
                dataKey="subjects"
                fill="#82ca9d"
                name="Subjects"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Teacher Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Staff No</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Total Students</TableHead>
                <TableHead>Workload Status</TableHead>
                <TableHead>Subject Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.teacherWorkload.map((teacher: any) => {
                const workload = getWorkloadStatus(teacher.totalStudents);
                const avgStudentsPerSubject = Math.round(
                  teacher.totalStudents / teacher.subjects.length
                );

                return (
                  <TableRow key={teacher.teacherId}>
                    <TableCell className="font-medium">
                      {teacher.teacherName}
                    </TableCell>
                    <TableCell>{teacher.staffNo || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{teacher.subjects.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold">
                            {teacher.totalStudents}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ~{avgStudentsPerSubject} per subject
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={workload.color as any}>
                        {workload.status}
                      </Badge>
                      {workload.status === "High" && (
                        <AlertTriangle className="h-4 w-4 text-orange-500 inline ml-2" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-xs">
                        {teacher.subjects.slice(0, 3).map((subject: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-muted-foreground">
                              {subject.subjectName}
                              {subject.paperName && ` - ${subject.paperName}`}
                            </span>
                            <span className="font-medium ml-2">
                              {subject.studentCount}
                            </span>
                          </div>
                        ))}
                        {teacher.subjects.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{teacher.subjects.length - 3} more
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teacher Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Average Students per Teacher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                analytics.teacherWorkload.reduce(
                  (sum: number, t: any) => sum + t.totalStudents,
                  0
                ) / analytics.teacherWorkload.length
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all teachers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Most Loaded Teacher
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.teacherWorkload.length > 0 && (
              <>
                <div className="text-2xl font-bold">
                  {
                    [...analytics.teacherWorkload].sort(
                      (a, b) => b.totalStudents - a.totalStudents
                    )[0].teacherName.split(" ")[0]
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {
                    [...analytics.teacherWorkload].sort(
                      (a, b) => b.totalStudents - a.totalStudents
                    )[0].totalStudents
                  }{" "}
                  students
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Avg Subjects per Teacher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                analytics.teacherWorkload.reduce(
                  (sum: number, t: any) => sum + t.subjects.length,
                  0
                ) / analytics.teacherWorkload.length
              ).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Subject assignments
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
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
import { Award, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

export default function PerformanceSection({ analytics }: { analytics: any }) {
  const topSubjects = [...analytics.subjectPerformanceComparison]
    .sort((a, b) => b.averageMark - a.averageMark)
    .slice(0, 5);

  const bottomSubjects = [...analytics.subjectPerformanceComparison]
    .sort((a, b) => a.averageMark - b.averageMark)
    .slice(0, 5);

  const subjectRadarData = analytics.subjectPerformanceComparison.map(
    (subject: any) => ({
      subject: subject.subjectCode || subject.subjectName.substring(0, 10),
      performance: subject.averageMark,
    })
  );

  const getGradeBadge = (mark: number) => {
    if (mark >= 75)
      return <Badge className="bg-green-500">Distinction</Badge>;
    if (mark >= 65) return <Badge className="bg-blue-500">Credit</Badge>;
    if (mark >= 50) return <Badge className="bg-yellow-500">Pass</Badge>;
    return <Badge variant="destructive">Fail</Badge>;
  };

  return (
    <>
      {/* Top Performers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top 10 Performers
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Average Mark</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topPerformers.map((student: any, index: number) => (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && `${index + 1}`}
                  </TableCell>
                  <TableCell>{student.admissionNo}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.subjectsCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{student.averageMark}%</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </TableCell>
                  <TableCell>{getGradeBadge(student.averageMark)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Subject Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={analytics.subjectPerformanceComparison}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="subjectName" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageMark" fill="#8884d8" name="Average Mark (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={subjectRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Performance"
                dataKey="performance"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top & Bottom Performing Subjects */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Top 5 Performing Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSubjects.map((subject: any, index: number) => (
                <div
                  key={subject.subjectId}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950"
                >
                  <div>
                    <p className="font-medium">{subject.subjectName}</p>
                    <p className="text-sm text-muted-foreground">
                      {subject.totalEnrolled} students
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {subject.averageMark}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Bottom 5 Performing Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bottomSubjects.map((subject: any) => (
                <div
                  key={subject.subjectId}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950"
                >
                  <div>
                    <p className="font-medium">{subject.subjectName}</p>
                    <p className="text-sm text-muted-foreground">
                      {subject.totalEnrolled} students
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">
                      {subject.averageMark}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
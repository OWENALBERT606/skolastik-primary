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
import { Award, AlertCircle } from "lucide-react";

export default function StudentsSection({ analytics }: { analytics: any }) {
  const strugglingStudents = [...analytics.topPerformers]
    .sort((a, b) => a.averageMark - b.averageMark)
    .slice(0, 10);

  return (
    <>
      {/* Top Performers - Detailed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Performers - Detailed View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Subjects Taken</TableHead>
                <TableHead>Average Mark</TableHead>
                <TableHead>Performance Band</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topPerformers.map((student: any, index: number) => (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium text-lg">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && `${index + 1}`}
                  </TableCell>
                  <TableCell>{student.admissionNo}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.subjectsCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-lg font-bold text-green-600">
                      {student.averageMark}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {student.averageMark >= 75 && (
                      <Badge className="bg-green-500">Distinction</Badge>
                    )}
                    {student.averageMark >= 65 && student.averageMark < 75 && (
                      <Badge className="bg-blue-500">Credit</Badge>
                    )}
                    {student.averageMark >= 50 && student.averageMark < 65 && (
                      <Badge className="bg-yellow-500">Pass</Badge>
                    )}
                    {student.averageMark < 50 && (
                      <Badge variant="destructive">Needs Support</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Students Needing Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            Students Needing Academic Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strugglingStudents.filter((s) => s.averageMark < 50).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Average Mark</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strugglingStudents
                  .filter((s) => s.averageMark < 50)
                  .map((student: any) => (
                    <TableRow key={student.studentId}>
                      <TableCell>{student.admissionNo}</TableCell>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-lg font-bold text-red-600">
                          {student.averageMark}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">At Risk</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Requires immediate intervention
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Excellent Performance!</p>
              <p className="text-sm text-muted-foreground mt-2">
                All students are performing above the minimum threshold
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Distribution */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Distinction Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {
                analytics.topPerformers.filter((s: any) => s.averageMark >= 75)
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Students (≥75%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Credit Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                analytics.topPerformers.filter(
                  (s: any) => s.averageMark >= 65 && s.averageMark < 75
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Students (65-74%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pass Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {
                analytics.topPerformers.filter(
                  (s: any) => s.averageMark >= 50 && s.averageMark < 65
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Students (50-64%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Below Pass</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {
                analytics.topPerformers.filter((s: any) => s.averageMark < 50)
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Students (&lt;50%)
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
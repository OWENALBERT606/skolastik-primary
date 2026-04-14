"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Eye, Edit, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";

type Enrollment = {
  id: string;
  status: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    gender: string;
  };
};

export default function StreamStudentsTab({
  streamId,
  enrollments,
}: {
  streamId: string;
  enrollments: Enrollment[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.student.firstName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      enrollment.student.lastName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      enrollment.student.admissionNo
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Enrolled Students ({enrollments.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No students found" : "No students enrolled yet"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">
                    {enrollment.student.admissionNo}
                  </TableCell>
                  <TableCell>
                    {enrollment.student.firstName} {enrollment.student.lastName}
                  </TableCell>
                  <TableCell>{enrollment.student.gender}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        enrollment.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/students/${enrollment.student.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/students/${enrollment.student.id}/marks`}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Marks
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/students/${enrollment.student.id}/edit`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Student
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Stream
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
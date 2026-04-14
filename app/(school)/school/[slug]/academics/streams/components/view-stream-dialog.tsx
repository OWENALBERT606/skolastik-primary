"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStreamById } from "@/actions/streams";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Users,
  Edit,
  Trash2,
  BarChart3,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface ViewStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ViewStreamDialog({
  open,
  onOpenChange,
  streamId,
  onEdit,
  onDelete,
}: ViewStreamDialogProps) {
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<any>(null);

  useEffect(() => {
    if (open) {
      loadStream();
    }
  }, [open, streamId]);

  const loadStream = async () => {
    setLoading(true);
    try {
      const data = await getStreamById(streamId);
      setStream(data);
    } catch (error) {
      toast.error("Failed to load stream details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>
                {loading ? <Skeleton className="h-7 w-32" /> : stream?.name}
              </DialogTitle>
              <DialogDescription>
                {loading ? (
                  <Skeleton className="h-4 w-48 mt-1" />
                ) : (
                  <>
                    {stream?.classYear.classTemplate.name} -{" "}
                    {stream?.classYear.academicYear.year}
                  </>
                )}
              </DialogDescription>
            </div>
            {!loading && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/streams/${streamId}/analytics`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <StreamLoadingSkeleton />
        ) : stream ? (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subjects">
                Subjects ({stream.streamSubjects?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="students">
                Students ({stream._count?.enrollments || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stream._count?.enrollments || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Subjects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stream.streamSubjects?.length || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stream.classYear?.academicYear?.terms?.length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Class Head</CardTitle>
                </CardHeader>
                <CardContent>
                  {stream.classHead ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {stream.classHead.firstName}{" "}
                            {stream.classHead.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Staff No: {stream.classHead.staffNo}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${stream.classHead.email}`}
                            className="hover:underline"
                          >
                            {stream.classHead.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${stream.classHead.phone}`}
                            className="hover:underline"
                          >
                            {stream.classHead.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No class head assigned
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects" className="mt-4">
              {stream.streamSubjects?.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Paper</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Teacher</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stream.streamSubjects.map((ss: any) => {
                        const teacher =
                          ss.teacherAssignments?.[0]?.teacher ||
                          ss.paperTeachers?.[0]?.teacher;

                        return (
                          <TableRow key={ss.id}>
                            <TableCell className="font-medium">
                              {ss.subject.name}
                            </TableCell>
                            <TableCell>
                              {ss.subjectPaper ? (
                                <Badge variant="outline">
                                  Paper {ss.subjectPaper.paperNumber}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>{ss.term.name}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  ss.subjectType === "COMPULSORY"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {ss.subjectType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {teacher ? (
                                <div className="text-sm">
                                  {teacher.firstName} {teacher.lastName}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  Not assigned
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No subjects assigned yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="students" className="mt-4">
              {stream.enrollments?.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stream.enrollments.map((enrollment: any) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            {enrollment.student.admissionNo}
                          </TableCell>
                          <TableCell>
                            {enrollment.student.firstName}{" "}
                            {enrollment.student.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                enrollment.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {enrollment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No students enrolled yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Stream not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StreamLoadingSkeleton() {
  return (
    <div className="space-y-4 mt-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
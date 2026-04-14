// app/school/[slug]/users/teachers/[id]/teacher-detail-client.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  Briefcase,
  GraduationCap,
  FileText,
  Heart,
  BookOpen,
  AlertCircle,
  Edit,
  History,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import TeacherDialog from "../components/teacher-dialogue";

type TeacherDetailClientProps = {
  teacher: any;
  slug: string;
  backUrl?: string;
};

export default function TeacherDetailClient({
  teacher,
  slug,
  backUrl,
}: TeacherDetailClientProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Format teacher data for editing
  const formatTeacherForEdit = () => ({
    ...teacher,
    status: teacher.currentStatus, // Map currentStatus to status for form compatibility
    dateOfBirth: teacher.dateOfBirth
      ? new Date(teacher.dateOfBirth).toISOString().split("T")[0]
      : "",
    dateOfHire: teacher.dateOfHire
      ? new Date(teacher.dateOfHire).toISOString().split("T")[0]
      : "",
    previousSchools: Array.isArray(teacher.previousSchools)
      ? teacher.previousSchools.join(", ")
      : "",
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href={backUrl || `/school/${slug}/users/teachers`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teachers
          </Link>
        </Button>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Teacher
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={teacher.profilePhoto || undefined} />
              <AvatarFallback className="text-3xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                {teacher.firstName[0]}
                {teacher.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold dark:text-white mb-2">
                {teacher.firstName} {teacher.lastName}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-3">
                {teacher.role}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  className={
                    teacher.currentStatus === "ACTIVE"
                      ? "bg-green-600 dark:bg-green-700"
                      : "bg-gray-600 dark:bg-gray-700"
                  }
                >
                  {teacher.currentStatus}
                </Badge>
                <Badge
                  variant="outline"
                  className="dark:border-slate-600 dark:text-slate-300"
                >
                  Staff No: {teacher.staffNo}
                </Badge>
                <Badge
                  variant="outline"
                  className="dark:border-slate-600 dark:text-slate-300"
                >
                  {teacher.employmentType}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="dark:text-slate-300">{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="dark:text-slate-300">{teacher.phone}</span>
                </div>
                {teacher.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span className="dark:text-slate-300">
                      {teacher.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger
            value="personal"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-300"
          >
            <User className="h-4 w-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger
            value="professional"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-300"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Professional
          </TabsTrigger>
          <TabsTrigger
            value="academic"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-300"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Academic
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-300"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-300"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="emergency"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-300"
          >
            <Heart className="h-4 w-4 mr-2" />
            Emergency
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-300"
          >
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="mt-6">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300 w-1/3">
                      Full Name
                    </TableCell>
                    <TableCell className="dark:text-white">
                      {teacher.firstName} {teacher.lastName}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Gender
                    </TableCell>
                    <TableCell className="capitalize dark:text-white">
                      {teacher.gender}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Date of Birth
                    </TableCell>
                    <TableCell className="dark:text-white">
                      {new Date(teacher.dateOfBirth).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </TableCell>
                  </TableRow>
                  {teacher.nationality && (
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300">
                        Nationality
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {teacher.nationality}
                      </TableCell>
                    </TableRow>
                  )}
                  {teacher.nationalId && (
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300">
                        National ID / Passport
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {teacher.nationalId}
                      </TableCell>
                    </TableRow>
                  )}
                  {teacher.maritalStatus && (
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300">
                        Marital Status
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {teacher.maritalStatus}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Phone Number
                    </TableCell>
                    <TableCell className="dark:text-white">
                      {teacher.phone}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Email Address
                    </TableCell>
                    <TableCell className="dark:text-white">
                      {teacher.email}
                    </TableCell>
                  </TableRow>
                  {teacher.address && (
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300">
                        Address
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {teacher.address}
                      </TableCell>
                    </TableRow>
                  )}
                  {teacher.healthInfo && (
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300">
                        Health Information
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {teacher.healthInfo}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Information */}
        <TabsContent value="professional" className="mt-6">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300 w-1/3">
                      Staff Number
                    </TableCell>
                    <TableCell className="dark:text-white font-mono">
                      {teacher.staffNo}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Role / Position
                    </TableCell>
                    <TableCell className="dark:text-white">
                      {teacher.role}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Employment Type
                    </TableCell>
                    <TableCell className="capitalize dark:text-white">
                      {teacher.employmentType}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Date of Hire
                    </TableCell>
                    <TableCell className="dark:text-white">
                      {new Date(teacher.dateOfHire).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Employment Status
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          teacher.currentStatus === "ACTIVE"
                            ? "bg-green-600"
                            : "bg-gray-600"
                        }
                      >
                        {teacher.currentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {teacher.qualification && (
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300">
                        Qualification
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {teacher.qualification}
                      </TableCell>
                    </TableRow>
                  )}
                  {teacher.specialization && (
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300">
                        Specialization
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {teacher.specialization}
                      </TableCell>
                    </TableRow>
                  )}
                  {teacher.teachingLevel && (
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300">
                        Teaching Level
                      </TableCell>
                      <TableCell className="capitalize dark:text-white">
                        {teacher.teachingLevel}
                      </TableCell>
                    </TableRow>
                  )}
                  {teacher.experienceYears && (
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300">
                        Years of Experience
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {teacher.experienceYears} years
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Account Status
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          teacher.user.status ? "default" : "secondary"
                        }
                      >
                        {teacher.user.status ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Email Verified
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          teacher.user.isVerfied ? "default" : "secondary"
                        }
                      >
                        {teacher.user.isVerfied ? "Verified" : "Not Verified"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Information */}
        <TabsContent value="academic" className="mt-6">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">
                Academic Background
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.highestQualification ||
              teacher.institutionAttended ||
              teacher.professionalTraining ||
              teacher.ongoingStudies ||
              (teacher.previousSchools && teacher.previousSchools.length > 0) ? (
                <Table>
                  <TableBody>
                    {teacher.highestQualification && (
                      <TableRow className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-slate-300 w-1/3">
                          Highest Qualification
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {teacher.highestQualification}
                        </TableCell>
                      </TableRow>
                    )}
                    {teacher.institutionAttended && (
                      <TableRow className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-slate-300">
                          Institution Attended
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {teacher.institutionAttended}
                        </TableCell>
                      </TableRow>
                    )}
                    {teacher.professionalTraining && (
                      <TableRow className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-slate-300">
                          Professional Training
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {teacher.professionalTraining}
                        </TableCell>
                      </TableRow>
                    )}
                    {teacher.ongoingStudies && (
                      <TableRow className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-slate-300">
                          Ongoing Studies
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {teacher.ongoingStudies}
                        </TableCell>
                      </TableRow>
                    )}
                    {teacher.previousSchools &&
                      teacher.previousSchools.length > 0 && (
                        <TableRow className="dark:border-slate-700">
                          <TableCell className="font-medium dark:text-slate-300">
                            Previous Schools
                          </TableCell>
                          <TableCell className="dark:text-white">
                            <ul className="list-disc list-inside space-y-1">
                              {teacher.previousSchools.map(
                                (school: string, index: number) => (
                                  <li key={index}>{school}</li>
                                )
                              )}
                            </ul>
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No academic information available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teaching Assignments */}
        <TabsContent value="assignments" className="mt-6 space-y-6">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">
                Current Teaching Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.streamSubjectAssignments &&
              teacher.streamSubjectAssignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-slate-700">
                        <TableHead className="dark:text-slate-300">
                          Subject
                        </TableHead>
                        <TableHead className="dark:text-slate-300">
                          Paper
                        </TableHead>
                        <TableHead className="dark:text-slate-300">
                          Class
                        </TableHead>
                        <TableHead className="dark:text-slate-300">
                          Stream
                        </TableHead>
                        <TableHead className="dark:text-slate-300">
                          Term
                        </TableHead>
                        <TableHead className="dark:text-slate-300">
                          Year
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacher.streamSubjectAssignments.map((assignment: any) => (
                        <TableRow
                          key={assignment.id}
                          className="dark:border-slate-700"
                        >
                          <TableCell className="font-medium dark:text-white">
                            {assignment.streamSubject?.subject?.name ?? "-"}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {assignment.streamSubject?.subjectPaper
                              ? `Paper ${assignment.streamSubject.subjectPaper.paperNumber}`
                              : "—"}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {assignment.streamSubject?.stream?.classYear?.classTemplate?.name ?? "-"}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {assignment.streamSubject?.stream?.name ?? "-"}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {assignment.streamSubject?.term?.name ?? "-"}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {assignment.streamSubject?.stream?.classYear?.academicYear?.year ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No teaching assignments yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Class Head */}
          {teacher.headedStreams && teacher.headedStreams.length > 0 && (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  Class Head Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="dark:text-slate-300">
                        Class
                      </TableHead>
                      <TableHead className="dark:text-slate-300">
                        Stream
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacher.headedStreams.map((stream: any) => (
                      <TableRow
                        key={stream.id}
                        className="dark:border-slate-700"
                      >
                        <TableCell className="dark:text-white">
                          {stream.classYear.classTemplate.name}
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {stream.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Subject Head */}
          {teacher.headedSubject && (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  Subject Department Head
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-slate-300 w-1/3">
                        Subject
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {teacher.headedSubject.name}
                      </TableCell>
                    </TableRow>
                    {teacher.headedSubject.code && (
                      <TableRow className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-slate-300">
                          Subject Code
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {teacher.headedSubject.code}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignment History */}
        <TabsContent value="history" className="mt-6">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">
                Assignment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.assignmentHistory && teacher.assignmentHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="dark:text-slate-300">Subject</TableHead>
                      <TableHead className="dark:text-slate-300">Class/Stream</TableHead>
                      <TableHead className="dark:text-slate-300">Period</TableHead>
                      <TableHead className="dark:text-slate-300">Reassigned To</TableHead>
                      <TableHead className="dark:text-slate-300">Date</TableHead>
                      <TableHead className="dark:text-slate-300">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacher.assignmentHistory.map((history: any) => (
                      <TableRow key={history.id} className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-white">
                          {history.streamSubjectTeacher.subject.name}
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {history.streamSubjectTeacher.stream.classYear.classTemplate.name} -{" "}
                          {history.streamSubjectTeacher.stream.name}
                        </TableCell>
                        <TableCell className="dark:text-white">
                          <div className="text-sm">
                            <div>
                              {new Date(history.previousAssignmentStart).toLocaleDateString()}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">
                              to {new Date(history.previousAssignmentEnd).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {history.newTeacher.firstName} {history.newTeacher.lastName}
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {new Date(history.reassignedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="dark:text-white max-w-xs truncate">
                          {history.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No assignment history available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Year Enrollments */}
          {teacher.yearEnrollments && teacher.yearEnrollments.length > 0 && (
            <Card className="dark:bg-slate-800 dark:border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  Year Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="dark:text-slate-300">Academic Year</TableHead>
                      <TableHead className="dark:text-slate-300">Status</TableHead>
                      <TableHead className="dark:text-slate-300">Start Date</TableHead>
                      <TableHead className="dark:text-slate-300">End Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacher.yearEnrollments.map((enrollment: any) => (
                      <TableRow key={enrollment.id} className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-white">
                          {enrollment.academicYear.year}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              enrollment.status === "ACTIVE"
                                ? "bg-green-600"
                                : enrollment.status === "COMPLETED"
                                ? "bg-blue-600"
                                : "bg-gray-600"
                            }
                          >
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {new Date(enrollment.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {enrollment.endDate
                            ? new Date(enrollment.endDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Emergency Contact */}
        <TabsContent value="emergency" className="mt-6">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">
                Emergency Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.emergencyContactName ||
              teacher.emergencyRelationship ||
              teacher.emergencyPhone ||
              teacher.emergencyEmail ? (
                <Table>
                  <TableBody>
                    {teacher.emergencyContactName && (
                      <TableRow className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-slate-300 w-1/3">
                          Contact Name
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {teacher.emergencyContactName}
                        </TableCell>
                      </TableRow>
                    )}
                    {teacher.emergencyRelationship && (
                      <TableRow className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-slate-300">
                          Relationship
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {teacher.emergencyRelationship}
                        </TableCell>
                      </TableRow>
                    )}
                    {teacher.emergencyPhone && (
                      <TableRow className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-slate-300">
                          Phone Number
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {teacher.emergencyPhone}
                        </TableCell>
                      </TableRow>
                    )}
                    {teacher.emergencyEmail && (
                      <TableRow className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-slate-300">
                          Email Address
                        </TableCell>
                        <TableCell className="dark:text-white">
                          {teacher.emergencyEmail}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No emergency contact information available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-6">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">
                Documents & Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300 w-1/3">
                      Profile Photo
                    </TableCell>
                    <TableCell>
                      {teacher.profilePhoto ? (
                        <a
                          href={teacher.profilePhoto}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Photo
                        </a>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">
                          No photo uploaded
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Academic Documents
                    </TableCell>
                    <TableCell>
                      {teacher.documents ? (
                        <a
                          href={teacher.documents}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Documents
                        </a>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">
                          No documents uploaded
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Created At
                    </TableCell>
                    <TableCell className="dark:text-white">
                      {new Date(teacher.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                  <TableRow className="dark:border-slate-700">
                    <TableCell className="font-medium dark:text-slate-300">
                      Last Updated
                    </TableCell>
                    <TableCell className="dark:text-white">
                      {new Date(teacher.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <TeacherDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editingId={teacher.id}
        initialData={formatTeacherForEdit()}
        schoolId={teacher.schoolId}
      />
    </div>
  );
}
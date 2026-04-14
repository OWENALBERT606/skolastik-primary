/**
 * Parent Detail Client Component
 * Shows comprehensive parent information including students, contact details, and account status
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Key,
  Moon,
  Sun,
  AlertCircle,
  BookOpen,
  TrendingUp,
  Award,
  FileText,
  Eye,
} from "lucide-react";
import { DeleteParentDialog, EditParentDialog, ResetPasswordDialog } from "./parent-dialogue-components";
import { toast } from "sonner";


interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string;
  altNo: string | null;
  title: string | null;
  relationship: string | null;
  gender: string | null;
  dob: string | null;
  idNo: string | null;
  occupation: string | null;
  address: string | null;
  village: string | null;
  country: string | null;
  religion: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    status: boolean;
    isVerfied: boolean;
    createdAt: string;
    updatedAt: string;
  };
  students: Array<{
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    otherNames: string | null;
    dob: string;
    gender: string;
    imageUrl: string | null;
    isActive: boolean;
    enrollments: Array<{
      id: string;
      status: string;
      classYear: {
        id: string;
        classTemplate: {
          name: string;
          code: string | null;
          level: number | null;
        };
      };
      stream: {
        id: string;
        name: string;
      } | null;
      term: {
        name: string;
        termNumber: number;
        academicYear: {
          year: string;
        };
      };
      academicYear: {
        year: string;
        isActive: boolean;
      };
      subjectEnrollments: Array<{
        id: string;
        streamSubject: {
          subject: {
            name: string;
            code: string | null;
          };
        };
      }>;
      reportCard: {
        totalSubjects: number | null;
        totalMarks: number | null;
        averageMarks: number | null;
        classPosition: number | null;
        streamPosition: number | null;
        outOf: number | null;
        isPublished: boolean;
      } | null;
    }>;
    school: {
      name: string;
    };
  }>;
  school: {
    name: string;
    logo: string | null;
  };
}

interface ParentDetailClientProps {
  parent: Parent;
  schoolName: string;
  slug: string;
  userId: string;
}

type DialogType = "edit" | "delete" | "password" | null;

export default function ParentDetailClient({
  parent,
  schoolName,
  slug,
  userId,
}: ParentDetailClientProps) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = stored === "dark" || (!stored && prefersDark);
    setIsDark(useDark);
    document.documentElement.classList.toggle("dark", useDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  const closeDialog = () => {
    setActiveDialog(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (dobString: string | null) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(parent.dob);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              href={`/school/${slug}/users/parents`}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Parents
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Parent Header Card */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Photo */}
              <div className="relative">
                {parent.imageUrl ? (
                  <img
                    src={parent.imageUrl}
                    alt={parent.name}
                    className="w-32 h-32 rounded-2xl object-cover ring-4 ring-white/20"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-white/20 flex items-center justify-center ring-4 ring-white/20">
                    <User className="w-16 h-16 text-white/80" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute -bottom-2 -right-2">
                  {parent.user.status ? (
                    <div className="bg-green-500 p-2 rounded-full ring-4 ring-white dark:ring-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="bg-red-500 p-2 rounded-full ring-4 ring-white dark:ring-slate-800">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {parent.title && `${parent.title}. `}
                      {parent.firstName} {parent.lastName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-white/90">
                      {parent.relationship && (
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                          {parent.relationship}
                        </span>
                      )}
                      {parent.occupation && (
                        <span className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {parent.occupation}
                        </span>
                      )}
                      {parent.students.length > 0 && (
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {parent.students.length} {parent.students.length === 1 ? "Child" : "Children"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveDialog("edit")}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setActiveDialog("password")}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <Key className="w-4 h-4" />
                  Reset Password
                </button>
                <button
                  onClick={() => setActiveDialog("delete")}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <p className="text-slate-900 dark:text-white font-medium">
                      {parent.email || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Phone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <p className="text-slate-900 dark:text-white font-medium">{parent.phone}</p>
                  </div>
                </div>
                {parent.altNo && (
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Alternative Phone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-900 dark:text-white font-medium">{parent.altNo}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Personal Details
              </h2>
              <div className="space-y-4">
                {parent.gender && (
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Gender</label>
                    <p className="text-slate-900 dark:text-white font-medium mt-1">{parent.gender}</p>
                  </div>
                )}
                {parent.dob && (
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Date of Birth</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-900 dark:text-white font-medium">
                        {formatDate(parent.dob)}
                        {age && <span className="text-slate-500 dark:text-slate-400 ml-2">({age} years)</span>}
                      </p>
                    </div>
                  </div>
                )}
                {parent.idNo && (
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">National ID / Passport</label>
                    <p className="text-slate-900 dark:text-white font-medium mt-1">{parent.idNo}</p>
                  </div>
                )}
                {parent.religion && (
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Religion</label>
                    <p className="text-slate-900 dark:text-white font-medium mt-1">{parent.religion}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            {(parent.address || parent.village || parent.country) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Address
                </h2>
                <div className="space-y-3">
                  {parent.address && (
                    <p className="text-slate-900 dark:text-white">{parent.address}</p>
                  )}
                  {parent.village && (
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Village/Town</label>
                      <p className="text-slate-900 dark:text-white font-medium mt-1">{parent.village}</p>
                    </div>
                  )}
                  {parent.country && (
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Country</label>
                      <p className="text-slate-900 dark:text-white font-medium mt-1">{parent.country}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Account Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Status</span>
                  {parent.user.status ? (
                    <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                      <XCircle className="w-4 h-4" />
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Email Verified</span>
                  {parent.user.isVerfied ? (
                    <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      No
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Member Since</label>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">
                    {formatDate(parent.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Students Information */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Children ({parent.students.length})
              </h2>

              {parent.students.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No Students Assigned
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    This parent doesn't have any students assigned yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {parent.students.map((student) => {
                    const activeEnrollment = student.enrollments[0];
                    
                    return (
                      <div
                        key={student.id}
                        className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Student Photo */}
                          {student.imageUrl ? (
                            <img
                              src={student.imageUrl}
                              alt={`${student.firstName} ${student.lastName}`}
                              className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xl ring-2 ring-slate-200 dark:ring-slate-700">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </div>
                          )}

                          {/* Student Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <Link
                                  href={`/school/${slug}/users/students/${student.id}`}
                                  className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  {student.firstName} {student.lastName}
                                  {student.otherNames && ` ${student.otherNames}`}
                                </Link>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Admission No: {student.admissionNo}
                                </p>
                              </div>
                              {student.isActive ? (
                                <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full">
                                  Inactive
                                </span>
                              )}
                            </div>

                            {/* Current Enrollment */}
                            {activeEnrollment && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400">Class: </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                      {activeEnrollment.classYear.classTemplate.name}
                                      {activeEnrollment.stream && ` - ${activeEnrollment.stream.name}`}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400">Year: </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                      {activeEnrollment.academicYear.year} - Term {activeEnrollment.term.termNumber}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Subjects */}
                            {activeEnrollment && activeEnrollment.subjectEnrollments.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                  Enrolled Subjects ({activeEnrollment.subjectEnrollments.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {activeEnrollment.subjectEnrollments.slice(0, 6).map((enrollment) => (
                                    <span
                                      key={enrollment.id}
                                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg"
                                    >
                                      {enrollment.streamSubject.subject.name}
                                    </span>
                                  ))}
                                  {activeEnrollment.subjectEnrollments.length > 6 && (
                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg">
                                      +{activeEnrollment.subjectEnrollments.length - 6} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Report Card Preview */}
                            {activeEnrollment?.reportCard?.isPublished && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <h4 className="font-semibold text-slate-900 dark:text-white">
                                    Latest Report Card
                                  </h4>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Average</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                      {activeEnrollment.reportCard.averageMarks?.toFixed(1) || "N/A"}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Class Position</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                      {activeEnrollment.reportCard.classPosition || "N/A"}
                                      {activeEnrollment.reportCard.outOf && `/${activeEnrollment.reportCard.outOf}`}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Stream Position</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                      {activeEnrollment.reportCard.streamPosition || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Subjects</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                      {activeEnrollment.reportCard.totalSubjects || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <Link
                                  href={`/school/${slug}/users/students/${student.id}`}
                                  className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                  <FileText className="w-4 h-4" />
                                  View Full Report
                                </Link>
                              </div>
                            )}

                            {/* View Student Link */}
                            <Link
                              href={`/school/${slug}/users/students/${student.id}`}
                              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              View Student Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {activeDialog === "edit" && (
        <EditParentDialog
          parent={{
            ...parent,
            dob: parent.dob ? new Date(parent.dob) : null,
          } as any}
          onClose={closeDialog}
          onSuccess={() => {
            closeDialog();
            router.refresh();
            toast.success("Parent updated successfully");
          }}
        />
      )}

      {activeDialog === "delete" && (
        <DeleteParentDialog
          parent={{
            ...parent,
            dob: parent.dob ? new Date(parent.dob) : null,
          } as any}
          onClose={closeDialog}
          onSuccess={() => {
            closeDialog();
            router.push(`/school/${slug}/users/parents`);
            toast.success("Parent deleted successfully");
          }}
        />
      )}

      {activeDialog === "password" && (
        <ResetPasswordDialog
          parent={{
            ...parent,
            dob: parent.dob ? new Date(parent.dob) : null,
          } as any}
          onClose={closeDialog}
          onSuccess={()=>{
            closeDialog();
            toast.success("Password reset successfully");
          }}
        />
      )}
    </div>
  );
}
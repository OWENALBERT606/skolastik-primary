// app/school/[slug]/users/students/components/student-detail-client.tsx
"use client";

import { useState, useTransition } from "react";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, Edit, UserPlus,
  TrendingUp, Activity, BookOpen, DollarSign, Award, CreditCard,
  GraduationCap, Layers, BarChart3, FileText, Hash, Droplets,
  Church, AlertCircle, School, Globe, ChevronDown, ChevronRight,
  Users, Briefcase, Home, ShieldCheck, ArrowRight, Loader2, RefreshCw, Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { computeAndGenerateStudentReportCard } from "@/actions/result-computation";
import { toast } from "sonner";
import EnrollStudentDialog        from "./enroll-student-dialogue";
import PromoteStudentDialog       from "./promote-student-dialogue";
import TransferStreamDialog       from "./transfer-stream-dialogue";
import StudentReportCardModal     from "./student-report-card-modal";
import ProjectsTab                from "./projects-tab";
const UpdateSubjectsDialog = dynamic(() => import("./update-subjects-dialogue"), { ssr: false });

// ── Styling ───────────────────────────────────────────────────────────────
const cardCls      = "border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] shadow-sm";
const cardTitleCls = "text-sm font-semibold text-zinc-700 dark:text-slate-300";
const bodyTextCls  = "text-zinc-900 dark:text-slate-100";
const mutedTextCls = "text-zinc-500 dark:text-slate-400";
const labelCls     = "text-xs font-medium text-zinc-500 dark:text-slate-400 uppercase tracking-wide";

// ── Types ─────────────────────────────────────────────────────────────────
type Props = {
  student:              any;
  academicYears:        any[];
  classYearsForEnroll:  any[];
  classYearsForPromote: any[];
  parents:              any[];
  gradingScales:        any[];
  aoiGradingScales:     any[];
  feeAccounts:          any[];
  schoolId:             string;
  slug:                 string;
  userId:               string;
  school?:              { name: string | null; motto: string | null; logo: string | null; address: string | null; contact: string | null } | null;
  projectWorks?:        any[];
  isProjectEligible?:   boolean;
  canUploadProject?:    boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", mutedTextCls)} />
      <div>
        <p className={cn("text-xs", mutedTextCls)}>{label}</p>
        <p className={cn("text-sm font-medium", bodyTextCls)}>{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    PROMOTED:    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    COMPLETED:   "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    GRADUATED:   "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    TRANSFERRED: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    DROPPED:     "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    REPEATED:    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
    PAID:        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    PARTIAL:     "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    OVERDUE:     "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    ISSUED:      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    DRAFT:       "bg-zinc-100 dark:bg-slate-700/50 text-zinc-600 dark:text-slate-400",
    CANCELLED:   "bg-zinc-100 dark:bg-slate-700/50 text-zinc-600 dark:text-slate-400",
    VOID:        "bg-zinc-100 dark:bg-slate-700/50 text-zinc-600 dark:text-slate-400",
    CLEARED:     "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    OVERPAID:    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    SUSPENDED:   "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    APPROVED:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    SUBMITTED:   "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    REJECTED:    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };
  return (
    <Badge className={cn("border-0 text-xs", map[status] ?? "bg-zinc-100 text-zinc-600")}>
      {status}
    </Badge>
  );
}

function GradeBadge({ grade }: { grade: string | null | undefined }) {
  if (!grade) return null;
  const isGood = ["D1","D2","C3","C4","A","B"].includes(grade);
  const isOk   = ["C5","C6","P7","C","D"].includes(grade);
  const cls = isGood
    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
    : isOk
    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
  return <Badge className={cn("border-0 font-bold", cls)}>{grade}</Badge>;
}

function currency(n: number) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <Card className={cardCls}>
      <CardContent className="pt-4 pb-4 text-center">
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
        {sub && <p className={cn("text-xs", mutedTextCls)}>{sub}</p>}
        <p className={cn("text-xs mt-1", mutedTextCls)}>{label}</p>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function StudentDetailClient({
  student,
  academicYears,
  classYearsForEnroll,
  classYearsForPromote,
  parents,
  gradingScales,
  aoiGradingScales,
  feeAccounts,
  schoolId,
  slug,
  userId,
  school,
  projectWorks = [],
  isProjectEligible = false,
  canUploadProject = false,
}: Props) {
  const router = useRouter();
  const [enrollOpen,   setEnrollOpen]   = useState(false);
  const [promoteOpen,  setPromoteOpen]  = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [reportCardEnrollment,  setReportCardEnrollment]  = useState<any | null>(null);
  const [updateSubjectsEnrollment, setUpdateSubjectsEnrollment] = useState<any | null>(null);

  const enrollments: any[] = student.enrollments ?? [];
  const activeEnrollment   = enrollments.find((e: any) => e.status === "ACTIVE");
  const fullName           = `${student.firstName}${student.otherNames ? " " + student.otherNames : ""} ${student.lastName}`;

  // ── Overview tab ─────────────────────────────────────────────────────────
  function OverviewTab() {
    const age = student.dob
      ? Math.floor((Date.now() - new Date(student.dob).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile banner */}
        <Card className={cn(cardCls, "lg:col-span-3")}>
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {student.imageUrl ? (
                <img src={student.imageUrl} alt={fullName}
                  className="w-24 h-24 rounded-2xl object-cover ring-2 ring-zinc-200 dark:ring-slate-700 shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shrink-0">
                  {student.firstName?.[0]}{student.lastName?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className={cn("text-xl font-bold mb-1", bodyTextCls)}>{fullName}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={cn("text-sm", mutedTextCls)}>{student.admissionNo}</span>
                  {student.isActive
                    ? <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0 text-xs">Active</Badge>
                    : <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-0 text-xs">Inactive</Badge>
                  }
                  {activeEnrollment && (
                    <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0 text-xs">
                      {activeEnrollment.classYear?.classTemplate?.name} · {activeEnrollment.stream?.name}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div><p className={cn("text-xs", mutedTextCls)}>Gender</p><p className={cn("text-sm font-medium", bodyTextCls)}>{student.gender ?? "—"}</p></div>
                  <div><p className={cn("text-xs", mutedTextCls)}>Age</p><p className={cn("text-sm font-medium", bodyTextCls)}>{age != null ? `${age} yrs` : "—"}</p></div>
                  <div><p className={cn("text-xs", mutedTextCls)}>Admitted</p><p className={cn("text-sm font-medium", bodyTextCls)}>{student.admissionDate ? format(new Date(student.admissionDate), "dd MMM yyyy") : "—"}</p></div>
                  <div><p className={cn("text-xs", mutedTextCls)}>Terms Enrolled</p><p className={cn("text-sm font-medium", bodyTextCls)}>{enrollments.length}</p></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal details */}
        <Card className={cn(cardCls, "lg:col-span-2")}>
          <CardHeader className="pb-3"><CardTitle className={cardTitleCls}>Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Calendar}    label="Date of Birth"      value={student.dob ? format(new Date(student.dob), "dd MMM yyyy") : null} />
            <InfoRow icon={Hash}        label="Admission No."      value={student.admissionNo} />
            <InfoRow icon={Hash}        label="LIN Number"         value={student.linNumber} />
            <InfoRow icon={Hash}        label="NIN"                value={student.NIN} />
            <InfoRow icon={Globe}       label="Nationality"        value={student.nationality} />
            <InfoRow icon={MapPin}      label="Village"            value={student.village} />
            <InfoRow icon={Church}      label="Religion"           value={student.religion} />
            <InfoRow icon={Droplets}    label="Blood Group"        value={student.bloodGroup} />
            <InfoRow icon={School}      label="Previous School"    value={student.previousSchool} />
            <InfoRow icon={AlertCircle} label="Medical Conditions" value={student.medicalConditions} />
            <InfoRow icon={AlertCircle} label="Disability"         value={student.disability} />
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {activeEnrollment && (
            <Card className={cn(cardCls, "border-blue-200 dark:border-blue-800/40")}>
              <CardHeader className="pb-3">
                <CardTitle className={cn(cardTitleCls, "flex items-center gap-2")}>
                  <GraduationCap className="h-4 w-4 text-blue-500" /> Current Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Class",    value: activeEnrollment.classYear?.classTemplate?.name },
                  { label: "Stream",   value: activeEnrollment.stream?.name },
                  { label: "Term",     value: activeEnrollment.term?.name },
                  { label: "Year",     value: activeEnrollment.academicYear?.year },
                  { label: "Type",     value: activeEnrollment.enrollmentType },
                  { label: "Subjects", value: activeEnrollment.subjectEnrollments?.length ? `${activeEnrollment.subjectEnrollments.length} enrolled` : null },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-center justify-between">
                    <span className={cn("text-xs", mutedTextCls)}>{label}</span>
                    <span className={cn("text-xs font-medium", bodyTextCls)}>{value}</span>
                  </div>
                ) : null)}
                {activeEnrollment.stream?.classHead && (
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", mutedTextCls)}>Class Teacher</span>
                    <span className={cn("text-xs font-medium", bodyTextCls)}>
                      {activeEnrollment.stream.classHead.firstName} {activeEnrollment.stream.classHead.lastName}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {student.studentBursaries?.length > 0 && (
            <Card className={cardCls}>
              <CardHeader className="pb-3">
                <CardTitle className={cn(cardTitleCls, "flex items-center gap-2")}>
                  <Award className="h-4 w-4 text-amber-500" /> Bursaries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {student.studentBursaries.map((sb: any) => (
                  <div key={sb.id} className="flex items-center justify-between">
                    <span className={cn("text-sm", bodyTextCls)}>{sb.bursary.name}</span>
                    <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 text-xs">
                      {sb.bursary.percentage ? `${sb.bursary.percentage}%` : currency(sb.bursary.fixedAmount ?? 0)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Parent / Guardian */}
        {student.parent && (
          <Card className={cn(cardCls, "lg:col-span-3")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={cn(cardTitleCls, "flex items-center gap-2")}>
                  <Users className="h-4 w-4 text-indigo-500" /> Parent / Guardian
                </CardTitle>
                <Link href={`/school/${slug}/users/parents/${student.parent.id}`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  View Profile <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoRow icon={User}      label="Full Name"    value={student.parent.name ?? `${student.parent.firstName} ${student.parent.lastName}`} />
              <InfoRow icon={Phone}     label="Phone"        value={student.parent.phone} />
              <InfoRow icon={Mail}      label="Email"        value={student.parent.email} />
              <InfoRow icon={Briefcase} label="Occupation"   value={student.parent.occupation} />
              <InfoRow icon={Home}      label="Address"      value={student.parent.address} />
              <InfoRow icon={MapPin}    label="Village"      value={student.parent.village} />
              <InfoRow icon={Users}     label="Relationship" value={student.parent.relationship} />
              {student.parent.user && (
                <div className="flex items-start gap-3">
                  <ShieldCheck className={cn("h-4 w-4 mt-0.5 shrink-0", mutedTextCls)} />
                  <div>
                    <p className={cn("text-xs", mutedTextCls)}>Account Status</p>
                    <StatusBadge status={student.parent.user.status ? "ACTIVE" : "SUSPENDED"} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Enrollments tab ───────────────────────────────────────────────────────
  function EnrollmentsTab() {
    const [expandedId, setExpandedId] = useState<string | null>(activeEnrollment?.id ?? null);

    if (!enrollments.length) {
      return <p className={cn("text-sm py-8 text-center", mutedTextCls)}>No enrollment records found.</p>;
    }

    return (
      <div className="space-y-3">
        {enrollments.map((enr: any) => {
          const isExpanded = expandedId === enr.id;
          const isActive   = enr.status === "ACTIVE";
          return (
            <Card key={enr.id} className={cn(cardCls, isActive && "border-blue-200 dark:border-blue-800/40")}>
              <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : enr.id)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                        isActive ? "bg-blue-100 dark:bg-blue-900/30" : "bg-zinc-100 dark:bg-slate-800")}>
                        <GraduationCap className={cn("h-4 w-4", isActive ? "text-blue-600 dark:text-blue-400" : mutedTextCls)} />
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold", bodyTextCls)}>
                          {enr.classYear?.classTemplate?.name}{enr.stream?.name ? ` — ${enr.stream.name}` : ""}
                        </p>
                        <p className={cn("text-xs", mutedTextCls)}>
                          {enr.academicYear?.year} · {enr.term?.name} · {enr.enrollmentType ?? "CONTINUING"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={enr.status} />
                      {enr.reportCard?.isPublished && (
                        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0 text-xs">Report Card</Badge>
                      )}
                      {isExpanded ? <ChevronDown className={cn("h-4 w-4", mutedTextCls)} /> : <ChevronRight className={cn("h-4 w-4", mutedTextCls)} />}
                    </div>
                  </div>
                </CardContent>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-100 dark:border-slate-700/50 px-4 pb-4 pt-3 space-y-4">
                  {enr.stream && (
                    <Link
                      href={`/school/${slug}/academics/streams/${enr.stream.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      View {enr.stream.name} Stream
                    </Link>
                  )}
                  {enr.subjectEnrollments?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className={cn("text-xs font-semibold", labelCls)}>Subjects ({enr.subjectEnrollments.length})</p>
                        {enr.status === "ACTIVE" && enr.streamId && (
                          <button
                            onClick={e => { e.stopPropagation(); setUpdateSubjectsEnrollment(enr); }}
                            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <BookOpen className="h-3 w-3" /> Update Subjects
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {enr.subjectEnrollments.map((se: any) => {
                          const name = se.streamSubject?.subject?.name ?? "Subject";
                          const finalMark = se.subjectFinalMark;
                          const result    = se.subjectResult;
                          const teacher   = se.streamSubject?.teacherAssignments?.[0]?.teacher;
                          return (
                            <div key={se.id} className="flex items-center justify-between bg-zinc-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                              <div>
                                <p className={cn("text-xs font-medium", bodyTextCls)}>{name}</p>
                                {teacher && (
                                  <p className={cn("text-xs", mutedTextCls)}>{teacher.firstName} {teacher.lastName}</p>
                                )}
                                {se.streamSubject?.id && (
                                  <Link
                                    href={`/school/${slug}/academics/streams/${enr.stream?.id}/subjects/${se.streamSubject.id}`}
                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                  >
                                    <Users className="h-3 w-3" /> {teacher ? "Change" : "Assign"} Teacher
                                  </Link>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {finalMark?.totalPercentage != null && (
                                  <span className={cn("text-xs font-bold", bodyTextCls)}>{Math.round(finalMark.totalPercentage)}%</span>
                                )}
                                <GradeBadge grade={finalMark?.finalGrade ?? result?.finalGrade} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {(enr.promotedFrom || enr.promotedTo?.length > 0) && (
                    <div>
                      <p className={cn("text-xs font-semibold mb-2", labelCls)}>Progression</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {enr.promotedFrom && (
                          <span className={cn("px-2 py-1 rounded bg-zinc-100 dark:bg-slate-800", mutedTextCls)}>
                            From: {enr.promotedFrom.classYear?.classTemplate?.name} {enr.promotedFrom.stream?.name}
                          </span>
                        )}
                        {enr.promotedTo?.map((pt: any) => (
                          <span key={pt.id} className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                            → {pt.classYear?.classTemplate?.name} {pt.stream?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  }

  // ── Performance tab ───────────────────────────────────────────────────────
  function PerformanceTab() {
    const [selectedId, setSelectedId] = useState<string>(
      activeEnrollment?.id ?? enrollments[0]?.id ?? ""
    );
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [isPending, startTransition]    = useTransition();
    const enr = enrollments.find((e: any) => e.id === selectedId);

    const handleGenerateReportCard = (enrollmentId: string) => {
      setGeneratingId(enrollmentId);
      startTransition(async () => {
        const res = await computeAndGenerateStudentReportCard({ enrollmentId, slug });
        setGeneratingId(null);
        if (res.ok) {
          toast.success("Report card generated successfully.");
          router.refresh();
        } else {
          toast.error(res.message);
        }
      });
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {enrollments.map((e: any) => (
            <button key={e.id} onClick={() => setSelectedId(e.id)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                selectedId === e.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-zinc-200 dark:border-slate-700 text-zinc-600 dark:text-slate-400 hover:border-blue-400"
              )}>
              {e.academicYear?.year} · {e.term?.name} · {e.classYear?.classTemplate?.name}
              {e.status === "ACTIVE" && " ●"}
            </button>
          ))}
        </div>

        {!enr ? (
          <p className={cn("text-sm py-8 text-center", mutedTextCls)}>No enrollment selected.</p>
        ) : (
          <div className="space-y-4">
            {/* Report card summary */}
            {enr.reportCard ? (
              <Card className={cn(cardCls, "border-blue-200 dark:border-blue-800/50")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={cn(cardTitleCls, "flex items-center gap-2")}>
                      <FileText className="h-4 w-4 text-blue-500" /> Report Card
                      <span className={cn("text-xs font-normal", mutedTextCls)}>
                        {enr.academicYear?.year} · {enr.term?.name}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {enr.reportCard.isPublished
                        ? <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0 text-xs">Published</Badge>
                        : <Badge className="bg-zinc-100 dark:bg-slate-700/50 text-zinc-600 dark:text-slate-400 border-0 text-xs">Draft</Badge>
                      }
                      {enr.streamId && (
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs flex items-center gap-1"
                          disabled={isPending && generatingId === enr.id}
                          onClick={() => handleGenerateReportCard(enr.id)}>
                          {isPending && generatingId === enr.id
                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Regenerating…</>
                            : <><RefreshCw className="h-3.5 w-3.5" /> Regenerate</>
                          }
                        </Button>
                      )}
                      {enr.streamId && enr.termId && (
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs flex items-center gap-1"
                          onClick={() => setReportCardEnrollment(enr)}>
                          <FileText className="h-3.5 w-3.5" /> Preview
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {enr.reportCard.averageMarks != null && (
                      <StatCard label="Average" value={`${Math.round(enr.reportCard.averageMarks)}%`} color="text-blue-600 dark:text-blue-400" />
                    )}
                    {enr.reportCard.aggregatePoints != null && (
                      <StatCard label="Aggregate" value={enr.reportCard.aggregatePoints} color="text-emerald-600 dark:text-emerald-400" />
                    )}
                    {enr.reportCard.division && (
                      <StatCard label="Division" value={`Div ${enr.reportCard.division}`} color="text-amber-600 dark:text-amber-400" />
                    )}
                    {enr.reportCard.streamPosition != null && (
                      <StatCard label="Stream Position" value={`#${enr.reportCard.streamPosition}`}
                        color="text-rose-600 dark:text-rose-400"
                        sub={enr.reportCard.classPosition != null ? `Class #${enr.reportCard.classPosition}` : undefined} />
                    )}
                    {enr.reportCard.totalPoints != null && (
                      <StatCard label="Total Points" value={enr.reportCard.totalPoints} color="text-purple-600 dark:text-purple-400" />
                    )}
                    {enr.reportCard.principalPasses != null && (
                      <StatCard label="Principal Passes" value={enr.reportCard.principalPasses} color="text-indigo-600 dark:text-indigo-400" />
                    )}
                    {enr.reportCard.subsidiaryPasses != null && (
                      <StatCard label="Subsidiary Passes" value={enr.reportCard.subsidiaryPasses} color="text-cyan-600 dark:text-cyan-400" />
                    )}
                    {enr.reportCard.totalSubjects != null && (
                      <StatCard label="Subjects" value={enr.reportCard.totalSubjects} color={bodyTextCls} />
                    )}
                  </div>
                  {(enr.reportCard.classTeacherComment || enr.reportCard.headTeacherComment) && (
                    <div className="space-y-2 border-t border-zinc-100 dark:border-slate-700/50 pt-3">
                      {enr.reportCard.classTeacherComment && (
                        <div>
                          <p className={cn("text-xs font-medium mb-1", labelCls)}>Class Teacher Comment</p>
                          <p className={cn("text-sm italic", bodyTextCls)}>"{enr.reportCard.classTeacherComment}"</p>
                        </div>
                      )}
                      {enr.reportCard.headTeacherComment && (
                        <div>
                          <p className={cn("text-xs font-medium mb-1", labelCls)}>Head Teacher Comment</p>
                          <p className={cn("text-sm italic", bodyTextCls)}>"{enr.reportCard.headTeacherComment}"</p>
                        </div>
                      )}
                    </div>
                  )}
                  {enr.reportCard.generatedAt && (
                    <p className={cn("text-xs mt-3", mutedTextCls)}>
                      Generated: {format(new Date(enr.reportCard.generatedAt), "dd MMM yyyy HH:mm")}
                      {enr.reportCard.publishedAt && ` · Published: ${format(new Date(enr.reportCard.publishedAt), "dd MMM yyyy")}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className={cn(cardCls, "border-dashed border-zinc-300 dark:border-slate-600")}>
                <CardContent className="py-6 flex flex-col items-center gap-3 text-center">
                  <FileText className={cn("h-8 w-8 opacity-30", mutedTextCls)} />
                  <div>
                    <p className={cn("text-sm font-medium", bodyTextCls)}>No report card for this term</p>
                    <p className={cn("text-xs mt-0.5", mutedTextCls)}>
                      {enr.streamId
                        ? "Compute results and generate this student's report card."
                        : "Report cards are not applicable for enrollments without a stream."}
                    </p>
                  </div>
                  {enr.streamId && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isPending && generatingId === enr.id}
                      onClick={() => handleGenerateReportCard(enr.id)}
                    >
                      {isPending && generatingId === enr.id
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                        : <><Wand2 className="h-3.5 w-3.5" /> Generate Report Card</>
                      }
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Subject results */}
            {enr.subjectEnrollments?.length > 0 && (
              <Card className={cardCls}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn(cardTitleCls, "flex items-center gap-2")}>
                    <BookOpen className="h-4 w-4 text-indigo-500" /> Subject Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {enr.subjectEnrollments.map((se: any) => {
                    const name = se.streamSubject?.subject?.name ?? "Subject";
                    const result    = se.subjectResult;
                    const finalMark = se.subjectFinalMark;
                    const teacher   = se.streamSubject?.teacherAssignments?.[0]?.teacher;

                    return (
                      <div key={se.id} className="border border-zinc-100 dark:border-slate-700/50 rounded-lg p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                            <div>
                              <span className={cn("text-sm font-semibold", bodyTextCls)}>{name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {finalMark?.totalPercentage != null && (
                              <span className={cn("text-sm font-bold", bodyTextCls)}>{Math.round(finalMark.totalPercentage)}%</span>
                            )}
                            <GradeBadge grade={finalMark?.finalGrade ?? result?.finalGrade} />
                            {(finalMark?.gradeDescriptor ?? result?.gradeDescriptor) && (
                              <span className={cn("text-xs", mutedTextCls)}>{finalMark?.gradeDescriptor ?? result?.gradeDescriptor}</span>
                            )}
                          </div>
                        </div>

                        {teacher && (
                          <p className={cn("text-xs mb-1", mutedTextCls)}>
                            Teacher: {teacher.firstName} {teacher.lastName}
                          </p>
                        )}
                        {se.streamSubject?.id && (
                          <Link
                            href={`/school/${slug}/academics/streams/${enr.stream?.id}/subjects/${se.streamSubject.id}`}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <Users className="h-3 w-3" /> {teacher ? "Change Teacher" : "Assign Teacher"}
                          </Link>
                        )}

                        {/* Exam marks */}
                        {se.examMarks?.length > 0 && (
                          <div className="mt-2">
                            <p className={cn("text-xs font-medium mb-1", labelCls)}>Exam Marks</p>
                            <div className="flex flex-wrap gap-2">
                              {se.examMarks.map((em: any) => (
                                <div key={em.id} className="flex items-center gap-1.5 bg-zinc-50 dark:bg-slate-800/50 rounded px-2 py-1">
                                  <span className={cn("text-xs", mutedTextCls)}>{em.exam?.examType ?? em.exam?.name}:</span>
                                  <span className={cn("text-xs font-semibold", bodyTextCls)}>{em.marksObtained}/{em.outOf}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AOI scores */}
                        {se.aoiScores?.length > 0 && (
                          <div className="mt-2">
                            <p className={cn("text-xs font-medium mb-1", labelCls)}>AOI / Continuous Assessment</p>
                            <div className="flex flex-wrap gap-2">
                              {se.aoiScores.map((aoi: any) => (
                                <div key={aoi.id} className="flex items-center gap-1.5 bg-zinc-50 dark:bg-slate-800/50 rounded px-2 py-1">
                                  <span className={cn("text-xs", mutedTextCls)}>T{aoi.aoiTopic?.topicNumber}:</span>
                                  <span className={cn("text-xs font-semibold", bodyTextCls)}>{aoi.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Finance tab ───────────────────────────────────────────────────────────
  function FinanceTab() {
    const [selectedAccId, setSelectedAccId] = useState<string>(feeAccounts[0]?.id ?? "");
    const acc = feeAccounts.find((a: any) => a.id === selectedAccId);

    if (!feeAccounts.length) {
      return <p className={cn("text-sm py-8 text-center", mutedTextCls)}>No fee accounts found.</p>;
    }

    const balance        = acc?.balance ?? 0;
    const totalPaid      = acc?.transactions?.reduce((s: number, t: any) => s + (t.amount ?? 0), 0) ?? 0;
    const totalInvoiced  = acc?.invoices?.reduce((s: number, inv: any) =>
      s + (inv.items?.reduce((si: number, it: any) => si + (it.amount ?? 0), 0) ?? 0), 0) ?? 0;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {feeAccounts.map((a: any) => (
            <button key={a.id} onClick={() => setSelectedAccId(a.id)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                selectedAccId === a.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-zinc-200 dark:border-slate-700 text-zinc-600 dark:text-slate-400 hover:border-blue-400"
              )}>
              {a.academicYear?.year} · {a.term?.name}
            </button>
          ))}
        </div>

        {acc && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Balance",  value: currency(balance),       color: balance > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400" },
                { label: "Invoiced", value: currency(totalInvoiced), color: "text-blue-600 dark:text-blue-400" },
                { label: "Paid",     value: currency(totalPaid),     color: "text-emerald-600 dark:text-emerald-400" },
              ].map(item => (
                <Card key={item.label} className={cardCls}>
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className={cn("text-lg font-bold", item.color)}>{item.value}</p>
                    <p className={cn("text-xs mt-1", mutedTextCls)}>{item.label}</p>
                  </CardContent>
                </Card>
              ))}
              <Card className={cardCls}>
                <CardContent className="pt-4 pb-4 text-center">
                  <StatusBadge status={acc.status ?? "ACTIVE"} />
                  <p className={cn("text-xs mt-1", mutedTextCls)}>Status</p>
                </CardContent>
              </Card>
            </div>

            {acc.invoices?.length > 0 && (
              <Card className={cardCls}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn(cardTitleCls, "flex items-center gap-2")}>
                    <FileText className="h-4 w-4 text-blue-500" /> Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {acc.invoices.map((inv: any) => (
                    <div key={inv.id} className="border border-zinc-100 dark:border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className={cn("text-sm font-medium", bodyTextCls)}>{inv.invoiceNo ?? `Invoice #${inv.id.slice(-6)}`}</p>
                          <p className={cn("text-xs", mutedTextCls)}>{inv.createdAt ? format(new Date(inv.createdAt), "dd MMM yyyy") : ""}</p>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                      {inv.items?.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {inv.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className={mutedTextCls}>{item.feeCategory?.name ?? item.description}</span>
                              <span className={cn("font-medium", bodyTextCls)}>{currency(item.amount ?? 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {acc.transactions?.length > 0 && (
              <Card className={cardCls}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn(cardTitleCls, "flex items-center gap-2")}>
                    <CreditCard className="h-4 w-4 text-emerald-500" /> Payment Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {acc.transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-slate-700/40 last:border-0">
                      <div>
                        <p className={cn("text-sm font-medium", bodyTextCls)}>
                          {tx.receipt?.receiptNo ?? tx.paymentMethod ?? "Payment"}
                        </p>
                        <p className={cn("text-xs", mutedTextCls)}>
                          {tx.processedAt ? format(new Date(tx.processedAt), "dd MMM yyyy HH:mm") : ""}
                          {tx.paymentMethod ? ` · ${tx.paymentMethod}` : ""}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{currency(tx.amount ?? 0)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {acc.bursaryAllocations?.length > 0 && (
              <Card className={cardCls}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn(cardTitleCls, "flex items-center gap-2")}>
                    <Award className="h-4 w-4 text-amber-500" /> Bursary Allocations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {acc.bursaryAllocations.map((ba: any) => (
                    <div key={ba.id} className="flex items-center justify-between">
                      <span className={cn("text-sm", bodyTextCls)}>{ba.bursary?.name}</span>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{currency(ba.amount ?? 0)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/school/${slug}/users/students`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
            <div>
              <h1 className={cn("text-xl font-bold", bodyTextCls)}>{fullName}</h1>
              <p className={cn("text-sm", mutedTextCls)}>
                {student.admissionNo}
                {activeEnrollment ? ` · ${activeEnrollment.classYear?.classTemplate?.name} ${activeEnrollment.stream?.name ?? ""}` : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEnrollOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Enrol
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPromoteOpen(true)}>
            <TrendingUp className="h-4 w-4 mr-1.5" /> Promote
          </Button>
          {activeEnrollment && (
            <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)}>
              <Activity className="h-4 w-4 mr-1.5" /> Transfer
            </Button>
          )}
          <Link href={`/school/${slug}/users/students/${student.id}/edit`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Edit className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-zinc-100 dark:bg-slate-800/60">
          <TabsTrigger value="overview"    className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="enrollments" className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Enrollments</TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Performance</TabsTrigger>
          <TabsTrigger value="finance"     className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Finance</TabsTrigger>
          {isProjectEligible && (
            <TabsTrigger value="projects" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Projects
              {projectWorks.length > 0 && (
                <span className="ml-1 text-[10px] bg-violet-500 text-white rounded-full px-1.5 py-0.5 font-semibold leading-none">
                  {projectWorks.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="overview"    className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="enrollments" className="mt-4"><EnrollmentsTab /></TabsContent>
        <TabsContent value="performance" className="mt-4"><PerformanceTab /></TabsContent>
        <TabsContent value="finance"     className="mt-4"><FinanceTab /></TabsContent>
        {isProjectEligible && (
          <TabsContent value="projects" className="mt-4">
            <ProjectsTab
              studentId={student.id}
              schoolId={schoolId}
              userId={userId}
              slug={slug}
              initialWorks={projectWorks}
              canUpload={canUploadProject}
              activeClass={activeEnrollment?.classYear?.classTemplate?.name}
              activeStream={activeEnrollment?.stream?.name}
              activeYear={activeEnrollment?.academicYear?.year}
              activeTerm={activeEnrollment?.term?.name}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Report Card Modal */}
      {reportCardEnrollment && (
        <StudentReportCardModal
          enrollment={{
            id:           reportCardEnrollment.id,
            streamId:     reportCardEnrollment.streamId ?? reportCardEnrollment.stream?.id ?? null,
            termId:       reportCardEnrollment.termId   ?? reportCardEnrollment.term?.id,
            studentId:    student.id,
            academicYear: { year: reportCardEnrollment.academicYear?.year ?? "" },
            term:         { name: reportCardEnrollment.term?.name ?? "" },
          }}
          school={school ?? null}
          onClose={() => setReportCardEnrollment(null)}
        />
      )}

      {/* Update Subjects Dialog */}
      {updateSubjectsEnrollment && (
        <UpdateSubjectsDialog
          open={!!updateSubjectsEnrollment}
          onOpenChange={v => { if (!v) setUpdateSubjectsEnrollment(null); }}
          enrollmentId={updateSubjectsEnrollment.id}
          streamId={updateSubjectsEnrollment.streamId ?? updateSubjectsEnrollment.stream?.id ?? ""}
          termId={updateSubjectsEnrollment.termId ?? updateSubjectsEnrollment.term?.id ?? ""}
          schoolId={schoolId}
          studentName={fullName}
          currentSubjectEnrollments={updateSubjectsEnrollment.subjectEnrollments ?? []}
        />
      )}

      {/* Dialogs */}
      <EnrollStudentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        student={{ id: student.id, firstName: student.firstName, lastName: student.lastName, admissionNo: student.admissionNo }}
        academicYears={academicYears}
        classYears={classYearsForEnroll}
        schoolId={schoolId}
        userId={userId}
      />
      <PromoteStudentDialog
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        student={{ id: student.id, firstName: student.firstName, lastName: student.lastName, admissionNo: student.admissionNo }}
        currentEnrollment={activeEnrollment}
        academicYears={academicYears}
        classYears={classYearsForPromote}
        schoolId={schoolId}
        userId={userId}
      />
      {activeEnrollment && (
        <TransferStreamDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          enrollment={{
            id: activeEnrollment.id,
            classYearId: activeEnrollment.classYearId ?? activeEnrollment.classYear?.id,
            classYear: { classTemplate: { name: activeEnrollment.classYear?.classTemplate?.name ?? "" } },
            stream: activeEnrollment.stream ? { id: activeEnrollment.stream.id, name: activeEnrollment.stream.name } : null,
          }}
          student={{ id: student.id, firstName: student.firstName, lastName: student.lastName, admissionNo: student.admissionNo }}
          schoolId={schoolId}
        />
      )}
    </div>
  );
}

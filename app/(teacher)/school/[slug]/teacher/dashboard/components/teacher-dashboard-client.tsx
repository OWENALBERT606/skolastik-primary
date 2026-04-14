// app/(teacher)/school/[slug]/teacher/dashboard/components/teacher-dashboard-client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge }      from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen, Users, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, ChevronDown, GraduationCap, Layers, ShieldCheck,
  FileText, MessageSquare, Calendar, Bell, Mail, MapPin,
  X, Inbox, BookMarked, Hash, School, ClipboardList,
} from "lucide-react";
import NextTermEnrollDialog from "./next-term-enroll-dialog";
import { AoiTopicsDialog }  from "@/components/aoi-topics-dialog";
import { format, isPast, isToday, isTomorrow } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────

type Subject = {
  streamSubjectId: string; subjectName: string; subjectCode: string | null;
  subjectLevel: string; paperName: string | null; paperNumber: number | null;
  paperCode: string | null; className: string; streamId: string; streamName: string;
  schoolId: string; termId: string; termName: string; termNumber: number;
  isActiveTerm: boolean;
  academicYearId: string; academicYear: string; isActiveYear: boolean;
  assignmentStatus: string;
  totalStudents: number; marksDraft: number;
  marksSubmitted: number; marksApproved: number; hasAnyMarks: boolean;
  allApproved: boolean; pendingApproval: boolean;
};

type Summary = {
  totalSubjects: number; totalStudents: number; pendingApproval: number;
  fullyApproved: number; activeTermSubjects: number;
};

type Teacher = { id: string; firstName: string; lastName: string; staffNo: string; role: string };

type CommMessage = {
  id: string; subject: string; body: string; audience: string; priority: string;
  sentAt: string | null; createdAt: string; channels: string[];
  createdBy: { id: string; name: string | null } | null;
};

type CommEvent = {
  id: string; title: string; description: string | null; eventType: string;
  audience: string; startDate: string; endDate: string; allDay: boolean;
  location: string | null; colorTag: string | null; isPinned: boolean;
  coverImageUrl: string | null;
  createdBy: { id: string; name: string | null } | null;
  _count: { rsvps: number };
};

type InboxPost = {
  id: string; isRead: boolean; createdAt: string;
  message: {
    id: string; subject: string; body: string; priority: string;
    sentAt: string | null; audience: string;
    createdBy: { id: string; name: string | null } | null;
  };
};

type Communications = {
  messages: CommMessage[]; events: CommEvent[];
  inboxPosts: InboxPost[]; unreadCount: number;
};

type HeadedStream = {
  streamId: string;
  streamName: string;
  className: string;
  academicYear: string;
  isActiveYear: boolean;
  studentCount: number;
  pendingReviews: number;
};

type Props = {
  teacher: Teacher; subjects: Subject[]; summary: Summary;
  headedStreams: HeadedStream[];
  slug: string; communications: Communications; isDOS?: boolean;
  userId: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────

function subjectMarkStatus(sub: Subject) {
  if (sub.allApproved)     return "approved";
  if (sub.pendingApproval) return "submitted";
  if (sub.marksDraft > 0)  return "draft";
  return "empty";
}

function StatusBadge({ sub }: { sub: Subject }) {
  const st = subjectMarkStatus(sub);
  const map: Record<string, string> = {
    approved:  "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    submitted: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    draft:     "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
    empty:     "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/50 dark:text-slate-500",
  };
  const labels: Record<string, string> = {
    approved: "Approved", submitted: "Awaiting Approval", draft: "Draft", empty: "No Marks",
  };
  return <Badge variant="outline" className={`text-xs font-medium ${map[st]}`}>{labels[st]}</Badge>;
}

function priorityBadgeCls(p: string) {
  if (p === "URGENT") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (p === "HIGH")   return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
}

function audienceLabel(a: string) {
  const m: Record<string, string> = {
    ALL: "All Users", ALL_STAFF: "All Staff", TEACHERS: "Teaching Staff",
    PARENTS: "Parents", STUDENTS: "Students", SPECIFIC_USERS: "Specific",
  };
  return m[a] ?? a;
}

function eventDateLabel(start: string, end: string, allDay: boolean) {
  const d = new Date(start);
  if (isToday(d))    return allDay ? "Today" : `Today · ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return allDay ? "Tomorrow" : `Tomorrow · ${format(d, "h:mm a")}`;
  if (isPast(d))     return format(d, "dd MMM yyyy");
  return format(d, "EEE, dd MMM yyyy") + (allDay ? "" : ` · ${format(d, "h:mm a")}`);
}

function eventDotColor(type: string, colorTag: string | null) {
  if (colorTag) return colorTag;
  const m: Record<string, string> = {
    ACADEMIC: "#3b82f6", HOLIDAY: "#22c55e", EXAM: "#ef4444",
    MEETING: "#a855f7", SPORTS: "#f97316", CULTURAL: "#ec4899", OTHER: "#94a3b8",
  };
  return m[type] ?? "#94a3b8";
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Icon className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

// canManage = teacher is actively assigned AND it's the active term
function SubjectCard({
  sub, slug, userId, canManage,
}: {
  sub: Subject; slug: string; userId: string; canManage: boolean;
}) {
  const [aoiOpen, setAoiOpen] = useState(false);
  const href = `/school/${slug}/teacher/subjects/${sub.streamSubjectId}`;
  return (
    <div className={`rounded-xl border hover:shadow-md transition-all group ${
      canManage
        ? "bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
        : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
    }`}>
      {/* Main clickable area */}
      <Link href={href} className="block p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className={`font-semibold text-sm ${canManage ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}>
              {sub.subjectName}
              {sub.paperName && <span className="ml-1.5 font-normal opacity-60">— P{sub.paperNumber}</span>}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {sub.className} {sub.streamName} · {sub.termName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {canManage
              ? <StatusBadge sub={sub} />
              : <Badge variant="outline" className="text-xs text-slate-400 border-slate-200 dark:border-slate-700">Past</Badge>
            }
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /><strong className="text-slate-700 dark:text-slate-300">{sub.totalStudents}</strong> students</span>
          {sub.marksDraft > 0     && <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /><strong>{sub.marksDraft}</strong> draft</span>}
          {sub.marksSubmitted > 0 && <span className="flex items-center gap-1 text-blue-600"><Clock className="h-3.5 w-3.5" /><strong>{sub.marksSubmitted}</strong> submitted</span>}
          {sub.marksApproved > 0  && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /><strong>{sub.marksApproved}</strong> approved</span>}
          {!sub.hasAnyMarks       && <span className="flex items-center gap-1 text-amber-500"><AlertTriangle className="h-3.5 w-3.5" />No marks yet</span>}
        </div>
      </Link>

      {/* Bottom actions: AOI Topics + Enroll-to-next-term */}
      {canManage && (
        <div className="px-5 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={(e) => { e.preventDefault(); setAoiOpen(true); }}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-md transition-colors"
            >
              <Hash className="h-3.5 w-3.5" />
              AOI Topics
            </button>
            <NextTermEnrollDialog
              streamSubjectId={sub.streamSubjectId}
              subjectName={sub.subjectName}
              paperName={sub.paperName}
              termName={sub.termName}
              userId={userId}
            />
          </div>
        </div>
      )}

      <AoiTopicsDialog
        open={aoiOpen}
        onOpenChange={setAoiOpen}
        streamSubjectId={sub.streamSubjectId}
        subjectName={sub.subjectName}
        paperName={sub.paperName}
        paperNumber={sub.paperNumber}
      />
    </div>
  );
}

// ── Subjects Tab ──────────────────────────────────────────────────────────

function SubjectsTab({ subjects, slug, userId }: { subjects: Subject[]; slug: string; userId: string }) {
  // ── Collect unique academic years, newest first ──────────────────────────
  const years = Array.from(
    new Map(subjects.map(s => [s.academicYearId, { id: s.academicYearId, year: s.academicYear, isActive: s.isActiveYear }]))
      .values()
  ).sort((a, b) => b.year.localeCompare(a.year));

  // Default: active year, or newest
  const defaultYearId = years.find(y => y.isActive)?.id ?? years[0]?.id ?? "";
  const [selectedYearId, setSelectedYearId] = useState(defaultYearId);

  const yearSubjects = subjects.filter(s => s.academicYearId === selectedYearId);
  const selectedYear = years.find(y => y.id === selectedYearId);

  // Within the selected year: split by active term vs past terms
  const activeTermSubs = yearSubjects.filter(s => s.isActiveTerm && s.assignmentStatus === "ACTIVE");
  const otherTermSubs  = yearSubjects.filter(s => !(s.isActiveTerm && s.assignmentStatus === "ACTIVE"));

  // Group other terms by termName
  const otherByTerm = otherTermSubs.reduce<Record<string, Subject[]>>((acc, s) => {
    const key = s.termName;
    acc[key] = acc[key] ?? [];
    acc[key].push(s);
    return acc;
  }, {});

  const [showOtherTerms, setShowOtherTerms] = useState(false);
  const isViewingActiveYear = selectedYear?.isActive ?? false;

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <BookOpen className="h-7 w-7 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600 dark:text-slate-400">No subjects assigned yet</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          Contact your school admin to assign stream subjects to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Year selector ─────────────────────────────────────────────────── */}
      {years.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">Academic Year:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {years.map(y => (
              <button
                key={y.id}
                onClick={() => { setSelectedYearId(y.id); setShowOtherTerms(false); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedYearId === y.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {y.year}
                {y.isActive && <span className="ml-1 opacity-70">(Active)</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Past-year banner (read-only notice) ───────────────────────────── */}
      {!isViewingActiveYear && (
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
          Viewing <strong className="text-slate-700 dark:text-slate-300 mx-1">{selectedYear?.year}</strong>
          — read-only. Switch to the active year to manage marks and enrollments.
        </div>
      )}

      {/* ── Active-term subjects (manageable) ─────────────────────────────── */}
      {activeTermSubs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-blue-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">
              Active Term — {activeTermSubs[0].termName}
            </h2>
            <span className="text-xs text-slate-400">
              ({activeTermSubs.length} subject{activeTermSubs.length !== 1 ? "s" : ""})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeTermSubs.map(sub => (
              <SubjectCard key={sub.streamSubjectId} sub={sub} slug={slug} userId={userId} canManage={true} />
            ))}
          </div>
        </section>
      )}

      {/* No active-term subjects for this year */}
      {isViewingActiveYear && activeTermSubs.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
          No subjects assigned for the active term in {selectedYear?.year}.
        </div>
      )}

      {/* ── Other terms within selected year (view-only) ──────────────────── */}
      {otherTermSubs.length > 0 && (
        <section>
          <button
            onClick={() => setShowOtherTerms(v => !v)}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-3"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showOtherTerms ? "rotate-180" : ""}`} />
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">
              {isViewingActiveYear ? "Previous Terms" : "All Terms"} — {selectedYear?.year}
            </span>
            <span className="text-xs text-slate-400">
              ({otherTermSubs.length} subject{otherTermSubs.length !== 1 ? "s" : ""})
            </span>
          </button>

          {showOtherTerms && (
            <div className="space-y-5">
              {Object.entries(otherByTerm).map(([termName, subs]) => (
                <div key={termName}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    {termName}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-80">
                    {subs.map(sub => (
                      <SubjectCard
                        key={sub.streamSubjectId} sub={sub} slug={slug}
                        userId={userId} canManage={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* No subjects at all for the selected year */}
      {yearSubjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
          <BookOpen className="h-7 w-7 mb-2 opacity-40" />
          No subject assignments found for {selectedYear?.year}.
        </div>
      )}
    </div>
  );
}

// ── Communications Tab ────────────────────────────────────────────────────

function CommunicationsTab({ comms, slug }: { comms: Communications; slug: string }) {
  const [section, setSection] = useState<"messages" | "events">("messages");

  const tabs = [
    { key: "messages" as const, label: "Messages", icon: MessageSquare, count: comms.messages.length + comms.inboxPosts.length },
    { key: "events"   as const, label: "Events & Calendar", icon: Calendar, count: comms.events.length },
  ];

  // Merge inbox posts + broadcast messages into one list, sorted by date
  const allMessages = [
    ...comms.inboxPosts.map(p => ({
      id: p.id, subject: p.message.subject, body: p.message.body,
      priority: p.message.priority, isRead: p.isRead,
      date: p.message.sentAt ?? p.createdAt,
      from: p.message.createdBy?.name ?? "System",
      audience: p.message.audience, type: "inbox" as const,
    })),
    ...comms.messages.map(m => ({
      id: m.id, subject: m.subject, body: m.body,
      priority: m.priority, isRead: true,
      date: m.sentAt ?? m.createdAt,
      from: m.createdBy?.name ?? "Admin",
      audience: m.audience, type: "broadcast" as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setSection(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              section === t.key
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && (
              <span className="text-xs rounded-full px-1.5 py-0.5 font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {t.count}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center pr-4">
          <Link href={`/school/${slug}/teacher/inbox`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            View all →
          </Link>
        </div>
      </div>

      <ScrollArea className="h-[480px]">

        {/* Messages (inbox + broadcast merged) */}
        {section === "messages" && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {allMessages.length === 0
              ? <EmptyState icon={MessageSquare} text="No messages yet" />
              : allMessages.map(msg => (
                <div key={msg.id} className={`px-5 py-4 ${!msg.isRead ? "bg-blue-50/40 dark:bg-blue-950/10" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!msg.isRead ? "bg-red-500" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${!msg.isRead ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{msg.body}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400">From: {msg.from}</span>
                        <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-xs text-slate-400">{format(new Date(msg.date), "dd MMM yyyy")}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityBadgeCls(msg.priority)}`}>
                          {msg.priority}
                        </Badge>
                        {msg.type === "inbox" && !msg.isRead && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-semibold">Unread</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Events */}
        {section === "events" && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {comms.events.length === 0
              ? <EmptyState icon={Calendar} text="No events published yet" />
              : comms.events.map(ev => (
                <div key={ev.id} className={`px-5 py-4 ${ev.isPinned ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: eventDotColor(ev.eventType, ev.colorTag) }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {ev.isPinned && <span className="mr-1">📌</span>}
                        {ev.title}
                      </p>
                      {ev.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ev.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {eventDateLabel(ev.startDate, ev.endDate, ev.allDay)}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="h-3 w-3" />{ev.location}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200">
                          {ev.eventType}
                        </Badge>
                        {isPast(new Date(ev.endDate)) && (
                          <span className="text-[10px] text-slate-400">Past</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

      </ScrollArea>
    </div>
  );
}

// ── Classes Tab (headed streams) ──────────────────────────────────────────

function ClassesTab({ streams, slug }: { streams: HeadedStream[]; slug: string }) {
  if (streams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <School className="h-7 w-7 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600 dark:text-slate-400">No classes assigned</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          You have not been assigned as a class head for any stream.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        You are the class head for the following stream{streams.length !== 1 ? "s" : ""}.
        Use the class dashboard to review marks, enroll students, and manage activities.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {streams.map(s => (
          <div key={s.streamId}
            className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                      <School className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                        {s.className} — {s.streamName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{s.academicYear}</p>
                    </div>
                  </div>
                </div>
                {s.isActiveYear
                  ? <Badge variant="outline" className="text-xs shrink-0 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Active</Badge>
                  : <Badge variant="outline" className="text-xs shrink-0 text-slate-400 border-slate-200 dark:border-slate-700">Past</Badge>
                }
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <strong className="text-slate-700 dark:text-slate-300">{s.studentCount}</strong> students
                </span>
                {s.pendingReviews > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <ClipboardList className="h-3.5 w-3.5" />
                    <strong>{s.pendingReviews}</strong> pending review{s.pendingReviews !== 1 ? "s" : ""}
                  </span>
                )}
                {s.pendingReviews === 0 && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    No pending reviews
                  </span>
                )}
              </div>

              <Link
                href={`/school/${slug}/teacher/class-dashboard`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                <School className="h-4 w-4" />
                Open Class Dashboard
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function TeacherDashboardClient({ teacher, subjects, summary, headedStreams, slug, communications, isDOS, userId }: Props) {
  const [activeTab, setActiveTab] = useState<"subjects" | "communications" | "classes">("subjects");
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const unread = communications.unreadCount;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-4">

      {/* Unread message banner */}
      {unread > 0 && !dismissedBanner && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <Mail className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">
            You have <strong>{unread} unread message{unread !== 1 ? "s" : ""}</strong> in your inbox.
          </p>
          <Link href={`/school/${slug}/teacher/inbox`}
            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline shrink-0">
            View inbox →
          </Link>
          <button onClick={() => setDismissedBanner(true)}
            className="w-5 h-5 rounded flex items-center justify-center text-red-400 hover:text-red-600 transition-colors shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl px-6 py-5 text-white">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">Welcome, {teacher.firstName} {teacher.lastName}</h1>
            <p className="text-blue-100 text-sm mt-0.5">Staff No: {teacher.staffNo} · {teacher.role}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 bg-blue-500/40 rounded-xl px-4 py-2">
              <GraduationCap className="h-5 w-5 text-blue-100" />
              <span className="text-blue-100 text-sm font-medium">Teacher Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={BookOpen}    label="Assigned Subjects" value={summary.totalSubjects}   color="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" />
        <SummaryCard icon={Users}       label="Total Students"    value={summary.totalStudents}   color="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" />
        <SummaryCard icon={Clock}       label="Awaiting Approval" value={summary.pendingApproval} color="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" />
        <SummaryCard icon={ShieldCheck} label="Fully Approved"    value={summary.fullyApproved}   color="bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400" />
      </div>

      {/* My Classes banner — only when teacher also heads a class */}
      {headedStreams.length > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl px-4 py-3">
          <School className="h-4 w-4 text-indigo-500 shrink-0" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300 flex-1">
            You are also a <strong>class head</strong> for {headedStreams.length} stream{headedStreams.length !== 1 ? "s" : ""}.
            {headedStreams.reduce((t, s) => t + s.pendingReviews, 0) > 0 && (
              <span className="ml-1 text-amber-700 dark:text-amber-400 font-semibold">
                {headedStreams.reduce((t, s) => t + s.pendingReviews, 0)} mark{headedStreams.reduce((t, s) => t + s.pendingReviews, 0) !== 1 ? "s" : ""} awaiting your review.
              </span>
            )}
          </p>
          <button
            onClick={() => setActiveTab("classes")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            View My Classes →
          </button>
        </div>
      )}

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {[
          { key: "subjects"       as const, label: "My Subjects",    icon: BookOpen,      badge: undefined as number | undefined },
          ...(headedStreams.length > 0
            ? [{ key: "classes" as const, label: "My Classes", icon: School,
                badge: headedStreams.reduce((t, s) => t + s.pendingReviews, 0) || undefined }]
            : []),
          { key: "communications" as const, label: "Communications", icon: Bell,
            badge: unread > 0 ? unread : undefined },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.badge != null && (
              <span className={`text-white text-xs rounded-full px-1.5 py-0.5 font-semibold ${t.key === "classes" ? "bg-amber-500" : "bg-red-500"}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "subjects"        && <SubjectsTab subjects={subjects} slug={slug} userId={userId} />}
      {activeTab === "classes"         && <ClassesTab streams={headedStreams} slug={slug} />}
      {activeTab === "communications"  && <CommunicationsTab comms={communications} slug={slug} />}

    </div>
  );
}

// "use client";

// import { useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Calendar, MapPin, Globe, Users, GraduationCap, Baby,
//   BookOpen, Trophy, Music, Heart, Plus, X, Loader2,
//   Clock, Link, Edit3, Trash2, CheckCircle2, Ban,
//   ChevronLeft, ChevronRight, Radio, Search, Star, Plane,
// } from "lucide-react";
// import { createEvent, updateEvent, publishEvent, cancelEvent, deleteEvent } from "@/actions/communication-actions";
// import { toast } from "sonner";

// // ── Types (exported so page.tsx can cast) ─────────────────────────────
// export type EventStatus   = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED" | "POSTPONED";
// export type EventType     = "ACADEMIC" | "SPORTS" | "CULTURAL" | "PARENTS_MEETING" | "STAFF_MEETING" | "HOLIDAY" | "TRIP" | "FUNDRAISING" | "HEALTH" | "OTHER";
// export type EventAudience = "ALL" | "PARENTS" | "TEACHERS" | "ALL_STAFF" | "STUDENTS" | "PUBLIC";

// export interface SchoolEvent {
//   id: string;
//   title: string;
//   description?: string | null;
//   eventType: EventType;
//   status: EventStatus;
//   audience: EventAudience;
//   startDate: string;
//   endDate: string;
//   allDay: boolean;
//   location?: string | null;
//   onlineUrl?: string | null;
//   colorTag?: string | null;
//   isPinned: boolean;
//   isRecurring: boolean;
//   publishedAt?: string | null;
//   createdAt: string;
//   createdBy: { id: string; name: string };
//   _count: { rsvps: number; reminders?: number };
// }

// interface Props {
//   schoolId: string;
//   schoolSlug: string;
//   userId: string;
//   events: SchoolEvent[];
//   total: number;
//   page: number;
//   totalPages: number;
// }

// // ── Meta maps ──────────────────────────────────────────────────────────
// const EVENT_TYPE_META: Record<EventType, { label: string; icon: React.ReactNode; lightCls: string; darkCls: string; iconLight: string; iconDark: string }> = {
//   ACADEMIC:        { label: "Academic",    icon: <BookOpen size={13} />, lightCls: "bg-violet-100 border-violet-300",    darkCls: "bg-violet-500/15 border-violet-500/30",    iconLight: "text-violet-600",  iconDark: "text-violet-300" },
//   SPORTS:          { label: "Sports",      icon: <Trophy size={13} />,   lightCls: "bg-blue-100 border-blue-300",  darkCls: "bg-blue-500/15 border-blue-500/30",  iconLight: "text-blue-600", iconDark: "text-blue-300" },
//   CULTURAL:        { label: "Cultural",    icon: <Music size={13} />,    lightCls: "bg-pink-100 border-pink-300",        darkCls: "bg-pink-500/15 border-pink-500/30",        iconLight: "text-pink-600",    iconDark: "text-pink-300" },
//   PARENTS_MEETING: { label: "Parents Mtg", icon: <Baby size={13} />,     lightCls: "bg-blue-100 border-blue-300",        darkCls: "bg-blue-500/15 border-blue-500/30",        iconLight: "text-blue-600",    iconDark: "text-blue-300" },
//   STAFF_MEETING:   { label: "Staff Mtg",   icon: <Users size={13} />,    lightCls: "bg-amber-100 border-amber-300",      darkCls: "bg-amber-500/15 border-amber-500/30",      iconLight: "text-amber-600",   iconDark: "text-amber-300" },
//   HOLIDAY:         { label: "Holiday",     icon: <Star size={13} />,     lightCls: "bg-yellow-100 border-yellow-300",    darkCls: "bg-yellow-500/15 border-yellow-500/30",    iconLight: "text-yellow-600",  iconDark: "text-yellow-300" },
//   TRIP:            { label: "Trip",        icon: <Plane size={13} />,    lightCls: "bg-cyan-100 border-cyan-300",        darkCls: "bg-cyan-500/15 border-cyan-500/30",        iconLight: "text-cyan-600",    iconDark: "text-cyan-300" },
//   FUNDRAISING:     { label: "Fundraising", icon: <Heart size={13} />,    lightCls: "bg-rose-100 border-rose-300",        darkCls: "bg-rose-500/15 border-rose-500/30",        iconLight: "text-rose-600",    iconDark: "text-rose-300" },
//   HEALTH:          { label: "Health",      icon: <Heart size={13} />,    lightCls: "bg-red-100 border-red-300",          darkCls: "bg-red-500/15 border-red-500/30",          iconLight: "text-red-600",     iconDark: "text-red-300" },
//   OTHER:           { label: "Other",       icon: <Calendar size={13} />, lightCls: "bg-zinc-100 border-zinc-300",        darkCls: "bg-zinc-500/15 border-zinc-500/30",        iconLight: "text-zinc-600",    iconDark: "text-zinc-400" },
// };

// const STATUS_META: Record<EventStatus, { label: string; dot: string; lightText: string; darkText: string }> = {
//   DRAFT:     { label: "Draft",     dot: "bg-zinc-400 dark:bg-zinc-500",   lightText: "text-zinc-500",    darkText: "text-zinc-400" },
//   PUBLISHED: { label: "Published", dot: "bg-blue-400",                 lightText: "text-blue-600", darkText: "text-blue-400" },
//   CANCELLED: { label: "Cancelled", dot: "bg-red-500",                     lightText: "text-red-600",     darkText: "text-red-400" },
//   COMPLETED: { label: "Completed", dot: "bg-blue-500",                    lightText: "text-blue-600",    darkText: "text-blue-400" },
//   POSTPONED: { label: "Postponed", dot: "bg-amber-500",                   lightText: "text-amber-600",   darkText: "text-amber-400" },
// };

// const AUDIENCE_META: Record<EventAudience, { label: string; icon: React.ReactNode }> = {
//   ALL:       { label: "Everyone",  icon: <Globe size={12} /> },
//   PARENTS:   { label: "Parents",   icon: <Baby size={12} /> },
//   TEACHERS:  { label: "Teachers",  icon: <GraduationCap size={12} /> },
//   ALL_STAFF: { label: "All Staff", icon: <Users size={12} /> },
//   STUDENTS:  { label: "Students",  icon: <BookOpen size={12} /> },
//   PUBLIC:    { label: "Public",    icon: <Radio size={12} /> },
// };

// function fmt(d: string) {
//   return new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });
// }
// function fmtTime(d: string) {
//   return new Date(d).toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
// }

// // ── Shared style strings ───────────────────────────────────────────────
// const inputCls = [
//   "w-full rounded-lg px-3 py-2.5 text-sm",
//   "bg-white dark:bg-slate-800/60",
//   "border border-zinc-200 dark:border-slate-700/60",
//   "text-zinc-900 dark:text-white",
//   "placeholder-zinc-400 dark:placeholder-zinc-600",
//   "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
// ].join(" ");

// const selectCls = [
//   "w-full rounded-lg px-3 py-2 text-sm",
//   "bg-white dark:bg-slate-800/60",
//   "border border-zinc-200 dark:border-slate-700/60",
//   "text-zinc-900 dark:text-white",
//   "focus:outline-none focus:border-blue-500",
// ].join(" ");

// // ── Toggle ─────────────────────────────────────────────────────────────
// function Toggle({ on, onToggle, label, activeColor = "bg-blue-600" }: {
//   on: boolean; onToggle: () => void; label: string; activeColor?: string;
// }) {
//   return (
//     <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onToggle}>
//       <div className={`w-9 h-5 rounded-full relative transition-colors ${on ? activeColor : "bg-zinc-200 dark:bg-white/10"}`}>
//         <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
//       </div>
//       <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
//     </div>
//   );
// }

// // ── Create / Edit Dialog ───────────────────────────────────────────────
// function EventDialog({ schoolId, userId, event, onClose, onSuccess }: {
//   schoolId: string; userId: string; event?: SchoolEvent | null;
//   onClose: () => void; onSuccess: () => void;
// }) {
//   const isEdit = !!event;
//   const [isPending, startTransition] = useTransition();
//   const [title, setTitle]           = useState(event?.title ?? "");
//   const [description, setDescription] = useState(event?.description ?? "");
//   const [eventType, setEventType]   = useState<EventType>(event?.eventType ?? "ACADEMIC");
//   const [audience, setAudience]     = useState<EventAudience>(event?.audience ?? "ALL");
//   const [startDate, setStartDate]   = useState(event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "");
//   const [endDate, setEndDate]       = useState(event?.endDate   ? new Date(event.endDate).toISOString().slice(0, 16)   : "");
//   const [allDay, setAllDay]         = useState(event?.allDay ?? false);
//   const [location, setLocation]     = useState(event?.location ?? "");
//   const [onlineUrl, setOnlineUrl]   = useState(event?.onlineUrl ?? "");
//   const [isPinned, setIsPinned]     = useState(event?.isPinned ?? false);
//   const [publishNow, setPublishNow] = useState(false);

//   const handleSubmit = () => {
//     startTransition(async () => {
//       const payload = {
//         title, description, eventType, audience,
//         startDate: new Date(startDate),
//         endDate: new Date(endDate),
//         allDay, location, onlineUrl, isPinned,
//       };
//       const result = isEdit
//         ? await updateEvent(event!.id, { ...payload, status: publishNow ? "PUBLISHED" : undefined })
//         : await createEvent({ schoolId, createdById: userId, ...payload, publishNow });

//       if (result.ok) { toast.success(result.message); onSuccess(); onClose(); }
//       else toast.error(result.message);
//     });
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
//       <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-slate-700/40 bg-blue-50 dark:bg-gradient-to-r dark:from-blue-900/20 dark:to-transparent">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
//               <Calendar size={15} className="text-blue-600 dark:text-blue-300" />
//             </div>
//             <div>
//               <h2 className="text-zinc-900 dark:text-white font-semibold text-sm">{isEdit ? "Edit Event" : "New Event"}</h2>
//               <p className="text-zinc-500 text-xs">{isEdit ? "Update event details" : "Create a school event"}</p>
//             </div>
//           </div>
//           <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
//             <X size={15} />
//           </button>
//         </div>

//         <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
//           {/* Title */}
//           <div>
//             <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Event Title</label>
//             <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. End of Term Sports Day" className={inputCls} />
//           </div>

//           {/* Type + Audience */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Event Type</label>
//               <select value={eventType} onChange={e => setEventType(e.target.value as EventType)} className={selectCls}>
//                 {Object.entries(EVENT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
//               </select>
//             </div>
//             <div>
//               <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Visible To</label>
//               <select value={audience} onChange={e => setAudience(e.target.value as EventAudience)} className={selectCls}>
//                 {Object.entries(AUDIENCE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
//               </select>
//             </div>
//           </div>

//           {/* Dates */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Start</label>
//               <input type={allDay ? "date" : "datetime-local"} value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
//             </div>
//             <div>
//               <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">End</label>
//               <input type={allDay ? "date" : "datetime-local"} value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
//             </div>
//           </div>

//           <Toggle on={allDay} onToggle={() => setAllDay(v => !v)} label="All-day event" activeColor="bg-violet-600" />

//           {/* Location + URL */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Location</label>
//               <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Main Hall, Field…" className={inputCls} />
//             </div>
//             <div>
//               <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Online Link</label>
//               <input value={onlineUrl} onChange={e => setOnlineUrl(e.target.value)} placeholder="https://meet.google.com/…" className={inputCls} />
//             </div>
//           </div>

//           {/* Description */}
//           <div>
//             <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Description</label>
//             <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
//               placeholder="Event details…" className={`${inputCls} resize-none`} />
//           </div>

//           {/* Pin + Publish toggles */}
//           <div className="flex gap-6 flex-wrap">
//             <Toggle on={isPinned}    onToggle={() => setIsPinned(v => !v)}    label="Pin to top"          activeColor="bg-amber-500" />
//             <Toggle on={publishNow}  onToggle={() => setPublishNow(v => !v)}  label="Publish immediately" activeColor="bg-blue-600" />
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-slate-700/40 bg-zinc-50 dark:bg-black/20">
//           <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-slate-700/60 hover:border-zinc-300 dark:hover:border-white/20 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all">
//             Cancel
//           </button>
//           <button onClick={handleSubmit} disabled={isPending || !title.trim() || !startDate || !endDate}
//             className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-40">
//             {isPending ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
//             {isEdit ? "Update Event" : publishNow ? "Publish Event" : "Save Draft"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Event Detail Dialog ────────────────────────────────────────────────
// function EventDetailDialog({ event, onClose, onEdit, onRefresh }: {
//   event: SchoolEvent; onClose: () => void; onEdit: () => void; onRefresh: () => void;
// }) {
//   const [isPending, startTransition] = useTransition();
//   const tm = EVENT_TYPE_META[event.eventType];
//   const sm = STATUS_META[event.status];
//   const am = AUDIENCE_META[event.audience];

//   const handlePublish = () => startTransition(async () => {
//     const res = await publishEvent(event.id);
//     if (res.ok) { toast.success(res.message); onRefresh(); onClose(); } else toast.error(res.message);
//   });
//   const handleCancel = () => startTransition(async () => {
//     const res = await cancelEvent(event.id);
//     if (res.ok) { toast.success(res.message); onRefresh(); onClose(); } else toast.error(res.message);
//   });
//   const handleDelete = () => startTransition(async () => {
//     const res = await deleteEvent(event.id);
//     if (res.ok) { toast.success(res.message); onRefresh(); onClose(); } else toast.error(res.message);
//   });

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
//       <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

//         {/* Accent bar */}
//         <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-transparent" />

//         <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-slate-700/40">
//           <div className="flex-1 pr-4">
//             <div className="flex items-center gap-2 mb-2 flex-wrap">
//               {/* Type badge */}
//               <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${tm.lightCls} ${tm.iconLight} dark:${tm.darkCls} dark:${tm.iconDark}`}>
//                 {tm.icon} {tm.label}
//               </span>
//               {/* Status */}
//               <span className={`flex items-center gap-1 text-xs ${sm.lightText} dark:${sm.darkText}`}>
//                 <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} /> {sm.label}
//               </span>
//               {event.isPinned && (
//                 <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded">📌 Pinned</span>
//               )}
//             </div>
//             <h2 className="text-zinc-900 dark:text-white font-semibold text-base">{event.title}</h2>
//           </div>
//           <div className="flex items-center gap-1">
//             <button onClick={onEdit} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
//               <Edit3 size={14} />
//             </button>
//             <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
//               <X size={15} />
//             </button>
//           </div>
//         </div>

//         <div className="p-6 space-y-4">
//           {/* Date/time */}
//           <div className="flex items-start gap-3 text-sm">
//             <Clock size={15} className="text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0" />
//             <div>
//               <div className="text-zinc-900 dark:text-white">{fmt(event.startDate)} {!event.allDay && `at ${fmtTime(event.startDate)}`}</div>
//               {event.endDate !== event.startDate && (
//                 <div className="text-zinc-500 text-xs mt-0.5">→ {fmt(event.endDate)} {!event.allDay && fmtTime(event.endDate)}</div>
//               )}
//             </div>
//           </div>

//           {event.location && (
//             <div className="flex items-center gap-3 text-sm">
//               <MapPin size={15} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
//               <span className="text-zinc-700 dark:text-zinc-200">{event.location}</span>
//             </div>
//           )}

//           {event.onlineUrl && (
//             <div className="flex items-center gap-3 text-sm">
//               <Link size={15} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
//               <a href={event.onlineUrl} target="_blank"
//                 className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 truncate">
//                 {event.onlineUrl}
//               </a>
//             </div>
//           )}

//           <div className="flex items-center gap-3 text-sm">
//             <span className="text-zinc-400 dark:text-zinc-500">{am.icon}</span>
//             <span className="text-zinc-600 dark:text-zinc-300">
//               Visible to: <span className="text-zinc-900 dark:text-white font-medium">{am.label}</span>
//             </span>
//           </div>

//           {event.description && (
//             <div className="bg-zinc-50 dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700/40 rounded-xl p-4">
//               <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">{event.description}</p>
//             </div>
//           )}

//           <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600 pt-1">
//             <span>Created by {event.createdBy.name}</span>
//             <span>{event._count.rsvps} RSVP{event._count.rsvps !== 1 ? "s" : ""}</span>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-slate-700/40 bg-zinc-50 dark:bg-black/20">
//           <div className="flex gap-2">
//             {event.status !== "CANCELLED" && event.status !== "COMPLETED" && (
//               <button onClick={handleCancel} disabled={isPending}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-lg transition-all">
//                 <Ban size={12} /> Cancel
//               </button>
//             )}
//             {event.status === "DRAFT" && (
//               <button onClick={handleDelete} disabled={isPending}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-slate-700/40 hover:border-zinc-300 dark:hover:border-white/15 rounded-lg transition-all">
//                 <Trash2 size={12} /> Delete
//               </button>
//             )}
//           </div>
//           {event.status === "DRAFT" && (
//             <button onClick={handlePublish} disabled={isPending}
//               className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-all">
//               {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
//               Publish
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Main ───────────────────────────────────────────────────────────────
// export default function EventsClient({ schoolId, userId, events, total, page, totalPages }: Props) {
//   const router = useRouter();
//   const [showCreate, setShowCreate] = useState(false);
//   const [viewEvent, setViewEvent]   = useState<SchoolEvent | null>(null);
//   const [editEvent, setEditEvent]   = useState<SchoolEvent | null>(null);
//   const [search, setSearch]         = useState("");

//   const filtered = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

//   return (
//     <div className="min-h-screen bg-zinc-50 dark:bg-[#0d1117] text-zinc-900 dark:text-white">

//       {/* Header */}
//       <div className="border-b border-zinc-200 dark:border-slate-700/40 bg-white/80 dark:bg-[#0d1117]/90 backdrop-blur-sm sticky top-0 z-20">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//           <div>
//             <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Events</h1>
//             <p className="text-zinc-500 text-xs mt-0.5">{total} event{total !== 1 ? "s" : ""} total</p>
//           </div>
//           <button onClick={() => setShowCreate(true)}
//             className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 dark:shadow-blue-900/40">
//             <Plus size={15} /> New Event
//           </button>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

//         {/* Filters */}
//         <div className="flex items-center gap-3 flex-wrap">
//           <div className="relative flex-1 min-w-[180px] max-w-xs">
//             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
//             <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…"
//               className="w-full bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
//           </div>
//           <select onChange={e => router.push(`?status=${e.target.value}`)}
//             className="bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500">
//             <option value="">All Statuses</option>
//             <option value="DRAFT">Draft</option>
//             <option value="PUBLISHED">Published</option>
//             <option value="CANCELLED">Cancelled</option>
//             <option value="COMPLETED">Completed</option>
//           </select>
//           <select onChange={e => router.push(`?type=${e.target.value}`)}
//             className="bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500">
//             <option value="">All Types</option>
//             {Object.entries(EVENT_TYPE_META).map(([k, v]) => (
//               <option key={k} value={k}>{v.label}</option>
//             ))}
//           </select>
//         </div>

//         {/* Grid */}
//         {filtered.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-20">
//             <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center mb-4">
//               <Calendar size={22} className="text-zinc-400 dark:text-zinc-600" />
//             </div>
//             <p className="text-zinc-500 dark:text-zinc-400 font-medium">No events found</p>
//             <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">Create the first school event</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {filtered.map(ev => {
//               const tm   = EVENT_TYPE_META[ev.eventType];
//               const sm   = STATUS_META[ev.status];
//               const am   = AUDIENCE_META[ev.audience];
//               const isPast = new Date(ev.endDate) < new Date();

//               return (
//                 <div key={ev.id} onClick={() => setViewEvent(ev)}
//                   className="group relative bg-white dark:bg-slate-800/50 hover:bg-zinc-50 dark:hover:bg-slate-700/40 border border-zinc-200 dark:border-slate-700/40 hover:border-zinc-300 dark:hover:border-white/15 rounded-2xl p-5 cursor-pointer transition-all overflow-hidden shadow-sm dark:shadow-none">

//                   {ev.isPinned && (
//                     <div className="absolute top-3 right-3 text-amber-500 dark:text-amber-400 text-xs">📌</div>
//                   )}

//                   <div className="flex items-start gap-3 mb-3">
//                     <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${tm.lightCls} dark:${tm.darkCls}`}>
//                       <span className={`${tm.iconLight} dark:${tm.iconDark}`}>{tm.icon}</span>
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{ev.title}</h3>
//                       <div className={`flex items-center gap-1 text-xs mt-0.5 ${sm.lightText} dark:${sm.darkText}`}>
//                         <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
//                         {sm.label}
//                       </div>
//                     </div>
//                   </div>

//                   <div className="space-y-1.5 mb-3">
//                     <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
//                       <Clock size={11} className="shrink-0" />
//                       <span>{fmt(ev.startDate)}</span>
//                       {!ev.allDay && <span className="text-zinc-400 dark:text-zinc-600">· {fmtTime(ev.startDate)}</span>}
//                     </div>
//                     {ev.location && (
//                       <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
//                         <MapPin size={11} className="shrink-0" /> {ev.location}
//                       </div>
//                     )}
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <span className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
//                       {am.icon} {am.label}
//                     </span>
//                     <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
//                       {ev._count.rsvps} RSVP{ev._count.rsvps !== 1 ? "s" : ""}
//                     </span>
//                   </div>

//                   {isPast && ev.status === "PUBLISHED" && (
//                     <div className="absolute inset-0 bg-white/40 dark:bg-black/30 rounded-2xl pointer-events-none" />
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="flex items-center justify-center gap-2 pt-2">
//             <button disabled={page <= 1} onClick={() => router.push(`?page=${page - 1}`)}
//               className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-30 transition-all">
//               <ChevronLeft size={15} />
//             </button>
//             <span className="text-xs text-zinc-500 px-2">Page {page} of {totalPages}</span>
//             <button disabled={page >= totalPages} onClick={() => router.push(`?page=${page + 1}`)}
//               className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-30 transition-all">
//               <ChevronRight size={15} />
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Dialogs */}
//       {showCreate && (
//         <EventDialog schoolId={schoolId} userId={userId}
//           onClose={() => setShowCreate(false)} onSuccess={() => router.refresh()} />
//       )}
//       {viewEvent && !editEvent && (
//         <EventDetailDialog event={viewEvent} onClose={() => setViewEvent(null)}
//           onEdit={() => { setEditEvent(viewEvent); setViewEvent(null); }}
//           onRefresh={() => router.refresh()} />
//       )}
//       {editEvent && (
//         <EventDialog schoolId={schoolId} userId={userId} event={editEvent}
//           onClose={() => setEditEvent(null)} onSuccess={() => router.refresh()} />
//       )}
//     </div>
//   );
// }




"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Globe, Users, GraduationCap, Baby,
  BookOpen, Trophy, Music, Heart, Plus, X, Loader2,
  Clock, Link, Edit3, Trash2, CheckCircle2, Ban,
  ChevronLeft, ChevronRight, Radio, Search, Star, Plane,
  LayoutGrid, CalendarDays,
} from "lucide-react";
import { createEvent, updateEvent, publishEvent, cancelEvent, deleteEvent } from "@/actions/communication-actions";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────
export type EventStatus   = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED" | "POSTPONED";
export type EventType     = "ACADEMIC" | "SPORTS" | "CULTURAL" | "PARENTS_MEETING" | "STAFF_MEETING" | "HOLIDAY" | "TRIP" | "FUNDRAISING" | "HEALTH" | "OTHER";
export type EventAudience = "ALL" | "PARENTS" | "TEACHERS" | "ALL_STAFF" | "STUDENTS" | "PUBLIC";

export interface SchoolEvent {
  id: string;
  title: string;
  description?: string | null;
  eventType: EventType;
  status: EventStatus;
  audience: EventAudience;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string | null;
  onlineUrl?: string | null;
  colorTag?: string | null;
  isPinned: boolean;
  isRecurring: boolean;
  publishedAt?: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
  _count: { rsvps: number; reminders?: number };
}

interface Props {
  schoolId: string;
  schoolSlug: string;
  userId: string;
  events: SchoolEvent[];
  total: number;
  page: number;
  totalPages: number;
  readOnly?: boolean;
}

// ── Meta maps ──────────────────────────────────────────────────────────
const EVENT_TYPE_META: Record<EventType, {
  label: string; icon: React.ReactNode;
  lightCls: string; darkCls: string;
  iconLight: string; iconDark: string;
  chipLight: string; chipDark: string;
}> = {
  ACADEMIC:        { label: "Academic",    icon: <BookOpen size={13} />, lightCls: "bg-violet-100 border-violet-300",    darkCls: "bg-violet-500/15 border-violet-500/30",    iconLight: "text-violet-600",  iconDark: "text-violet-300",  chipLight: "bg-violet-500",   chipDark: "bg-violet-500" },
  SPORTS:          { label: "Sports",      icon: <Trophy size={13} />,   lightCls: "bg-blue-100 border-blue-300",  darkCls: "bg-blue-500/15 border-blue-500/30",  iconLight: "text-blue-600", iconDark: "text-blue-300", chipLight: "bg-blue-500",  chipDark: "bg-blue-500" },
  CULTURAL:        { label: "Cultural",    icon: <Music size={13} />,    lightCls: "bg-pink-100 border-pink-300",        darkCls: "bg-pink-500/15 border-pink-500/30",        iconLight: "text-pink-600",    iconDark: "text-pink-300",    chipLight: "bg-pink-500",     chipDark: "bg-pink-500" },
  PARENTS_MEETING: { label: "Parents Mtg", icon: <Baby size={13} />,     lightCls: "bg-blue-100 border-blue-300",        darkCls: "bg-blue-500/15 border-blue-500/30",        iconLight: "text-blue-600",    iconDark: "text-blue-300",    chipLight: "bg-blue-500",     chipDark: "bg-blue-500" },
  STAFF_MEETING:   { label: "Staff Mtg",   icon: <Users size={13} />,    lightCls: "bg-amber-100 border-amber-300",      darkCls: "bg-amber-500/15 border-amber-500/30",      iconLight: "text-amber-600",   iconDark: "text-amber-300",   chipLight: "bg-amber-500",    chipDark: "bg-amber-500" },
  HOLIDAY:         { label: "Holiday",     icon: <Star size={13} />,     lightCls: "bg-yellow-100 border-yellow-300",    darkCls: "bg-yellow-500/15 border-yellow-500/30",    iconLight: "text-yellow-600",  iconDark: "text-yellow-300",  chipLight: "bg-yellow-500",   chipDark: "bg-yellow-400" },
  TRIP:            { label: "Trip",        icon: <Plane size={13} />,    lightCls: "bg-cyan-100 border-cyan-300",        darkCls: "bg-cyan-500/15 border-cyan-500/30",        iconLight: "text-cyan-600",    iconDark: "text-cyan-300",    chipLight: "bg-cyan-500",     chipDark: "bg-cyan-500" },
  FUNDRAISING:     { label: "Fundraising", icon: <Heart size={13} />,    lightCls: "bg-rose-100 border-rose-300",        darkCls: "bg-rose-500/15 border-rose-500/30",        iconLight: "text-rose-600",    iconDark: "text-rose-300",    chipLight: "bg-rose-500",     chipDark: "bg-rose-500" },
  HEALTH:          { label: "Health",      icon: <Heart size={13} />,    lightCls: "bg-red-100 border-red-300",          darkCls: "bg-red-500/15 border-red-500/30",          iconLight: "text-red-600",     iconDark: "text-red-300",     chipLight: "bg-red-500",      chipDark: "bg-red-500" },
  OTHER:           { label: "Other",       icon: <Calendar size={13} />, lightCls: "bg-zinc-100 border-zinc-300",        darkCls: "bg-zinc-500/15 border-zinc-500/30",        iconLight: "text-zinc-600",    iconDark: "text-zinc-400",    chipLight: "bg-zinc-500",     chipDark: "bg-zinc-500" },
};

const STATUS_META: Record<EventStatus, { label: string; dot: string; lightText: string; darkText: string }> = {
  DRAFT:     { label: "Draft",     dot: "bg-zinc-400 dark:bg-zinc-500",  lightText: "text-zinc-500",    darkText: "text-zinc-400" },
  PUBLISHED: { label: "Published", dot: "bg-blue-400",                lightText: "text-blue-600", darkText: "text-blue-400" },
  CANCELLED: { label: "Cancelled", dot: "bg-red-500",                    lightText: "text-red-600",     darkText: "text-red-400" },
  COMPLETED: { label: "Completed", dot: "bg-blue-500",                   lightText: "text-blue-600",    darkText: "text-blue-400" },
  POSTPONED: { label: "Postponed", dot: "bg-amber-500",                  lightText: "text-amber-600",   darkText: "text-amber-400" },
};

const AUDIENCE_META: Record<EventAudience, { label: string; icon: React.ReactNode }> = {
  ALL:       { label: "Everyone",  icon: <Globe size={12} /> },
  PARENTS:   { label: "Parents",   icon: <Baby size={12} /> },
  TEACHERS:  { label: "Teachers",  icon: <GraduationCap size={12} /> },
  ALL_STAFF: { label: "All Staff", icon: <Users size={12} /> },
  STUDENTS:  { label: "Students",  icon: <BookOpen size={12} /> },
  PUBLIC:    { label: "Public",    icon: <Radio size={12} /> },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
}

// ── Shared styles ──────────────────────────────────────────────────────
const inputCls = [
  "w-full rounded-lg px-3 py-2.5 text-sm",
  "bg-white dark:bg-slate-800/60",
  "border border-zinc-200 dark:border-slate-700/60",
  "text-zinc-900 dark:text-white",
  "placeholder-zinc-400 dark:placeholder-zinc-600",
  "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
].join(" ");

const selectCls = [
  "w-full rounded-lg px-3 py-2 text-sm",
  "bg-white dark:bg-slate-800/60",
  "border border-zinc-200 dark:border-slate-700/60",
  "text-zinc-900 dark:text-white",
  "focus:outline-none focus:border-blue-500",
].join(" ");

// ── Toggle ─────────────────────────────────────────────────────────────
function Toggle({ on, onToggle, label, activeColor = "bg-blue-600" }: {
  on: boolean; onToggle: () => void; label: string; activeColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onToggle}>
      <div className={`w-9 h-5 rounded-full relative transition-colors ${on ? activeColor : "bg-zinc-200 dark:bg-white/10"}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
    </div>
  );
}

// ── Calendar Grid View ─────────────────────────────────────────────────
function CalendarView({ events, onEventClick, onDateClick }: {
  events: SchoolEvent[];
  onEventClick: (e: SchoolEvent) => void;
  onDateClick: (date: string) => void;
}) {
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Build the calendar grid for this month
  const { cells, firstDay } = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return { cells, firstDay };
  }, [calYear, calMonth]);

  // Map events to day numbers in this month
  const eventsByDay = useMemo(() => {
    const map: Record<number, SchoolEvent[]> = {};
    for (const ev of events) {
      const start = new Date(ev.startDate);
      const end   = new Date(ev.endDate);
      // Iterate each day the event spans within this month
      const cursor = new Date(start);
      while (cursor <= end) {
        if (cursor.getFullYear() === calYear && cursor.getMonth() === calMonth) {
          const d = cursor.getDate();
          if (!map[d]) map[d] = [];
          // Avoid duplicate entries for multi-day events
          if (!map[d].find(e => e.id === ev.id)) map[d].push(ev);
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [events, calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0);  setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };
  const goToday = () => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); };

  const isToday = (day: number) =>
    day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  const handleDateClick = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    onDateClick(d.toISOString().slice(0, 10));
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 rounded-2xl overflow-hidden">

      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-slate-700/40">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            {MONTHS[calMonth]} {calYear}
          </h2>
          <button onClick={goToday}
            className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-slate-700/60 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-slate-600 hover:text-zinc-700 dark:hover:text-white transition-all">
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-slate-700/60 hover:text-zinc-700 dark:hover:text-white transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-slate-700/60 hover:text-zinc-700 dark:hover:text-white transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-slate-700/40">
        {DAYS.map(d => (
          <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-zinc-400 dark:text-slate-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-zinc-100 dark:divide-slate-700/30">
        {cells.map((day, idx) => {
          const dayEvents = day ? (eventsByDay[day] ?? []) : [];
          const overflow  = dayEvents.length > 3;
          const visible   = dayEvents.slice(0, 3);

          return (
            <div key={idx}
              onClick={() => day && handleDateClick(day)}
              className={`min-h-[96px] p-1.5 transition-colors ${
                day
                  ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-slate-800/40"
                  : "bg-zinc-50/50 dark:bg-slate-900/30"
              }`}>
              {day && (
                <>
                  {/* Day number */}
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium mb-1 transition-colors ${
                    isToday(day)
                      ? "bg-blue-500 text-white font-bold"
                      : "text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-700/60"
                  }`}>
                    {day}
                  </div>

                  {/* Event chips */}
                  <div className="space-y-0.5">
                    {visible.map(ev => {
                      const tm = EVENT_TYPE_META[ev.eventType];
                      const isCancelled = ev.status === "CANCELLED";
                      return (
                        <div key={ev.id}
                          onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer transition-opacity hover:opacity-80 ${
                            isCancelled ? "opacity-40 line-through" : ""
                          } ${tm.chipLight} dark:${tm.chipDark} text-white`}>
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                    {overflow && (
                      <div className="text-[10px] text-zinc-400 dark:text-slate-500 px-1.5 font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-zinc-100 dark:border-slate-700/40 flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.entries(EVENT_TYPE_META).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${v.chipLight}`} />
            <span className="text-[10px] text-zinc-500 dark:text-slate-400">{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Create / Edit Dialog ───────────────────────────────────────────────
function EventDialog({ schoolId, userId, event, prefillDate, onClose, onSuccess }: {
  schoolId: string; userId: string; event?: SchoolEvent | null;
  prefillDate?: string;
  onClose: () => void; onSuccess: () => void;
}) {
  const isEdit = !!event;
  const [isPending, startTransition] = useTransition();
  const [title,       setTitle]       = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [eventType,   setEventType]   = useState<EventType>(event?.eventType ?? "ACADEMIC");
  const [audience,    setAudience]    = useState<EventAudience>(event?.audience ?? "ALL");
  const [startDate,   setStartDate]   = useState(
    event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16)
    : prefillDate ? `${prefillDate}T08:00` : ""
  );
  const [endDate,     setEndDate]     = useState(
    event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16)
    : prefillDate ? `${prefillDate}T17:00` : ""
  );
  const [allDay,      setAllDay]      = useState(event?.allDay ?? false);
  const [location,    setLocation]    = useState(event?.location ?? "");
  const [onlineUrl,   setOnlineUrl]   = useState(event?.onlineUrl ?? "");
  const [isPinned,    setIsPinned]    = useState(event?.isPinned ?? false);
  const [publishNow,  setPublishNow]  = useState(false);

  const handleSubmit = () => {
    startTransition(async () => {
      const payload = {
        title, description, eventType, audience,
        startDate: new Date(startDate),
        endDate:   new Date(endDate),
        allDay, location, onlineUrl, isPinned,
      };
      const result = isEdit
        ? await updateEvent(event!.id, { ...payload, status: publishNow ? "PUBLISHED" : undefined })
        : await createEvent({ schoolId, createdById: userId, ...payload, publishNow });

      if (result.ok) { toast.success(result.message); onSuccess(); onClose(); }
      else toast.error(result.message);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-slate-700/40 bg-blue-50 dark:bg-gradient-to-r dark:from-blue-900/20 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
              <Calendar size={15} className="text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="text-zinc-900 dark:text-white font-semibold text-sm">{isEdit ? "Edit Event" : "New Event"}</h2>
              <p className="text-zinc-500 text-xs">{isEdit ? "Update event details" : "Create a school event"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Event Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. End of Term Sports Day" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Event Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value as EventType)} className={selectCls}>
                {Object.entries(EVENT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Visible To</label>
              <select value={audience} onChange={e => setAudience(e.target.value as EventAudience)} className={selectCls}>
                {Object.entries(AUDIENCE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Start</label>
              <input type={allDay ? "date" : "datetime-local"} value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">End</label>
              <input type={allDay ? "date" : "datetime-local"} value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <Toggle on={allDay} onToggle={() => setAllDay(v => !v)} label="All-day event" activeColor="bg-violet-600" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Main Hall, Field…" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Online Link</label>
              <input value={onlineUrl} onChange={e => setOnlineUrl(e.target.value)} placeholder="https://meet.google.com/…" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Event details…" className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-6 flex-wrap">
            <Toggle on={isPinned}   onToggle={() => setIsPinned(v => !v)}   label="Pin to top"          activeColor="bg-amber-500" />
            <Toggle on={publishNow} onToggle={() => setPublishNow(v => !v)} label="Publish immediately" activeColor="bg-blue-600" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-slate-700/40 bg-zinc-50 dark:bg-black/20">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-slate-700/60 hover:border-zinc-300 dark:hover:border-white/20 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isPending || !title.trim() || !startDate || !endDate}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-40">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            {isEdit ? "Update Event" : publishNow ? "Publish Event" : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event Detail Dialog ────────────────────────────────────────────────
function EventDetailDialog({ event, onClose, onEdit, onRefresh }: {
  event: SchoolEvent; onClose: () => void; onEdit: () => void; onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const tm = EVENT_TYPE_META[event.eventType];
  const sm = STATUS_META[event.status];
  const am = AUDIENCE_META[event.audience];

  const handlePublish = () => startTransition(async () => {
    const res = await publishEvent(event.id);
    if (res.ok) { toast.success(res.message); onRefresh(); onClose(); } else toast.error(res.message);
  });
  const handleCancel = () => startTransition(async () => {
    const res = await cancelEvent(event.id);
    if (res.ok) { toast.success(res.message); onRefresh(); onClose(); } else toast.error(res.message);
  });
  const handleDelete = () => startTransition(async () => {
    const res = await deleteEvent(event.id);
    if (res.ok) { toast.success(res.message); onRefresh(); onClose(); } else toast.error(res.message);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-transparent" />

        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-slate-700/40">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${tm.lightCls} ${tm.iconLight} dark:${tm.darkCls} dark:${tm.iconDark}`}>
                {tm.icon} {tm.label}
              </span>
              <span className={`flex items-center gap-1 text-xs ${sm.lightText} dark:${sm.darkText}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} /> {sm.label}
              </span>
              {event.isPinned && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded">📌 Pinned</span>
              )}
            </div>
            <h2 className="text-zinc-900 dark:text-white font-semibold text-base">{event.title}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
              <Edit3 size={14} />
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <Clock size={15} className="text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-zinc-900 dark:text-white">{fmt(event.startDate)} {!event.allDay && `at ${fmtTime(event.startDate)}`}</div>
              {event.endDate !== event.startDate && (
                <div className="text-zinc-500 text-xs mt-0.5">→ {fmt(event.endDate)} {!event.allDay && fmtTime(event.endDate)}</div>
              )}
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={15} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span className="text-zinc-700 dark:text-zinc-200">{event.location}</span>
            </div>
          )}
          {event.onlineUrl && (
            <div className="flex items-center gap-3 text-sm">
              <Link size={15} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
              <a href={event.onlineUrl} target="_blank"
                className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 truncate">
                {event.onlineUrl}
              </a>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-400 dark:text-zinc-500">{am.icon}</span>
            <span className="text-zinc-600 dark:text-zinc-300">
              Visible to: <span className="text-zinc-900 dark:text-white font-medium">{am.label}</span>
            </span>
          </div>

          {event.description && (
            <div className="bg-zinc-50 dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700/40 rounded-xl p-4">
              <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600 pt-1">
            <span>Created by {event.createdBy.name}</span>
            <span>{event._count.rsvps} RSVP{event._count.rsvps !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-slate-700/40 bg-zinc-50 dark:bg-black/20">
          <div className="flex gap-2">
            {event.status !== "CANCELLED" && event.status !== "COMPLETED" && (
              <button onClick={handleCancel} disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-lg transition-all">
                <Ban size={12} /> Cancel
              </button>
            )}
            {event.status === "DRAFT" && (
              <button onClick={handleDelete} disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-slate-700/40 hover:border-zinc-300 dark:hover:border-white/15 rounded-lg transition-all">
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
          {event.status === "DRAFT" && (
            <button onClick={handlePublish} disabled={isPending}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-all">
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function EventsClient({ schoolId, userId, events, total, page, totalPages, readOnly = false }: Props) {
  const router = useRouter();
  const [view,        setView]        = useState<"grid" | "calendar">("calendar");
  const [showCreate,  setShowCreate]  = useState(false);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [viewEvent,   setViewEvent]   = useState<SchoolEvent | null>(null);
  const [editEvent,   setEditEvent]   = useState<SchoolEvent | null>(null);
  const [search,      setSearch]      = useState("");

  const filtered = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  const handleDateClick = (date: string) => {
    if (readOnly) return;
    setPrefillDate(date);
    setShowCreate(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0d1117] text-zinc-900 dark:text-white">

      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-slate-700/40 bg-white/80 dark:bg-[#0d1117]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Events</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{total} event{total !== 1 ? "s" : ""} total</p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-xl p-0.5">
              <button onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === "calendar"
                    ? "bg-white dark:bg-slate-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-white"
                }`}>
                <CalendarDays size={13} /> Calendar
              </button>
              <button onClick={() => setView("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === "grid"
                    ? "bg-white dark:bg-slate-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-white"
                }`}>
                <LayoutGrid size={13} /> Cards
              </button>
            </div>

            <button onClick={() => { setPrefillDate(undefined); setShowCreate(true); }}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 dark:shadow-blue-900/40 ${readOnly ? "hidden" : ""}`}>
              <Plus size={15} /> New Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* Filters (cards view only) */}
        {view === "grid" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…"
                className="w-full bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
            </div>
            <select onChange={e => router.push(`?status=${e.target.value}`)}
              className="bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select onChange={e => router.push(`?type=${e.target.value}`)}
              className="bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500">
              <option value="">All Types</option>
              {Object.entries(EVENT_TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Calendar view ── */}
        {view === "calendar" && (
          <CalendarView
            events={events}
            onEventClick={setViewEvent}
            onDateClick={handleDateClick}
          />
        )}

        {/* ── Cards view ── */}
        {view === "grid" && (
          <>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center mb-4">
                  <Calendar size={22} className="text-zinc-400 dark:text-zinc-600" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">No events found</p>
                <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">Create the first school event</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(ev => {
                  const tm = EVENT_TYPE_META[ev.eventType];
                  const sm = STATUS_META[ev.status];
                  const am = AUDIENCE_META[ev.audience];
                  const isPast = new Date(ev.endDate) < new Date();

                  return (
                    <div key={ev.id} onClick={() => setViewEvent(ev)}
                      className="group relative bg-white dark:bg-slate-800/50 hover:bg-zinc-50 dark:hover:bg-slate-700/40 border border-zinc-200 dark:border-slate-700/40 hover:border-zinc-300 dark:hover:border-white/15 rounded-2xl p-5 cursor-pointer transition-all overflow-hidden shadow-sm dark:shadow-none">
                      {ev.isPinned && <div className="absolute top-3 right-3 text-amber-500 dark:text-amber-400 text-xs">📌</div>}

                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${tm.lightCls} dark:${tm.darkCls}`}>
                          <span className={`${tm.iconLight} dark:${tm.iconDark}`}>{tm.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{ev.title}</h3>
                          <div className={`flex items-center gap-1 text-xs mt-0.5 ${sm.lightText} dark:${sm.darkText}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                            {sm.label}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <Clock size={11} className="shrink-0" />
                          <span>{fmt(ev.startDate)}</span>
                          {!ev.allDay && <span className="text-zinc-400 dark:text-zinc-600">· {fmtTime(ev.startDate)}</span>}
                        </div>
                        {ev.location && (
                          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                            <MapPin size={11} className="shrink-0" /> {ev.location}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                          {am.icon} {am.label}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
                          {ev._count.rsvps} RSVP{ev._count.rsvps !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {isPast && ev.status === "PUBLISHED" && (
                        <div className="absolute inset-0 bg-white/40 dark:bg-black/30 rounded-2xl pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button disabled={page <= 1} onClick={() => router.push(`?page=${page - 1}`)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-30 transition-all">
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs text-zinc-500 px-2">Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => router.push(`?page=${page + 1}`)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-30 transition-all">
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      {showCreate && (
        <EventDialog schoolId={schoolId} userId={userId} prefillDate={prefillDate}
          onClose={() => { setShowCreate(false); setPrefillDate(undefined); }}
          onSuccess={() => router.refresh()} />
      )}
      {viewEvent && !editEvent && (
        <EventDetailDialog event={viewEvent} onClose={() => setViewEvent(null)}
          onEdit={() => { setEditEvent(viewEvent); setViewEvent(null); }}
          onRefresh={() => router.refresh()} />
      )}
      {editEvent && (
        <EventDialog schoolId={schoolId} userId={userId} event={editEvent}
          onClose={() => setEditEvent(null)} onSuccess={() => router.refresh()} />
      )}
    </div>
  );
}
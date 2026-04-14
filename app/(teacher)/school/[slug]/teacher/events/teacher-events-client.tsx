"use client";

import { useState, useMemo } from "react";
import {
  Calendar, MapPin, Globe, Users, GraduationCap, BookOpen,
  Trophy, Music, Heart, Star, Plane, Clock, X, Search,
  ChevronLeft, ChevronRight, Radio, LayoutGrid,
} from "lucide-react";

type EventType     = "ACADEMIC" | "SPORTS" | "CULTURAL" | "PARENTS_MEETING" | "STAFF_MEETING" | "HOLIDAY" | "TRIP" | "FUNDRAISING" | "HEALTH" | "OTHER";
type EventAudience = "ALL" | "PARENTS" | "TEACHERS" | "ALL_STAFF" | "STUDENTS" | "PUBLIC";

interface SchoolEvent {
  id: string;
  title: string;
  description?: string | null;
  eventType: EventType;
  audience: EventAudience;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string | null;
  onlineUrl?: string | null;
  isPinned: boolean;
  createdAt: string;
  createdBy: { id: string; name: string };
  _count: { rsvps: number };
}

interface Props {
  slug: string;
  events: SchoolEvent[];
  total: number;
  page: number;
}

// ── Constants ─────────────────────────────────────────────────────────

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const TYPE_META: Record<EventType, { label: string; icon: React.ReactNode; cls: string; chip: string }> = {
  ACADEMIC:        { label: "Academic",    icon: <BookOpen size={13} />, cls: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30", chip: "bg-violet-500" },
  SPORTS:          { label: "Sports",      icon: <Trophy size={13} />,   cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",             chip: "bg-blue-500" },
  CULTURAL:        { label: "Cultural",    icon: <Music size={13} />,    cls: "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30",             chip: "bg-pink-500" },
  PARENTS_MEETING: { label: "Parents Mtg", icon: <Users size={13} />,    cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",             chip: "bg-blue-500" },
  STAFF_MEETING:   { label: "Staff Mtg",   icon: <Users size={13} />,    cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",       chip: "bg-amber-500" },
  HOLIDAY:         { label: "Holiday",     icon: <Star size={13} />,     cls: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30", chip: "bg-yellow-500" },
  TRIP:            { label: "Trip",        icon: <Plane size={13} />,    cls: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30",             chip: "bg-cyan-500" },
  FUNDRAISING:     { label: "Fundraising", icon: <Heart size={13} />,    cls: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",             chip: "bg-rose-500" },
  HEALTH:          { label: "Health",      icon: <Heart size={13} />,    cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",                   chip: "bg-red-500" },
  OTHER:           { label: "Other",       icon: <Calendar size={13} />, cls: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-500/15 dark:text-zinc-300 dark:border-zinc-500/30",             chip: "bg-zinc-500" },
};

const AUDIENCE_META: Record<EventAudience, { label: string; icon: React.ReactNode }> = {
  ALL:       { label: "Everyone",  icon: <Globe size={12} /> },
  PARENTS:   { label: "Parents",   icon: <Users size={12} /> },
  TEACHERS:  { label: "Teachers",  icon: <GraduationCap size={12} /> },
  ALL_STAFF: { label: "All Staff", icon: <Users size={12} /> },
  STUDENTS:  { label: "Students",  icon: <BookOpen size={12} /> },
  PUBLIC:    { label: "Public",    icon: <Radio size={12} /> },
};

// ── Helpers ───────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
}
function isUpcoming(d: string) {
  return new Date(d) >= new Date();
}

// ── Event Detail Dialog ───────────────────────────────────────────────

function EventDetailDialog({ event, onClose }: { event: SchoolEvent; onClose: () => void }) {
  const tm = TYPE_META[event.eventType];
  const am = AUDIENCE_META[event.audience];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-transparent" />
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-slate-700/40">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${tm.cls}`}>
                {tm.icon} {tm.label}
              </span>
              {event.isPinned && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded">📌 Pinned</span>
              )}
            </div>
            <h2 className="text-zinc-900 dark:text-white font-semibold text-base">{event.title}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <Clock size={15} className="text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-zinc-900 dark:text-white">{fmt(event.startDate)} {!event.allDay && `at ${fmtTime(event.startDate)}`}</div>
              <div className="text-zinc-500 text-xs mt-0.5">→ {fmt(event.endDate)} {!event.allDay && fmtTime(event.endDate)}</div>
            </div>
          </div>
          {event.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={15} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span className="text-zinc-700 dark:text-zinc-200">{event.location}</span>
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
      </div>
    </div>
  );
}

// ── Calendar View ─────────────────────────────────────────────────────

function CalendarView({ events, onEventClick }: {
  events: SchoolEvent[];
  onEventClick: (e: SchoolEvent) => void;
}) {
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const cells = useMemo(() => {
    const firstDay    = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const arr: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [calYear, calMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, SchoolEvent[]> = {};
    for (const ev of events) {
      const cursor = new Date(ev.startDate);
      const end    = new Date(ev.endDate);
      while (cursor <= end) {
        if (cursor.getFullYear() === calYear && cursor.getMonth() === calMonth) {
          const d = cursor.getDate();
          if (!map[d]) map[d] = [];
          if (!map[d].find(e => e.id === ev.id)) map[d].push(ev);
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [events, calYear, calMonth]);

  const prevMonth = () => calMonth === 0 ? (setCalMonth(11), setCalYear(y => y - 1)) : setCalMonth(m => m - 1);
  const nextMonth = () => calMonth === 11 ? (setCalMonth(0), setCalYear(y => y + 1)) : setCalMonth(m => m + 1);
  const goToday   = () => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); };
  const isTodayFn = (day: number) => day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  return (
    <div className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-700/60 rounded-2xl overflow-hidden">
      {/* Month nav */}
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
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-slate-700/60 hover:text-zinc-700 dark:hover:text-white transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-slate-700/60 hover:text-zinc-700 dark:hover:text-white transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-slate-700/40">
        {DAYS.map(d => (
          <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-zinc-400 dark:text-slate-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-zinc-100 dark:divide-slate-700/30">
        {cells.map((day, idx) => {
          const dayEvents = day ? (eventsByDay[day] ?? []) : [];
          const visible   = dayEvents.slice(0, 3);
          const overflow  = dayEvents.length > 3;
          return (
            <div key={idx} className={`min-h-[96px] p-1.5 ${day ? "" : "bg-zinc-50/50 dark:bg-slate-900/30"}`}>
              {day && (
                <>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${
                    isTodayFn(day) ? "bg-blue-500 text-white font-bold" : "text-zinc-700 dark:text-slate-300"
                  }`}>{day}</div>
                  <div className="space-y-0.5">
                    {visible.map(ev => {
                      const tm = TYPE_META[ev.eventType];
                      return (
                        <div key={ev.id}
                          onClick={() => onEventClick(ev)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity text-white ${tm.chip}`}>
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                    {overflow && (
                      <div className="text-[10px] text-zinc-400 dark:text-slate-500 px-1.5 font-medium">+{dayEvents.length - 3} more</div>
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
        {Object.entries(TYPE_META).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${v.chip}`} />
            <span className="text-[10px] text-zinc-500 dark:text-slate-400">{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cards View ────────────────────────────────────────────────────────

function CardsView({ events, onEventClick }: { events: SchoolEvent[]; onEventClick: (e: SchoolEvent) => void }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center mb-4">
          <Calendar size={22} className="text-zinc-400 dark:text-zinc-600" />
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">No events found</p>
        <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">Published events for staff will appear here</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map(ev => {
        const tm   = TYPE_META[ev.eventType];
        const past = !isUpcoming(ev.endDate);
        return (
          <div key={ev.id} onClick={() => onEventClick(ev)}
            className={`relative bg-white dark:bg-slate-800/50 hover:bg-zinc-50 dark:hover:bg-slate-700/40 border border-zinc-200 dark:border-slate-700/40 hover:border-zinc-300 dark:hover:border-white/15 rounded-2xl p-5 cursor-pointer transition-all shadow-sm dark:shadow-none ${past ? "opacity-60" : ""}`}>
            {ev.isPinned && <div className="absolute top-3 right-3 text-amber-500 text-xs">📌</div>}
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${tm.cls}`}>
                {tm.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{ev.title}</h3>
                <span className={`text-xs ${tm.cls} px-1.5 py-0.5 rounded border inline-flex items-center gap-1 mt-0.5`}>
                  {tm.label}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
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
            {past && (
              <div className="mt-3">
                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-700/40 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-600/40 rounded">Past</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function TeacherEventsClient({ events, total, slug }: Props) {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<SchoolEvent | null>(null);
  const [filter,   setFilter]   = useState<"all" | "upcoming" | "past">("all");
  const [view,     setView]     = useState<"calendar" | "cards">("calendar");

  const filtered = useMemo(() => events
    .filter(e => {
      if (filter === "upcoming") return isUpcoming(e.endDate);
      if (filter === "past")     return !isUpcoming(e.endDate);
      return true;
    })
    .filter(e => e.title.toLowerCase().includes(search.toLowerCase())),
    [events, filter, search]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-slate-950 text-zinc-900 dark:text-white">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-slate-700/40 bg-white/80 dark:bg-slate-950/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-blue-500" />
            <div>
              <h1 className="text-lg font-semibold">Events & Calendar</h1>
              <p className="text-zinc-500 text-xs">{total} published event{total !== 1 ? "s" : ""} for staff</p>
            </div>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800/60 rounded-lg p-1">
            <button onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === "calendar"
                  ? "bg-white dark:bg-slate-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}>
              <Calendar size={13} /> Calendar
            </button>
            <button onClick={() => setView("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === "cards"
                  ? "bg-white dark:bg-slate-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}>
              <LayoutGrid size={13} /> Cards
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Filters — only shown in cards view */}
        {view === "cards" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…"
                className="w-full bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
            </div>
            <div className="flex gap-1">
              {(["all", "upcoming", "past"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all capitalize ${
                    filter === f
                      ? "bg-blue-100 dark:bg-blue-600/20 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-200"
                      : "bg-white dark:bg-slate-800/60 border-zinc-200 dark:border-slate-700/60 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-slate-600"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === "calendar"
          ? <CalendarView events={events} onEventClick={setSelected} />
          : <CardsView    events={filtered} onEventClick={setSelected} />
        }
      </div>

      {selected && <EventDetailDialog event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

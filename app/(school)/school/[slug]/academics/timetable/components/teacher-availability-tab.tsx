"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { Switch }  from "@/components/ui/switch";
import { Input }   from "@/components/ui/input";
import { Loader2, Save, CheckCircle2, ChevronDown, ChevronUp, Users, Search, X } from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
type Day = typeof DAYS[number];

type Availability = {
  dayOfWeek:     Day;
  isAvailable:   boolean;
  availableFrom: string | null;
  availableTo:   string | null;
};

type Teacher = {
  id:             string;
  firstName:      string;
  lastName:       string;
  staffNo:        string;
  employmentType: string;
  availabilities: Availability[];
};

// Default: available Mon–Fri full day, off Sat–Sun
function defaultAvailability(): Availability[] {
  return DAYS.map(day => ({
    dayOfWeek:     day,
    isAvailable:   day !== "SATURDAY" && day !== "SUNDAY",
    availableFrom: null,
    availableTo:   null,
  }));
}

function mergeAvailability(existing: Availability[]): Availability[] {
  const map = new Map(existing.map(a => [a.dayOfWeek, a]));
  return DAYS.map(day => map.get(day) ?? {
    dayOfWeek:     day,
    isAvailable:   day !== "SATURDAY" && day !== "SUNDAY",
    availableFrom: null,
    availableTo:   null,
  });
}

export default function TeacherAvailabilityTab({
  schoolId,
  teachers: teachersProp,
}: {
  schoolId: string;
  teachers: Teacher[];
}) {
  const teachers = teachersProp ?? [];

  // Local state: teacherId → availability rows
  const [availability, setAvailability] = useState<Record<string, Availability[]>>(() => {
    const init: Record<string, Availability[]> = {};
    for (const t of teachers) {
      init[t.id] = mergeAvailability(t.availabilities as Availability[]);
    }
    return init;
  });

  const [saving,   setSaving]   = useState<string | null>(null);
  const [saved,    setSaved]    = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search,   setSearch]   = useState("");
  const [showAll,  setShowAll]  = useState(false); // false = part-time only

  const partTime = teachers.filter(t =>
    t.employmentType?.toUpperCase() === "PART_TIME"
  );
  const fullTime = teachers.filter(t =>
    t.employmentType?.toUpperCase() !== "PART_TIME"
  );

  function toggleDay(teacherId: string, day: Day, value: boolean) {
    setAvailability(prev => ({
      ...prev,
      [teacherId]: prev[teacherId].map(a =>
        a.dayOfWeek === day ? { ...a, isAvailable: value } : a
      ),
    }));
    setSaved(prev => { const s = new Set(prev); s.delete(teacherId); return s; });
  }

  function updateTime(teacherId: string, day: Day, field: "availableFrom" | "availableTo", value: string) {
    setAvailability(prev => ({
      ...prev,
      [teacherId]: prev[teacherId].map(a =>
        a.dayOfWeek === day ? { ...a, [field]: value || null } : a
      ),
    }));
    setSaved(prev => { const s = new Set(prev); s.delete(teacherId); return s; });
  }

  async function saveTeacher(teacherId: string) {
    setSaving(teacherId);
    try {
      const rows = availability[teacherId];
      // Save each day in parallel
      await Promise.all(rows.map(row =>
        fetch("/api/timetable/teacher-availability", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            schoolId,
            teacherId,
            dayOfWeek:     row.dayOfWeek,
            isAvailable:   row.isAvailable,
            availableFrom: row.availableFrom || undefined,
            availableTo:   row.availableTo   || undefined,
          }),
        })
      ));
      setSaved(prev => new Set([...prev, teacherId]));
    } finally {
      setSaving(null);
    }
  }

  async function saveAll() {
    for (const t of partTime) {
      await saveTeacher(t.id);
    }
  }

  if (teachers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-400">
          <Users className="h-8 w-8 mx-auto mb-3 opacity-40" />
          No active teachers found for this school.
        </CardContent>
      </Card>
    );
  }

  const allSaved = partTime.every(t => saved.has(t.id));

  const pool  = showAll ? teachers : partTime;
  const query = search.trim().toLowerCase();
  const filtered = query
    ? pool.filter(t =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(query) ||
        t.staffNo.toLowerCase().includes(query)
      )
    : pool;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      {fullTime.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-3 py-2.5 text-sm text-blue-700 dark:text-blue-300">
          <span className="shrink-0 mt-0.5">ℹ️</span>
          <span>
            {fullTime.length} full-time teacher{fullTime.length !== 1 ? "s are" : " is"} always available — no schedule needed.
            <button onClick={() => setShowAll(v => !v)} className="ml-1.5 underline underline-offset-2 font-medium">
              {showAll ? "Hide full-time" : "Show all teachers"}
            </button>
          </span>
        </div>
      )}

      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or staff no…"
            className="pl-8 pr-8 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <p className="text-xs text-gray-400">
            {filtered.length} of {pool.length} teacher{pool.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" variant="outline" onClick={saveAll} disabled={!!saving || allSaved || partTime.length === 0}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save All
          </Button>
        </div>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-gray-400">
            {query
              ? <><Search className="h-7 w-7 mx-auto mb-2 opacity-40" /><p className="text-sm">No teachers match &ldquo;{search}&rdquo;</p></>
              : <><Users className="h-7 w-7 mx-auto mb-2 opacity-40" /><p className="text-sm">No part-time teachers found.</p></>
            }
          </CardContent>
        </Card>
      )}

      {/* Teacher cards */}
      {filtered.map(teacher => {
        const isPartTime = teacher.employmentType?.toUpperCase() === "PART_TIME";
        const rows       = availability[teacher.id] ?? defaultAvailability();
        const isExpanded = expanded === teacher.id;
        const isSaving   = saving === teacher.id;
        const isSaved    = saved.has(teacher.id);
        const activeDays = rows.filter(r => r.isAvailable).length;

        return (
          <Card key={teacher.id} className={isSaved ? "border-green-200 dark:border-green-800" : ""}>
            <button
              className="w-full text-left"
              onClick={() => isPartTime ? setExpanded(isExpanded ? null : teacher.id) : undefined}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {teacher.firstName} {teacher.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-gray-400">{teacher.staffNo}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          isPartTime
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}>
                          {isPartTime ? "Part-time" : teacher.employmentType?.replace("_", " ") ?? "Full-time"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPartTime ? (
                      <>
                        <div className="hidden sm:flex gap-1">
                          {DAYS.slice(0, 5).map(day => {
                            const row = rows.find(r => r.dayOfWeek === day);
                            return (
                              <span key={day} className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                row?.isAvailable
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                  : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                              }`}>
                                {day.slice(0, 2)}
                              </span>
                            );
                          })}
                        </div>
                        {isSaved && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Always available</span>
                    )}
                  </div>
                </div>
              </CardHeader>
            </button>

            {/* Expanded editor — part-time only */}
            {isPartTime && isExpanded && (
              <CardContent className="pt-0 space-y-3">
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                  <div className="grid grid-cols-[100px_60px_1fr_1fr] gap-3 px-1">
                    <span className="text-xs font-medium text-gray-400">Day</span>
                    <span className="text-xs font-medium text-gray-400">Active</span>
                    <span className="text-xs font-medium text-gray-400">From</span>
                    <span className="text-xs font-medium text-gray-400">To</span>
                  </div>
                  {rows.map(row => (
                    <div key={row.dayOfWeek} className={`grid grid-cols-[100px_60px_1fr_1fr] gap-3 items-center px-1 py-1.5 rounded-lg ${row.isAvailable ? "" : "opacity-50"}`}>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {row.dayOfWeek.charAt(0) + row.dayOfWeek.slice(1).toLowerCase()}
                      </span>
                      <Switch checked={row.isAvailable} onCheckedChange={v => toggleDay(teacher.id, row.dayOfWeek as Day, v)} />
                      <Input type="time" value={row.availableFrom ?? ""} onChange={e => updateTime(teacher.id, row.dayOfWeek as Day, "availableFrom", e.target.value)} disabled={!row.isAvailable} placeholder="08:00" className="h-8 text-sm" />
                      <Input type="time" value={row.availableTo ?? ""} onChange={e => updateTime(teacher.id, row.dayOfWeek as Day, "availableTo", e.target.value)} disabled={!row.isAvailable} placeholder="17:00" className="h-8 text-sm" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400">{activeDays} day{activeDays !== 1 ? "s" : ""} active · leave time empty for full-day</p>
                  <Button size="sm" onClick={() => saveTeacher(teacher.id)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : isSaved ? <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-300" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

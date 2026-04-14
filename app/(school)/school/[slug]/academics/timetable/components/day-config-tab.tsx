"use client";

import { useEffect, useState } from "react";
import { Button }  from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge }   from "@/components/ui/badge";
import { Loader2, Plus, Save, Trash2, School, BookOpen, ChevronDown, ChevronUp, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import { Switch }  from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAYS       = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"] as const;
const SLOT_TYPES = ["LESSON","BREAK","LUNCH","ASSEMBLY","PREP","FREE"] as const;
const LESSON_TYPES = new Set(["LESSON", "PREP"]);

type Slot = { slotNumber: number; startTime: string; endTime: string; slotType: string; label: string; durationMin: number };
type SlotDraft = Slot & { durationRaw?: string }; // raw string while user is typing
type DayConfig = { id?: string; dayOfWeek: string; isActive: boolean; slots: Slot[] };

type ClassYear = {
  id:            string;
  classTemplate: { name: string; classLevel: string };
  academicYear:  { year: string };
  dayConfigs?:   DayConfig[];
};

const SLOT_COLORS: Record<string, string> = {
  LESSON:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  BREAK:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  LUNCH:    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  ASSEMBLY: "bg-purple-100 text-purple-700",
  PREP:     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  FREE:     "bg-gray-100 text-gray-500",
};

// ─── Shared slot editor ───────────────────────────────────────────────────────

function SlotEditor({
  configs, selected, onSelectDay, onUpdateDay, onSaveDay, saving,
}: {
  configs:     DayConfig[];
  selected:    string;
  onSelectDay: (day: string) => void;
  onUpdateDay: (day: string, patch: Partial<DayConfig>) => void;
  onSaveDay:   (day: string) => Promise<void>;
  saving:      string | null;
}) {
  const dayConfig = configs.find(c => c.dayOfWeek === selected);

  function addSlot() {
    if (!dayConfig) return;
    const last = dayConfig.slots[dayConfig.slots.length - 1];
    const dur  = last?.durationMin ?? 40;
    const start = last?.endTime ?? "07:30";
    const newSlot: Slot = {
      slotNumber:  (last?.slotNumber ?? 0) + 1,
      startTime:   start,
      endTime:     addMinutes(start, dur),
      slotType:    "LESSON",
      label:       `Period ${(last?.slotNumber ?? 0) + 1}`,
      durationMin: dur,
    };
    onUpdateDay(selected, { slots: [...dayConfig.slots, newSlot] });
  }

  function updateSlot(idx: number, patch: Partial<Slot>) {
    if (!dayConfig) return;
    const slots = [...dayConfig.slots];
    let merged = { ...slots[idx], ...patch };

    // Recompute endTime when duration or startTime changes (for any slot type)
    if ("durationMin" in patch || "startTime" in patch) {
      merged.endTime = addMinutes(merged.startTime, merged.durationMin);
    }
    // If endTime edited manually → sync durationMin
    if ("endTime" in patch && !("durationMin" in patch) && !("startTime" in patch)) {
      const diff = timeDiffMinutes(merged.startTime, merged.endTime);
      if (diff > 0) merged.durationMin = diff;
    }
    // If slotType changed → recompute endTime from stored duration
    if ("slotType" in patch) {
      merged.endTime = addMinutes(merged.startTime, merged.durationMin);
    }

    slots[idx] = merged;

    // Cascade: push each subsequent slot's startTime = previous slot's endTime
    for (let i = idx + 1; i < slots.length; i++) {
      const prev = slots[i - 1];
      const cur  = { ...slots[i], startTime: prev.endTime };
      cur.endTime = addMinutes(cur.startTime, cur.durationMin);
      slots[i] = cur;
    }

    onUpdateDay(selected, { slots });
  }

  function removeSlot(idx: number) {
    if (!dayConfig) return;
    onUpdateDay(selected, { slots: dayConfig.slots.filter((_, i) => i !== idx) });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      {/* Day selector */}
      <div className="space-y-1">
        {DAYS.map(day => {
          const cfg = configs.find(c => c.dayOfWeek === day);
          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                ${selected === day
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
            >
              <span>{day.charAt(0) + day.slice(1).toLowerCase()}</span>
              {cfg && (
                <span className={`text-xs ${selected === day ? "text-blue-200" : cfg.isActive ? "text-green-500" : "text-gray-400"}`}>
                  {cfg.isActive ? `${cfg.slots.length} slots` : "off"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slot editor panel — always render, even for empty days */}
      <Card>
        {dayConfig ? (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{selected.charAt(0) + selected.slice(1).toLowerCase()}</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={dayConfig.isActive}
                      onCheckedChange={v => onUpdateDay(selected, { isActive: v })}
                    />
                    <span className="text-gray-500">{dayConfig.isActive ? "Active" : "Off"}</span>
                  </div>
                  <Button size="sm" onClick={() => onSaveDay(selected)} disabled={saving === selected}>
                    {saving === selected
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      : <Save className="h-3.5 w-3.5 mr-1" />}
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayConfig.slots.map((slot, idx) => (
                <div key={idx} className="grid grid-cols-[28px_1fr_1fr_52px_1fr_1fr_28px] gap-2 items-end">
                  {/* # */}
                  <div className="text-center text-xs text-gray-400 pb-2">{slot.slotNumber}</div>

                  {/* Start */}
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">Start</Label>}
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={e => updateSlot(idx, { startTime: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* End */}
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">End</Label>}
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={e => updateSlot(idx, { endTime: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">Mins</Label>}
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      defaultValue={slot.durationMin}
                      key={`dur-${idx}-${slot.durationMin}`}
                      onBlur={e => {
                        const val = Math.max(5, Math.min(300, parseInt(e.target.value, 10) || slot.durationMin));
                        updateSlot(idx, { durationMin: val });
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      className={`h-8 text-sm ${
                        LESSON_TYPES.has(slot.slotType)
                          ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
                          : "bg-gray-50 dark:bg-gray-900/30 text-gray-400"
                      }`}
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">Type</Label>}
                    <Select value={slot.slotType} onValueChange={v => updateSlot(idx, { slotType: v })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SLOT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Label */}
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">Label</Label>}
                    <Input
                      value={slot.label}
                      onChange={e => updateSlot(idx, { label: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="Period 1"
                    />
                  </div>

                  {/* Delete */}
                  <button onClick={() => removeSlot(idx)} className="pb-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={addSlot} className="w-full mt-1">
                <Plus className="h-3.5 w-3.5 mr-1" />Add Slot
              </Button>

              {dayConfig.slots.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(
                    dayConfig.slots.reduce((acc, s) => ({ ...acc, [s.slotType]: (acc[s.slotType] ?? 0) + 1 }), {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <span key={type} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SLOT_COLORS[type] ?? ""}`}>
                      {count}× {type}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </>
        ) : (
          <CardContent className="py-12 text-center text-gray-400 text-sm">
            Select a day to configure its slots.
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ─── General (school-wide) config ─────────────────────────────────────────────

function GeneralDayConfig({ schoolId }: { schoolId: string }) {
  // Initialize all 7 days immediately so the panel always renders
  const defaultConfigs = (): DayConfig[] =>
    DAYS.map(day => ({
      dayOfWeek: day,
      isActive:  day !== "SATURDAY" && day !== "SUNDAY",
      slots:     [],
    }));

  const [configs,  setConfigs]  = useState<DayConfig[]>(defaultConfigs);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("MONDAY");
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/timetable/day-config?schoolId=${schoolId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        const existing = new Map((d.configs ?? []).map((c: DayConfig) => [c.dayOfWeek, c]));
        setConfigs(DAYS.map(day => (existing.get(day) as DayConfig | undefined) ?? {
          dayOfWeek: day,
          isActive:  day !== "SATURDAY" && day !== "SUNDAY",
          slots:     [],
        }));
      })
      .catch(e => setFetchErr(e.message))
      .finally(() => setLoading(false));
  }, [schoolId]);

  function updateDay(day: string, patch: Partial<DayConfig>) {
    setConfigs(prev => prev.map(c => c.dayOfWeek === day ? { ...c, ...patch } : c));
  }

  async function saveDay(day: string) {
    const cfg = configs.find(c => c.dayOfWeek === day);
    if (!cfg) return;
    setSaving(day);
    try {
      await fetch("/api/timetable/day-config", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ schoolId, ...cfg }),
      });
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;

  return (
    <>
      {fetchErr && (
        <div className="mb-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-2">
          Could not load saved config ({fetchErr}) — showing defaults. Save a day to persist.
        </div>
      )}
      <SlotEditor
        configs={configs}
        selected={selected}
        onSelectDay={setSelected}
        onUpdateDay={updateDay}
        onSaveDay={saveDay}
        saving={saving}
      />
    </>
  );
}

// ─── Per-class config ─────────────────────────────────────────────────────────

function ClassDayConfigPanel({ schoolId, classYears }: { schoolId: string; classYears: ClassYear[] }) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classConfigs,  setClassConfigs]  = useState<Record<string, DayConfig[]>>({});
  const [loading,       setLoading]       = useState<string | null>(null);
  const [saving,        setSaving]        = useState<string | null>(null);
  const [selectedDay,   setSelectedDay]   = useState<string>("MONDAY");
  const [expanded,      setExpanded]      = useState<string | null>(null);

  // Don't seed from SSR — always load via API (dayConfigs not included in SSR query)
  useEffect(() => {}, []);

  async function loadClass(classYearId: string) {
    if (classConfigs[classYearId] !== undefined) {
      setSelectedClass(classYearId);
      return;
    }
    setLoading(classYearId);
    try {
      const res  = await fetch(`/api/timetable/class-day-config?classYearId=${classYearId}`);
      const data = await res.json();
      setClassConfigs(prev => ({ ...prev, [classYearId]: data.configs ?? [] }));
      setSelectedClass(classYearId);
    } finally {
      setLoading(null);
    }
  }

  function getConfigs(classYearId: string): DayConfig[] {
    const overrides = new Map((classConfigs[classYearId] ?? []).map((c: DayConfig) => [c.dayOfWeek, c]));
    // Show all 7 days; days without override show empty slots (inherits general)
    return DAYS.map(day => overrides.get(day) ?? {
      dayOfWeek: day, isActive: day !== "SATURDAY" && day !== "SUNDAY", slots: [],
    });
  }

  function updateDay(classYearId: string, day: string, patch: Partial<DayConfig>) {
    setClassConfigs(prev => {
      const current = getConfigs(classYearId);
      const updated = current.map(c => c.dayOfWeek === day ? { ...c, ...patch } : c);
      return { ...prev, [classYearId]: updated };
    });
  }

  async function saveDay(classYearId: string, day: string) {
    const cfg = getConfigs(classYearId).find(c => c.dayOfWeek === day);
    if (!cfg) return;
    setSaving(`${classYearId}:${day}`);
    try {
      await fetch("/api/timetable/class-day-config", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ schoolId, classYearId, ...cfg }),
      });
    } finally {
      setSaving(null);
    }
  }

  async function removeOverride(classYearId: string) {
    await fetch(`/api/timetable/class-day-config?classYearId=${classYearId}`, { method: "DELETE" });
    setClassConfigs(prev => ({ ...prev, [classYearId]: [] }));
    if (selectedClass === classYearId) setSelectedClass(null);
  }

  const activeClass = classYears.find(cy => cy.id === selectedClass);
  const hasOverride = (classYearId: string) => (classConfigs[classYearId] ?? []).length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Select a class to configure its day schedule. Classes without an override inherit the general school config.
      </p>

      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        {/* Class list */}
        <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
          {classYears.map(cy => {
            const isSelected = selectedClass === cy.id;
            const override   = hasOverride(cy.id);
            return (
              <button
                key={cy.id}
                onClick={() => loadClass(cy.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between gap-2
                  ${isSelected
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
              >
                <div>
                  <p className="font-medium">{cy.classTemplate.name}</p>
                  <p className={`text-xs ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                    {cy.academicYear.year} · {cy.classTemplate.classLevel.replace("_", " ")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {loading === cy.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {override && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isSelected ? "bg-blue-500 text-white" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                      custom
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {classYears.length === 0 && (
            <p className="text-sm text-gray-400 px-3 py-4">No active classes found.</p>
          )}
        </div>

        {/* Editor for selected class */}
        {selectedClass && activeClass ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{activeClass.classTemplate.name}</p>
                <p className="text-xs text-gray-400">{activeClass.academicYear.year} · {activeClass.classTemplate.classLevel.replace("_", " ")}</p>
              </div>
              {hasOverride(selectedClass) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => removeOverride(selectedClass)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Remove Override
                </Button>
              )}
            </div>

            <SlotEditor
              configs={getConfigs(selectedClass)}
              selected={selectedDay}
              onSelectDay={setSelectedDay}
              onUpdateDay={(day, patch) => updateDay(selectedClass, day, patch)}
              onSaveDay={(day) => saveDay(selectedClass, day)}
              saving={saving ? saving.split(":")[1] === selectedDay ? selectedDay : null : null}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-gray-400">
              <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a class to configure its day schedule</p>
              <p className="text-xs mt-1 opacity-70">Classes without a custom config inherit the general school schedule</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function DayConfigTab({
  schoolId,
  classYears,
}: {
  schoolId:   string;
  classYears: ClassYear[];
}) {
  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList className="w-full max-w-xs">
        <TabsTrigger value="general" className="flex-1 gap-1.5">
          <School className="h-3.5 w-3.5" />General
        </TabsTrigger>
        <TabsTrigger value="per-class" className="flex-1 gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />Per Class
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <GeneralDayConfig schoolId={schoolId} />
      </TabsContent>

      <TabsContent value="per-class">
        <ClassDayConfigPanel schoolId={schoolId} classYears={classYears} />
      </TabsContent>
    </Tabs>
  );
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total  = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function timeDiffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

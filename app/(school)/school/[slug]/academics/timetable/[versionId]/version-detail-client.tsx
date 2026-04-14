"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge }  from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

const SLOT_TYPE_COLORS: Record<string, string> = {
  LESSON:   "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  BREAK:    "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  LUNCH:    "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
  PREP:     "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
  FREE:     "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700",
  ASSEMBLY: "bg-purple-50 border-purple-200",
};

export default function VersionDetailClient({
  version, slots, slug,
}: {
  version: any;
  slots:   any[];
  slug:    string;
}) {
  const [conflicts, setConflicts] = useState<any[]>(version.conflicts ?? []);
  const [resolving, setResolving] = useState<string | null>(null);

  // Group slots by stream, then by day
  const streams = [...new Map(slots.map(s => [s.stream.id, s.stream])).values()];
  const byStream = new Map<string, Map<string, any[]>>();
  for (const slot of slots) {
    if (!byStream.has(slot.stream.id)) byStream.set(slot.stream.id, new Map());
    const dayMap = byStream.get(slot.stream.id)!;
    if (!dayMap.has(slot.dayOfWeek)) dayMap.set(slot.dayOfWeek, []);
    dayMap.get(slot.dayOfWeek)!.push(slot);
  }

  const activeDays = DAYS.filter(d => slots.some(s => s.dayOfWeek === d));
  const errorCount = conflicts.filter(c => c.severity === "ERROR" && !c.isResolved).length;

  async function resolveConflict(conflictId: string) {
    setResolving(conflictId);
    try {
      const res = await fetch(
        `/api/timetable/versions/${version.id}/conflicts?conflictId=${conflictId}`,
        { method: "PATCH" }
      );
      if (res.ok) {
        setConflicts(prev => prev.map(c => c.id === conflictId ? { ...c, isResolved: true } : c));
      }
    } finally {
      setResolving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/school/${slug}/academics/timetable`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
          </Link>
        </Button>
        <div className="flex gap-3 text-sm text-gray-500">
          <span>{slots.length} slots</span>
          <span>{conflicts.length} conflicts</span>
          {errorCount > 0 && (
            <span className="text-red-600 font-medium">{errorCount} unresolved errors</span>
          )}
        </div>
      </div>

      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Timetable Grid</TabsTrigger>
          <TabsTrigger value="conflicts">
            Conflicts
            {errorCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{errorCount}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6 mt-4">
          {streams.map(stream => {
            const dayMap = byStream.get(stream.id)!;
            return (
              <Card key={stream.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{stream.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${activeDays.length}, 1fr)` }}>
                    {activeDays.map(day => (
                      <div key={day} className="space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 text-center">
                          {day.slice(0, 3)}
                        </p>
                        {(dayMap.get(day) ?? []).map((slot: any) => {
                          const teacher = slot.streamSubject?.teacherAssignments?.[0]?.teacher;
                          return (
                            <div
                              key={slot.id}
                              className={`rounded-lg border p-2 text-xs ${SLOT_TYPE_COLORS[slot.slotType] ?? ""}`}
                            >
                              <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                                {slot.streamSubject?.subject?.name ?? slot.slotType}
                              </p>
                              {teacher && (
                                <p className="text-gray-500 truncate">
                                  {teacher.firstName} {teacher.lastName}
                                </p>
                              )}
                              <p className="text-gray-400">{slot.startTime}–{slot.endTime}</p>
                            </div>
                          );
                        })}
                        {!dayMap.has(day) && (
                          <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-300 text-center">—</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {streams.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-gray-400 text-sm">No slots in this version.</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-3 mt-4">
          {conflicts.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-green-600 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                No conflicts detected.
              </CardContent>
            </Card>
          )}
          {conflicts.map(c => (
            <Card key={c.id} className={c.isResolved ? "opacity-50" : ""}>
              <CardContent className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${c.severity === "ERROR" ? "text-red-500" : "text-amber-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{c.conflictType}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                    {c.dayOfWeek && <p className="text-xs text-gray-400">{c.dayOfWeek} · slot {c.slotNumber}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={c.severity === "ERROR" ? "destructive" : "secondary"} className="text-xs">
                    {c.severity}
                  </Badge>
                  {!c.isResolved && (
                    <Button size="sm" variant="outline" onClick={() => resolveConflict(c.id)} disabled={resolving === c.id}>
                      {resolving === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Resolve"}
                    </Button>
                  )}
                  {c.isResolved && <span className="text-xs text-green-600">Resolved</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input }   from "@/components/ui/input";
import { Button }  from "@/components/ui/button";
import { Switch }  from "@/components/ui/switch";
import { Loader2, Save, CheckCircle2, BookOpen, Search, X } from "lucide-react";

type SubjectConfig = {
  id?:           string;
  lessonsPerWeek: number;
  allowDoubles:   boolean;
};

type ClassSubject = {
  id:              string;
  subject:         { name: string; code: string | null };
  timetableConfig: SubjectConfig | null;
};

type ClassYear = {
  id:            string;
  classTemplate: { name: string; classLevel: string };
  academicYear:  { year: string };
  classSubjects: ClassSubject[];
};

export default function SubjectPeriodsTab({
  classYears: initialClassYears,
}: {
  classYears: ClassYear[];
}) {
  const [selectedClass, setSelectedClass] = useState<string | null>(
    initialClassYears[0]?.id ?? null
  );
  const [search,  setSearch]  = useState("");
  const [configs, setConfigs] = useState<Record<string, SubjectConfig>>(() => {
    const init: Record<string, SubjectConfig> = {};
    for (const cy of initialClassYears) {
      for (const cs of cy.classSubjects) {
        init[cs.id] = {
          lessonsPerWeek: cs.timetableConfig?.lessonsPerWeek ?? 3,
          allowDoubles:   cs.timetableConfig?.allowDoubles   ?? false,
        };
      }
    }
    return init;
  });
  const [saving, setSaving] = useState<string | null>(null); // classSubjectId
  const [saved,  setSaved]  = useState<Set<string>>(new Set());

  const activeClass = initialClassYears.find(cy => cy.id === selectedClass);

  const query    = search.trim().toLowerCase();
  const subjects = (activeClass?.classSubjects ?? []).filter(cs =>
    !query ||
    cs.subject.name.toLowerCase().includes(query) ||
    (cs.subject.code ?? "").toLowerCase().includes(query)
  );

  function update(classSubjectId: string, patch: Partial<SubjectConfig>) {
    setConfigs(prev => ({ ...prev, [classSubjectId]: { ...prev[classSubjectId], ...patch } }));
    setSaved(prev => { const s = new Set(prev); s.delete(classSubjectId); return s; });
  }

  async function save(classSubjectId: string) {
    setSaving(classSubjectId);
    try {
      await fetch("/api/timetable/subject-config", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          classSubjectId,
          lessonsPerWeek: configs[classSubjectId]?.lessonsPerWeek ?? 3,
          allowDoubles:   configs[classSubjectId]?.allowDoubles   ?? false,
        }),
      });
      setSaved(prev => new Set([...prev, classSubjectId]));
    } finally {
      setSaving(null);
    }
  }

  async function saveAll() {
    if (!activeClass) return;
    for (const cs of activeClass.classSubjects) {
      await save(cs.id);
    }
  }

  const allSaved = (activeClass?.classSubjects ?? []).every(cs => saved.has(cs.id));

  if (initialClassYears.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-400">
          <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
          No active classes found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      {/* Class list */}
      <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
        {initialClassYears.map(cy => {
          const isSelected = selectedClass === cy.id;
          return (
            <button
              key={cy.id}
              onClick={() => { setSelectedClass(cy.id); setSearch(""); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isSelected
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
            >
              <p className="font-medium">{cy.classTemplate.name}</p>
              <p className={`text-xs ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                {cy.academicYear.year} · {cy.classSubjects.length} subjects
              </p>
            </button>
          );
        })}
      </div>

      {/* Subject editor */}
      {activeClass ? (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search subjects…"
                className="pl-8 pr-8 h-8 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={saveAll} disabled={!!saving || allSaved}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Save All
            </Button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_100px_80px_44px] gap-3 px-3 text-xs font-medium text-gray-400">
            <span>Subject</span>
            <span>Periods/week</span>
            <span>Doubles</span>
            <span></span>
          </div>

          {subjects.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-400 text-sm">
                {query ? `No subjects match "${search}"` : "No subjects assigned to this class."}
              </CardContent>
            </Card>
          )}

          {subjects.map(cs => {
            const cfg      = configs[cs.id] ?? { lessonsPerWeek: 3, allowDoubles: false };
            const isSaving = saving === cs.id;
            const isSaved  = saved.has(cs.id);

            return (
              <div
                key={cs.id}
                className="grid grid-cols-[1fr_100px_80px_44px] gap-3 items-center px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {/* Subject name */}
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cs.subject.name}</p>
                  {cs.subject.code && <p className="text-xs text-gray-400">{cs.subject.code}</p>}
                </div>

                {/* Periods per week */}
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={cfg.lessonsPerWeek}
                  onChange={e => update(cs.id, { lessonsPerWeek: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="h-8 text-sm text-center"
                />

                {/* Allow doubles */}
                <div className="flex justify-center">
                  <Switch
                    checked={cfg.allowDoubles}
                    onCheckedChange={v => update(cs.id, { allowDoubles: v })}
                  />
                </div>

                {/* Save */}
                <Button
                  size="sm"
                  variant={isSaved ? "ghost" : "outline"}
                  onClick={() => save(cs.id)}
                  disabled={isSaving}
                  className="h-8 w-8 p-0"
                >
                  {isSaving
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : isSaved
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      : <Save className="h-3.5 w-3.5" />}
                </Button>
              </div>
            );
          })}

          {subjects.length > 0 && (
            <p className="text-xs text-gray-400 px-3 pt-1">
              "Doubles" allows two consecutive periods for this subject in one day.
            </p>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Select a class to configure subject periods</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

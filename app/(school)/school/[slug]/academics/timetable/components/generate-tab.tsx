"use client";

import { useState } from "react";
import { Button }   from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Badge }    from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react";

type Term = { id: string; name: string; termNumber: number };
type Year = { id: string; year: string; terms: Term[] };

export default function GenerateTab({
  schoolId, years, onGenerated,
}: {
  schoolId:    string;
  years:       Year[];
  onGenerated: (v: any) => void;
}) {
  const [yearId,    setYearId]    = useState("");
  const [termId,    setTermId]    = useState("");
  const [label,     setLabel]     = useState("");
  const [duration,  setDuration]  = useState<number>(40);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<any>(null);

  const selectedYear = years.find(y => y.id === yearId);
  const terms        = selectedYear?.terms ?? [];

  async function handleValidate() {
    if (!yearId || !termId) return;
    setValidating(true);
    setValidation(null);
    try {
      const res  = await fetch("/api/timetable/validate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ schoolId, academicYearId: yearId, termId }),
      });
      setValidation(await res.json());
    } finally {
      setValidating(false);
    }
  }

  async function handleGenerate() {
    if (!yearId || !termId) return;
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch("/api/timetable/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ schoolId, academicYearId: yearId, termId, label: label || undefined, lessonDurationMin: duration }),
      });
      const data = await res.json();
      setResult(data);
      if (data.versionId) onGenerated({ id: data.versionId, versionNumber: data.versionNumber, label: label || `Version ${data.versionNumber}`, status: "DRAFT", termId, generatedAt: new Date().toISOString(), publishedAt: null, _count: { slots: data.placedCount, conflicts: data.conflicts?.length ?? 0 } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Config card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate Timetable</CardTitle>
          <CardDescription>Select a term and run the constraint-based generator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Academic Year</Label>
            <Select value={yearId} onValueChange={v => { setYearId(v); setTermId(""); setValidation(null); setResult(null); }}>
              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y.id} value={y.id}>{y.year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Term</Label>
            <Select value={termId} onValueChange={v => { setTermId(v); setValidation(null); setResult(null); }} disabled={!yearId}>
              <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
              <SelectContent>
                {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Version Label <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Input placeholder="e.g. Term 1 Draft" value={label} onChange={e => setLabel(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Lesson Duration <span className="text-gray-400 text-xs">(minutes per period)</span></Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={20}
                max={180}
                step={5}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-28"
              />
              <span className="text-sm text-gray-500">min</span>
              <span className="text-xs text-gray-400 ml-1">
                {duration >= 60
                  ? `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ""}`.trim()
                  : ""}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Overrides slot end times for LESSON/PREP slots. Break and lunch times are unchanged.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleValidate} disabled={!yearId || !termId || validating}>
              {validating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Validate
            </Button>
            <Button onClick={handleGenerate} disabled={!yearId || !termId || loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results card */}
      <div className="space-y-4">
        {validation && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {validation.ready
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <AlertCircle className="h-4 w-4 text-red-500" />}
                Validation {validation.ready ? "Passed" : "Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {validation.errors?.map((e: string, i: number) => (
                <div key={i} className="flex gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <p>{e}</p>
                </div>
              ))}
              {validation.warnings?.map((w: string, i: number) => (
                <div key={i} className="flex gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <p>{w}</p>
                </div>
              ))}
              {validation.ready && !validation.warnings?.length && (
                <p className="text-green-600 dark:text-green-400">All checks passed. Ready to generate.</p>
              )}
              {!validation.ready && (
                <p className="text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  Fix the errors above before generating. Warnings are informational only.
                </p>
              )}
              {validation.ready && validation.warnings?.length > 0 && (
                <p className="text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  Warnings are informational — generation can proceed.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {result.success
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <AlertCircle className="h-4 w-4 text-amber-500" />}
                Generation {result.success ? "Complete" : "Partial"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {result.error && <p className="text-red-600">{result.error}</p>}
              {result.versionId && (
                <>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{result.placedCount}</p>
                      <p className="text-xs text-gray-500">slots placed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {result.conflicts?.filter((c: any) => c.severity === "ERROR").length ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">errors</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {result.conflicts?.filter((c: any) => c.severity === "WARNING").length ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">warnings</p>
                    </div>
                  </div>
                  {result.generationStats && (
                    <div className="rounded-md bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                      <p>Genetic algorithm · {result.generationStats.generationsRun} generations · pop {result.generationStats.populationSize}</p>
                      <p>Fitness: {result.generationStats.finalBestFitness.toFixed(4)} · stopped: {result.generationStats.stoppedReason.replace("_", " ").toLowerCase()}</p>
                    </div>
                  )}
                </>
              )}
              {/* Skipped subjects (no teacher) */}
              {result.conflicts?.some((c: any) => c.conflictType === "NO_TEACHER_ASSIGNED") && (
                <div className="flex gap-1.5 text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <p>
                    {result.conflicts.filter((c: any) => c.conflictType === "NO_TEACHER_ASSIGNED").length} subject(s) skipped — no teacher assigned. Assign teachers and regenerate to include them.
                  </p>
                </div>
              )}
              {result.conflicts?.filter((c: any) => c.conflictType !== "NO_TEACHER_ASSIGNED").slice(0, 5).map((c: any, i: number) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Badge variant={c.severity === "ERROR" ? "destructive" : "secondary"} className="text-xs shrink-0">{c.severity}</Badge>
                  <p className="text-gray-600 dark:text-gray-400">{c.description}</p>
                </div>
              ))}
              {(result.conflicts?.filter((c: any) => c.conflictType !== "NO_TEACHER_ASSIGNED").length ?? 0) > 5 && (
                <p className="text-xs text-gray-400">+{result.conflicts.filter((c: any) => c.conflictType !== "NO_TEACHER_ASSIGNED").length - 5} more — view in Versions tab</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

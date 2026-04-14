// app/school/[slug]/academics/report-cards/components/report-cards-client.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { toast }    from "sonner";
import {
  FileText, Settings2, Eye, Loader2,
  CheckCircle2, Users, ChevronDown, ChevronRight, Palette, BookOpen, Calendar,
} from "lucide-react";
import {
  computeStreamResults,
  generateStreamReportCards,
} from "@/actions/result-computation";
import ReportCardPreview from "../report-card-preview";
import MidtermReportCardPreview from "../midterm-report-card-preview";
import ALevelReportCardPreview from "../alevel-report-card-preview";
import AOIReportPreview from "../aoi-report-preview";

// ── Types ─────────────────────────────────────────────────────────────────────

type TermInfo = { id: string; name: string; termNumber: number; isActive: boolean };
type YearInfo = { id: string; year: string; isActive: boolean; terms: TermInfo[] };

type StreamData = {
  streamId:        string;
  streamName:      string;
  className:       string;
  classLevel:      string;
  academicYearId:  string;
  enrollmentsByTerm: Record<string, { total: number; withReports: number; published: number }>;
};

type School = {
  name: string | null; motto: string | null; logo: string | null;
  address: string | null; contact: string | null; contact2: string | null;
  email: string | null; email2: string | null;
} | null;

export type ReportCardFormat = "classic" | "modern";

export type ReportCardTheme = {
  primaryColor: string; headerBg: string; headerText: string;
  accentColor: string; tableHeaderBg: string; tableHeaderText: string; footerBg: string;
};

const PRESET_THEMES: Record<string, { label: string; theme: ReportCardTheme }> = {
  maroon: { label: "Maroon & Gold", theme: { primaryColor: "#8B1A1A", headerBg: "#8B1A1A", headerText: "#FFFFFF", accentColor: "#C9A227", tableHeaderBg: "#8B1A1A", tableHeaderText: "#FFFFFF", footerBg: "#F5F0E8" } },
  navy:   { label: "Navy Blue",     theme: { primaryColor: "#1B3A6B", headerBg: "#1B3A6B", headerText: "#FFFFFF", accentColor: "#2A7AE2", tableHeaderBg: "#1B3A6B", tableHeaderText: "#FFFFFF", footerBg: "#EEF4FB" } },
  green:  { label: "Forest Green",  theme: { primaryColor: "#1A5C2A", headerBg: "#1A5C2A", headerText: "#FFFFFF", accentColor: "#3A9B52", tableHeaderBg: "#1A5C2A", tableHeaderText: "#FFFFFF", footerBg: "#EEF7F0" } },
  purple: { label: "Royal Purple",  theme: { primaryColor: "#4A1A8B", headerBg: "#4A1A8B", headerText: "#FFFFFF", accentColor: "#7C3AE2", tableHeaderBg: "#4A1A8B", tableHeaderText: "#FFFFFF", footerBg: "#F3EEF9" } },
  black:  { label: "Black & Gold",  theme: { primaryColor: "#1A1A1A", headerBg: "#1A1A1A", headerText: "#FFFFFF", accentColor: "#D4A017", tableHeaderBg: "#1A1A1A", tableHeaderText: "#FFFFFF", footerBg: "#F5F5F0" } },
};

type Props = {
  streams:       StreamData[];
  school:        School;
  years:         YearInfo[];
  defaultYearId: string;
  defaultTermId: string;
  schoolId:      string;
  slug:          string;
  approverId:    string;
};

export default function ReportCardsClient({
  streams, school, years, defaultYearId, defaultTermId, schoolId, slug, approverId,
}: Props) {
  // ── Year / term selection ─────────────────────────────────────────────────
  const [selectedYearId, setSelectedYearId] = useState(defaultYearId);
  const [selectedTermId, setSelectedTermId] = useState(defaultTermId);

  const selectedYear = years.find(y => y.id === selectedYearId) ?? years[0];
  const selectedTerm = selectedYear?.terms.find(t => t.id === selectedTermId) ?? selectedYear?.terms[0];

  const handleYearChange = (yearId: string) => {
    setSelectedYearId(yearId);
    const yr = years.find(y => y.id === yearId);
    if (yr) {
      const t = yr.terms.find(t => t.isActive) ?? yr.terms[0];
      if (t) setSelectedTermId(t.id);
    }
  };

  // ── Design state ──────────────────────────────────────────────────────────
  const [format,         setFormat]         = useState<ReportCardFormat>("classic");
  const [selectedTheme,  setSelectedTheme]  = useState("maroon");
  const [customColor,    setCustomColor]    = useState("#8B1A1A");
  const [useCustom,      setUseCustom]      = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // ── Report type ───────────────────────────────────────────────────────────
  const [reportType,   setReportType]   = useState<"end-of-term" | "midterm" | "aoi">("end-of-term");
  const [midtermExams, setMidtermExams] = useState<{ bot: boolean; mte: boolean }>({ bot: true, mte: true });

  // ── Actions ───────────────────────────────────────────────────────────────
  const [isPending,     startTransition]  = useTransition();
  const [loadingKey,    setLoadingKey]    = useState<string | null>(null);
  const [previewStream, setPreviewStream] = useState<{ id: string; classLevel: string } | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const theme: ReportCardTheme = useCustom
    ? { primaryColor: customColor, headerBg: customColor, headerText: "#FFFFFF", accentColor: customColor, tableHeaderBg: customColor, tableHeaderText: "#FFFFFF", footerBg: "#F9F9F9" }
    : PRESET_THEMES[selectedTheme]?.theme ?? PRESET_THEMES.maroon.theme;

  // ── Filter streams for selected year + term ───────────────────────────────
  const filteredStreams = useMemo(() => {
    if (!selectedTerm) return [];
    return streams
      .filter(s => s.academicYearId === selectedYearId)
      .map(s => {
        const counts = s.enrollmentsByTerm[selectedTerm.id] ?? { total: 0, withReports: 0, published: 0 };
        return {
          streamId:      s.streamId,
          streamName:    s.streamName,
          className:     s.className,
          classLevel:    s.classLevel,
          totalStudents: counts.total,
          withReports:   counts.withReports,
          published:     counts.published,
        };
      })
      .filter(s => s.totalStudents > 0);
  }, [streams, selectedYearId, selectedTerm]);

  const byClass = filteredStreams.reduce<Record<string, typeof filteredStreams>>((acc, s) => {
    if (!acc[s.className]) acc[s.className] = [];
    acc[s.className].push(s);
    return acc;
  }, {});

  const toggleClass = (name: string) =>
    setExpandedClasses(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; });

  const generateForStream = (streamId: string, streamName: string) => {
    if (!selectedTerm) return;
    const key = `gen-${streamId}`;
    setLoadingKey(key);
    startTransition(async () => {
      const r1 = await computeStreamResults({ streamId, termId: selectedTerm.id, slug });
      if (!r1.ok) { toast.error(`Compute failed: ${r1.message}`); setLoadingKey(null); return; }
      const r2 = await generateStreamReportCards({ streamId, termId: selectedTerm.id, slug });
      if (r2.ok) toast.success(`${streamName} — ${r2.message}`);
      else       toast.error(r2.message);
      setLoadingKey(null);
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" /> Report Cards
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {selectedYear?.year} · {selectedTerm?.name}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCustomizer(p => !p)} className="gap-2">
          <Palette className="h-4 w-4" /> Customise Design
        </Button>
      </div>

      {/* Year + Term selectors */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">Period</span>

        <div className="flex flex-wrap gap-2">
          {years.map(y => (
            <button key={y.id} onClick={() => handleYearChange(y.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selectedYearId === y.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300"
              }`}>
              {y.year}
              {y.isActive && <span className="ml-1 text-[10px] opacity-80">●</span>}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

        <div className="flex flex-wrap gap-2">
          {(selectedYear?.terms ?? []).map(t => (
            <button key={t.id} onClick={() => setSelectedTermId(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selectedTermId === t.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300"
              }`}>
              {t.name}
              {t.isActive && <span className="ml-1 text-[10px] opacity-80">●</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Report type selector */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">Report Type</span>
        <div className="flex gap-2">
          {([
            ["end-of-term", "End of Term"],
            ["midterm",     "Midterm"],
            ["aoi",         "AOI Only"],
          ] as const).map(([rt, label]) => (
            <button key={rt} onClick={() => setReportType(rt)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                reportType === rt
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300"
              }`}>
              {label}
            </button>
          ))}
        </div>
        {reportType === "midterm" && (
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 font-medium">Show exams:</span>
            {(["bot", "mte"] as const).map(ex => (
              <label key={ex} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={midtermExams[ex]}
                  onChange={e => setMidtermExams(p => ({ ...p, [ex]: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300 uppercase">{ex}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Design customiser */}
      {showCustomizer && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Report Card Design
          </h2>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Format</p>
            <div className="flex gap-3">
              {(["classic", "modern"] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                    format === f ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 capitalize mb-1">{f}</div>
                  <p className="text-xs text-slate-500">
                    {f === "classic" ? "Traditional table layout — subject, mark, grade, remark, teacher." : "Modern card layout — continuous assessment topics, competencies, scores."}
                  </p>
                  <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-20" style={{ backgroundColor: theme.headerBg }}>
                    <div className="h-6 flex items-center px-2">
                      <div className="text-xs font-bold" style={{ color: theme.headerText }}>{school?.name ?? "SCHOOL NAME"}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 h-14 px-2 pt-1">
                      {f === "classic" ? (
                        <div className="space-y-1">
                          {["Mathematics", "English", "Biology"].map(s => (
                            <div key={s} className="flex gap-2 text-xs">
                              <span className="flex-1 text-slate-600 dark:text-slate-400">{s}</span>
                              <span className="w-8 text-right text-slate-500">72</span>
                              <span className="w-6 font-medium" style={{ color: theme.accentColor }}>C3</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {["English — Personal life", "Maths — Number Bases"].map(s => (
                            <div key={s} className="flex gap-2 text-xs">
                              <span className="flex-1 text-slate-600 dark:text-slate-400 truncate">{s}</span>
                              <span className="font-medium" style={{ color: theme.accentColor }}>8/10</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Colour Theme</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESET_THEMES).map(([key, { label, theme: t }]) => (
                <button key={key} onClick={() => { setSelectedTheme(key); setUseCustom(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    !useCustom && selectedTheme === key ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 font-medium" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}>
                  <span className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: t.headerBg }} />
                  <span className="text-slate-700 dark:text-slate-300">{label}</span>
                </button>
              ))}
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${
                useCustom ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 font-medium" : "border-slate-200 dark:border-slate-700"
              }`}>
                <input type="color" value={customColor}
                  onChange={e => { setCustomColor(e.target.value); setUseCustom(true); }}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" />
                <span className="text-slate-700 dark:text-slate-300">Custom…</span>
              </label>
            </div>
          </div>
          <div className="h-10 rounded-lg overflow-hidden flex items-center px-4 gap-3" style={{ backgroundColor: theme.headerBg }}>
            <span className="text-sm font-bold" style={{ color: theme.headerText }}>{school?.name ?? "School Name"}</span>
            <span className="text-xs opacity-70" style={{ color: theme.headerText }}>· {selectedTerm?.name} Report</span>
          </div>
        </div>
      )}

      {/* Stream list */}
      <div className="space-y-3">
        {Object.entries(byClass).map(([className, classStreams]) => {
          const isExpanded = expandedClasses.has(className);
          return (
            <div key={className} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => toggleClass(className)}
                className="w-full flex items-center gap-2 px-5 py-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors">
                {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{className}</span>
                <span className="text-sm text-slate-400">{classStreams.length} stream{classStreams.length !== 1 ? "s" : ""}</span>
              </button>

              {isExpanded && classStreams.map(s => {
                const genKey = `gen-${s.streamId}`;
                const isGen  = isPending && loadingKey === genKey;
                const pct    = s.totalStudents > 0 ? Math.round((s.withReports / s.totalStudents) * 100) : 0;

                return (
                  <div key={s.streamId}
                    className="flex items-center gap-4 px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-900">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{className} {s.streamName}</p>
                        {s.classLevel && (
                          <Badge variant="outline" className="text-xs">{s.classLevel.replace("_", "-")}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {s.totalStudents} students</span>
                        <span>{s.withReports}/{s.totalStudents} reports generated</span>
                        {s.published > 0 && <span className="text-green-600 dark:text-green-400">{s.published} published</span>}
                      </div>
                      <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full w-48">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: theme.primaryColor }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {reportType === "aoi" ? (
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                          onClick={() => setPreviewStream({ id: s.streamId, classLevel: s.classLevel })}>
                          <Eye className="h-3.5 w-3.5" /> AOI Report
                        </Button>
                      ) : (
                        <>
                          {s.withReports > 0 && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                              onClick={() => setPreviewStream({ id: s.streamId, classLevel: s.classLevel })}>
                              <Eye className="h-3.5 w-3.5" /> Preview
                            </Button>
                          )}
                          <Button size="sm" className="gap-1.5 text-xs text-white"
                            style={{ backgroundColor: theme.primaryColor }}
                            disabled={isGen}
                            onClick={() => generateForStream(s.streamId, `${className} ${s.streamName}`)}>
                            {isGen
                              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                              : s.withReports === s.totalStudents && s.withReports > 0
                              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Regenerate</>
                              : <><FileText className="h-3.5 w-3.5" /> Generate</>
                            }
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {filteredStreams.length === 0 && (
          <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No streams with students found</p>
            <p className="text-sm mt-1">for {selectedYear?.year} · {selectedTerm?.name}</p>
          </div>
        )}
      </div>

      {/* Preview modals */}
      {previewStream && selectedTerm && reportType === "end-of-term" && previewStream.classLevel === "A_LEVEL" && (
        <ALevelReportCardPreview
          streamId={previewStream.id}
          termId={selectedTerm.id}
          format={format}
          theme={theme}
          school={school}
          academicYear={selectedYear?.year ?? ""}
          termName={selectedTerm.name}
          onClose={() => setPreviewStream(null)}
        />
      )}
      {previewStream && selectedTerm && reportType === "end-of-term" && previewStream.classLevel !== "A_LEVEL" && (
        <ReportCardPreview
          streamId={previewStream.id}
          termId={selectedTerm.id}
          format={format}
          theme={theme}
          school={school}
          academicYear={selectedYear?.year ?? ""}
          termName={selectedTerm.name}
          onClose={() => setPreviewStream(null)}
        />
      )}
      {previewStream && selectedTerm && reportType === "midterm" && (
        <MidtermReportCardPreview
          streamId={previewStream.id}
          termId={selectedTerm.id}
          theme={theme}
          school={school}
          academicYear={selectedYear?.year ?? ""}
          termName={selectedTerm.name}
          showBOT={midtermExams.bot}
          showMTE={midtermExams.mte}
          onClose={() => setPreviewStream(null)}
        />
      )}
      {previewStream && selectedTerm && reportType === "aoi" && (
        <AOIReportPreview
          streamId={previewStream.id}
          termId={selectedTerm.id}
          theme={theme}
          school={school}
          academicYear={selectedYear?.year ?? ""}
          termName={selectedTerm.name}
          onClose={() => setPreviewStream(null)}
        />
      )}
    </div>
  );
}

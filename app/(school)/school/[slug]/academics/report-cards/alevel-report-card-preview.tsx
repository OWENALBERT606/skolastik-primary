// app/(school)/school/[slug]/academics/report-cards/alevel-report-card-preview.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button }  from "@/components/ui/button";
import { toast }   from "sonner";
import { X, Loader2, Printer } from "lucide-react";
import { ReportCardFormat, ReportCardTheme } from "./components/report-cards-client";
import {
  WATERMARKS, BORDERS, BorderOverlay,
  type WatermarkId, type BorderId,
  type ReportCardData,
} from "./report-card-preview";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Map grade code to UACE letter (for MAJOR subjects only) */
function aLevelScoreLetter(grade: string | null, isSubsidiary: boolean): string {
  if (!grade) return "—";
  if (isSubsidiary) return grade; // subsidiary: show O-level grade as-is
  const map: Record<string, string> = {
    D1: "A", D2: "B", C3: "C", C4: "D", C5: "E", C6: "O",
    P7: "F", P8: "F", F9: "F",
  };
  return map[grade] ?? grade;
}

function gradeComment(grade: string | null): string {
  if (!grade) return "—";
  const map: Record<string, string> = {
    D1: "VERY GOOD", D2: "GOOD",    C3: "CREDIT",   C4: "PASS",
    C5: "PASS",      C6: "ORDINARY", P7: "FAIL",     P8: "FAIL", F9: "FAIL",
  };
  return map[grade] ?? "—";
}

function parseRawMark(raw: string | null): string {
  if (!raw) return "—";
  const [marks] = raw.split("/").map(Number);
  return isNaN(marks) ? "—" : String(Math.round(marks));
}

function buildCombination(subjects: ReportCardData["subjects"]): string {
  const major = subjects.filter(s => !s.isSubsidiary);
  const sub   = subjects.filter(s => s.isSubsidiary);
  const majorPart = major
    .map(s => (s.subjectCode ? s.subjectCode.split(/\s+/)[0] : s.subjectName.slice(0, 3)).toUpperCase())
    .join("");
  const subPart = sub
    .map(s => (s.subjectCode ? s.subjectCode.split(/\s+/)[0] : s.subjectName.slice(0, 3)).toUpperCase())
    .join("/");
  return subPart ? `${majorPart}/${subPart}` : majorPart;
}

function autoClassComment(avg: number | null, name: string): string {
  const first = name.split(" ")[0];
  if (avg == null) return `${first} has shown effort this term. Keep working hard.`;
  if (avg >= 80) return `${first} has demonstrated exceptional performance. Outstanding results — keep it up!`;
  if (avg >= 70) return `${first} has performed very well. With continued dedication, even greater heights are achievable.`;
  if (avg >= 60) return `${first} has shown satisfactory performance. More focus and consistent study will yield better results.`;
  if (avg >= 50) return `${first} has made reasonable effort but needs to work harder. Regular revision is encouraged.`;
  return `${first} needs to improve significantly. Please seek extra help and dedicate more time to studies.`;
}

function autoHeadComment(avg: number | null): string {
  if (avg == null) return "We encourage this student to strive for excellence in all areas.";
  if (avg >= 80) return "A truly commendable performance. The school is proud of this student's achievement. Keep soaring!";
  if (avg >= 70) return "Well done! This is a good performance. We encourage continued hard work and dedication.";
  if (avg >= 60) return "A satisfactory performance. We believe this student can do better with more effort and focus.";
  return "There is room for improvement. We urge this student to take studies more seriously next term.";
}

// ── Style helpers ──────────────────────────────────────────────────────────────

function th(align: "left" | "center" | "right", extra?: React.CSSProperties): React.CSSProperties {
  return {
    border: "1px solid #bbb", padding: "4px 5px",
    textAlign: align, fontWeight: 700, fontSize: "12px",
    backgroundColor: "#f0f0f0",
    ...extra,
  };
}

function td(align: "left" | "center" | "right", extra?: React.CSSProperties): React.CSSProperties {
  return {
    border: "1px solid #ccc", padding: "3px 5px",
    textAlign: align, fontSize: "12px", fontWeight: 700,
    ...extra,
  };
}

// ── Fetch helper ───────────────────────────────────────────────────────────────

async function fetchReportCards(streamId: string, termId: string, studentId?: string): Promise<ReportCardData[]> {
  const params = new URLSearchParams({ streamId, termId });
  if (studentId) params.set("studentId", studentId);
  const res = await fetch(`/api/report-cards?${params}`);
  if (!res.ok) throw new Error("Failed to load report cards");
  return res.json();
}

// ── A-Level Report Card ────────────────────────────────────────────────────────

export function ALevelReportCard({ data, theme, school, academicYear, termName, termEndDate, nextTermDate, watermarkId, borderId, includeAoi }: {
  data: ReportCardData; theme: ReportCardTheme;
  school: { name?: string | null; motto?: string | null; logo?: string | null; address?: string | null; contact?: string | null; contact2?: string | null; email?: string | null; email2?: string | null } | null;
  academicYear: string; termName: string;
  termEndDate: string; nextTermDate: string;
  watermarkId: WatermarkId; borderId: BorderId;
  includeAoi: boolean;
}) {
  const primary  = theme.primaryColor ?? "#1a3a6b";
  const accent   = theme.accentColor  ?? "#c8a400";
  const wm       = WATERMARKS.find(w => w.id === watermarkId) ?? WATERMARKS[0];
  const combination = buildCombination(data.subjects);

  const classComment = data.classTeacherComment || autoClassComment(data.averageMark, data.studentName);
  const headComment  = data.headTeacherComment  || autoHeadComment(data.averageMark);

  // Separate major and subsidiary subjects
  const majorSubjects = data.subjects.filter(s => !s.isSubsidiary);
  const subSubjects   = data.subjects.filter(s => s.isSubsidiary);
  const allSubjects   = [...majorSubjects, ...subSubjects]; // majors first

  return (
    <div
      className="bg-white text-black font-sans"
      style={{
        width: "210mm", minHeight: "297mm",
        margin: "0 auto", padding: "12mm 10mm 8mm",
        fontSize: "12px", fontWeight: 700,
        position: "relative", boxSizing: "border-box",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Watermark tile */}
      {wm.id !== "none" && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: wm.css, backgroundSize: wm.size, opacity: wm.opacity,
        }} />
      )}

      {/* Logo watermark */}
      {school?.logo && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img src={school.logo} alt="" style={{ width: "400px", height: "400px", objectFit: "contain", opacity: 0.15 }} />
        </div>
      )}

      {/* Border */}
      <BorderOverlay borderId={borderId} primary={primary} accent={accent} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, gap: "4px" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ width: "120px", flexShrink: 0 }}>
            {school?.logo
              ? <img src={school.logo} alt="Badge" style={{ width: "120px", height: "120px", objectFit: "contain" }} />
              : <div style={{ width: "120px", height: "120px", border: "2px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#aaa" }}>BADGE</div>
            }
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "0 8px" }}>
            <div style={{ fontWeight: 900, fontSize: "24px", textTransform: "uppercase", color: primary, letterSpacing: "1px", lineHeight: 1.1, marginBottom: "3px" }}>
              {school?.name ?? "SCHOOL NAME"}
            </div>
            {school?.address && <div style={{ fontSize: "12px", color: "#444", marginBottom: "2px" }}>{school.address}</div>}
            {school?.contact && <div style={{ fontSize: "12px", color: "#444", marginBottom: "2px" }}>
              {school.contact}{school.contact2 ? `/${school.contact2}` : ""}
              {school.email ? `,${school.email}` : ""}
            </div>}
            {school?.motto && <div style={{ fontSize: "13px", fontStyle: "italic", fontWeight: 900, textDecoration: "underline", marginTop: "3px" }}>
              MOTTO: {school.motto}
            </div>}
          </div>
          <div style={{ width: "120px", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
            {data.imageUrl
              ? <img src={data.imageUrl} alt="Student" style={{ width: "95px", height: "120px", objectFit: "cover", border: "1px solid #bbb" }} />
              : <div style={{ width: "95px", height: "120px", border: "1px solid #bbb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#aaa", backgroundColor: "#f9f9f9" }}>PHOTO</div>
            }
          </div>
        </div>

        {/* ── STUDENT INFO ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #aaa" }}>
          <tbody>
            <tr>
              <td style={{ ...td("left"), width: "100px", border: "1px solid #aaa" }}>NAME :</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>{data.studentName.toUpperCase()}</td>
              <td style={{ ...td("left"), width: "100px", border: "1px solid #aaa" }}>STUDENT ID :</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>{data.admissionNo}</td>
              <td style={{ ...td("left"), width: "110px", border: "1px solid #aaa" }}>PAYMENT CODE :</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>—</td>
            </tr>
            <tr>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>CLASS :</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>{data.className.toUpperCase()}</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>STREAM :</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>{data.streamName.toUpperCase()}</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>SEX :</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>{data.gender?.toUpperCase() ?? "—"}</td>
            </tr>
            <tr>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>COMBINATION :</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>{combination}</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>TOTAL POINTS / SCORE :</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>
                {(data as any).totalPoints ?? "—"} pts, {data.totalScore != null ? data.totalScore.toFixed(1) : "—"} marks
              </td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>POSITION :</td>
              <td style={{ ...td("left"), border: "1px solid #aaa" }}>
                {data.classPosition != null && data.outOf != null ? `${data.classPosition} out of ${data.outOf}` : "—"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── TITLE ── */}
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: "14px", color: accent, textDecoration: "underline", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "4px" }}>
          END OF {termName.toUpperCase()} {academicYear} STUDENT REPORT CARD
        </div>

        {/* ── MARKS TABLE ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "4px" }}>
          <thead>
            <tr style={{ backgroundColor: primary, color: "#fff" }}>
              <th style={{ ...th("center", { backgroundColor: primary, color: "#fff" }), width: "60px" }}>SUBJECT CODE</th>
              <th style={{ ...th("left",   { backgroundColor: primary, color: "#fff" }), width: "120px" }}>SUBJECT NAME</th>
              <th style={{ ...th("center", { backgroundColor: primary, color: "#fff" }), width: "40px" }}>PAPER</th>
              <th style={{ ...th("center", { backgroundColor: primary, color: "#fff" }), width: "38px" }}>MOT</th>
              <th style={{ ...th("center", { backgroundColor: primary, color: "#fff" }), width: "38px" }}>EOT</th>
              <th style={{ ...th("center", { backgroundColor: primary, color: "#fff" }), width: "45px" }}>AVG</th>
              <th style={{ ...th("center", { backgroundColor: primary, color: "#fff" }), width: "40px" }}>GRADE</th>
              <th style={{ ...th("center", { backgroundColor: primary, color: "#fff" }), width: "40px" }}>SCORE</th>
              <th style={{ ...th("center", { backgroundColor: primary, color: "#fff" }) }}>COMMENT</th>
              <th style={{ ...th("center", { backgroundColor: primary, color: "#fff" }), width: "45px" }}>INITIAL</th>
            </tr>
          </thead>
          <tbody>
            {allSubjects.flatMap((subject, sIdx) => {
              const papers = subject.papers && subject.papers.length > 0 ? subject.papers : [null];
              const paperCount = papers.length;
              const rowBg = sIdx % 2 === 0 ? "#fff" : "#f7f7f7";
              const subjectGrade = subject.finalGrade;
              const scoreLetter  = aLevelScoreLetter(subjectGrade, subject.isSubsidiary ?? false);
              const comment      = subject.gradeDescriptor
                ? subject.gradeDescriptor.toUpperCase()
                : gradeComment(subjectGrade);

              return papers.map((paper, pIdx) => {
                // Determine which mark to show in MOT column (prefer MTE, fall back to BOT)
                const motDisplay = paper
                  ? (parseRawMark(paper.mteRaw) !== "—" ? parseRawMark(paper.mteRaw) : parseRawMark(paper.botRaw))
                  : "—";
                const eotDisplay = paper ? parseRawMark(paper.eotRaw) : "—";
                const avgDisplay = paper?.paperAvgPct != null ? paper.paperAvgPct.toFixed(1) : "—";
                const pgDisplay  = paper?.paperGrade ?? "—";

                return (
                  <tr key={`${sIdx}-${pIdx}`} style={{ backgroundColor: rowBg }}>
                    {pIdx === 0 && (
                      <td rowSpan={paperCount} style={{ ...td("center"), verticalAlign: "middle", fontWeight: 800 }}>
                        {subject.subjectCode ?? ""}
                      </td>
                    )}
                    {pIdx === 0 && (
                      <td rowSpan={paperCount} style={{ ...td("left"), verticalAlign: "middle", fontWeight: 800 }}>
                        {subject.subjectName.toUpperCase()}
                        {(subject.isSubsidiary) && (
                          <span style={{ fontSize: "9px", color: "#666", fontWeight: 600, marginLeft: "3px" }}>(S)</span>
                        )}
                      </td>
                    )}
                    <td style={td("center")}>{paper ? paper.paperNumber : "—"}</td>
                    <td style={td("center")}>{motDisplay}</td>
                    <td style={td("center")}>{eotDisplay}</td>
                    <td style={td("center")}>{avgDisplay}</td>
                    <td style={td("center")}>{pgDisplay}</td>
                    {pIdx === 0 && (
                      <td rowSpan={paperCount} style={{ ...td("center"), verticalAlign: "middle", fontWeight: 900, fontSize: "13px", color: primary }}>
                        {scoreLetter}
                      </td>
                    )}
                    {pIdx === 0 && (
                      <td rowSpan={paperCount} style={{ ...td("left"), verticalAlign: "middle" }}>
                        {comment}
                      </td>
                    )}
                    {pIdx === 0 && (
                      <td rowSpan={paperCount} style={{ ...td("center"), verticalAlign: "middle" }}>
                        ............
                      </td>
                    )}
                  </tr>
                );
              });
            })}
            <tr style={{ backgroundColor: "#e8ecf2", borderTop: `2px solid ${primary}` }}>
              <td colSpan={5} style={{ ...td("right", { border: "1px solid #ccc" }), fontWeight: 800, color: primary }}>TOTAL SCORE</td>
              <td style={{ ...td("center", { border: "1px solid #ccc" }), fontWeight: 900, color: primary, fontSize: "14px" }}>
                {data.totalScore != null ? data.totalScore.toFixed(1) : "—"}
              </td>
              <td colSpan={4} style={td("center", { border: "1px solid #ccc" })} />
            </tr>
          </tbody>
        </table>

        {/* ── COMMENTS ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6px", border: "1px solid #bbb" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #bbb", padding: "4px 6px", fontWeight: 800, fontSize: "12px", backgroundColor: "#f0f0f0", width: "160px" }}>
                CLASS TEACHER&apos;S COMMENT:
              </td>
              <td colSpan={3} style={{ border: "1px solid #bbb", padding: "4px 6px", fontWeight: 700, fontSize: "12px" }}>
                {classComment.toUpperCase()}
              </td>
            </tr>
            <tr>
              <td style={{ border: "none", padding: "2px 6px" }} />
              <td style={{ border: "none", padding: "2px 6px", fontWeight: 700, fontSize: "12px", width: "160px", textAlign: "right" }}>Signature</td>
              <td style={{ border: "none", padding: "2px 6px", borderBottom: "1px dashed #888", width: "160px" }} />
              <td style={{ border: "none", padding: "2px 6px" }} />
            </tr>
            <tr>
              <td style={{ border: "1px solid #bbb", padding: "4px 6px", fontWeight: 800, fontSize: "12px", backgroundColor: "#f0f0f0" }}>
                HEAD TEACHER&apos;S COMMENT:
              </td>
              <td colSpan={3} style={{ border: "1px solid #bbb", padding: "4px 6px", fontWeight: 700, fontSize: "12px" }}>
                {headComment.toUpperCase()}
              </td>
            </tr>
            <tr>
              <td style={{ border: "none", padding: "2px 6px" }} />
              <td style={{ border: "none", padding: "2px 6px", fontWeight: 700, fontSize: "12px", textAlign: "right" }}>Signature</td>
              <td style={{ border: "none", padding: "2px 6px", borderBottom: "1px dashed #888" }} />
              <td style={{ border: "none", padding: "2px 6px" }} />
            </tr>
          </tbody>
        </table>

        {/* ── TERM DATES ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6px", border: "1px solid #bbb" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #bbb", padding: "4px 6px", fontWeight: 800, fontSize: "12px", width: "50%" }}>
                Next Term Begins On: <span style={{ fontWeight: 700 }}>{nextTermDate || "TBD"}</span>
              </td>
              <td style={{ border: "1px solid #bbb", padding: "4px 6px", fontWeight: 800, fontSize: "12px" }}>
                Ends On: <span style={{ fontWeight: 700 }}>{termEndDate || "TBD"}</span>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ border: "1px solid #bbb", padding: "4px 6px", fontWeight: 700, fontSize: "12px" }}>
                School requirements: —
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── GRADING SCALE ── */}
        <div style={{ marginTop: "8px", flexGrow: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ backgroundColor: "#ddd" }}>
                <th style={th("center", { width: "90px" })}>RANGE :</th>
                {[["0.0 - 39.9","F9"],["40.0 - 44.9","P8"],["45.0 - 49.9","P7"],
                  ["50.0 - 54.9","C6"],["55.0 - 59.9","C5"],["60.0 - 64.9","C4"],
                  ["65.0 - 69.9","C3"],["70.0 - 74.9","D2"],["75.0 - 100.0","D1"]].map(([r]) => (
                  <th key={r} style={th("center")}>{r}</th>
                ))}
              </tr>
              <tr>
                <th style={th("center")}>GRADE :</th>
                {["F9","P8","P7","C6","C5","C4","C3","D2","D1"].map(g => (
                  <th key={g} style={th("center")}>{g}</th>
                ))}
              </tr>
              <tr>
                <th style={th("center")}>SCORE :</th>
                {["F","F","F","O","E","D","C","B","A"].map((l, i) => (
                  <th key={i} style={th("center")}>{l}</th>
                ))}
              </tr>
              <tr>
                <th style={th("center")}>POINTS :</th>
                {["0","0","0","1","2","3","4","5","6"].map((p, i) => (
                  <th key={i} style={th("center")}>{p}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign: "center", marginTop: "6px" }}>
          <span style={{ color: "red", fontWeight: 900, fontSize: "12px", textDecoration: "underline" }}>
            This report is invalid without a valid school stamp
          </span>
        </div>

      </div>
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────

type Props = {
  streamId:     string;
  termId:       string;
  format:       ReportCardFormat;
  theme:        ReportCardTheme;
  school:       { name?: string | null; motto?: string | null; logo?: string | null; address?: string | null; contact?: string | null; contact2?: string | null; email?: string | null; email2?: string | null } | null;
  academicYear: string;
  termName:     string;
  onClose:      () => void;
  /** Optional: filter to a single student's report card */
  studentId?:   string;
};

const DEFAULT_WATERMARK: WatermarkId = "none";
const DEFAULT_BORDER: BorderId       = "simple";

export default function ALevelReportCardPreview({ streamId, termId, theme, school, academicYear, termName, onClose, studentId }: Props) {
  const [cards,      setCards]      = useState<ReportCardData[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [current,    setCurrent]    = useState(0);
  const [watermark,  setWatermark]  = useState<WatermarkId>(DEFAULT_WATERMARK);
  const [border,     setBorder]     = useState<BorderId>(DEFAULT_BORDER);
  const [includeAoi, setIncludeAoi] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReportCards(streamId, termId, studentId)
      .then(data => { setCards(data); setLoading(false); })
      .catch(e  => { toast.error(e.message); setLoading(false); });
  }, [streamId, termId, studentId]);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>A-Level Report Cards</title>
      <style>@page{size:A4 portrait;margin:0}body{margin:0;font-family:Arial,sans-serif}
      .page-break{page-break-after:always}</style>
      </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading report cards…</span>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-sm text-slate-500 mb-4">No report cards found for this stream/term.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const card = cards[current];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 text-white shrink-0 flex-wrap">
        <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-700 transition-colors">
          <X className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold flex-1 min-w-0 truncate">
          A-Level Report Cards — {termName} {academicYear}
        </span>

        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm">
          <button disabled={current === 0} onClick={() => setCurrent(c => c - 1)}
            className="px-2 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600">◀</button>
          <span>{current + 1} / {cards.length}</span>
          <button disabled={current === cards.length - 1} onClick={() => setCurrent(c => c + 1)}
            className="px-2 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600">▶</button>
        </div>

        {/* Watermark picker */}
        <select value={watermark} onChange={e => setWatermark(e.target.value as WatermarkId)}
          className="text-xs bg-slate-700 text-white rounded px-2 py-1 border-0">
          {WATERMARKS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
        </select>

        {/* Border picker */}
        <select value={border} onChange={e => setBorder(e.target.value as BorderId)}
          className="text-xs bg-slate-700 text-white rounded px-2 py-1 border-0">
          {BORDERS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>

        {/* AOI toggle */}
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
          <input type="checkbox" checked={includeAoi} onChange={e => setIncludeAoi(e.target.checked)}
            className="w-3.5 h-3.5 rounded" />
          Include AOI
        </label>

        {/* Print */}
        <Button size="sm" variant="outline" className="text-white border-slate-500 hover:bg-slate-700" onClick={handlePrint}>
          <Printer className="h-3.5 w-3.5 mr-1.5" />
          Print All
        </Button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-y-auto flex justify-center py-6 px-4">
        {/* Single card preview */}
        <ALevelReportCard
          data={card}
          theme={theme}
          school={school}
          academicYear={academicYear}
          termName={termName}
          termEndDate=""
          nextTermDate=""
          watermarkId={watermark}
          borderId={border}
          includeAoi={includeAoi}
        />
      </div>

      {/* Hidden print target */}
      <div ref={printRef} style={{ display: "none" }}>
        {cards.map((c, i) => (
          <div key={c.enrollmentId} className={i < cards.length - 1 ? "page-break" : ""}>
            <ALevelReportCard
              data={c}
              theme={theme}
              school={school}
              academicYear={academicYear}
              termName={termName}
              termEndDate=""
              nextTermDate=""
              watermarkId={watermark}
              borderId={border}
              includeAoi={includeAoi}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

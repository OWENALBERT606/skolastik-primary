// app/school/[slug]/academics/report-cards/report-card-preview.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button }  from "@/components/ui/button";
import { toast }   from "sonner";
import { X, Loader2, Printer } from "lucide-react";
import { ReportCardFormat, ReportCardTheme } from "./components/report-cards-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PaperRow = {
  paperNumber:  number;
  paperName:    string | null;
  botRaw:       string | null;
  mteRaw:       string | null;
  eotRaw:       string | null;
  paperAvgPct:  number | null;
  paperGrade:   string | null;
};

type SubjectRow = {
  subjectName:     string;
  subjectCode:     string | null;
  category:        string | null;
  totalPercentage: number | null;
  finalGrade:      string | null;
  gradeDescriptor: string | null;
  gradePoints:     number | null;
  teacherName:     string | null;
  botPct:          number | null;
  botRaw:          string | null;
  mtePct:          number | null;
  mteRaw:          string | null;
  eotPct:          number | null;
  eotRaw:          string | null;
};

export type ReportCardData = {
  enrollmentId:        string;
  studentName:         string;
  admissionNo:         string;
  gender:              string;
  dob:                 string;
  imageUrl:            string | null;
  className:           string;
  classCode:           string | null;
  streamName:          string;
  averageMark:         number | null;
  aggregatePoints:     number | null;
  division:            string | null;
  classTeacherComment: string | null;
  headTeacherComment:  string | null;
  isPublished:         boolean;
  subjects:            SubjectRow[];
  totalScore?:         number | null;
  classPosition?:      number | null;
  outOf?:              number | null;
  examWeights: {
    hasBOT: boolean; hasMTE: boolean; hasEOT: boolean;
    botWeight: number; mteWeight: number; eotWeight: number;
  };
};

type Props = {
  streamId:     string;
  termId:       string;
  format:       ReportCardFormat;
  theme:        ReportCardTheme;
  school:       { name: string | null; motto: string | null; logo: string | null; address: string | null; contact: string | null; contact2: string | null; email: string | null; email2: string | null } | null;
  academicYear: string;
  termName:     string;
  onClose:      () => void;
  /** Optional: filter to a single student's report card */
  studentId?:   string;
  /** Optional: hide the term date inputs (e.g. parent portal) */
  hideDateInputs?: boolean;
};

// ── Watermark definitions ──────────────────────────────────────────────────────

export type WatermarkId = "none" | "checkerboard" | "diagonal_lines" | "dots" | "waves" | "diamonds" | "crosshatch";

export const WATERMARKS: { id: WatermarkId; label: string; css: string; size: string; opacity: number }[] = [
  { id: "none",           label: "None",           css: "none",  size: "0",        opacity: 0 },
  { id: "checkerboard",   label: "Checkerboard",
    css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='white'/%3E%3Crect x='0' y='0' width='30' height='30' fill='%23c8c8c8'/%3E%3Crect x='30' y='30' width='30' height='30' fill='%23c8c8c8'/%3E%3C/svg%3E")`,
    size: "60px 60px", opacity: 0.28 },
  { id: "diagonal_lines", label: "Diagonal Lines",
    css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='white'/%3E%3Cline x1='0' y1='40' x2='40' y2='0' stroke='%23aaa' stroke-width='2'/%3E%3Cline x1='-10' y1='40' x2='30' y2='0' stroke='%23aaa' stroke-width='2'/%3E%3Cline x1='10' y1='40' x2='50' y2='0' stroke='%23aaa' stroke-width='2'/%3E%3C/svg%3E")`,
    size: "40px 40px", opacity: 0.28 },
  { id: "dots",           label: "Polka Dots",
    css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30'%3E%3Crect width='30' height='30' fill='white'/%3E%3Ccircle cx='15' cy='15' r='5' fill='%23bbb'/%3E%3C/svg%3E")`,
    size: "30px 30px", opacity: 0.28 },
  { id: "waves",          label: "Waves",
    css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='20'%3E%3Crect width='80' height='20' fill='white'/%3E%3Cpath d='M0 10 Q20 0 40 10 Q60 20 80 10' fill='none' stroke='%23aaa' stroke-width='2'/%3E%3C/svg%3E")`,
    size: "80px 20px", opacity: 0.28 },
  { id: "diamonds",       label: "Diamonds",
    css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='white'/%3E%3Crect x='10' y='10' width='20' height='20' fill='%23c8c8c8' transform='rotate(45 20 20)'/%3E%3C/svg%3E")`,
    size: "40px 40px", opacity: 0.28 },
  { id: "crosshatch",     label: "Crosshatch",
    css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' fill='white'/%3E%3Cline x1='0' y1='0' x2='20' y2='20' stroke='%23aaa' stroke-width='1.2'/%3E%3Cline x1='20' y1='0' x2='0' y2='20' stroke='%23aaa' stroke-width='1.2'/%3E%3C/svg%3E")`,
    size: "20px 20px", opacity: 0.28 },
];

// ── Border definitions ─────────────────────────────────────────────────────────

export type BorderId = "simple" | "double" | "ornate" | "thick_inner" | "dashed" | "ribbon";

export const BORDERS: { id: BorderId; label: string }[] = [
  { id: "simple",      label: "Simple" },
  { id: "double",      label: "Double Line" },
  { id: "ornate",      label: "Ornate Corners" },
  { id: "thick_inner", label: "Thick + Inner" },
  { id: "dashed",      label: "Dashed" },
  { id: "ribbon",      label: "Ribbon" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

async function fetchStreamReportCards(streamId: string, termId: string, studentId?: string): Promise<ReportCardData[]> {
  const params = new URLSearchParams({ streamId, termId });
  if (studentId) params.set("studentId", studentId);
  const res = await fetch(`/api/report-cards?${params}`);
  if (!res.ok) throw new Error("Failed to load report cards");
  return res.json();
}

function gradeLetter(grade: string | null): string {
  if (!grade) return "—";
  if (["D1","D2"].includes(grade)) return "A";
  if (["C3","C4"].includes(grade)) return "B";
  if (["C5","C6"].includes(grade)) return "C";
  if (["P7","P8"].includes(grade)) return "D";
  if (grade === "F9")              return "E";
  return grade;
}

function achievementLevel(grade: string | null): string {
  if (!grade) return "—";
  const l = gradeLetter(grade);
  if (l === "A") return "Exceptional";
  if (l === "B") return "Outstanding";
  if (l === "C") return "Satisfactory";
  if (l === "D") return "Basic";
  return "Elementary";
}

function overallIdentifier(avg: number | null): { id: number; label: string } {
  if (avg == null) return { id: 0, label: "—" };
  if (avg >= 2.5)  return { id: 3, label: "Outstanding" };
  if (avg >= 1.5)  return { id: 2, label: "Moderate" };
  return            { id: 1, label: "Basic" };
}

function pct(val: number | null): string {
  return val != null ? `${Math.round(val)}` : "—";
}

function autoClassComment(avg: number | null, name: string): string {
  const first = name.split(" ")[0];
  if (avg == null) return `${first} has shown effort this term. Keep working hard.`;
  if (avg >= 80) return `${first} has demonstrated exceptional academic performance this term. An outstanding student — keep it up!`;
  if (avg >= 70) return `${first} has performed very well this term. With continued dedication, even greater heights are achievable.`;
  if (avg >= 60) return `${first} has shown satisfactory performance. More focus and consistent study will yield better results.`;
  if (avg >= 50) return `${first} has made reasonable effort but needs to work harder. Regular revision and class participation are encouraged.`;
  if (avg >= 40) return `${first} needs to improve significantly. Please seek extra help and dedicate more time to studies.`;
  return `${first} is struggling academically. Urgent attention and support from parents and teachers is required.`;
}

function autoHeadComment(avg: number | null): string {
  if (avg == null) return "We encourage this student to strive for excellence in all areas.";
  if (avg >= 80) return "A truly commendable performance. The school is proud of this student's achievement. Keep soaring!";
  if (avg >= 70) return "Well done! This is a good performance. We encourage continued hard work and dedication.";
  if (avg >= 60) return "A satisfactory performance. We believe this student can do better with more effort and focus.";
  if (avg >= 50) return "There is room for improvement. We urge this student to take studies more seriously next term.";
  if (avg >= 40) return "This performance is below expectations. We strongly encourage the student and parents to work together for improvement.";
  return "This performance is a cause for concern. We request parents to meet with the class teacher to discuss a way forward.";
}

// ── Style helpers ──────────────────────────────────────────────────────────────

function th(align: "left" | "center" | "right", width?: string): React.CSSProperties {
  return {
    border: "1px solid #bbb", padding: "4px 5px",
    textAlign: align, fontWeight: 700, fontSize: "13px",
    ...(width ? { width } : {}),
  };
}

function td(align: "left" | "center" | "right"): React.CSSProperties {
  return {
    border: "1px solid #ccc", padding: "3px 5px",
    textAlign: align, fontSize: "13px", fontWeight: 700,
  };
}

// ── Border renderer ────────────────────────────────────────────────────────────

export function BorderOverlay({ borderId, primary, accent }: { borderId: BorderId; primary: string; accent: string }) {
  if (borderId === "simple") {
    return <div style={{ position: "absolute", inset: 0, border: `4px solid ${primary}`, pointerEvents: "none", zIndex: 2 }} />;
  }
  if (borderId === "double") {
    return <>
      <div style={{ position: "absolute", inset: 0, border: `4px solid ${primary}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "7px", border: `1.5px solid ${accent}`, pointerEvents: "none", zIndex: 2 }} />
    </>;
  }
  if (borderId === "ornate") {
    const corners = [
      { top: "4px", left: "4px", borderTop: `3px solid ${accent}`, borderLeft: `3px solid ${accent}` },
      { top: "4px", right: "4px", borderTop: `3px solid ${accent}`, borderRight: `3px solid ${accent}` },
      { bottom: "4px", left: "4px", borderBottom: `3px solid ${accent}`, borderLeft: `3px solid ${accent}` },
      { bottom: "4px", right: "4px", borderBottom: `3px solid ${accent}`, borderRight: `3px solid ${accent}` },
    ];
    return <>
      <div style={{ position: "absolute", inset: 0, border: `4px solid ${primary}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "8px", border: `1.5px solid ${accent}`, pointerEvents: "none", zIndex: 2 }} />
      {corners.map((s, i) => (
        <div key={i} style={{ position: "absolute", width: "24px", height: "24px", pointerEvents: "none", zIndex: 3, ...s }} />
      ))}
    </>;
  }
  if (borderId === "thick_inner") {
    return <>
      <div style={{ position: "absolute", inset: 0, border: `6px solid ${primary}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "10px", border: `3px solid ${accent}`, pointerEvents: "none", zIndex: 2 }} />
    </>;
  }
  if (borderId === "dashed") {
    return <>
      <div style={{ position: "absolute", inset: 0, border: `4px solid ${primary}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "6px", border: `2px dashed ${accent}`, pointerEvents: "none", zIndex: 2 }} />
    </>;
  }
  if (borderId === "ribbon") {
    return <>
      <div style={{ position: "absolute", inset: 0, border: `5px double ${primary}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "8px", border: `1px solid ${accent}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "11px", border: `1px solid ${accent}`, pointerEvents: "none", zIndex: 2 }} />
    </>;
  }
  return null;
}

// ── Main Report Card ───────────────────────────────────────────────────────────

export function TermlyReportCard({ data, theme, school, academicYear, termName, termEndDate, nextTermDate, watermarkId, borderId }: {
  data: ReportCardData; theme: ReportCardTheme;
  school: Props["school"]; academicYear: string; termName: string;
  termEndDate: string; nextTermDate: string;
  watermarkId: WatermarkId; borderId: BorderId;
}) {
  const isOLevel = data.classLevel === "O_LEVEL" || !data.classLevel;
  const oi       = overallIdentifier(data.averageMark);
  const primary  = theme.primaryColor ?? "#1a3a6b";
  const accent   = theme.accentColor  ?? "#c8a400";
  const wm       = WATERMARKS.find(w => w.id === watermarkId) ?? WATERMARKS[0];

  const classComment = data.classTeacherComment || autoClassComment(data.averageMark, data.studentName);
  const headComment  = data.headTeacherComment  || autoHeadComment(data.averageMark);

  return (
    <div
      className="bg-white text-black font-sans"
      style={{
        width: "210mm", minHeight: "297mm",
        margin: "0 auto", padding: "12mm 10mm 8mm",
        fontSize: "13px", fontWeight: 700,
        position: "relative", boxSizing: "border-box",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Watermark */}
      {wm.id !== "none" && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: wm.css, backgroundSize: wm.size, opacity: wm.opacity,
        }} />
      )}

      {/* Badge watermark — centered logo at low opacity */}
      {school?.logo && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img src={school.logo} alt="" style={{ width: "420px", height: "420px", objectFit: "contain", opacity: 0.18 }} />
        </div>
      )}

      {/* Border overlay */}
      <BorderOverlay borderId={borderId} primary={primary} accent={accent} />

      {/* Content — flex column fills full height */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, gap: "3px" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ width: "130px", flexShrink: 0 }}>
            {school?.logo
              ? <img src={school.logo} alt="Badge" style={{ width: "130px", height: "130px", objectFit: "contain" }} />
              : <div style={{ width: "130px", height: "130px", border: "2px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#aaa", borderRadius: "4px" }}>BADGE</div>
            }
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "0 8px" }}>
            <div style={{ fontWeight: 900, fontSize: "26px", textTransform: "uppercase", color: primary, letterSpacing: "1px", lineHeight: 1.1, marginBottom: "4px" }}>
              {school?.name ?? "SCHOOL NAME"}
            </div>
            {school?.address && <div style={{ fontSize: "13px", color: "#444", marginBottom: "2px" }}>{school.address}</div>}
            {school?.contact && <div style={{ fontSize: "13px", color: "#444", marginBottom: "2px" }}>Tel: {school.contact}{school.contact2 ? ` / ${school.contact2}` : ""}</div>}
            {school?.email   && <div style={{ fontSize: "13px", color: "#444", marginBottom: "2px" }}>Email: {school.email}{school.email2 ? ` / ${school.email2}` : ""}</div>}
            {school?.motto   && <div style={{ fontSize: "13px", fontStyle: "italic", color: "#666", marginTop: "3px" }}>"{school.motto}"</div>}
          </div>
          <div style={{ width: "130px", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
            {data.imageUrl
              ? <img src={data.imageUrl} alt="Student" style={{ width: "100px", height: "130px", objectFit: "cover", border: "1px solid #bbb" }} />
              : <div style={{ width: "100px", height: "130px", border: "1px solid #bbb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#aaa", backgroundColor: "#f9f9f9" }}>PHOTO</div>
            }
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: "16px", color: accent, textDecoration: "underline", textTransform: "uppercase", letterSpacing: "2px" }}>
          TERMLY REPORT CARD
        </div>

        {/* Student info */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingBottom: "5px", width: "55px", border: "none" }}>NAME:</td>
              <td style={{ fontWeight: 800, paddingRight: "16px", paddingBottom: "5px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{data.studentName}</td>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingBottom: "5px", width: "65px", border: "none" }}>SECTION:</td>
              <td style={{ fontWeight: 800, paddingRight: "16px", paddingBottom: "5px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{data.streamName}</td>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingBottom: "5px", width: "32px", border: "none" }}>LIN:</td>
              <td style={{ fontWeight: 800, paddingBottom: "5px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{data.admissionNo}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingTop: "5px", border: "none" }}>CLASS:</td>
              <td style={{ fontWeight: 800, paddingRight: "16px", paddingTop: "5px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{data.className} {data.streamName}</td>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingTop: "5px", border: "none" }}>TERM:</td>
              <td style={{ fontWeight: 800, paddingRight: "16px", paddingTop: "5px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{termName}, {academicYear}</td>
              <td colSpan={2} style={{ border: "none", paddingTop: "5px" }} />
            </tr>
          </tbody>
        </table>

        {/* Performance header — with top spacing */}
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: "13px", backgroundColor: primary, color: "#fff", padding: "5px 0", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "6px" }}>
          PERFORMANCE RECORDS
        </div>

        {/* Marks table */}
        {(() => {
          const ew = data.examWeights ?? { hasBOT: false, hasMTE: true, hasEOT: true, botWeight: 0, mteWeight: 50, eotWeight: 50 };
          const hasBOT = ew.hasBOT && data.subjects.some((s: any) => s.botRaw != null || s.botPct != null);
          const hasMTE = ew.hasMTE && data.subjects.some((s: any) => s.mteRaw != null || s.mtePct != null);
          const hasEOT = ew.hasEOT && data.subjects.some((s: any) => s.eotRaw != null || s.eotPct != null);
          const examCols = (hasBOT ? 1 : 0) + (hasMTE ? 1 : 0) + (hasEOT ? 1 : 0);

          // Compute totals for the totals row
          const subjectTotals = data.subjects
            .map((s: any) => s.totalPercentage)
            .filter((v: any): v is number => v !== null);
          const overallAvg = (data as any).overallAvg ??
            (subjectTotals.length > 0 ? subjectTotals.reduce((a: number, b: number) => a + b, 0) / subjectTotals.length : null);

          return (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: primary, color: "#fff" }}>
                  <th style={th("left", "110px")}>SUBJECT</th>
                  {hasBOT && <th style={th("center","50px")}>BOT</th>}
                  {hasMTE && <th style={th("center","50px")}>MTE</th>}
                  {hasEOT && <th style={th("center","50px")}>EOT</th>}
                  <th style={th("center","40px")}>TOTAL</th>
                  <th style={th("center","30px")}>GRADE</th>
                  <th style={th("center","80px")}>ACHIEVEMENT</th>
                  <th style={th("center","28px")}>TCH</th>
                </tr>
                {/* Weight sub-row */}
                <tr style={{ backgroundColor: "#e8ecf2", color: primary, fontSize: "11px" }}>
                  <td style={{ border: "1px solid #bbb", padding: "2px 4px", fontWeight: 700, fontStyle: "italic" }}>Contribution</td>
                  {hasBOT && <td style={{ border: "1px solid #bbb", padding: "2px 3px", textAlign: "center", fontWeight: 800 }}>{ew.botWeight}%</td>}
                  {hasMTE && <td style={{ border: "1px solid #bbb", padding: "2px 3px", textAlign: "center", fontWeight: 800 }}>{ew.mteWeight}%</td>}
                  {hasEOT && <td style={{ border: "1px solid #bbb", padding: "2px 3px", textAlign: "center", fontWeight: 800 }}>{ew.eotWeight}%</td>}
                  <td style={{ border: "1px solid #bbb", padding: "2px 3px", textAlign: "center", fontWeight: 800 }}>100%</td>
                  <td style={{ border: "1px solid #bbb", padding: "2px 3px" }} />
                  <td style={{ border: "1px solid #bbb", padding: "2px 3px" }} />
                  <td style={{ border: "1px solid #bbb", padding: "2px 3px" }} />
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((sub: any, i: number) => {
                  const botDisp = sub.botRaw ?? (sub.botPct != null ? pct(sub.botPct) : "—");
                  const mteDisp = sub.mteRaw ?? (sub.mtePct != null ? pct(sub.mtePct) : "—");
                  const eotDisp = sub.eotRaw ?? (sub.eotPct != null ? pct(sub.eotPct) : "—");
                  const total   = sub.totalPercentage != null ? sub.totalPercentage.toFixed(1) : "—";
                  const grade   = gradeLetter(sub.finalGrade);
                  const level   = achievementLevel(sub.finalGrade);
                  const teacher = sub.teacherName ? sub.teacherName.split(" ").map((p: string) => p[0]).join(".").toUpperCase() : "";
                  const bg = i % 2 === 0 ? "transparent" : "rgba(245,247,250,0.4)";
                  return (
                    <tr key={i} style={{ backgroundColor: bg }}>
                      <td style={td("left")}>{sub.subjectName.toUpperCase()}</td>
                      {hasBOT && <td style={td("center")}>{botDisp}</td>}
                      {hasMTE && <td style={td("center")}>{mteDisp}</td>}
                      {hasEOT && <td style={td("center")}>{eotDisp}</td>}
                      <td style={{ ...td("center"), fontWeight: 800 }}>{total}%</td>
                      <td style={{ ...td("center"), fontWeight: 800, color: primary }}>{grade}</td>
                      <td style={{ ...td("center"), fontStyle: "italic" }}>{level}</td>
                      <td style={td("center")}>{teacher}</td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                <tr style={{ backgroundColor: "#e8ecf2", borderTop: `2px solid ${primary}` }}>
                  <td style={{ ...td("right"), fontWeight: 800, color: primary, fontSize: "12px" }}>
                    AVERAGE TOTAL
                  </td>
                  {Array(examCols).fill(0).map((_: any, i: number) => <td key={i} style={td("center")} />)}
                  <td style={{ ...td("center"), fontWeight: 900, color: primary, fontSize: "14px" }}>
                    {overallAvg != null ? `${overallAvg.toFixed(1)}%` : "—"}
                  </td>
                  <td colSpan={3} style={td("center")} />
                </tr>
              </tbody>
            </table>
          );
        })()}

        {/* Overall identifier + position */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #bbb", padding: "3px 6px", fontWeight: 700, whiteSpace: "nowrap" }}>Overall Identifier</td>
              <td style={{ border: "1px solid #bbb", padding: "3px 8px", fontWeight: 800, textAlign: "center", color: primary, width: "32px" }}>{oi.id}</td>
              <td style={{ border: "1px solid #bbb", padding: "3px 6px", fontWeight: 700, whiteSpace: "nowrap" }}>Overall Achievement</td>
              <td style={{ border: "1px solid #bbb", padding: "3px 8px", fontWeight: 800, textAlign: "center", color: accent }}>{oi.label}</td>
              <td style={{ border: "1px solid #bbb", padding: "3px 6px", fontWeight: 700, whiteSpace: "nowrap" }}>Division</td>
              <td style={{ border: "1px solid #bbb", padding: "3px 8px", fontWeight: 800, textAlign: "center", color: primary }}>
                {(data as any).division ?? "—"}
              </td>
              <td style={{ border: "1px solid #bbb", padding: "3px 6px", fontWeight: 700, whiteSpace: "nowrap" }}>Position</td>
              <td style={{ border: "1px solid #bbb", padding: "3px 8px", fontWeight: 800, textAlign: "center", color: primary }}>
                {(data as any).classPosition != null
                  ? `${(data as any).classPosition} / ${(data as any).outOf ?? "?"}`
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Comments */}
        <div style={{ fontSize: "14px", marginTop: "10px" }}>
          <div style={{ marginBottom: "8px", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800 }}>Class Teacher's Comment:</div>
            <div style={{ fontWeight: 800, fontStyle: "italic", textDecoration: "underline", color: "#1a3a8f", marginTop: "2px" }}>{classComment}</div>
          </div>
          <div style={{ marginBottom: "8px", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800 }}>Head Teacher's Comment:</div>
            <div style={{ fontWeight: 800, fontStyle: "italic", textDecoration: "underline", color: "#1a3a8f", marginTop: "2px" }}>{headComment}</div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <span style={{ fontWeight: 800 }}>SIGNATURE: </span>
            <span style={{ borderBottom: "1.5px solid #333", display: "inline-block", width: "140px" }} />
          </div>
        </div>

        {/* Grading scale + identifier — stacked, matching reference layout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Grading Scale */}
          <div>
            <div style={{ textAlign: "center", fontWeight: 800, fontSize: "13px", color: primary, textDecoration: "underline", textTransform: "uppercase", marginBottom: "4px" }}>GRADING SCALE</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["80-100","70-79","60-69","50-59","0-49"].map(r => (
                    <th key={r} style={{ border: `1px solid ${primary}`, padding: "4px 6px", textAlign: "center", fontSize: "13px", color: primary, backgroundColor: "transparent", fontWeight: 700 }}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {["A","B","C","D","E"].map(g => (
                    <td key={g} style={{ border: `1px solid ${primary}`, padding: "4px 6px", textAlign: "center", fontWeight: 800, fontSize: "14px", color: primary }}>{g}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {/* Identifier Scale */}
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ border: `1px solid ${primary}`, padding: "4px 8px", textAlign: "center", fontSize: "13px", color: primary, backgroundColor: "transparent", fontWeight: 700, width: "80px" }}>Identifier</th>
                  <th style={{ border: `1px solid ${primary}`, padding: "4px 8px", textAlign: "center", fontSize: "13px", color: primary, backgroundColor: "transparent", fontWeight: 700, width: "120px" }}>Score range</th>
                  <th style={{ border: `1px solid ${primary}`, padding: "4px 8px", textAlign: "left", fontSize: "13px", color: primary, backgroundColor: "transparent", fontWeight: 700 }}>Descriptor</th>
                </tr>
              </thead>
              <tbody>
                {[{ id: 1, range: "0.9 – 1.49", desc: "Basic" }, { id: 2, range: "1.5 – 2.49", desc: "Moderate" }, { id: 3, range: "2.5 – 3.0", desc: "Outstanding" }].map(row => (
                  <tr key={row.id}>
                    <td style={{ border: `1px solid ${primary}`, padding: "4px 8px", textAlign: "center", fontSize: "13px", fontWeight: 700 }}>{row.id}</td>
                    <td style={{ border: `1px solid ${primary}`, padding: "4px 8px", textAlign: "center", fontSize: "13px", fontWeight: 700 }}>{row.range}</td>
                    <td style={{ border: `1px solid ${primary}`, padding: "4px 8px", textAlign: "left", fontSize: "13px", fontWeight: 700 }}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer dates */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 800, borderTop: `1.5px solid ${primary}`, paddingTop: "5px", marginTop: "10px" }}>
          <span>This term has ended on: <span style={{ color: accent, fontWeight: 900, textDecoration: "underline", borderBottom: `2px solid ${accent}`, display: "inline-block", minWidth: "90px" }}>{termEndDate || "_______________"}</span></span>
          <span>Next term begins on: <span style={{ color: accent, fontWeight: 900, textDecoration: "underline", borderBottom: `2px solid ${accent}`, display: "inline-block", minWidth: "90px" }}>{nextTermDate || "_______________"}</span></span>
        </div>

        {/* Stamp caution — bottom of page, italic, quoted, no warning icon */}
        <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#666", letterSpacing: "1px", fontStyle: "italic", borderTop: "1px dashed #ccc", paddingTop: "6px", marginTop: "6px" }}>
          "Not valid without a school stamp"
        </div>

      </div>
    </div>
  );
}

// ── Pure-HTML card builder for iframe printing ────────────────────────────────

function buildCardHtml(
  data: ReportCardData,
  opts: {
    primary: string; accent: string;
    school: Props["school"]; academicYear: string; termName: string;
    termEnd: string; nextTerm: string;
    watermarkId: WatermarkId; borderId: BorderId;
  }
): string {
  const { primary, accent, school, academicYear, termName, termEnd, nextTerm, watermarkId, borderId } = opts;
  const isOLevel = data.classLevel === "O_LEVEL" || !data.classLevel;
  const oi = overallIdentifier(data.averageMark);
  const wm = WATERMARKS.find(w => w.id === watermarkId) ?? WATERMARKS[0];

  const classComment = data.classTeacherComment || autoClassComment(data.averageMark, data.studentName);
  const headComment  = data.headTeacherComment  || autoHeadComment(data.averageMark);

  const ew = data.examWeights ?? { hasBOT: false, hasMTE: true, hasEOT: true, botWeight: 0, mteWeight: 50, eotWeight: 50 };

  const hasBOT = ew.hasBOT && data.subjects.some(s => s.botRaw != null || s.botPct != null);
  const hasMTE = ew.hasMTE && data.subjects.some(s => s.mteRaw != null || s.mtePct != null);
  const hasEOT = ew.hasEOT && data.subjects.some(s => s.eotRaw != null || s.eotPct != null);
  const examColCount = [hasBOT, hasMTE, hasEOT].filter(Boolean).length;

  const subjectRows = data.subjects.map((sub, i) => {
    const botDisp = sub.botRaw ?? (sub.botPct != null ? pct(sub.botPct) : "—");
    const mteDisp = sub.mteRaw ?? (sub.mtePct != null ? pct(sub.mtePct) : "—");
    const eotDisp = sub.eotRaw ?? (sub.eotPct != null ? pct(sub.eotPct) : "—");
    const total   = sub.totalPercentage != null ? sub.totalPercentage.toFixed(1) : "—";
    const grade   = gradeLetter(sub.finalGrade);
    const level   = achievementLevel(sub.finalGrade);
    const teacher = sub.teacherName ? sub.teacherName.split(" ").map((p: string) => p[0]).join(".").toUpperCase() : "";
    const bg = i % 2 === 0 ? "transparent" : "rgba(245,247,250,0.4)";
    return `<tr style="background:${bg}">
      <td class="td-left">${sub.subjectName.toUpperCase()}</td>
      ${hasBOT ? `<td class="td-center">${botDisp}</td>` : ""}
      ${hasMTE ? `<td class="td-center">${mteDisp}</td>` : ""}
      ${hasEOT ? `<td class="td-center">${eotDisp}</td>` : ""}
      <td class="td-center" style="font-weight:800">${total}%</td>
      <td class="td-center" style="color:${primary};font-weight:800">${grade}</td>
      <td class="td-center" style="font-style:italic">${level}</td>
      <td class="td-center">${teacher}</td>
    </tr>`;
  }).join("");

  const logoHtml = school?.logo
    ? `<img src="${school.logo}" style="width:130px;height:130px;object-fit:contain" />`
    : `<div style="width:130px;height:130px;border:2px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:9px;color:#aaa;border-radius:4px">BADGE</div>`;

  const wmCss = wm.id !== "none"
    ? `background-image:${wm.css};background-size:${wm.size};`
    : "";

  // Use inline SVG pattern for print — CSS background-image data URIs are stripped by browsers when printing
  function buildWmSvg(id: WatermarkId, opacity: number): string {
    if (id === "none") return "";
    const pid = `wm_${id}`;
    let patternContent = "";
    let pw = 60, ph = 60;
    if (id === "checkerboard") {
      pw = 60; ph = 60;
      patternContent = `<rect width="60" height="60" fill="white"/><rect x="0" y="0" width="30" height="30" fill="#c8c8c8"/><rect x="30" y="30" width="30" height="30" fill="#c8c8c8"/>`;
    } else if (id === "diagonal_lines") {
      pw = 40; ph = 40;
      patternContent = `<line x1="0" y1="40" x2="40" y2="0" stroke="#aaa" stroke-width="2"/><line x1="-10" y1="40" x2="30" y2="0" stroke="#aaa" stroke-width="2"/><line x1="10" y1="40" x2="50" y2="0" stroke="#aaa" stroke-width="2"/>`;
    } else if (id === "dots") {
      pw = 30; ph = 30;
      patternContent = `<circle cx="15" cy="15" r="5" fill="#bbb"/>`;
    } else if (id === "waves") {
      pw = 80; ph = 20;
      patternContent = `<path d="M0 10 Q20 0 40 10 Q60 20 80 10" fill="none" stroke="#aaa" stroke-width="2"/>`;
    } else if (id === "diamonds") {
      pw = 40; ph = 40;
      patternContent = `<rect x="10" y="10" width="20" height="20" fill="#c8c8c8" transform="rotate(45 20 20)"/>`;
    } else if (id === "crosshatch") {
      pw = 20; ph = 20;
      patternContent = `<line x1="0" y1="0" x2="20" y2="20" stroke="#aaa" stroke-width="1.2"/><line x1="20" y1="0" x2="0" y2="20" stroke="#aaa" stroke-width="1.2"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:${opacity}" preserveAspectRatio="xMidYMid slice">
      <defs><pattern id="${pid}" x="0" y="0" width="${pw}" height="${ph}" patternUnits="userSpaceOnUse">${patternContent}</pattern></defs>
      <rect width="100%" height="100%" fill="url(#${pid})"/>
    </svg>`;
  }

  const wmOverlayHtml = wm.id !== "none" ? buildWmSvg(wm.id, wm.opacity) : "";

  let borderCss = "";
  let innerBorderHtml = "";
  if (borderId === "simple") {
    borderCss = `border:4px solid ${primary};`;
  } else if (borderId === "double") {
    borderCss = `border:4px solid ${primary};`;
    innerBorderHtml = `<div style="position:absolute;inset:7px;border:1.5px solid ${accent};pointer-events:none;z-index:2"></div>`;
  } else if (borderId === "ornate") {
    borderCss = `border:4px solid ${primary};`;
    innerBorderHtml = `
      <div style="position:absolute;inset:8px;border:1.5px solid ${accent};pointer-events:none;z-index:2"></div>
      <div style="position:absolute;top:4px;left:4px;width:24px;height:24px;border-top:3px solid ${accent};border-left:3px solid ${accent};pointer-events:none;z-index:3"></div>
      <div style="position:absolute;top:4px;right:4px;width:24px;height:24px;border-top:3px solid ${accent};border-right:3px solid ${accent};pointer-events:none;z-index:3"></div>
      <div style="position:absolute;bottom:4px;left:4px;width:24px;height:24px;border-bottom:3px solid ${accent};border-left:3px solid ${accent};pointer-events:none;z-index:3"></div>
      <div style="position:absolute;bottom:4px;right:4px;width:24px;height:24px;border-bottom:3px solid ${accent};border-right:3px solid ${accent};pointer-events:none;z-index:3"></div>`;
  } else if (borderId === "thick_inner") {
    borderCss = `border:6px solid ${primary};`;
    innerBorderHtml = `<div style="position:absolute;inset:10px;border:3px solid ${accent};pointer-events:none;z-index:2"></div>`;
  } else if (borderId === "dashed") {
    borderCss = `border:4px solid ${primary};`;
    innerBorderHtml = `<div style="position:absolute;inset:6px;border:2px dashed ${accent};pointer-events:none;z-index:2"></div>`;
  } else if (borderId === "ribbon") {
    borderCss = `border:5px double ${primary};`;
    innerBorderHtml = `
      <div style="position:absolute;inset:8px;border:1px solid ${accent};pointer-events:none;z-index:2"></div>
      <div style="position:absolute;inset:11px;border:1px solid ${accent};pointer-events:none;z-index:2"></div>`;
  }

  const overallGrade = isOLevel ? (data.division ?? "—") : (data.totalPoints != null ? `${data.totalPoints}pts` : "—");

  return `
  <div class="page" style="${borderCss}">
    ${wmOverlayHtml}
    ${school?.logo ? `<div style="position:absolute;inset:0;pointer-events:none;z-index:0;display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact"><img src="${school.logo}" style="width:420px;height:420px;object-fit:contain;opacity:0.18" /></div>` : ""}
    ${innerBorderHtml}
    <div class="content">
      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">
        <div style="width:130px;flex-shrink:0">${logoHtml}</div>
        <div style="flex:1;text-align:center;padding:0 8px">
          <div class="school-name">${school?.name ?? "SCHOOL NAME"}</div>
          ${school?.address ? `<div class="school-info">${school.address}</div>` : ""}
          ${school?.contact ? `<div class="school-info">Tel: ${school.contact}${school.contact2 ? ` / ${school.contact2}` : ""}</div>` : ""}
          ${school?.email   ? `<div class="school-info">Email: ${school.email}${school.email2 ? ` / ${school.email2}` : ""}</div>` : ""}
          ${school?.motto   ? `<div class="school-motto">"${school.motto}"</div>` : ""}
        </div>
        <div style="width:130px;flex-shrink:0;display:flex;justify-content:flex-end">
          ${data.imageUrl
            ? `<img src="${data.imageUrl}" style="width:100px;height:130px;object-fit:cover;border:1px solid #bbb" />`
            : `<div style="width:100px;height:130px;border:1px solid #bbb;display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;background:#f9f9f9">PHOTO</div>`
          }
        </div>
      </div>
      <div class="report-title">TERMLY REPORT CARD</div>
      <!-- Student info -->
      <table style="margin-bottom:5px;font-size:13px">
        <tbody>
          <tr>
            <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:5px;width:55px;border:none">NAME:</td>
            <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-bottom:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${data.studentName}</td>
            <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:5px;width:65px;border:none">SECTION:</td>
            <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-bottom:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${data.streamName}</td>
            <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:5px;width:32px;border:none">LIN:</td>
            <td style="border-bottom:1.5px solid #333;font-weight:800;padding-bottom:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${data.admissionNo}</td>
          </tr>
          <tr>
            <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-top:5px;border:none">CLASS:</td>
            <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-top:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${data.className} ${data.streamName}</td>
            <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-top:5px;border:none">TERM:</td>
            <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-top:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${termName}, ${academicYear}</td>
            <td colspan="2" style="border:none;padding-top:5px"></td>
          </tr>
        </tbody>
      </table>
      <div class="perf-header" style="margin-top:6px">PERFORMANCE RECORDS</div>
      <table style="margin-bottom:4px">
        <thead>
          <tr>
            <th class="th-left" style="width:110px">SUBJECT</th>
            ${hasBOT ? `<th class="th-center" style="width:50px">BOT</th>` : ""}
            ${hasMTE ? `<th class="th-center" style="width:50px">MTE</th>` : ""}
            ${hasEOT ? `<th class="th-center" style="width:50px">EOT</th>` : ""}
            <th class="th-center" style="width:40px">TOTAL</th>
            <th class="th-center" style="width:30px">GRADE</th>
            <th class="th-center" style="width:80px">ACHIEVEMENT</th>
            <th class="th-center" style="width:28px">TCH</th>
          </tr>
          <tr style="background:#e8ecf2;color:${primary};font-size:11px;font-style:italic">
            <td style="border:1px solid #bbb;padding:2px 4px;font-weight:700">Contribution</td>
            ${hasBOT ? `<td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">${ew.botWeight}%</td>` : ""}
            ${hasMTE ? `<td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">${ew.mteWeight}%</td>` : ""}
            ${hasEOT ? `<td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">${ew.eotWeight}%</td>` : ""}
            <td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">100%</td>
            <td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>
            <td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>
            <td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
          <tr style="background:#e8ecf2;border-top:2px solid ${primary}">
            <td colspan="${1 + (hasBOT ? 1 : 0) + (hasMTE ? 1 : 0) + (hasEOT ? 1 : 0)}" class="td-right" style="font-weight:800;color:${primary};padding:4px 5px;border:1px solid #ccc;text-align:right">TOTAL SCORE</td>
            <td class="td-center" style="font-weight:900;color:${primary};font-size:14px;padding:4px 5px;border:1px solid #ccc;text-align:center">
              ${data.totalScore != null ? data.totalScore.toFixed(1) : "—"}
            </td>
            <td colspan="3" class="td-center" style="border:1px solid #ccc"></td>
          </tr>
        </tbody>
      </table>
      <!-- Overall -->
      <table style="margin-bottom:5px;font-size:13px">
        <tbody>
          <tr>
            <td style="border:1px solid #bbb;padding:3px 6px;font-weight:700;white-space:nowrap">Overall Identifier</td>
            <td style="border:1px solid #bbb;padding:3px 8px;font-weight:800;text-align:center;color:${primary};width:32px">${oi.id}</td>
            <td style="border:1px solid #bbb;padding:3px 6px;font-weight:700;white-space:nowrap">Overall Achievement</td>
            <td style="border:1px solid #bbb;padding:3px 8px;font-weight:800;text-align:center;color:${accent}">${oi.label}</td>
            <td style="border:1px solid #bbb;padding:3px 6px;font-weight:700;white-space:nowrap">Overall Grade</td>
            <td style="border:1px solid #bbb;padding:3px 8px;font-weight:800;text-align:center;color:${primary}">${overallGrade}</td>
          </tr>
          <tr>
            <td style="border:1px solid #bbb;padding:3px 6px;font-weight:700;white-space:nowrap">Position in Class</td>
            <td colspan="5" style="border:1px solid #bbb;padding:3px 8px;font-weight:800;color:${primary}">
              ${data.classPosition != null && data.outOf != null ? `${data.classPosition} out of ${data.outOf}` : "—"}
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Comments -->
      <div style="margin-bottom:5px;font-size:14px;margin-top:10px">
        <div style="margin-bottom:8px;line-height:1.5"><div style="font-weight:800">Class Teacher's Comment:</div><div class="comment-val" style="margin-top:2px">${classComment}</div></div>
        <div style="margin-bottom:8px;line-height:1.5"><div style="font-weight:800">Head Teacher's Comment:</div><div class="comment-val" style="margin-top:2px">${headComment}</div></div>
        <div style="margin-top:12px"><span style="font-weight:800">SIGNATURE: </span><span style="border-bottom:1.5px solid #333;display:inline-block;width:140px">&nbsp;</span></div>
      </div>
      <!-- Grading Scale stacked above Identifier -->
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:5px">
        <div>
          <div class="section-title">GRADING SCALE</div>
          <table>
            <thead><tr>
              <th class="th-center" style="color:${primary};background:transparent;border:1px solid ${primary}">80-100</th>
              <th class="th-center" style="color:${primary};background:transparent;border:1px solid ${primary}">70-79</th>
              <th class="th-center" style="color:${primary};background:transparent;border:1px solid ${primary}">60-69</th>
              <th class="th-center" style="color:${primary};background:transparent;border:1px solid ${primary}">50-59</th>
              <th class="th-center" style="color:${primary};background:transparent;border:1px solid ${primary}">0-49</th>
            </tr></thead>
            <tbody><tr>
              <td class="td-center" style="font-weight:800;font-size:14px;color:${primary};border:1px solid ${primary}">A</td>
              <td class="td-center" style="font-weight:800;font-size:14px;color:${primary};border:1px solid ${primary}">B</td>
              <td class="td-center" style="font-weight:800;font-size:14px;color:${primary};border:1px solid ${primary}">C</td>
              <td class="td-center" style="font-weight:800;font-size:14px;color:${primary};border:1px solid ${primary}">D</td>
              <td class="td-center" style="font-weight:800;font-size:14px;color:${primary};border:1px solid ${primary}">E</td>
            </tr></tbody>
          </table>
        </div>
        <div>
          <table>
            <thead><tr>
              <th class="th-center" style="color:${primary};background:transparent;border:1px solid ${primary};width:80px">Identifier</th>
              <th class="th-center" style="color:${primary};background:transparent;border:1px solid ${primary};width:120px">Score range</th>
              <th class="th-left"   style="color:${primary};background:transparent;border:1px solid ${primary}">Descriptor</th>
            </tr></thead>
            <tbody>
              <tr><td class="td-center" style="border:1px solid ${primary}">1</td><td class="td-center" style="border:1px solid ${primary}">0.9 – 1.49</td><td class="td-left" style="border:1px solid ${primary}">Basic</td></tr>
              <tr><td class="td-center" style="border:1px solid ${primary}">2</td><td class="td-center" style="border:1px solid ${primary}">1.5 – 2.49</td><td class="td-left" style="border:1px solid ${primary}">Moderate</td></tr>
              <tr><td class="td-center" style="border:1px solid ${primary}">3</td><td class="td-center" style="border:1px solid ${primary}">2.5 – 3.0</td><td class="td-left" style="border:1px solid ${primary}">Outstanding</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Footer dates -->
      <div class="footer-dates">
        <span>This term has ended on: <span class="date-val">${termEnd || "_______________"}</span></span>
        <span>Next term begins on: <span class="date-val">${nextTerm || "_______________"}</span></span>
      </div>
      <!-- Stamp caution — bottom, italic, quoted -->
      <div style="text-align:center;font-size:12px;font-weight:700;color:#666;letter-spacing:1px;font-style:italic;border-top:1px dashed #ccc;padding-top:6px;margin-top:6px">
        &ldquo;Not valid without a school stamp&rdquo;
      </div>
    </div>
  </div>`;
}

// ── Preview modal ──────────────────────────────────────────────────────────────

export default function ReportCardPreview({
  streamId, termId, format, theme, school, academicYear, termName, onClose, studentId, hideDateInputs,
}: Props) {
  const [cards,        setCards]        = useState<ReportCardData[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [termEndDate,  setTermEndDate]  = useState("");
  const [nextTermDate, setNextTermDate] = useState("");
  const [watermarkId]  = useState<WatermarkId>("checkerboard");
  const [borderId]     = useState<BorderId>("ornate");
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchStreamReportCards(streamId, termId, studentId)
      .then(setCards)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [streamId, termId, studentId]);

  function formatDate(val: string) {
    if (!val) return "";
    // Parse YYYY-MM-DD manually to avoid UTC timezone shift
    const [year, month, day] = val.split("-").map(Number);
    if (!year || !month || !day) return "";
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  }

  function handlePrint() {
    const frame = printFrameRef.current;
    if (!frame || cards.length === 0) return;

    const termEnd  = formatDate(termEndDate);
    const nextTerm = formatDate(nextTermDate);
    const primary  = theme.primaryColor ?? "#1a3a6b";
    const accent   = theme.accentColor  ?? "#c8a400";
    const wm       = WATERMARKS.find(w => w.id === watermarkId) ?? WATERMARKS[0];

    const cardsHtml = cards.map(card =>
      buildCardHtml(card, { primary, accent, school, academicYear, termName, termEnd, nextTerm, watermarkId, borderId })
    ).join("");

    let borderPageCss = "";
    if (borderId === "simple")      borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "double") borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "ornate") borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "thick_inner") borderPageCss = `border:6px solid ${primary};`;
    else if (borderId === "dashed") borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "ribbon") borderPageCss = `border:5px double ${primary};`;

    const wmBgCss = wm.id !== "none"
      ? `background-image:${wm.css};background-size:${wm.size};`
      : "";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Report Cards</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    body { background:white; font-family:Arial,sans-serif; font-weight:700; }
    .page {
      width:210mm; min-height:297mm;
      page-break-after:always; break-after:page;
      position:relative; padding:12mm 10mm 8mm;
      margin:0 auto; font-size:13px;
      display:flex; flex-direction:column;
      ${borderPageCss}
    }
    .page:last-child { page-break-after:avoid; break-after:avoid; }
    .content { position:relative; z-index:1; display:flex; flex-direction:column; flex:1; gap:3px; }
    table { width:100%; border-collapse:collapse; }
    th,td { border:1px solid #ccc; padding:3px 5px; font-size:13px; font-weight:700; }
    th { background:${primary}; color:#fff; font-weight:700; }
    .th-left { text-align:left; }
    .th-center { text-align:center; }
    .td-left { text-align:left; }
    .td-center { text-align:center; }
    .perf-header { text-align:center; font-weight:800; font-size:13px; background:${primary}; color:#fff; padding:4px 0; text-transform:uppercase; letter-spacing:0.8px; }
    .section-title { text-align:center; font-weight:800; font-size:13px; color:${primary}; text-decoration:underline; text-transform:uppercase; margin-bottom:3px; }
    .report-title { text-align:center; font-weight:900; font-size:16px; color:${accent}; text-decoration:underline; text-transform:uppercase; letter-spacing:2px; }
    .school-name { font-weight:900; font-size:26px; text-transform:uppercase; color:${primary}; letter-spacing:1px; line-height:1.1; margin-bottom:4px; text-align:center; }
    .school-info { font-size:13px; color:#444; text-align:center; margin-bottom:2px; }
    .school-motto { font-size:13px; font-style:italic; color:#666; text-align:center; margin-top:3px; }
    .footer-dates { display:flex; justify-content:space-between; font-size:13px; font-weight:800; border-top:1.5px solid ${primary}; padding-top:5px; margin-top:10px; }
    .date-val { color:${accent}; font-weight:900; text-decoration:underline; border-bottom:2px solid ${accent}; display:inline-block; min-width:90px; }
    .comment-val { font-weight:800; font-style:italic; text-decoration:underline; color:#1a3a8f; }
    @media print { @page { size:A4 portrait; margin:0; } body { margin:0; } .page { margin:0; } }
  </style>
</head>
<body>${cardsHtml}</body>
</html>`;

    const doc = frame.contentDocument || frame.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
    frame.contentWindow?.addEventListener("load", () => {
      setTimeout(() => { frame.contentWindow?.focus(); frame.contentWindow?.print(); }, 300);
    });
    setTimeout(() => { frame.contentWindow?.focus(); frame.contentWindow?.print(); }, 800);
  }

  return (
    <>
      <iframe ref={printFrameRef} style={{ display: "none" }} title="print-frame" />

      <div className="fixed inset-0 z-50 flex flex-col bg-slate-300 dark:bg-slate-800">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shrink-0 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X className="h-4 w-4" />
            </button>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Report Card Preview</span>
            {!loading && cards.length > 0 && (
              <span className="text-xs text-slate-500">{cards.length} student{cards.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Term dates — hidden in parent portal */}
            {!hideDateInputs && (
              <>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Term ended:</label>
                  <input type="date" value={termEndDate} onChange={e => setTermEndDate(e.target.value)}
                    className="text-xs border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Next term:</label>
                  <input type="date" value={nextTermDate} onChange={e => setNextTermDate(e.target.value)}
                    className="text-xs border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </>
            )}

            <Button size="sm" className="gap-1.5" onClick={handlePrint} disabled={loading || cards.length === 0}>
              <Printer className="h-4 w-4" /> Print All
            </Button>
          </div>
        </div>

        {/* Scrollable preview */}
        <div className="flex-1 overflow-y-auto py-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : cards.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              No report cards found for this stream and term.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8">
              {cards.map((card) => (
                <div key={card.enrollmentId} className="shadow-2xl">
                  <TermlyReportCard
                    data={card} theme={theme} school={school}
                    academicYear={academicYear} termName={termName}
                    termEndDate={formatDate(termEndDate)}
                    nextTermDate={formatDate(nextTermDate)}
                    watermarkId={watermarkId}
                    borderId={borderId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Printer, Loader2, FileText, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WATERMARKS, BORDERS,
  type WatermarkId, type BorderId,
  TermlyReportCard,
  type ReportCardData,
} from "@/app/(school)/school/[slug]/academics/report-cards/report-card-preview";
import type { ReportCardTheme } from "@/app/(school)/school/[slug]/academics/report-cards/components/report-cards-client";

// ── Types ─────────────────────────────────────────────────────────────────
type School = {
  name: string | null; motto: string | null; logo: string | null;
  address: string | null; contact: string | null;
  contact2?: string | null; email?: string | null; email2?: string | null;
} | null;

export type Props = {
  enrollment: {
    id: string;
    streamId: string | null;
    termId: string;
    studentId: string;
    academicYear: { year: string };
    term: { name: string };
  };
  school: School;
  onClose: () => void;
};

const PRESET_THEMES: Record<string, { label: string; theme: ReportCardTheme }> = {
  maroon: { label: "Maroon",  theme: { primaryColor: "#8B1A1A", headerBg: "#8B1A1A", headerText: "#fff", accentColor: "#C9A227", tableHeaderBg: "#8B1A1A", tableHeaderText: "#fff", footerBg: "#F5F0E8" } },
  navy:   { label: "Navy",    theme: { primaryColor: "#1B3A6B", headerBg: "#1B3A6B", headerText: "#fff", accentColor: "#2A7AE2", tableHeaderBg: "#1B3A6B", tableHeaderText: "#fff", footerBg: "#EEF4FB" } },
  green:  { label: "Green",   theme: { primaryColor: "#1A5C2A", headerBg: "#1A5C2A", headerText: "#fff", accentColor: "#3A9B52", tableHeaderBg: "#1A5C2A", tableHeaderText: "#fff", footerBg: "#EEF7F0" } },
  purple: { label: "Purple",  theme: { primaryColor: "#4A1A8B", headerBg: "#4A1A8B", headerText: "#fff", accentColor: "#7C3AE2", tableHeaderBg: "#4A1A8B", tableHeaderText: "#fff", footerBg: "#F3EEF9" } },
  black:  { label: "Black",   theme: { primaryColor: "#1A1A1A", headerBg: "#1A1A1A", headerText: "#fff", accentColor: "#D4A017", tableHeaderBg: "#1A1A1A", tableHeaderText: "#fff", footerBg: "#F5F5F0" } },
};

// ── Print helper ──────────────────────────────────────────────────────────
function printCard(card: ReportCardData, school: School, academicYear: string, termName: string, theme: ReportCardTheme, watermarkId: WatermarkId, borderId: BorderId) {
  const wm = WATERMARKS.find(w => w.id === watermarkId) ?? WATERMARKS[0];
  const primary = theme.primaryColor;
  const accent  = theme.accentColor;

  const borderCss = (() => {
    if (borderId === "simple")      return `<div style="position:absolute;inset:0;border:4px solid ${primary};pointer-events:none"></div>`;
    if (borderId === "double")      return `<div style="position:absolute;inset:0;border:4px solid ${primary};pointer-events:none"></div><div style="position:absolute;inset:7px;border:1.5px solid ${accent};pointer-events:none"></div>`;
    if (borderId === "thick_inner") return `<div style="position:absolute;inset:0;border:6px solid ${primary};pointer-events:none"></div><div style="position:absolute;inset:10px;border:3px solid ${accent};pointer-events:none"></div>`;
    if (borderId === "dashed")      return `<div style="position:absolute;inset:0;border:4px solid ${primary};pointer-events:none"></div><div style="position:absolute;inset:6px;border:2px dashed ${accent};pointer-events:none"></div>`;
    if (borderId === "ribbon")      return `<div style="position:absolute;inset:0;border:5px double ${primary};pointer-events:none"></div><div style="position:absolute;inset:8px;border:1px solid ${accent};pointer-events:none"></div>`;
    return "";
  })();

  const isOLevel = card.classLevel === "O_LEVEL" || !card.classLevel;
  const hasAoi1 = card.subjects.some(s => (s as any).aoiScores?.[0] != null);
  const hasAoi2 = card.subjects.some(s => (s as any).aoiScores?.[1] != null);
  const hasAoi3 = card.subjects.some(s => (s as any).aoiScores?.[2] != null);
  const hasBOT  = card.subjects.some(s => s.botRaw != null || s.botPct != null);
  const hasMTE  = card.subjects.some(s => s.mteRaw != null || s.mtePct != null);
  const hasEOT  = card.subjects.some(s => s.eotRaw != null || s.eotPct != null);
  const ew = card.examWeights ?? { bot: 0, mte: 0, eot: 0, aoi: 20, summative: 80 };

  const subjectRows = card.subjects.map((s, i) => {
    const ss = s as any;
    const aoi1 = ss.aoiScores?.[0]; const aoi2 = ss.aoiScores?.[1]; const aoi3 = ss.aoiScores?.[2];
    const scores = [aoi1, aoi2, aoi3].filter((v: any) => v != null) as number[];
    const avg20  = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : (s.aoiRawAverage ?? null);
    const pct20  = avg20 != null ? (avg20 / 3 * 20).toFixed(1) : "—";
    const s80    = s.summativeContribution != null ? s.summativeContribution.toFixed(1) : "—";
    const pct20n = avg20 != null ? avg20 / 3 * 20 : null;
    const total  = pct20n != null && s.summativeContribution != null ? (pct20n + s.summativeContribution).toFixed(1) : (s.totalPercentage != null ? s.totalPercentage.toFixed(1) : "—");
    const grade  = s.finalGrade ?? "—";
    const teacher = s.teacherName ? s.teacherName.split(" ").map((p: string) => p[0]).join(".").toUpperCase() : "";
    const bg = i % 2 === 0 ? "transparent" : "rgba(245,247,250,0.4)";
    return `<tr style="background:${bg}">
      <td style="border:1px solid #ccc;padding:3px 5px;font-size:13px;font-weight:700">${s.subjectName.toUpperCase()}</td>
      ${hasAoi1 ? `<td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:700">${aoi1 ?? "—"}</td>` : ""}
      ${hasAoi2 ? `<td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:700">${aoi2 ?? "—"}</td>` : ""}
      ${hasAoi3 ? `<td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:700">${aoi3 ?? "—"}</td>` : ""}
      <td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:700">${avg20 != null ? avg20.toFixed(1) : "—"}</td>
      <td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:800;color:${accent}">${pct20}</td>
      ${hasBOT ? `<td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:700">${s.botRaw ?? "—"}</td>` : ""}
      ${hasMTE ? `<td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:700">${s.mteRaw ?? "—"}</td>` : ""}
      ${hasEOT ? `<td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:700">${s.eotRaw ?? "—"}</td>` : ""}
      <td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:700">${s80}</td>
      <td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:800">${total}</td>
      <td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:800;color:${primary}">${grade}</td>
      <td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-style:italic">${s.gradeDescriptor ?? "—"}</td>
      <td style="border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:13px;font-weight:700">${teacher}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Report Card — ${card.studentName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  body{font-family:Arial,sans-serif;background:#fff}
  @media print{@page{size:A4;margin:0}body{padding:0}}
</style></head><body>
<div style="width:210mm;min-height:297mm;padding:12mm 10mm 8mm;font-size:13px;font-weight:700;position:relative;box-sizing:border-box">
  ${wm.id !== "none" ? `<div style="position:absolute;inset:0;pointer-events:none;background-image:${wm.css};background-size:${wm.size};opacity:${wm.opacity}"></div>` : ""}
  ${school?.logo ? `<div style="position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center"><img src="${school.logo}" style="width:420px;height:420px;object-fit:contain;opacity:0.18"/></div>` : ""}
  ${borderCss}
  <div style="position:relative;z-index:1">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">
      <div style="width:130px;flex-shrink:0">${school?.logo ? `<img src="${school.logo}" style="width:130px;height:130px;object-fit:contain"/>` : `<div style="width:130px;height:130px;border:2px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:11px;color:#aaa">BADGE</div>`}</div>
      <div style="flex:1;text-align:center;padding:0 8px">
        <div style="font-weight:900;font-size:26px;text-transform:uppercase;color:${primary};letter-spacing:1px;line-height:1.1;margin-bottom:4px">${school?.name ?? "SCHOOL NAME"}</div>
        ${school?.address ? `<div style="font-size:13px;color:#444;margin-bottom:2px">${school.address}</div>` : ""}
        ${school?.contact ? `<div style="font-size:13px;color:#444;margin-bottom:2px">Tel: ${school.contact}</div>` : ""}
        ${school?.motto ? `<div style="font-size:13px;font-style:italic;color:#666;margin-top:3px">"${school.motto}"</div>` : ""}
      </div>
      <div style="width:130px;flex-shrink:0;display:flex;justify-content:flex-end">
        ${card.imageUrl ? `<img src="${card.imageUrl}" style="width:100px;height:130px;object-fit:cover;border:1px solid #bbb"/>` : `<div style="width:100px;height:130px;border:1px solid #bbb;display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;background:#f9f9f9">PHOTO</div>`}
      </div>
    </div>
    <div style="text-align:center;font-weight:900;font-size:16px;color:${accent};text-decoration:underline;text-transform:uppercase;letter-spacing:2px">TERMLY REPORT CARD</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">
      <tbody>
        <tr>
          <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:5px;width:55px;border:none">NAME:</td>
          <td style="font-weight:800;padding-right:16px;padding-bottom:5px;border:none;border-bottom:1.5px solid #333;text-transform:uppercase">${card.studentName}</td>
          <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:5px;width:65px;border:none">SECTION:</td>
          <td style="font-weight:800;padding-right:16px;padding-bottom:5px;border:none;border-bottom:1.5px solid #333;text-transform:uppercase">${card.streamName}</td>
          <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:5px;width:32px;border:none">LIN:</td>
          <td style="font-weight:800;padding-bottom:5px;border:none;border-bottom:1.5px solid #333;text-transform:uppercase">${card.admissionNo}</td>
        </tr>
        <tr>
          <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-top:5px;border:none">CLASS:</td>
          <td style="font-weight:800;padding-right:16px;padding-top:5px;border:none;border-bottom:1.5px solid #333;text-transform:uppercase">${card.className} ${card.streamName}</td>
          <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-top:5px;border:none">TERM:</td>
          <td style="font-weight:800;padding-right:16px;padding-top:5px;border:none;border-bottom:1.5px solid #333;text-transform:uppercase">${termName}, ${academicYear}</td>
          <td colspan="2" style="border:none;padding-top:5px"></td>
        </tr>
      </tbody>
    </table>
    <div style="text-align:center;font-weight:800;font-size:13px;background:${primary};color:#fff;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;margin-top:6px">PERFORMANCE RECORDS</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:${primary};color:#fff">
          <th style="border:1px solid #bbb;padding:4px 5px;text-align:left;font-weight:700;font-size:13px;width:90px">SUBJECT</th>
          ${hasAoi1 ? `<th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:22px">AOI1</th>` : ""}
          ${hasAoi2 ? `<th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:22px">AOI2</th>` : ""}
          ${hasAoi3 ? `<th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:22px">AOI3</th>` : ""}
          <th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:26px">AVG</th>
          <th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:28px">20%</th>
          ${hasBOT ? `<th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:36px">BOT</th>` : ""}
          ${hasMTE ? `<th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:36px">MTE</th>` : ""}
          ${hasEOT ? `<th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:36px">EOT</th>` : ""}
          <th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:28px">80%</th>
          <th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:30px">100%</th>
          <th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:26px">GRADE</th>
          <th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:76px">ACHIEVEMENT</th>
          <th style="border:1px solid #bbb;padding:4px 5px;text-align:center;font-weight:700;font-size:13px;width:28px">TCH</th>
        </tr>
        <tr style="background:#e8ecf2;color:${primary};font-size:11px">
          <td style="border:1px solid #bbb;padding:2px 4px;font-weight:700;font-style:italic">Contribution</td>
          ${hasAoi1 ? `<td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>` : ""}
          ${hasAoi2 ? `<td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>` : ""}
          ${hasAoi3 ? `<td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>` : ""}
          <td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>
          <td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">${ew.aoi}%</td>
          ${hasBOT ? `<td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">${ew.bot}%</td>` : ""}
          ${hasMTE ? `<td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">${ew.mte}%</td>` : ""}
          ${hasEOT ? `<td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">${ew.eot}%</td>` : ""}
          <td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">${ew.summative}%</td>
          <td style="border:1px solid #bbb;padding:2px 3px;text-align:center;font-weight:800">100%</td>
          <td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>
          <td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>
          <td style="border:1px solid #bbb;padding:2px 3px;text-align:center"></td>
        </tr>
      </thead>
      <tbody>${subjectRows}</tbody>
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:4px">
      <tbody><tr>
        <td style="border:1px solid #bbb;padding:3px 6px;font-weight:700;white-space:nowrap">Overall Identifier</td>
        <td style="border:1px solid #bbb;padding:3px 8px;font-weight:800;text-align:center;color:${primary};width:32px">${card.averageMark != null ? (card.averageMark >= 2.5 ? 3 : card.averageMark >= 1.5 ? 2 : 1) : 0}</td>
        <td style="border:1px solid #bbb;padding:3px 6px;font-weight:700;white-space:nowrap">Overall Achievement</td>
        <td style="border:1px solid #bbb;padding:3px 8px;font-weight:800;text-align:center;color:${accent}">${card.averageMark != null ? (card.averageMark >= 2.5 ? "Outstanding" : card.averageMark >= 1.5 ? "Moderate" : "Basic") : "—"}</td>
        <td style="border:1px solid #bbb;padding:3px 6px;font-weight:700;white-space:nowrap">Overall Grade</td>
        <td style="border:1px solid #bbb;padding:3px 8px;font-weight:800;text-align:center;color:${primary}">${isOLevel ? (card.division ?? "—") : (card.totalPoints != null ? `${card.totalPoints}pts` : "—")}</td>
      </tr></tbody>
    </table>
    <div style="font-size:14px;margin-top:10px">
      <div style="margin-bottom:8px;line-height:1.5"><div style="font-weight:800">Class Teacher's Comment:</div><div style="font-weight:800;font-style:italic;text-decoration:underline;color:#1a3a8f;margin-top:2px">${card.classTeacherComment ?? ""}</div></div>
      <div style="margin-bottom:8px;line-height:1.5"><div style="font-weight:800">Head Teacher's Comment:</div><div style="font-weight:800;font-style:italic;text-decoration:underline;color:#1a3a8f;margin-top:2px">${card.headTeacherComment ?? ""}</div></div>
      <div style="margin-top:12px"><span style="font-weight:800">SIGNATURE: </span><span style="border-bottom:1.5px solid #333;display:inline-block;width:140px"></span></div>
    </div>
  </div>
</div>
</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  iframe.contentDocument!.open();
  iframe.contentDocument!.write(html);
  iframe.contentDocument!.close();
  iframe.onload = () => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  };
}

// ── Main modal ────────────────────────────────────────────────────────────
export default function StudentReportCardModal({ enrollment, school, onClose }: Props) {
  const [card,         setCard]         = useState<ReportCardData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState("maroon");
  const [watermarkId,  setWatermarkId]  = useState<WatermarkId>("none");
  const [borderId,     setBorderId]     = useState<BorderId>("simple");
  const [showDesign,   setShowDesign]   = useState(false);

  const theme = PRESET_THEMES[selectedTheme]?.theme ?? PRESET_THEMES.maroon.theme;

  useEffect(() => {
    if (!enrollment.streamId || !enrollment.termId) {
      setError("Missing stream or term information.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/report-cards?streamId=${enrollment.streamId}&termId=${enrollment.termId}&studentId=${enrollment.studentId}`)
      .then(r => r.json())
      .then((data: ReportCardData[]) => {
        if (!Array.isArray(data) || data.length === 0) {
          setError("No report card data found for this term.");
        } else {
          setCard(data[0]);
        }
      })
      .catch(() => setError("Failed to load report card."))
      .finally(() => setLoading(false));
  }, [enrollment.streamId, enrollment.termId, enrollment.studentId]);

  // Normalise school to full type expected by TermlyReportCard
  const fullSchool = school ? {
    name: school.name, motto: school.motto, logo: school.logo,
    address: school.address, contact: school.contact,
    contact2: school.contact2 ?? null,
    email: school.email ?? null, email2: school.email2 ?? null,
  } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-slate-100">Report Card</h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              {enrollment.academicYear.year} · {enrollment.term.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDesign(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-slate-600 text-xs text-zinc-600 dark:text-slate-300 hover:border-blue-400 transition-colors">
              <Palette className="h-3.5 w-3.5" /> Design
            </button>
            <Button size="sm" onClick={() => card && printCard(card, school, enrollment.academicYear.year, enrollment.term.name, theme, watermarkId, borderId)}
              disabled={!card}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 h-8 text-xs">
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors">
              <X className="h-4 w-4 text-zinc-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Design panel */}
        {showDesign && (
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-slate-700/50 bg-zinc-50 dark:bg-slate-800/40 shrink-0 flex flex-wrap gap-5">
            {/* Theme */}
            <div>
              <p className="text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">Colour Theme</p>
              <div className="flex gap-1.5">
                {Object.entries(PRESET_THEMES).map(([key, { label, theme: t }]) => (
                  <button key={key} onClick={() => setSelectedTheme(key)}
                    title={label}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${selectedTheme === key ? "border-blue-500 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: t.primaryColor }} />
                ))}
              </div>
            </div>
            {/* Watermark */}
            <div>
              <p className="text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">Watermark</p>
              <div className="flex flex-wrap gap-1">
                {WATERMARKS.map(w => (
                  <button key={w.id} onClick={() => setWatermarkId(w.id)}
                    className={`px-2 py-1 rounded text-[10px] border transition-all ${watermarkId === w.id ? "bg-blue-600 text-white border-blue-600" : "border-zinc-200 dark:border-slate-600 text-zinc-600 dark:text-slate-400"}`}>
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Border */}
            <div>
              <p className="text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">Border</p>
              <div className="flex flex-wrap gap-1">
                {BORDERS.map(b => (
                  <button key={b.id} onClick={() => setBorderId(b.id)}
                    className={`px-2 py-1 rounded text-[10px] border transition-all ${borderId === b.id ? "bg-blue-600 text-white border-blue-600" : "border-zinc-200 dark:border-slate-600 text-zinc-600 dark:text-slate-400"}`}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-900 p-4">
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-zinc-500 dark:text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading report card...</span>
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500 dark:text-slate-400">
              <FileText className="h-10 w-10 opacity-40" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {card && !loading && (
            <div className="shadow-xl">
              <TermlyReportCard
                data={card}
                theme={theme}
                school={fullSchool}
                academicYear={enrollment.academicYear.year}
                termName={enrollment.term.name}
                termEndDate=""
                nextTermDate=""
                watermarkId={watermarkId}
                borderId={borderId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

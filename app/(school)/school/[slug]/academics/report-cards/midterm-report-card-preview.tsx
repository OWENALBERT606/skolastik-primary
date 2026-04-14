// app/school/[slug]/academics/report-cards/midterm-report-card-preview.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button }  from "@/components/ui/button";
import { toast }   from "sonner";
import { X, Loader2, Printer } from "lucide-react";
import { ReportCardTheme } from "./components/report-cards-client";
import { WATERMARKS, BORDERS, WatermarkId, BorderId } from "./report-card-preview";

function BorderOverlay({ borderId, primary, accent }: { borderId: BorderId; primary: string; accent: string }) {
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

// ── Types ──────────────────────────────────────────────────────────────────────

type AOITopicRow = {
  topicNumber:  number;
  topicName:    string;
  description:  string | null;
  maxPoints:    number;
  score:        number | null;
  remarks:      string | null;
  status:       string;
};

type PaperData = {
  paperId:     string | null;
  paperNumber: number | null;
  paperName:   string | null;
  aoiTopics:   AOITopicRow[];
  botMarks:    number | null;
  botOutOf:    number | null;
  mteMarks:    number | null;
  mteOutOf:    number | null;
};

type SubjectData = {
  subjectId:   string;
  subjectName: string;
  subjectCode: string | null;
  papers:      PaperData[];
};

type MidtermCardData = {
  enrollmentId: string;
  studentName:  string;
  admissionNo:  string;
  gender:       string;
  dob:          string;
  imageUrl:     string | null;
  className:    string;
  streamName:   string;
  subjects:     SubjectData[];
};

type Props = {
  streamId:     string;
  termId:       string;
  theme:        ReportCardTheme;
  school:       { name: string | null; motto: string | null; logo: string | null; address: string | null; contact: string | null; contact2: string | null; email: string | null; email2: string | null } | null;
  academicYear: string;
  termName:     string;
  showBOT:      boolean;
  showMTE:      boolean;
  onClose:      () => void;
};

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchMidtermCards(streamId: string, termId: string): Promise<MidtermCardData[]> {
  const res = await fetch(`/api/report-cards/midterm?streamId=${streamId}&termId=${termId}`);
  if (!res.ok) throw new Error("Failed to load midterm data");
  return res.json();
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

// ── Single Midterm Card ────────────────────────────────────────────────────────

function MidtermCard({ data, theme, school, academicYear, termName, showBOT, showMTE, watermarkId, borderId }: {
  data:         MidtermCardData;
  theme:        ReportCardTheme;
  school:       Props["school"];
  academicYear: string;
  termName:     string;
  showBOT:      boolean;
  showMTE:      boolean;
  watermarkId:  WatermarkId;
  borderId:     BorderId;
}) {
  const primary = theme.primaryColor ?? "#1a3a6b";
  const accent  = theme.accentColor  ?? "#c8a400";
  const wm      = WATERMARKS.find(w => w.id === watermarkId) ?? WATERMARKS[0];

  return (
    <div
      className="bg-white text-black font-sans"
      style={{
        width: "210mm",
        margin: "0 auto", padding: "12mm 10mm 8mm",
        fontSize: "13px", fontWeight: 700,
        position: "relative", boxSizing: "border-box",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Tile watermark */}
      {wm.id !== "none" && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: wm.css, backgroundSize: wm.size, opacity: wm.opacity,
        }} />
      )}

      {/* Badge watermark */}
      {school?.logo && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img src={school.logo} alt="" style={{ width: "420px", height: "420px", objectFit: "contain", opacity: 0.18 }} />
        </div>
      )}

      {/* Border */}
      <BorderOverlay borderId={borderId} primary={primary} accent={accent} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, gap: "3px" }}>

        {/* Header */}
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
          MID-TERM REPORT CARD
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

        {/* Performance header */}
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: "13px", backgroundColor: primary, color: "#fff", padding: "5px 0", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "6px" }}>
          MID-TERM PERFORMANCE RECORDS
        </div>

        {/* Marks table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: primary, color: "#fff" }}>
              <th style={th("left", "130px")}>SUBJECT / PAPER</th>
              {showBOT && <th style={th("center", "55px")}>BOT</th>}
              {showBOT && <th style={th("center", "45px")}>/ OUT OF</th>}
              {showMTE && <th style={th("center", "55px")}>MTE</th>}
              {showMTE && <th style={th("center", "45px")}>/ OUT OF</th>}
              <th style={th("left")}>AOI TOPIC</th>
              <th style={th("center", "50px")}>SCORE</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.flatMap((subject, si) => {
              const subjectBg = si % 2 === 0 ? "transparent" : "rgba(245,247,250,0.4)";

              return subject.papers.flatMap((paper, pi) => {
                const label = subject.papers.length > 1
                  ? `${subject.subjectName.toUpperCase()} P${paper.paperNumber ?? pi + 1}${paper.paperName ? ` – ${paper.paperName}` : ""}`
                  : subject.subjectName.toUpperCase();

                const topics = paper.aoiTopics.length > 0 ? paper.aoiTopics : [null];

                return topics.map((topic, ti) => (
                  <tr key={`${si}-${pi}-${ti}`} style={{ backgroundColor: subjectBg }}>
                    {/* Subject/paper label only on first topic row */}
                    {ti === 0 ? (
                      <td style={{ ...td("left"), verticalAlign: "top" }} rowSpan={topics.length}>{label}</td>
                    ) : null}
                    {/* BOT/MTE only on first topic row */}
                    {ti === 0 && showBOT ? <td style={{ ...td("center"), verticalAlign: "top" }} rowSpan={topics.length}>{paper.botMarks ?? "—"}</td> : (ti === 0 && !showBOT ? null : null)}
                    {ti === 0 && showBOT ? <td style={{ ...td("center"), verticalAlign: "top" }} rowSpan={topics.length}>{paper.botOutOf ?? "—"}</td> : null}
                    {ti === 0 && showMTE ? <td style={{ ...td("center"), verticalAlign: "top" }} rowSpan={topics.length}>{paper.mteMarks ?? "—"}</td> : null}
                    {ti === 0 && showMTE ? <td style={{ ...td("center"), verticalAlign: "top" }} rowSpan={topics.length}>{paper.mteOutOf ?? "—"}</td> : null}
                    {/* AOI topic name */}
                    <td style={{ ...td("left"), fontSize: "12px" }}>
                      {topic ? `${topic.topicNumber}. ${topic.topicName}` : "—"}
                    </td>
                    {/* Score */}
                    <td style={{ ...td("center"), fontSize: "12px" }}>
                      {topic ? `${topic.score ?? "—"} / ${topic.maxPoints}` : "—"}
                    </td>
                  </tr>
                ));
              });
            })}
          </tbody>
        </table>

        {/* Stamp caution */}
        <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#666", letterSpacing: "1px", fontStyle: "italic", borderTop: "1px dashed #ccc", paddingTop: "6px", marginTop: "auto" }}>
          &ldquo;Not valid without a school stamp&rdquo;
        </div>
      </div>
    </div>
  );
}

// ── Preview modal ──────────────────────────────────────────────────────────────

export default function MidtermReportCardPreview({
  streamId, termId, theme, school, academicYear, termName, showBOT, showMTE, onClose,
}: Props) {
  const [cards,       setCards]       = useState<MidtermCardData[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [watermarkId] = useState<WatermarkId>("checkerboard");
  const [borderId]    = useState<BorderId>("ornate");
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchMidtermCards(streamId, termId)
      .then(setCards)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [streamId, termId]);

  function handlePrint() {
    const frame = printFrameRef.current;
    if (!frame || cards.length === 0) return;

    const primary = theme.primaryColor ?? "#1a3a6b";
    const accent  = theme.accentColor  ?? "#c8a400";
    const wm      = WATERMARKS.find(w => w.id === watermarkId) ?? WATERMARKS[0];

    let borderPageCss = "";
    if (borderId === "simple")       borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "double")  borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "ornate")  borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "thick_inner") borderPageCss = `border:6px solid ${primary};`;
    else if (borderId === "dashed")  borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "ribbon")  borderPageCss = `border:5px double ${primary};`;

    const cardsHtml = cards.map(card => {
      const logoHtml = school?.logo
        ? `<img src="${school.logo}" style="width:130px;height:130px;object-fit:contain" />`
        : `<div style="width:130px;height:130px;border:2px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:9px;color:#aaa;border-radius:4px">BADGE</div>`;

      const subjectRows = card.subjects.flatMap((subject, si) => {
        const subjectBg = si % 2 === 0 ? "transparent" : "rgba(245,247,250,0.4)";
        return subject.papers.flatMap((paper, pi) => {
          const label = subject.papers.length > 1
            ? `${subject.subjectName.toUpperCase()} P${paper.paperNumber ?? pi + 1}${paper.paperName ? ` – ${paper.paperName}` : ""}`
            : subject.subjectName.toUpperCase();
          const topics = paper.aoiTopics.length > 0 ? paper.aoiTopics : [null as typeof paper.aoiTopics[0] | null];
          return topics.map((topic, ti) => `<tr style="background:${subjectBg}">
            ${ti === 0 ? `<td class="td-left" rowspan="${topics.length}" style="vertical-align:top">${label}</td>` : ""}
            ${ti === 0 && showBOT ? `<td class="td-center" rowspan="${topics.length}" style="vertical-align:top">${paper.botMarks ?? "—"}</td>` : ""}
            ${ti === 0 && showBOT ? `<td class="td-center" rowspan="${topics.length}" style="vertical-align:top">${paper.botOutOf ?? "—"}</td>` : ""}
            ${ti === 0 && showMTE ? `<td class="td-center" rowspan="${topics.length}" style="vertical-align:top">${paper.mteMarks ?? "—"}</td>` : ""}
            ${ti === 0 && showMTE ? `<td class="td-center" rowspan="${topics.length}" style="vertical-align:top">${paper.mteOutOf ?? "—"}</td>` : ""}
            <td class="td-left" style="font-size:12px">${topic ? `${topic.topicNumber}. ${topic.topicName}` : "—"}</td>
            <td class="td-center" style="font-size:12px">${topic ? `${topic.score ?? "—"} / ${topic.maxPoints}` : "—"}</td>
          </tr>`);
        });
      }).join("");

      return `<div class="page" style="${borderPageCss}">
        ${school?.logo ? `<div style="position:absolute;inset:0;pointer-events:none;z-index:0;display:flex;align-items:center;justify-content:center"><img src="${school.logo}" style="width:420px;height:420px;object-fit:contain;opacity:0.18" /></div>` : ""}
        <div class="content">
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
              ${card.imageUrl
                ? `<img src="${card.imageUrl}" style="width:100px;height:130px;object-fit:cover;border:1px solid #bbb" />`
                : `<div style="width:100px;height:130px;border:1px solid #bbb;display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;background:#f9f9f9">PHOTO</div>`
              }
            </div>
          </div>
          <div class="report-title">MID-TERM REPORT CARD</div>
          <table style="margin-bottom:5px;font-size:13px">
            <tbody>
              <tr>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:5px;width:55px;border:none">NAME:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-bottom:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${card.studentName}</td>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:5px;width:65px;border:none">SECTION:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-bottom:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${card.streamName}</td>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:5px;width:32px;border:none">LIN:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-bottom:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${card.admissionNo}</td>
              </tr>
              <tr>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-top:5px;border:none">CLASS:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-top:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${card.className} ${card.streamName}</td>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-top:5px;border:none">TERM:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-top:5px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${termName}, ${academicYear}</td>
                <td colspan="2" style="border:none;padding-top:5px"></td>
              </tr>
            </tbody>
          </table>
          <div class="perf-header" style="margin-top:6px">MID-TERM PERFORMANCE RECORDS</div>
          <table>
            <thead>
              <tr>
                <th class="th-left" style="width:130px">SUBJECT / PAPER</th>
                ${showBOT ? `<th class="th-center" style="width:55px">BOT</th>` : ""}
                ${showBOT ? `<th class="th-center" style="width:45px">/ OUT OF</th>` : ""}
                ${showMTE ? `<th class="th-center" style="width:55px">MTE</th>` : ""}
                ${showMTE ? `<th class="th-center" style="width:45px">/ OUT OF</th>` : ""}
                <th class="th-left">AOI TOPIC</th>
                <th class="th-center" style="width:50px">SCORE</th>
              </tr>
            </thead>
            <tbody>${subjectRows}</tbody>
          </table>
          <div style="text-align:center;font-size:12px;font-weight:700;color:#666;letter-spacing:1px;font-style:italic;border-top:1px dashed #ccc;padding-top:6px;margin-top:auto">
            &ldquo;Not valid without a school stamp&rdquo;
          </div>
        </div>
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Mid-Term Report Cards</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    body { background:white; font-family:Arial,sans-serif; font-weight:700; }
    .page { width:210mm; page-break-after:always; break-after:page; position:relative; padding:12mm 10mm 8mm; margin:0 auto; font-size:13px; display:flex; flex-direction:column; }
    .page:last-child { page-break-after:avoid; break-after:avoid; }
    .content { position:relative; z-index:1; display:flex; flex-direction:column; flex:1; gap:3px; }
    table { width:100%; border-collapse:collapse; }
    th,td { border:1px solid #ccc; padding:3px 5px; font-size:13px; font-weight:700; }
    th { background:${primary}; color:#fff; font-weight:700; }
    .th-left { text-align:left; } .th-center { text-align:center; }
    .td-left { text-align:left; } .td-center { text-align:center; }
    .perf-header { text-align:center; font-weight:800; font-size:13px; background:${primary}; color:#fff; padding:4px 0; text-transform:uppercase; letter-spacing:0.8px; }
    .report-title { text-align:center; font-weight:900; font-size:16px; color:${accent}; text-decoration:underline; text-transform:uppercase; letter-spacing:2px; }
    .school-name { font-weight:900; font-size:26px; text-transform:uppercase; color:${primary}; letter-spacing:1px; line-height:1.1; margin-bottom:4px; text-align:center; }
    .school-info { font-size:13px; color:#444; text-align:center; margin-bottom:2px; }
    .school-motto { font-size:13px; font-style:italic; color:#666; text-align:center; margin-top:3px; }
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
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Mid-Term Report Card Preview</span>
            {!loading && cards.length > 0 && (
              <span className="text-xs text-slate-500">{cards.length} student{cards.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Navigation */}

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
              No mid-term report cards found for this stream and term.
            </div>
                  ) : (
            <div className="flex flex-col items-center gap-8">
              {cards.map((card) => (
                <div key={card.enrollmentId} className="shadow-2xl">
                  <MidtermCard
                    data={card}
                    theme={theme}
                    school={school}
                    academicYear={academicYear}
                    termName={termName}
                    showBOT={showBOT}
                    showMTE={showMTE}
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

// app/school/[slug]/academics/report-cards/aoi-report-preview.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button }  from "@/components/ui/button";
import { toast }   from "sonner";
import { X, Loader2, Printer } from "lucide-react";
import { ReportCardTheme } from "./components/report-cards-client";
import { WATERMARKS, BORDERS, WatermarkId, BorderId } from "./report-card-preview";

// ── Types ──────────────────────────────────────────────────────────────────────

type AOITopicEntry = {
  topicNumber:  number;
  topicName:    string;
  competence:   string | null;
  score:        number | null;
  maxScore:     number;
  genericSkills: string | null;
  remarks:      string | null;
};

type AOISubject = {
  subjectName:     string;
  subjectCode:     string | null;
  aoiContribution: number | null;
  topics:          AOITopicEntry[];
};

type AOICardData = {
  enrollmentId: string;
  studentName:  string;
  admissionNo:  string;
  gender:       string;
  imageUrl:     string | null;
  className:    string;
  streamName:   string;
  subjects:     AOISubject[];
};

type AOIConfig = {
  aoiWeight:            number;
  aoiMaxPoints:         number;
  showAOICompetence:    boolean;
  showAOIGenericSkills: boolean;
  showAOIRemarks:       boolean;
};

type Props = {
  streamId:     string;
  termId:       string;
  theme:        ReportCardTheme;
  school:       {
    name: string | null; motto: string | null; logo: string | null;
    address: string | null; contact: string | null; contact2: string | null;
    email: string | null; email2: string | null;
  } | null;
  academicYear: string;
  termName:     string;
  onClose:      () => void;
};

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchAOICards(streamId: string, termId: string): Promise<{ cards: AOICardData[]; config: AOIConfig }> {
  const res = await fetch(`/api/report-cards/aoi?streamId=${streamId}&termId=${termId}`);
  if (!res.ok) throw new Error("Failed to load AOI report data");
  return res.json();
}

// ── Style helpers ──────────────────────────────────────────────────────────────

function th(align: "left" | "center" | "right", width?: string): React.CSSProperties {
  return {
    border: "1px solid #bbb", padding: "4px 5px",
    textAlign: align, fontWeight: 700, fontSize: "12px",
    ...(width ? { width } : {}),
  };
}

function td(align: "left" | "center" | "right", extra?: React.CSSProperties): React.CSSProperties {
  return {
    border: "1px solid #ddd", padding: "3px 5px",
    textAlign: align, fontSize: "12px", fontWeight: 600,
    verticalAlign: "top",
    ...extra,
  };
}

// ── Border overlay ─────────────────────────────────────────────────────────────

function BorderOverlay({ borderId, primary, accent }: { borderId: BorderId; primary: string; accent: string }) {
  if (borderId === "simple")
    return <div style={{ position: "absolute", inset: 0, border: `4px solid ${primary}`, pointerEvents: "none", zIndex: 2 }} />;
  if (borderId === "double")
    return <>
      <div style={{ position: "absolute", inset: 0, border: `4px solid ${primary}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "7px", border: `1.5px solid ${accent}`, pointerEvents: "none", zIndex: 2 }} />
    </>;
  if (borderId === "ornate") {
    const corners = [
      { top: "4px",    left: "4px",  borderTop: `3px solid ${accent}`, borderLeft: `3px solid ${accent}` },
      { top: "4px",    right: "4px", borderTop: `3px solid ${accent}`, borderRight: `3px solid ${accent}` },
      { bottom: "4px", left: "4px",  borderBottom: `3px solid ${accent}`, borderLeft: `3px solid ${accent}` },
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
  if (borderId === "thick_inner")
    return <>
      <div style={{ position: "absolute", inset: 0, border: `6px solid ${primary}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "10px", border: `3px solid ${accent}`, pointerEvents: "none", zIndex: 2 }} />
    </>;
  if (borderId === "dashed")
    return <>
      <div style={{ position: "absolute", inset: 0, border: `4px solid ${primary}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "6px", border: `2px dashed ${accent}`, pointerEvents: "none", zIndex: 2 }} />
    </>;
  if (borderId === "ribbon")
    return <>
      <div style={{ position: "absolute", inset: 0, border: `5px double ${primary}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "8px", border: `1px solid ${accent}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: "11px", border: `1px solid ${accent}`, pointerEvents: "none", zIndex: 2 }} />
    </>;
  return null;
}

// ── Single AOI Card ────────────────────────────────────────────────────────────

function AOICard({ data, config, theme, school, academicYear, termName, watermarkId, borderId }: {
  data:         AOICardData;
  config:       AOIConfig;
  theme:        ReportCardTheme;
  school:       Props["school"];
  academicYear: string;
  termName:     string;
  watermarkId:  WatermarkId;
  borderId:     BorderId;
}) {
  const primary = theme.primaryColor ?? "#1a3a6b";
  const accent  = theme.accentColor  ?? "#c8a400";
  const wm      = WATERMARKS.find(w => w.id === watermarkId) ?? WATERMARKS[0];

  const { showAOICompetence, showAOIGenericSkills, showAOIRemarks } = config;

  return (
    <div
      className="bg-white text-black font-sans"
      style={{
        width: "210mm", margin: "0 auto", padding: "12mm 10mm 8mm",
        fontSize: "12px", fontWeight: 600, position: "relative",
        boxSizing: "border-box", display: "flex", flexDirection: "column",
      }}
    >
      {/* Tile watermark */}
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
          <img src={school.logo} alt="" style={{ width: "380px", height: "380px", objectFit: "contain", opacity: 0.16 }} />
        </div>
      )}

      <BorderOverlay borderId={borderId} primary={primary} accent={accent} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, gap: "4px" }}>

        {/* School header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ width: "120px", flexShrink: 0 }}>
            {school?.logo
              ? <img src={school.logo} alt="Badge" style={{ width: "120px", height: "120px", objectFit: "contain" }} />
              : <div style={{ width: "120px", height: "120px", border: "2px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#aaa", borderRadius: "4px" }}>BADGE</div>
            }
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "0 8px" }}>
            <div style={{ fontWeight: 900, fontSize: "24px", textTransform: "uppercase", color: primary, letterSpacing: "1px", lineHeight: 1.1, marginBottom: "4px" }}>
              {school?.name ?? "SCHOOL NAME"}
            </div>
            {school?.address && <div style={{ fontSize: "12px", color: "#444", marginBottom: "2px" }}>{school.address}</div>}
            {school?.contact && <div style={{ fontSize: "12px", color: "#444", marginBottom: "2px" }}>Tel: {school.contact}{school.contact2 ? ` / ${school.contact2}` : ""}</div>}
            {school?.email   && <div style={{ fontSize: "12px", color: "#444", marginBottom: "2px" }}>Email: {school.email}{school.email2 ? ` / ${school.email2}` : ""}</div>}
            {school?.motto   && <div style={{ fontSize: "12px", fontStyle: "italic", color: "#666", marginTop: "2px" }}>"{school.motto}"</div>}
          </div>
          <div style={{ width: "120px", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
            {data.imageUrl
              ? <img src={data.imageUrl} alt="Student" style={{ width: "90px", height: "120px", objectFit: "cover", border: "1px solid #bbb" }} />
              : <div style={{ width: "90px", height: "120px", border: "1px solid #bbb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#aaa", backgroundColor: "#f9f9f9" }}>PHOTO</div>
            }
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: "15px", color: accent, textDecoration: "underline", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "2px" }}>
          AOI ASSESSMENT REPORT
        </div>

        {/* Student info */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "4px" }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingBottom: "4px", width: "55px", border: "none" }}>NAME:</td>
              <td style={{ fontWeight: 800, paddingRight: "16px", paddingBottom: "4px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{data.studentName}</td>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingBottom: "4px", width: "65px", border: "none" }}>SECTION:</td>
              <td style={{ fontWeight: 800, paddingRight: "16px", paddingBottom: "4px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{data.streamName}</td>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingBottom: "4px", width: "32px", border: "none" }}>LIN:</td>
              <td style={{ fontWeight: 800, paddingBottom: "4px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{data.admissionNo}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingTop: "4px", border: "none" }}>CLASS:</td>
              <td style={{ fontWeight: 800, paddingRight: "16px", paddingTop: "4px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{data.className} {data.streamName}</td>
              <td style={{ fontWeight: 800, paddingRight: "4px", whiteSpace: "nowrap", paddingTop: "4px", border: "none" }}>TERM:</td>
              <td style={{ fontWeight: 800, paddingRight: "16px", paddingTop: "4px", border: "none", borderBottom: "1.5px solid #333", textTransform: "uppercase" }}>{termName}, {academicYear}</td>
              <td colSpan={2} style={{ border: "none", paddingTop: "4px" }} />
            </tr>
          </tbody>
        </table>

        {/* Section title */}
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: "12px", backgroundColor: primary, color: "#fff", padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.8px" }}>
          ACTIVITIES OF INTEGRATION (AOI) — PERFORMANCE RECORDS
        </div>

        {/* AOI table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: primary, color: "#fff" }}>
              <th style={th("left", "130px")}>SUBJECT</th>
              <th style={th("center", "26px")}>#</th>
              <th style={th("left")}>TOPIC</th>
              {showAOICompetence    && <th style={th("left")}>COMPETENCE / LEARNING OUTCOME</th>}
              <th style={th("center", "52px")}>SCORE</th>
              {showAOIGenericSkills && <th style={th("left", "120px")}>GENERIC SKILLS</th>}
              {showAOIRemarks       && <th style={th("left", "120px")}>TEACHER REMARKS</th>}
            </tr>
          </thead>
          <tbody>
            {data.subjects.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ ...td("center"), color: "#888", fontStyle: "italic", padding: "10px" }}>
                  No AOI scores recorded for this student.
                </td>
              </tr>
            ) : (
              data.subjects.flatMap((subject, si) => {
                const subjectBg = si % 2 === 0 ? "transparent" : "rgba(245,247,250,0.5)";
                const topics    = subject.topics.length > 0 ? subject.topics : [null as AOITopicEntry | null];

                return topics.map((topic, ti) => (
                  <tr key={`${si}-${ti}`} style={{ backgroundColor: subjectBg }}>
                    {ti === 0 && (
                      <td
                        style={{ ...td("left", { fontWeight: 700, verticalAlign: "top" }) }}
                        rowSpan={topics.length}
                      >
                        {subject.subjectName}
                        {subject.subjectCode && (
                          <span style={{ display: "block", fontWeight: 600, fontSize: "10px", color: "#666" }}>
                            {subject.subjectCode}
                          </span>
                        )}
                        {subject.aoiContribution != null && (
                          <span style={{ display: "block", fontSize: "10px", color: "#555", marginTop: "2px" }}>
                            AOI: {subject.aoiContribution.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    )}
                    <td style={td("center")}>
                      {topic ? topic.topicNumber : ""}
                    </td>
                    <td style={td("left")}>
                      {topic ? topic.topicName : "—"}
                    </td>
                    {showAOICompetence && (
                      <td style={{ ...td("left"), fontStyle: "italic", color: "#444", fontSize: "11px" }}>
                        {topic?.competence ?? ""}
                      </td>
                    )}
                    <td style={{ ...td("center"), fontWeight: 700 }}>
                      {topic ? `${topic.score ?? "—"} / ${topic.maxScore}` : ""}
                    </td>
                    {showAOIGenericSkills && (
                      <td style={{ ...td("left"), fontSize: "11px", color: "#444" }}>
                        {topic?.genericSkills ?? ""}
                      </td>
                    )}
                    {showAOIRemarks && (
                      <td style={{ ...td("left"), fontSize: "11px", color: "#444" }}>
                        {topic?.remarks ?? ""}
                      </td>
                    )}
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>

        {/* Signature row */}
        <div style={{ display: "flex", gap: "24px", marginTop: "auto", paddingTop: "12px", borderTop: "1px dashed #ccc" }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: "1px solid #333", marginBottom: "3px", height: "22px" }} />
            <div style={{ fontSize: "11px", fontWeight: 700 }}>Class Teacher</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: "1px solid #333", marginBottom: "3px", height: "22px" }} />
            <div style={{ fontSize: "11px", fontWeight: 700 }}>Head Teacher / Principal</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: "1px solid #333", marginBottom: "3px", height: "22px" }} />
            <div style={{ fontSize: "11px", fontWeight: 700 }}>Parent / Guardian</div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#666", letterSpacing: "1px", fontStyle: "italic", marginTop: "4px" }}>
          &ldquo;Not valid without a school stamp&rdquo;
        </div>
      </div>
    </div>
  );
}

// ── Preview modal ──────────────────────────────────────────────────────────────

export default function AOIReportPreview({
  streamId, termId, theme, school, academicYear, termName, onClose,
}: Props) {
  const [cards,       setCards]       = useState<AOICardData[]>([]);
  const [config,      setConfig]      = useState<AOIConfig>({ aoiWeight: 20, aoiMaxPoints: 3, showAOICompetence: true, showAOIGenericSkills: true, showAOIRemarks: true });
  const [loading,     setLoading]     = useState(true);
  const [watermarkId, setWatermarkId] = useState<WatermarkId>("checkerboard");
  const [borderId,    setBorderId]    = useState<BorderId>("ornate");
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchAOICards(streamId, termId)
      .then(({ cards, config }) => { setCards(cards); setConfig(config); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [streamId, termId]);

  function handlePrint() {
    const frame = printFrameRef.current;
    if (!frame || cards.length === 0) return;

    const primary = theme.primaryColor ?? "#1a3a6b";
    const accent  = theme.accentColor  ?? "#c8a400";
    const wm      = WATERMARKS.find(w => w.id === watermarkId) ?? WATERMARKS[0];
    const { showAOICompetence, showAOIGenericSkills, showAOIRemarks } = config;

    let borderPageCss = "";
    if (borderId === "simple")       borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "double")  borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "ornate")  borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "thick_inner") borderPageCss = `border:6px solid ${primary};`;
    else if (borderId === "dashed")  borderPageCss = `border:4px solid ${primary};`;
    else if (borderId === "ribbon")  borderPageCss = `border:5px double ${primary};`;

    const logoHtml = (logo: string | null | undefined) => logo
      ? `<img src="${logo}" style="width:120px;height:120px;object-fit:contain"/>`
      : `<div style="width:120px;height:120px;border:2px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:9px;color:#aaa;border-radius:4px">BADGE</div>`;

    const cardsHtml = cards.map(card => {
      const tableRows = card.subjects.length === 0
        ? `<tr><td colspan="10" style="border:1px solid #ddd;padding:10px;text-align:center;color:#888;font-style:italic">No AOI scores recorded for this student.</td></tr>`
        : card.subjects.flatMap((subject, si) => {
            const bg     = si % 2 === 0 ? "transparent" : "rgba(245,247,250,0.5)";
            const topics = subject.topics.length > 0 ? subject.topics : [null as AOITopicEntry | null];
            return topics.map((topic, ti) => `<tr style="background:${bg}">
              ${ti === 0 ? `<td class="td-left" rowspan="${topics.length}" style="font-weight:700;vertical-align:top">
                ${subject.subjectName}
                ${subject.subjectCode ? `<span style="display:block;font-weight:600;font-size:10px;color:#666">${subject.subjectCode}</span>` : ""}
                ${subject.aoiContribution != null ? `<span style="display:block;font-size:10px;color:#555;margin-top:2px">AOI: ${subject.aoiContribution.toFixed(1)}%</span>` : ""}
              </td>` : ""}
              <td class="td-center">${topic ? topic.topicNumber : ""}</td>
              <td class="td-left">${topic ? topic.topicName : "—"}</td>
              ${showAOICompetence    ? `<td class="td-left" style="font-style:italic;color:#444;font-size:11px">${topic?.competence ?? ""}</td>` : ""}
              <td class="td-center" style="font-weight:700">${topic ? `${topic.score ?? "—"} / ${topic.maxScore}` : ""}</td>
              ${showAOIGenericSkills ? `<td class="td-left" style="font-size:11px;color:#444">${topic?.genericSkills ?? ""}</td>` : ""}
              ${showAOIRemarks       ? `<td class="td-left" style="font-size:11px;color:#444">${topic?.remarks ?? ""}</td>` : ""}
            </tr>`);
          }).join("");

      return `<div class="page" style="${borderPageCss}">
        ${school?.logo ? `<div style="position:absolute;inset:0;pointer-events:none;z-index:0;display:flex;align-items:center;justify-content:center"><img src="${school.logo}" style="width:380px;height:380px;object-fit:contain;opacity:0.16"/></div>` : ""}
        <div class="content">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">
            <div style="width:120px;flex-shrink:0">${logoHtml(school?.logo)}</div>
            <div style="flex:1;text-align:center;padding:0 8px">
              <div class="school-name">${school?.name ?? "SCHOOL NAME"}</div>
              ${school?.address ? `<div class="school-info">${school.address}</div>` : ""}
              ${school?.contact ? `<div class="school-info">Tel: ${school.contact}${school.contact2 ? ` / ${school.contact2}` : ""}</div>` : ""}
              ${school?.email   ? `<div class="school-info">Email: ${school.email}${school.email2 ? ` / ${school.email2}` : ""}</div>` : ""}
              ${school?.motto   ? `<div class="school-motto">"${school.motto}"</div>` : ""}
            </div>
            <div style="width:120px;flex-shrink:0;display:flex;justify-content:flex-end">
              ${card.imageUrl
                ? `<img src="${card.imageUrl}" style="width:90px;height:120px;object-fit:cover;border:1px solid #bbb"/>`
                : `<div style="width:90px;height:120px;border:1px solid #bbb;display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;background:#f9f9f9">PHOTO</div>`}
            </div>
          </div>
          <div class="report-title">AOI ASSESSMENT REPORT</div>
          <table style="margin-bottom:4px;font-size:12px">
            <tbody>
              <tr>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:4px;width:55px;border:none">NAME:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-bottom:4px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${card.studentName}</td>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:4px;width:65px;border:none">SECTION:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-bottom:4px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${card.streamName}</td>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-bottom:4px;width:32px;border:none">LIN:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-bottom:4px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${card.admissionNo}</td>
              </tr>
              <tr>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-top:4px;border:none">CLASS:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-top:4px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${card.className} ${card.streamName}</td>
                <td style="font-weight:800;padding-right:4px;white-space:nowrap;padding-top:4px;border:none">TERM:</td>
                <td style="border-bottom:1.5px solid #333;font-weight:800;padding-right:16px;padding-top:4px;border-top:none;border-left:none;border-right:none;text-transform:uppercase">${termName}, ${academicYear}</td>
                <td colspan="2" style="border:none;padding-top:4px"></td>
              </tr>
            </tbody>
          </table>
          <div class="perf-header">ACTIVITIES OF INTEGRATION (AOI) — PERFORMANCE RECORDS</div>
          <table>
            <thead>
              <tr>
                <th class="th-left" style="width:130px">SUBJECT</th>
                <th class="th-center" style="width:26px">#</th>
                <th class="th-left">TOPIC</th>
                ${showAOICompetence    ? `<th class="th-left">COMPETENCE / LEARNING OUTCOME</th>` : ""}
                <th class="th-center" style="width:52px">SCORE</th>
                ${showAOIGenericSkills ? `<th class="th-left" style="width:120px">GENERIC SKILLS</th>` : ""}
                ${showAOIRemarks       ? `<th class="th-left" style="width:120px">TEACHER REMARKS</th>` : ""}
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div style="display:flex;gap:24px;margin-top:auto;padding-top:12px;border-top:1px dashed #ccc">
            <div style="flex:1"><div style="border-bottom:1px solid #333;margin-bottom:3px;height:22px"></div><div style="font-size:11px;font-weight:700">Class Teacher</div></div>
            <div style="flex:1"><div style="border-bottom:1px solid #333;margin-bottom:3px;height:22px"></div><div style="font-size:11px;font-weight:700">Head Teacher / Principal</div></div>
            <div style="flex:1"><div style="border-bottom:1px solid #333;margin-bottom:3px;height:22px"></div><div style="font-size:11px;font-weight:700">Parent / Guardian</div></div>
          </div>
          <div style="text-align:center;font-size:11px;font-weight:700;color:#666;letter-spacing:1px;font-style:italic;margin-top:4px">
            &ldquo;Not valid without a school stamp&rdquo;
          </div>
        </div>
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>AOI Assessment Reports</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    body { background:white; font-family:Arial,sans-serif; font-weight:600; }
    .page { width:210mm; page-break-after:always; break-after:page; position:relative; padding:12mm 10mm 8mm; margin:0 auto; font-size:12px; display:flex; flex-direction:column; }
    .page:last-child { page-break-after:avoid; break-after:avoid; }
    .content { position:relative; z-index:1; display:flex; flex-direction:column; flex:1; gap:4px; }
    table { width:100%; border-collapse:collapse; }
    th,td { border:1px solid #ddd; padding:3px 5px; font-size:12px; font-weight:600; vertical-align:top; }
    th { background:${primary}; color:#fff; font-weight:700; }
    .th-left  { text-align:left;   border:1px solid #bbb; padding:4px 5px; font-weight:700; font-size:12px; }
    .th-center{ text-align:center; border:1px solid #bbb; padding:4px 5px; font-weight:700; font-size:12px; }
    .td-left  { text-align:left;   border:1px solid #ddd; padding:3px 5px; font-size:12px; font-weight:600; vertical-align:top; }
    .td-center{ text-align:center; border:1px solid #ddd; padding:3px 5px; font-size:12px; font-weight:600; vertical-align:top; }
    .school-name  { font-weight:900; font-size:22px; text-transform:uppercase; color:${primary}; letter-spacing:1px; line-height:1.1; margin-bottom:4px; text-align:center; }
    .school-info  { font-size:12px; color:#444; text-align:center; margin-bottom:2px; }
    .school-motto { font-size:12px; font-style:italic; color:#666; text-align:center; margin-top:2px; }
    .report-title { text-align:center; font-weight:900; font-size:15px; color:${accent}; text-decoration:underline; text-transform:uppercase; letter-spacing:2px; margin-bottom:2px; }
    .perf-header  { text-align:center; font-weight:800; font-size:12px; background:${primary}; color:#fff; padding:4px 0; text-transform:uppercase; letter-spacing:0.8px; }
    ${wm.id !== "none" ? `.page::before { content:""; position:absolute; inset:0; background-image:${wm.css}; background-size:${wm.size}; opacity:${wm.opacity}; pointer-events:none; z-index:0; }` : ""}
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
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">AOI Assessment Report Preview</span>
            {!loading && cards.length > 0 && (
              <span className="text-xs text-slate-500">{cards.length} student{cards.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Watermark */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Watermark:</label>
              <select
                value={watermarkId}
                onChange={e => setWatermarkId(e.target.value as WatermarkId)}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {WATERMARKS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </div>

            {/* Border */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Border:</label>
              <select
                value={borderId}
                onChange={e => setBorderId(e.target.value as BorderId)}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {BORDERS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>

            <Button size="sm" className="gap-1.5" onClick={handlePrint} disabled={loading || cards.length === 0}>
              <Printer className="h-4 w-4" /> Print All
            </Button>
          </div>
        </div>

        {/* Scrollable preview area */}
        <div className="flex-1 overflow-y-auto py-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : cards.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No AOI scores recorded for this stream and term.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8">
              {cards.map(card => (
                <div key={card.enrollmentId} className="shadow-2xl">
                  <AOICard
                    data={card}
                    config={config}
                    theme={theme}
                    school={school}
                    academicYear={academicYear}
                    termName={termName}
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

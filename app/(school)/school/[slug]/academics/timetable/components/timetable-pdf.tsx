"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlotData = {
  dayOfWeek:  string;
  slotNumber: number;
  startTime:  string;
  endTime:    string;
  slotType:   string;
  streamSubject: {
    subject: { name: string; code: string };
    teacherAssignments: { teacher: { firstName: string; lastName: string } }[];
  };
};

export type DaySlot = {
  slotNumber: number;
  startTime:  string;
  endTime:    string;
  slotType:   string;
  label:      string | null;
};

export type DayConfig = {
  dayOfWeek: string;
  slots:     DaySlot[];
};

export type StreamData = {
  streamId:   string;
  streamName: string;
  className:  string;
  level:      number;
  slots:      SlotData[];
};

export type VersionMeta = {
  label:         string | null;
  versionNumber: number;
  status:        string;
  generatedAt:   string;
  school:        { name: string };
  academicYear:  { year: string };
  term:          { name: string };
};

export type TimetablePDFProps = {
  version:    VersionMeta;
  dayConfigs: DayConfig[];
  streams:    StreamData[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const DAY_SHORT: Record<string, string> = {
  MONDAY:"Mo", TUESDAY:"Tu", WEDNESDAY:"We",
  THURSDAY:"Th", FRIDAY:"Fr", SATURDAY:"Sa", SUNDAY:"Su",
};

// Slot types that are non-lesson separators
const BREAK_TYPES = new Set(["BREAK","LUNCH","ASSEMBLY","FREE","PREP"]);

// Width constants (pt)
const DAY_COL_W   = 30;
const BREAK_COL_W = 28;
const LESSON_COL_W = 52; // flex-like fixed width

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily:      "Helvetica",
    fontSize:        7,
    padding:         14,
    paddingBottom:   18,
    backgroundColor: "#ffffff",
  },
  // ── Header ──
  pageHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginBottom:   2,
  },
  schoolName: {
    fontSize: 6.5,
    color:    "#333",
  },
  classTitle: {
    fontSize:   18,
    fontFamily: "Helvetica-Bold",
    textAlign:  "center",
    color:      "#000",
    marginBottom: 4,
  },
  // ── Table ──
  table: {
    flexDirection: "column",
    border:        "1pt solid #000",
  },
  row: {
    flexDirection: "row",
    borderBottom:  "0.5pt solid #000",
  },
  lastRow: {
    flexDirection: "row",
  },
  // ── Day label cell ──
  dayCell: {
    width:          DAY_COL_W,
    minHeight:      44,
    borderRight:    "0.5pt solid #000",
    justifyContent: "center",
    alignItems:     "center",
  },
  dayText: {
    fontFamily: "Helvetica-Bold",
    fontSize:   13,
    color:      "#000",
  },
  // ── Header corner ──
  cornerCell: {
    width:       DAY_COL_W,
    minHeight:   32,
    borderRight: "0.5pt solid #000",
  },
  // ── Lesson header cell ──
  lessonHeaderCell: {
    width:          LESSON_COL_W,
    minHeight:      32,
    borderRight:    "0.5pt solid #000",
    alignItems:     "center",
    justifyContent: "center",
    padding:        2,
  },
  lessonHeaderNum: {
    fontFamily: "Helvetica-Bold",
    fontSize:   11,
    color:      "#000",
  },
  lessonHeaderTime: {
    fontSize:  5.5,
    color:     "#333",
    marginTop: 1,
    textAlign: "center",
  },
  // ── Break header cell ──
  breakHeaderCell: {
    width:          BREAK_COL_W,
    minHeight:      32,
    borderRight:    "0.5pt solid #000",
    alignItems:     "center",
    justifyContent: "center",
    padding:        2,
  },
  breakHeaderLabel: {
    fontSize:  5,
    color:     "#333",
    textAlign: "center",
  },
  breakHeaderTime: {
    fontSize:  4.5,
    color:     "#555",
    marginTop: 1,
    textAlign: "center",
  },
  // ── Lesson cell ──
  lessonCell: {
    width:          LESSON_COL_W,
    minHeight:      44,
    borderRight:    "0.5pt solid #000",
    padding:        3,
    alignItems:     "center",
    justifyContent: "center",
  },
  subjectCode: {
    fontFamily: "Helvetica-Bold",
    fontSize:   9,
    color:      "#000",
    textAlign:  "center",
  },
  teacherName: {
    fontSize:  5,
    color:     "#444",
    marginTop: 2,
    textAlign: "center",
  },
  // ── Break cell ──
  breakCell: {
    width:          BREAK_COL_W,
    minHeight:      44,
    borderRight:    "0.5pt solid #000",
    alignItems:     "center",
    justifyContent: "center",
  },
  // ── Footer ──
  footer: {
    position:       "absolute",
    bottom:         8,
    left:           14,
    right:          14,
    flexDirection:  "row",
    justifyContent: "space-between",
    fontSize:       6,
    color:          "#555",
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isBreak(slotType: string) {
  return BREAK_TYPES.has(slotType);
}

function breakLabel(slot: DaySlot): string {
  if (slot.label) return slot.label;
  const map: Record<string, string> = {
    BREAK:    "BREAK TIME",
    LUNCH:    "LUNCH TIME",
    ASSEMBLY: "ASSEMBLY",
    FREE:     "FREE",
    PREP:     "PREP",
  };
  return map[slot.slotType] ?? slot.slotType;
}

/** Render a string vertically — one character per line */
function VerticalText({ text, style }: { text: string; style?: any }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {text.split("").map((ch, i) => (
        <Text key={i} style={[{ fontSize: 5, color: "#333", lineHeight: 1.2 }, style]}>
          {ch === " " ? "\u00A0" : ch}
        </Text>
      ))}
    </View>
  );
}

// ─── Stream page ──────────────────────────────────────────────────────────────

function StreamPage({
  stream, dayConfigs, version, totalPages, pageIndex,
}: {
  stream:     StreamData;
  dayConfigs: DayConfig[];
  version:    VersionMeta;
  totalPages: number;
  pageIndex:  number;
}) {
  const templateSlots = dayConfigs[0]?.slots ?? [];
  const activeDays    = DAYS_ORDER.filter(d => dayConfigs.some(dc => dc.dayOfWeek === d));
  const generatedDate = new Date(version.generatedAt).toLocaleDateString("en-GB");

  // slot lookup: "DAY:slotNumber" → SlotData
  const lookup = new Map<string, SlotData>();
  for (const s of stream.slots) lookup.set(`${s.dayOfWeek}:${s.slotNumber}`, s);

  // Assign lesson numbers (only LESSON slots get a number)
  let lessonNum = 0;
  const slotMeta = templateSlots.map(slot => {
    const num = isBreak(slot.slotType) ? null : ++lessonNum;
    return { slot, lessonNum: num };
  });

  return (
    <Page size="A4" orientation="landscape" style={S.page}>
      {/* School name top-left */}
      <View style={S.pageHeader}>
        <Text style={S.schoolName}>{version.school.name}</Text>
        <Text style={[S.schoolName, { color: "#888" }]}>
          {version.academicYear.year} · {version.term.name}
        </Text>
      </View>

      {/* Class title */}
      <Text style={S.classTitle}>
        {stream.className} {stream.streamName}
      </Text>

      {/* Table */}
      <View style={S.table}>
        {/* Header row */}
        <View style={S.row}>
          <View style={S.cornerCell} />
          {slotMeta.map(({ slot, lessonNum: num }) =>
            isBreak(slot.slotType) ? (
              <View key={slot.slotNumber} style={S.breakHeaderCell}>
                <Text style={S.breakHeaderLabel}>{breakLabel(slot)}</Text>
                <Text style={S.breakHeaderTime}>{slot.startTime}</Text>
                <Text style={S.breakHeaderTime}>{slot.endTime}</Text>
              </View>
            ) : (
              <View key={slot.slotNumber} style={S.lessonHeaderCell}>
                <Text style={S.lessonHeaderNum}>{num}</Text>
                <Text style={S.lessonHeaderTime}>{slot.startTime} - {slot.endTime}</Text>
              </View>
            )
          )}
        </View>

        {/* Day rows */}
        {activeDays.map((day, di) => {
          const isLast = di === activeDays.length - 1;
          return (
            <View key={day} style={isLast ? S.lastRow : S.row}>
              <View style={S.dayCell}>
                <Text style={S.dayText}>{DAY_SHORT[day] ?? day.slice(0, 2)}</Text>
              </View>
              {slotMeta.map(({ slot }) => {
                if (isBreak(slot.slotType)) {
                  return (
                    <View key={slot.slotNumber} style={S.breakCell}>
                      <Text style={[S.breakHeaderLabel, { fontSize: 4 }]}>{breakLabel(slot)}</Text>
                    </View>
                  );
                }
                const placed = lookup.get(`${day}:${slot.slotNumber}`);
                const teacher = placed?.streamSubject.teacherAssignments[0]?.teacher;
                const tName = teacher
                  ? `${teacher.lastName.toUpperCase()} ${teacher.firstName}`
                  : "";
                return (
                  <View key={slot.slotNumber} style={S.lessonCell}>
                    {placed && (
                      <>
                        <Text style={S.subjectCode}>{placed.streamSubject.subject.code}</Text>
                        <Text style={S.teacherName}>{tName}</Text>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={S.footer} fixed>
        <Text>Timetable generated: {generatedDate}</Text>
        <Text>Page {pageIndex + 1} of {totalPages}</Text>
      </View>
    </Page>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────

export default function TimetablePDF({ version, dayConfigs, streams }: TimetablePDFProps) {
  const subtitle = `${version.academicYear.year} — ${version.term.name}`;
  return (
    <Document
      title={`Timetable — ${version.school.name} — ${subtitle}`}
      author={version.school.name}
    >
      {streams.map((stream, idx) => (
        <StreamPage
          key={stream.streamId}
          stream={stream}
          dayConfigs={dayConfigs}
          version={version}
          totalPages={streams.length}
          pageIndex={idx}
        />
      ))}
    </Document>
  );
}

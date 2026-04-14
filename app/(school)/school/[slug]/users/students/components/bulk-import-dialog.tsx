"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Upload, Download, X, AlertCircle, CheckCircle2,
  Loader2, FileSpreadsheet, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { bulkCreateStudents, type BulkStudentRow } from "@/actions/bulk-students";

// ── Types ─────────────────────────────────────────────────────────────────

type ClassYear = { id: string; name: string; academicYearId: string; classLevel?: string };
type Stream    = { id: string; name: string; classYearId: string };

type ParsedRow = BulkStudentRow & {
  _rowNum:      number;
  _error?:      string;
  _classLabel?: string;
  _streamLabel?: string;
};

type Props = {
  open:       boolean;
  onClose:    () => void;
  schoolId:   string;
  userId:     string;
  slug:       string;
  classYears: ClassYear[];
  streams:    Stream[];
};

// ── Template definition ───────────────────────────────────────────────────

const TEMPLATE_HEADERS = [
  "admissionNo",       "firstName",    "lastName",     "otherNames",
  "dob",               "gender",       "nationality",
  "parentFirstName",   "parentLastName", "parentPhone", "parentEmail", "parentRelationship",
  "className",         "streamName",
  "village",           "religion",     "previousSchool", "phone",
];

const TEMPLATE_EXAMPLE_ROWS = [
  [
    "ADM2024001", "John",  "Doe",   "",
    "2008-03-15", "MALE",  "Ugandan",
    "James", "Doe", "0701234567", "james@email.com", "Father",
    "Senior 1", "North",
    "Kampala", "Christian", "Greenhill Academy", "",
  ],
  [
    "ADM2024002", "Mary",  "Nakato", "",
    "2009-07-22", "FEMALE", "Ugandan",
    "Grace", "Nakato", "0712345678", "", "Mother",
    "Senior 2", "South",
    "Entebbe", "Catholic", "", "",
  ],
];

const COLUMN_NOTES = [
  { col: "admissionNo",        note: "Required. Unique per school." },
  { col: "firstName",          note: "Required." },
  { col: "lastName",           note: "Required." },
  { col: "otherNames",         note: "Optional." },
  { col: "dob",                note: "Required. Format: YYYY-MM-DD" },
  { col: "gender",             note: "Required. MALE or FEMALE" },
  { col: "nationality",        note: "Required. e.g. Ugandan" },
  { col: "parentFirstName",    note: "Required." },
  { col: "parentLastName",     note: "Required." },
  { col: "parentPhone",        note: "Required. Unique. Used as parent login." },
  { col: "parentEmail",        note: "Optional." },
  { col: "parentRelationship", note: "Optional. e.g. Father / Mother / Guardian" },
  { col: "className",          note: "Required. Must match exactly, e.g. Senior 1" },
  { col: "streamName",         note: "Optional. e.g. North" },
  { col: "village",            note: "Optional." },
  { col: "religion",           note: "Optional." },
  { col: "previousSchool",     note: "Optional." },
  { col: "phone",              note: "Optional. Student login phone. Auto-generated if blank." },
];

// ── Component ─────────────────────────────────────────────────────────────

export default function BulkImportDialog({
  open, onClose, schoolId, userId, slug, classYears, streams,
}: Props) {
  const [step,       setStep]       = useState<"upload" | "preview" | "done">("upload");
  const [rows,       setRows]       = useState<ParsedRow[]>([]);
  const [importing,  setImporting]  = useState(false);
  const [result,     setResult]     = useState<{ created: number; skipped: number; errors: { row: number; admissionNo: string; message: string }[] } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showGuide,  setShowGuide]  = useState(false);
  const [dragging,   setDragging]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────

  function reset() {
    setStep("upload");
    setRows([]);
    setResult(null);
    setShowErrors(false);
    setShowGuide(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  // ── Template download ────────────────────────────────────────────────────

  function downloadTemplate() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Template
    const wsData = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({
      wch: Math.max(h.length + 4, 18),
    }));

    // Style header row bold (xlsx-js-style not available, use comment workaround)
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    // Sheet 2: Instructions
    const instrData = [
      ["COLUMN", "NOTES"],
      ...COLUMN_NOTES.map((n) => [n.col, n.note]),
    ];
    const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
    wsInstr["!cols"] = [{ wch: 24 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions");

    XLSX.writeFile(wb, "student_bulk_upload_template.xlsx");
    toast.success("Template downloaded");
  }

  // ── Parse uploaded file ──────────────────────────────────────────────────

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: "array", cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (raw.length < 2) {
          toast.error("File is empty or has no data rows.");
          return;
        }

        const headers: string[] = (raw[0] as string[]).map((h) =>
          String(h).trim().toLowerCase().replace(/\s+/g, "")
        );

        // Map header name → column index (case-insensitive)
        const idx = (name: string) => {
          const lower = name.toLowerCase();
          const i = headers.indexOf(lower);
          return i >= 0 ? i : -1;
        };

        const parsed: ParsedRow[] = [];

        for (let r = 1; r < raw.length; r++) {
          const row = raw[r] as any[];
          // Skip completely empty rows
          if (row.every((c) => c === "" || c == null)) continue;

          const get = (col: string) => {
            const i = idx(col);
            return i >= 0 ? String(row[i] ?? "").trim() : "";
          };

          // Resolve dob — xlsx may parse as Date object
          let dob = get("dob");
          if (row[idx("dob")] instanceof Date) {
            const d = row[idx("dob")] as Date;
            dob = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          }

          const className  = get("classname")  || get("class");
          const streamName = get("streamname") || get("stream");

          // Resolve classYearId from className
          const matchedClass = classYears.find(
            (cy) => cy.name.toLowerCase() === className.toLowerCase()
          );
          const classYearId = matchedClass?.id ?? "";

          // Resolve streamId from streamName + classYearId
          const matchedStream = streams.find(
            (s) =>
              s.name.toLowerCase() === streamName.toLowerCase() &&
              s.classYearId === classYearId
          );
          const streamId = matchedStream?.id;

          // Validate required fields
          const errors: string[] = [];
          if (!get("admissionno") && !get("admissionNo")) errors.push("admissionNo required");
          if (!get("firstname")   && !get("firstName"))   errors.push("firstName required");
          if (!get("lastname")    && !get("lastName"))    errors.push("lastName required");
          if (!dob)                                        errors.push("dob required");
          if (!get("gender"))                              errors.push("gender required");
          if (!get("parentfirstname") && !get("parentFirstName")) errors.push("parentFirstName required");
          if (!get("parentlastname")  && !get("parentLastName"))  errors.push("parentLastName required");
          if (!get("parentphone")     && !get("parentPhone"))     errors.push("parentPhone required");
          if (!classYearId)                                errors.push(`class "${className}" not found`);

          const admNo = get("admissionno") || get("admissionNo");

          parsed.push({
            _rowNum:      r + 1,
            _error:       errors.length ? errors.join("; ") : undefined,
            _classLabel:  matchedClass?.name ?? className,
            _streamLabel: matchedStream?.name ?? streamName,
            admissionNo:  admNo,
            firstName:    get("firstname")    || get("firstName"),
            lastName:     get("lastname")     || get("lastName"),
            otherNames:   get("othernames")   || get("otherNames") || undefined,
            dob,
            gender:       (get("gender") || "MALE").toUpperCase(),
            nationality:  get("nationality") || "Ugandan",
            parentFirstName:    get("parentfirstname")    || get("parentFirstName"),
            parentLastName:     get("parentlastname")     || get("parentLastName"),
            parentPhone:        get("parentphone")        || get("parentPhone"),
            parentEmail:        get("parentemail")        || get("parentEmail") || undefined,
            parentRelationship: get("parentrelationship") || get("parentRelationship") || "Guardian",
            classYearId,
            streamId,
            village:        get("village")       || undefined,
            religion:       get("religion")      || undefined,
            previousSchool: get("previousschool") || get("previousSchool") || undefined,
            phone:          get("phone")         || undefined,
          });
        }

        setRows(parsed);
        setStep("preview");
      } catch (err: any) {
        toast.error("Failed to parse file: " + (err.message ?? "Unknown error"));
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }, [classYears, streams]); // eslint-disable-line

  // ── Import ───────────────────────────────────────────────────────────────

  async function handleImport() {
    const validRows = rows.filter((r) => !r._error);
    if (!validRows.length) { toast.error("No valid rows to import."); return; }

    setImporting(true);
    try {
      const res = await bulkCreateStudents(validRows, schoolId, userId, slug);
      setResult({ created: res.created, skipped: res.skipped, errors: res.errors });
      setStep("done");
      if (res.created > 0) toast.success(`${res.created} student${res.created !== 1 ? "s" : ""} created`);
      if (res.errors.length) toast.warning(`${res.errors.length} row${res.errors.length !== 1 ? "s" : ""} had errors`);
    } catch (err: any) {
      toast.error(err.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const validRows   = rows.filter((r) => !r._error);
  const invalidRows = rows.filter((r) => !!r._error);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700">

        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              Bulk Import Students
            </DialogTitle>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {(["upload", "preview", "done"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s ? "bg-blue-600 text-white" :
                  (["upload","preview","done"].indexOf(step) > i) ? "bg-emerald-500 text-white" :
                  "bg-zinc-200 dark:bg-slate-700 text-zinc-500"
                }`}>{i + 1}</div>
                <span className={`text-xs capitalize ${step === s ? "text-zinc-900 dark:text-white font-medium" : "text-zinc-400"}`}>{s}</span>
                {i < 2 && <div className="w-8 h-px bg-zinc-200 dark:bg-slate-700" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── STEP: UPLOAD ── */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Download template */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 text-sm text-blue-800 dark:text-blue-300">
                  Download the template, fill in student data, then upload it here.
                  The template includes an Instructions sheet explaining each column.
                </div>
                <Button size="sm" variant="outline" onClick={downloadTemplate}
                  className="shrink-0 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Template
                </Button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  dragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-zinc-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-zinc-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-zinc-400 dark:text-slate-500" />
                <p className="text-sm font-medium text-zinc-700 dark:text-slate-300">
                  Drop your Excel file here, or click to browse
                </p>
                <p className="text-xs text-zinc-400 dark:text-slate-500 mt-1">.xlsx, .xls, .csv supported</p>
              </div>

              {/* Column guide toggle */}
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-200 transition-colors"
              >
                {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showGuide ? "Hide" : "Show"} column guide
              </button>

              {showGuide && (
                <div className="rounded-xl border border-zinc-200 dark:border-slate-700 overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-zinc-50 dark:bg-slate-800">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-600 dark:text-slate-300 w-48">Column</th>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-600 dark:text-slate-300">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-slate-700/50">
                      {COLUMN_NOTES.map((n) => (
                        <tr key={n.col} className="hover:bg-zinc-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-1.5 font-mono text-blue-600 dark:text-blue-400">{n.col}</td>
                          <td className="px-3 py-1.5 text-zinc-600 dark:text-slate-400">{n.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 border-0">
                  {rows.length} rows parsed
                </Badge>
                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0">
                  {validRows.length} valid
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-0">
                    {invalidRows.length} with errors
                  </Badge>
                )}
              </div>

              {/* Error rows */}
              {invalidRows.length > 0 && (
                <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 p-3">
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400 w-full text-left"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""} will be skipped due to errors
                    {showErrors ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                  {showErrors && (
                    <div className="mt-2 space-y-1">
                      {invalidRows.map((r) => (
                        <div key={r._rowNum} className="text-xs text-red-600 dark:text-red-400 flex gap-2">
                          <span className="font-mono shrink-0">Row {r._rowNum}</span>
                          <span>{r._error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preview table */}
              <div className="rounded-xl border border-zinc-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-slate-400 whitespace-nowrap">Row</th>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-slate-400 whitespace-nowrap">Adm No.</th>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-slate-400 whitespace-nowrap">Name</th>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-slate-400 whitespace-nowrap">Gender</th>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-slate-400 whitespace-nowrap">DOB</th>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-slate-400 whitespace-nowrap">Parent</th>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-slate-400 whitespace-nowrap">Class</th>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-slate-400 whitespace-nowrap">Stream</th>
                        <th className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-slate-400 whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-slate-700/50">
                      {rows.map((r) => (
                        <tr key={r._rowNum} className={r._error ? "bg-red-50 dark:bg-red-900/10" : "hover:bg-zinc-50 dark:hover:bg-slate-800/30"}>
                          <td className="px-3 py-2 text-zinc-400">{r._rowNum}</td>
                          <td className="px-3 py-2 font-mono text-zinc-700 dark:text-slate-300">{r.admissionNo}</td>
                          <td className="px-3 py-2 text-zinc-800 dark:text-slate-200 whitespace-nowrap">{r.firstName} {r.lastName}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-slate-400">{r.gender}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-slate-400 whitespace-nowrap">{r.dob}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-slate-400 whitespace-nowrap">{r.parentFirstName} · {r.parentPhone}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-slate-400 whitespace-nowrap">{r._classLabel}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-slate-400">{r._streamLabel || "—"}</td>
                          <td className="px-3 py-2">
                            {r._error
                              ? <span className="text-red-500 text-[10px]">Error</span>
                              : <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">✓ Valid</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === "done" && result && (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200 dark:border-slate-700 p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                <div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">Import Complete</p>
                  <p className="text-sm text-zinc-500 dark:text-slate-400 mt-1">
                    {result.created} created · {result.skipped} skipped · {result.errors.length} errors
                  </p>
                </div>
                <div className="flex justify-center gap-3 flex-wrap">
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0 text-sm px-3 py-1">
                    {result.created} students created
                  </Badge>
                  {result.skipped > 0 && (
                    <Badge className="bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-400 border-0 text-sm px-3 py-1">
                      {result.skipped} already existed
                    </Badge>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 p-4">
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400 w-full text-left"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} failed
                    {showErrors ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                  {showErrors && (
                    <div className="mt-3 space-y-1.5">
                      {result.errors.map((e, i) => (
                        <div key={i} className="text-xs text-red-600 dark:text-red-400 flex gap-2">
                          <span className="font-mono shrink-0">Row {e.row} ({e.admissionNo})</span>
                          <span>{e.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-slate-700 shrink-0 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-slate-800/40">
          <div className="text-xs text-zinc-400 dark:text-slate-500">
            {step === "preview" && `${validRows.length} of ${rows.length} rows will be imported`}
          </div>
          <div className="flex items-center gap-2">
            {step === "upload" && (
              <>
                <Button variant="outline" size="sm" onClick={handleClose}
                  className="border-zinc-200 dark:border-slate-700 text-zinc-700 dark:text-slate-300">
                  Cancel
                </Button>
                <Button size="sm" onClick={downloadTemplate}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Get Template
                </Button>
              </>
            )}
            {step === "preview" && (
              <>
                <Button variant="outline" size="sm" onClick={reset}
                  className="border-zinc-200 dark:border-slate-700 text-zinc-700 dark:text-slate-300">
                  Back
                </Button>
                <Button size="sm" onClick={handleImport} disabled={importing || validRows.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                  {importing
                    ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Importing…</>
                    : <><Upload className="w-3.5 h-3.5 mr-1.5" /> Import {validRows.length} Students</>
                  }
                </Button>
              </>
            )}
            {step === "done" && (
              <>
                <Button variant="outline" size="sm" onClick={reset}
                  className="border-zinc-200 dark:border-slate-700 text-zinc-700 dark:text-slate-300">
                  Import More
                </Button>
                <Button size="sm" onClick={handleClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  Done
                </Button>
              </>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

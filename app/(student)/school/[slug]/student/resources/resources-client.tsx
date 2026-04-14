"use client";

import { useState, useMemo } from "react";
import { format }            from "date-fns";
import {
  BookOpen, FileText, FileQuestion, ClipboardList, GraduationCap,
  Search, Download, ChevronDown, BookMarked, Calendar,
} from "lucide-react";
import { ResourceType } from "@prisma/client";
import type { ResourceRow } from "@/actions/subject-resources";

type AcademicTerm = { id: string; name: string; termNumber: number; isActive: boolean };
type AcademicYear = { id: string; year: string; isActive: boolean; terms: AcademicTerm[] };
type Subject      = { subjectId: string; subjectName: string; streamId: string; streamName: string };

type Props = {
  resources:     ResourceRow[];
  subjects:      Subject[];
  academicYears: AcademicYear[];
  slug:          string;
};

const RESOURCE_TYPES: { value: ResourceType; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: "NOTES",      label: "Notes",       icon: FileText,      color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20"    },
  { value: "PAST_PAPER", label: "Past Paper",  icon: FileQuestion,  color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { value: "ASSIGNMENT", label: "Assignment",  icon: ClipboardList, color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/20"   },
  { value: "SYLLABUS",   label: "Syllabus",    icon: BookOpen,      color: "text-green-600 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20"   },
  { value: "OTHER",      label: "Other",       icon: GraduationCap, color: "text-slate-500 dark:text-slate-400",   bg: "bg-slate-100 dark:bg-slate-800"     },
];
const TYPE_MAP = Object.fromEntries(RESOURCE_TYPES.map(t => [t.value, t]));

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1024**2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024**2).toFixed(1)} MB`;
}

export default function StudentResourcesClient({ resources, subjects, academicYears }: Props) {
  // ── Year / term selection ──────────────────────────────────────────────────
  const activeYear  = academicYears.find(y => y.isActive) ?? academicYears[0] ?? null;
  const [selectedYearId, setSelectedYearId] = useState<string>(activeYear?.id ?? "");

  const currentYear = academicYears.find(y => y.id === selectedYearId) ?? null;
  const activeTerm  = currentYear?.terms.find(t => t.isActive) ?? currentYear?.terms[0] ?? null;
  const [selectedTermId, setSelectedTermId] = useState<string>(() => activeTerm?.id ?? "ALL");

  // When year changes, reset term to the active term of the new year
  function handleYearChange(yearId: string) {
    setSelectedYearId(yearId);
    const year = academicYears.find(y => y.id === yearId);
    const term = year?.terms.find(t => t.isActive) ?? year?.terms[0];
    setSelectedTermId(term?.id ?? "ALL");
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [filterType, setFilterType] = useState<ResourceType | "ALL">("ALL");
  const [filterSubj, setFilterSubj] = useState<string>("ALL");

  const uniqueSubjects = useMemo(
    () => [...new Map(subjects.map(s => [s.subjectId, s])).values()],
    [subjects],
  );

  // ── Year + term filtering ─────────────────────────────────────────────────
  const yearFiltered = useMemo(() => {
    if (!currentYear) return resources;

    return resources.filter(r => {
      if (!r.termId) return true; // no term tag → show everywhere

      // Does this resource's termId belong to the selected year?
      return currentYear.terms.some(t => t.id === r.termId);
    });
  }, [resources, currentYear]);

  const termFiltered = useMemo(() => {
    if (selectedTermId === "ALL") return yearFiltered;
    return yearFiltered.filter(r => !r.termId || r.termId === selectedTermId);
  }, [yearFiltered, selectedTermId]);

  // ── Additional filters ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return termFiltered.filter(r => {
      if (filterType !== "ALL" && r.type !== filterType) return false;
      if (filterSubj !== "ALL" && r.subjectId !== filterSubj) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!r.title.toLowerCase().includes(q) && !r.subjectName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [termFiltered, filterType, filterSubj, search]);

  // ── Group by subject ───────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    return filtered.reduce((acc, r) => {
      const key = r.subjectName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {} as Record<string, ResourceRow[]>);
  }, [filtered]);

  const isFiltered = filterType !== "ALL" || filterSubj !== "ALL" || search.trim();

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-indigo-500" />
          Learning Resources
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Notes, past papers, and assignments from your teachers
        </p>
      </div>

      {/* Academic year pills */}
      {academicYears.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {academicYears.map(y => (
            <button
              key={y.id}
              onClick={() => handleYearChange(y.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedYearId === y.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {y.year}{y.isActive ? " (Current)" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Term tabs */}
      {currentYear && currentYear.terms.length > 0 && (
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSelectedTermId("ALL")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              selectedTermId === "ALL"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            All Terms
          </button>
          {currentYear.terms.map(term => (
            <button
              key={term.id}
              onClick={() => setSelectedTermId(term.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                selectedTermId === term.id
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {term.name}
              {term.isActive && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Type quick-filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", ...RESOURCE_TYPES.map(t => t.value)] as const).map(v => {
          const t    = v !== "ALL" ? TYPE_MAP[v] : null;
          const Icon = t?.icon;
          return (
            <button
              key={v}
              onClick={() => setFilterType(v as any)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterType === v
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {v === "ALL" ? "All Types" : t?.label}
            </button>
          );
        })}
      </div>

      {/* Search + subject filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        {uniqueSubjects.length > 1 && (
          <div className="relative">
            <select
              value={filterSubj}
              onChange={e => setFilterSubj(e.target.value)}
              className="pl-3 pr-8 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none appearance-none"
            >
              <option value="ALL">All subjects</option>
              {uniqueSubjects.map(s => (
                <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        )}
        {filtered.length > 0 && (
          <span className="text-xs text-slate-400 ml-auto">
            {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
          <BookMarked className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">
            {isFiltered ? "No resources match your filter" : "No resources for this period"}
          </p>
          <p className="text-sm mt-1">
            {isFiltered
              ? "Try clearing filters"
              : "Your teachers haven\u2019t uploaded any resources here yet. Check back soon."}
          </p>
        </div>
      )}

      {/* Grouped by subject */}
      {!isFiltered
        ? Object.entries(grouped).map(([subjectName, items]) => (
            <SubjectSection key={subjectName} subjectName={subjectName} items={items} />
          ))
        : filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map(r => <ResourceCard key={r.id} resource={r} />)}
            </div>
          )
      }
    </div>
  );
}

// ── Subject section ────────────────────────────────────────────────────────────

function SubjectSection({ subjectName, items }: { subjectName: string; items: ResourceRow[] }) {
  const [open, setOpen] = useState(true);

  const byType = RESOURCE_TYPES.map(t => ({
    ...t,
    items: items.filter(r => r.type === t.value),
  })).filter(g => g.items.length > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-800 dark:text-white text-sm">{subjectName}</span>
          <span className="text-xs text-slate-400">({items.length} file{items.length !== 1 ? "s" : ""})</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {byType.map(({ value, label, icon: Icon, color, bg, items: typeItems }) => (
            <div key={value}>
              <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-1.5">
                <Icon className={`w-3 h-3 ${color}`} />
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${color}`}>{label}</span>
                <span className="text-[10px] text-slate-400">({typeItems.length})</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {typeItems.map(r => <ResourceCard key={r.id} resource={r} compact />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Resource card ──────────────────────────────────────────────────────────────

function ResourceCard({ resource: r, compact }: { resource: ResourceRow; compact?: boolean }) {
  const t    = TYPE_MAP[r.type];
  const Icon = t.icon;

  return (
    <div className={`flex items-center gap-3 ${compact ? "px-4 py-2.5" : "px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"} hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors`}>
      <div className={`p-1.5 rounded-lg shrink-0 ${t.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${t.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {!compact && <span className={`text-xs font-semibold ${t.color}`}>{t.label}</span>}
          {r.termName   && <span className="text-xs text-slate-400">{r.termName}</span>}
          {r.uploaderName && <span className="text-xs text-slate-400">by {r.uploaderName}</span>}
          <span className="text-xs text-slate-300 dark:text-slate-600">{format(new Date(r.createdAt), "d MMM yyyy")}</span>
          {r.fileSize && <span className="text-xs text-slate-400">({formatBytes(r.fileSize)})</span>}
        </div>
        {r.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{r.description}</p>}
      </div>

      <a
        href={r.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
        download
      >
        <Download className="w-3 h-3" />
        <span className="hidden sm:inline">Download</span>
      </a>
    </div>
  );
}

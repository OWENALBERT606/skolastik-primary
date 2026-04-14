"use client";

import { useState, useRef, useTransition } from "react";
import { toast }  from "sonner";
import { format } from "date-fns";
import {
  Upload, FileText, BookOpen, ClipboardList, GraduationCap, FileQuestion,
  Trash2, Eye, EyeOff, Plus, X, Loader2, ChevronDown, Search,
  Download, ExternalLink,
} from "lucide-react";
import { ResourceType } from "@prisma/client";
import type { ResourceRow } from "@/actions/subject-resources";
import {
  createSubjectResource,
  deleteSubjectResource,
  updateSubjectResource,
} from "@/actions/subject-resources";

// ── Types ─────────────────────────────────────────────────────────────────────

type Subject = { subjectId: string; subjectName: string; streamId: string; streamName: string };
type Term    = { id: string; name: string; termNumber: number; isActive: boolean };

type Props = {
  resources: ResourceRow[];
  subjects:  Subject[];
  terms:     Term[];
  teacherId: string;
  schoolId:  string;
  slug:      string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const RESOURCE_TYPES: { value: ResourceType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "NOTES",      label: "Notes",       icon: FileText,      color: "text-blue-500  bg-blue-50  dark:bg-blue-900/20"  },
  { value: "PAST_PAPER", label: "Past Paper",  icon: FileQuestion,  color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20" },
  { value: "ASSIGNMENT", label: "Assignment",  icon: ClipboardList, color: "text-amber-500  bg-amber-50  dark:bg-amber-900/20"  },
  { value: "SYLLABUS",   label: "Syllabus",    icon: BookOpen,      color: "text-green-500  bg-green-50  dark:bg-green-900/20"  },
  { value: "OTHER",      label: "Other",       icon: GraduationCap, color: "text-slate-500  bg-slate-50  dark:bg-slate-800"      },
];

const TYPE_MAP = Object.fromEntries(RESOURCE_TYPES.map(t => [t.value, t]));

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024**2)    return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024**2).toFixed(1)} MB`;
}

// ── Upload helper ─────────────────────────────────────────────────────────────

async function uploadToR2(file: File): Promise<{ fileUrl: string; fileKey: string; fileName: string; fileSize: number }> {
  const res = await fetch("/api/r2/upload", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const { presignedUrl, key, publicUrl } = await res.json();

  const uploadRes = await fetch(presignedUrl, {
    method:  "PUT",
    headers: { "Content-Type": file.type },
    body:    file,
  });
  if (!uploadRes.ok) throw new Error("Upload failed");

  return { fileUrl: publicUrl, fileKey: key, fileName: file.name, fileSize: file.size };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ResourcesClient({ resources, subjects, terms, teacherId, schoolId }: Props) {
  const [rows,       setRows]       = useState<ResourceRow[]>(resources);
  const [showUpload, setShowUpload] = useState(false);
  const [search,     setSearch]     = useState("");
  const [filterType, setFilterType] = useState<ResourceType | "ALL">("ALL");
  const [filterSubj, setFilterSubj] = useState<string>("ALL");
  const [isPending,  startTransition] = useTransition();

  // Upload form state
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [type,     setType]     = useState<ResourceType>("NOTES");
  const [subjectId, setSubjectId] = useState("");
  const [streamId,  setStreamId]  = useState("");
  const [termId,    setTermId]    = useState(terms.find(t => t.isActive)?.id ?? terms[0]?.id ?? "");
  const [file,     setFile]     = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Unique subjects (for first dropdown)
  const uniqueSubjectOptions = [...new Map(subjects.map(s => [s.subjectId, s])).values()];
  // Classes available for selected subject
  const classesForSubject = subjectId ? subjects.filter(s => s.subjectId === subjectId) : [];

  // When subject changes, reset stream and auto-select if only one class
  const handleSubjectChange = (val: string) => {
    setSubjectId(val);
    const classes = subjects.filter(s => s.subjectId === val);
    setStreamId(classes.length === 1 ? classes[0].streamId : "");
  };

  const handleUpload = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!subjectId)    { toast.error("Select a subject"); return; }
    if (!streamId)     { toast.error("Select a class"); return; }
    if (!file)         { toast.error("Choose a file to upload"); return; }

    setUploading(true);
    try {
      const r2 = await uploadToR2(file);
      startTransition(async () => {
        const result = await createSubjectResource({
          title:       title.trim(),
          description: desc.trim() || undefined,
          type,
          fileUrl:     r2.fileUrl,
          fileKey:     r2.fileKey,
          fileName:    r2.fileName,
          fileSize:    r2.fileSize,
          subjectId,
          streamId:    streamId || undefined,
          termId:      termId   || undefined,
          schoolId,
          teacherId,
        });
        if (result.ok) {
          toast.success(result.message);
          // Optimistic add
          setRows(prev => [{
            id:           result.data.id,
            title:        title.trim(),
            description:  desc.trim() || null,
            type,
            fileUrl:      r2.fileUrl,
            fileKey:      r2.fileKey,
            fileName:     r2.fileName,
            fileSize:     r2.fileSize,
            subjectId,
            subjectName:  uniqueSubjectOptions.find(s => s.subjectId === subjectId)?.subjectName ?? "",
            streamId:     streamId || null,
            streamName:   subjects.find(s => s.subjectId === subjectId && s.streamId === streamId)?.streamName ?? null,
            termId:       termId || null,
            termName:     terms.find(t => t.id === termId)?.name ?? null,
            isPublished:  true,
            createdAt:    new Date().toISOString(),
            uploaderName: "You",
          }, ...prev]);
          setTitle(""); setDesc(""); setFile(null); setShowUpload(false);
          if (fileRef.current) fileRef.current.value = "";
        } else {
          toast.error(result.message);
        }
        setUploading(false);
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this resource? Students will no longer be able to access it.")) return;
    startTransition(async () => {
      const result = await deleteSubjectResource(id, teacherId);
      if (result.ok) {
        toast.success(result.message);
        setRows(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleTogglePublish = (id: string, current: boolean) => {
    startTransition(async () => {
      const result = await updateSubjectResource(id, teacherId, { isPublished: !current });
      if (result.ok) {
        setRows(prev => prev.map(r => r.id === id ? { ...r, isPublished: !current } : r));
        toast.success(!current ? "Resource published" : "Resource hidden from students");
      } else {
        toast.error(result.message);
      }
    });
  };

  // Filtered list
  const filtered = rows.filter(r => {
    if (filterType !== "ALL" && r.type !== filterType) return false;
    if (filterSubj !== "ALL" && r.subjectId !== filterSubj) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.subjectName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Learning Resources
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Upload notes, past papers, and assignments for your students
          </p>
        </div>
        <button
          onClick={() => setShowUpload(v => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {showUpload ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Upload Resource</>}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-500" /> New Resource
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. S.3 Mathematics Notes — Term 2"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Subject *</label>
              <div className="relative">
                <select
                  value={subjectId}
                  onChange={e => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none"
                >
                  <option value="">Select subject…</option>
                  {uniqueSubjectOptions.map(s => (
                    <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Class (stream) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Class *</label>
              <div className="relative">
                <select
                  value={streamId}
                  onChange={e => setStreamId(e.target.value)}
                  disabled={!subjectId}
                  className="w-full px-3 py-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none disabled:opacity-50"
                >
                  <option value="">{subjectId ? "Select class…" : "Select subject first"}</option>
                  {classesForSubject.map(s => (
                    <option key={s.streamId} value={s.streamId}>{s.streamName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Type *</label>
              <div className="relative">
                <select
                  value={type}
                  onChange={e => setType(e.target.value as ResourceType)}
                  className="w-full px-3 py-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none"
                >
                  {RESOURCE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Term */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Term (optional)</label>
              <div className="relative">
                <select
                  value={termId}
                  onChange={e => setTermId(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none"
                >
                  <option value="">No term</option>
                  {terms.map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.isActive ? " (Active)" : ""}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description (optional)</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={2}
                placeholder="Brief description of this resource…"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>

            {/* File */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">File *</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-slate-400">({formatBytes(file.size)})</span>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Upload className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-sm">Click to choose file</p>
                    <p className="text-xs mt-0.5">PDF, DOC, DOCX, PPT, PPTX, images (max 50 MB)</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || isPending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {(uploading || isPending) ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload</>}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(["ALL", ...RESOURCE_TYPES.map(t => t.value)] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterType(v as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === v
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {v === "ALL" ? "All" : TYPE_MAP[v]?.label}
            </button>
          ))}
        </div>

        {/* Subject filter */}
        <div className="relative">
          <select
            value={filterSubj}
            onChange={e => setFilterSubj(e.target.value)}
            className="pl-3 pr-8 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none appearance-none"
          >
            <option value="ALL">All subjects</option>
            {uniqueSubjectOptions.map(s => (
              <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Resource list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
          <BookOpen className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">No resources yet</p>
          <p className="text-sm mt-1">Upload notes, past papers, or assignments for your students</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const t = TYPE_MAP[r.type];
            const Icon = t.icon;
            return (
              <div key={r.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                {/* Icon */}
                <div className={`p-2 rounded-lg shrink-0 ${t.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{r.title}</p>
                    {!r.isPublished && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{r.subjectName}</span>
                    {r.streamName && <span className="text-xs text-slate-400">· {r.streamName}</span>}
                    {r.termName   && <span className="text-xs text-slate-400">· {r.termName}</span>}
                    <span className="text-xs text-slate-400">· {r.fileName}</span>
                    {r.fileSize   && <span className="text-xs text-slate-400">({formatBytes(r.fileSize)})</span>}
                    <span className="text-xs text-slate-300 dark:text-slate-600">· {format(new Date(r.createdAt), "d MMM yyyy")}</span>
                  </div>
                  {r.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{r.description}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    title="View / Download"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleTogglePublish(r.id, r.isPublished)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    title={r.isPublished ? "Hide from students" : "Publish to students"}
                  >
                    {r.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

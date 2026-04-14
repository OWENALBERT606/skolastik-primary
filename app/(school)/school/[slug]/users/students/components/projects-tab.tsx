"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FolderArchive, Plus, Pencil, Trash2, Download, Loader2,
  X, Check, Calendar, School, BookOpen, FileArchive, Upload,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { toast }              from "sonner";
import { format }             from "date-fns";
import { UploadButton }       from "@/lib/uploadthing";
import {
  createProjectWork,
  updateProjectWork,
  deleteProjectWork,
} from "@/actions/project-works";

// ── Types ──────────────────────────────────────────────────────────────────

type ProjectWork = {
  id:           string;
  title:        string;
  description:  string | null;
  fileUrl:      string;
  fileName:     string;
  fileSizeKb:   number | null;
  className:    string | null;
  streamName:   string | null;
  academicYear: string | null;
  termName:     string | null;
  createdAt:    string | Date;
  updatedAt:    string | Date;
  uploadedBy:   { id: string; firstName: string; lastName: string } | null;
};

type Props = {
  studentId:    string;
  schoolId:     string;
  userId:       string;
  slug:         string;
  initialWorks: ProjectWork[];
  canUpload?:   boolean; // only teachers and class heads may upload
  // Context from the student's active enrollment (pre-filled on upload)
  activeClass?:  string;
  activeStream?: string;
  activeYear?:   string;
  activeTerm?:   string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtSize(kb: number | null) {
  if (!kb) return "";
  if (kb < 1024)      return `${kb} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────

function ProjectFormModal({
  studentId, schoolId, userId, slug,
  activeClass, activeStream, activeYear, activeTerm,
  editing,
  onClose, onSaved,
}: Props & {
  editing?:  ProjectWork;
  onClose:   () => void;
  onSaved:   (work: ProjectWork) => void;
}) {
  const [title, setTitle]             = useState(editing?.title        ?? "");
  const [description, setDescription] = useState(editing?.description  ?? "");
  const [fileUrl, setFileUrl]         = useState(editing?.fileUrl       ?? "");
  const [fileName, setFileName]       = useState(editing?.fileName      ?? "");
  const [fileSizeKb, setFileSizeKb]   = useState<number | null>(editing?.fileSizeKb ?? null);
  const [uploading, setUploading]     = useState(false);
  const [isPending, startTransition]  = useTransition();

  const isEdit = !!editing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim())            { toast.error("Title is required"); return; }
    if (!isEdit && !fileUrl)      { toast.error("Please upload a zip file"); return; }

    startTransition(async () => {
      let result;
      if (isEdit) {
        result = await updateProjectWork({ id: editing!.id, title, description, slug });
      } else {
        result = await createProjectWork({
          studentId, schoolId, uploadedById: userId,
          title, description, fileUrl, fileName,
          fileSizeKb: fileSizeKb ?? undefined,
          className:   activeClass,
          streamName:  activeStream,
          academicYear: activeYear,
          termName:    activeTerm,
          slug,
        });
      }

      if (result.ok) {
        toast.success(result.message);
        onSaved(result.data as unknown as ProjectWork);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <FolderArchive className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Project" : "Add Project Work"}
            </h2>
          </div>
          <button onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Agriculture Field Study"
              required
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the project work…"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm resize-none"
            />
          </div>

          {/* File upload (new only) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Project File (ZIP) <span className="text-red-500">*</span>
              </label>
              {fileUrl ? (
                <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                  <FileArchive className="w-5 h-5 text-violet-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{fileName}</p>
                    {fileSizeKb && <p className="text-xs text-slate-500">{fmtSize(fileSizeKb)}</p>}
                  </div>
                  <button type="button" onClick={() => { setFileUrl(""); setFileName(""); setFileSizeKb(null); }}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
                  <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Upload a <strong>.zip</strong> file containing all project evidence<br />
                    (videos, audio, images, documents). Max 512 MB.
                  </p>
                  <UploadButton
                    endpoint="projectWorkFiles"
                    onUploadBegin={() => setUploading(true)}
                    onClientUploadComplete={(res) => {
                      setUploading(false);
                      if (res?.[0]) {
                        setFileUrl(res[0].ufsUrl ?? res[0].url);
                        setFileName(res[0].name);
                        setFileSizeKb(Math.round((res[0].size ?? 0) / 1024));
                        toast.success("File uploaded successfully");
                      }
                    }}
                    onUploadError={(err) => {
                      setUploading(false);
                      toast.error(`Upload failed: ${err.message}`);
                    }}
                    appearance={{
                      button: "bg-violet-600 hover:bg-violet-700 text-white text-xs px-4 py-1.5 rounded-lg ut-uploading:opacity-70",
                      allowedContent: "hidden",
                    }}
                  />
                  {uploading && (
                    <p className="text-xs text-violet-500 mt-2 flex items-center justify-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Context tags (read-only preview when creating) */}
          {!isEdit && (activeClass || activeYear) && (
            <div className="flex flex-wrap gap-2">
              {activeClass  && <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md"><School className="w-3 h-3" />{activeClass}{activeStream ? ` · ${activeStream}` : ""}</span>}
              {activeYear   && <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md"><Calendar className="w-3 h-3" />{activeYear}{activeTerm ? ` · ${activeTerm}` : ""}</span>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} disabled={isPending || uploading}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isPending || uploading || (!isEdit && !fileUrl)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? "Saving…" : "Adding…"}</> : <>{isEdit ? "Save Changes" : "Add Project"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────

function DeleteConfirm({ work, slug, onClose, onDeleted }: {
  work: ProjectWork; slug: string;
  onClose: () => void; onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProjectWork({ id: work.id, slug });
      if (result.ok) {
        toast.success(result.message);
        onDeleted(work.id);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Delete Project Work</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Are you sure you want to delete <strong className="text-slate-800 dark:text-white">"{work.title}"</strong>?
          The uploaded file will also be removed.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={isPending}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={isPending}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Card ───────────────────────────────────────────────────────────

function ProjectCard({ work, onEdit, onDelete }: {
  work: ProjectWork;
  onEdit:   () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all">
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg shrink-0 mt-0.5">
            <FolderArchive className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">
              {work.title}
            </h4>
            {/* Context badges */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {work.className && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                  <School className="w-3 h-3" />
                  {work.className}{work.streamName ? ` · ${work.streamName}` : ""}
                </span>
              )}
              {work.academicYear && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3" />
                  {work.academicYear}{work.termName ? ` · ${work.termName}` : ""}
                </span>
              )}
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <a href={work.fileUrl} target="_blank" rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
              title="Download">
              <Download className="w-4 h-4" />
            </a>
            <button onClick={onEdit}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File info row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <FileArchive className="w-3.5 h-3.5" />
            {work.fileName}
            {work.fileSizeKb ? ` · ${fmtSize(work.fileSizeKb)}` : ""}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(work.updatedAt), "dd MMM yyyy")}
          </span>
        </div>

        {/* Description toggle */}
        {work.description && (
          <>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mt-2 transition-colors">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Hide" : "Show"} description
            </button>
            {expanded && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {work.description}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ProjectsTab ───────────────────────────────────────────────────────

export default function ProjectsTab({
  studentId, schoolId, userId, slug,
  initialWorks, canUpload = false,
  activeClass, activeStream, activeYear, activeTerm,
}: Props) {
  const [works, setWorks]       = useState<ProjectWork[]>(initialWorks);
  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState<ProjectWork | null>(null);
  const [deleting, setDeleting] = useState<ProjectWork | null>(null);

  const atLimit = works.length >= 10;

  const handleSaved = (work: ProjectWork) => {
    setWorks(prev => {
      const idx = prev.findIndex(w => w.id === work.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = work;
        return updated;
      }
      return [work, ...prev];
    });
    setShowAdd(false);
    setEditing(null);
  };

  const handleDeleted = (id: string) => {
    setWorks(prev => prev.filter(w => w.id !== id));
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-violet-500" />
            Project Works
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload zipped project files including evidence (videos, audio, images)
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowAdd(true)}
            disabled={atLimit}
            title={atLimit ? "Maximum 10 project works reached" : undefined}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-4 h-4" />
            Add Project
            {atLimit && <span className="text-xs opacity-80">(10/10)</span>}
          </button>
        )}
      </div>

      {/* Empty state */}
      {works.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <FolderArchive className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="font-semibold text-slate-600 dark:text-slate-400">No project works yet</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Upload the student's project work as a zip file containing all evidence.
          </p>
          {canUpload && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors text-sm">
              <Plus className="w-4 h-4" />
              Add First Project
            </button>
          )}
        </div>
      )}

      {/* Works grid */}
      {works.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {works.map(work => (
            <ProjectCard
              key={work.id}
              work={work}
              onEdit={() => setEditing(work)}
              onDelete={() => setDeleting(work)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {(showAdd || editing) && (
        <ProjectFormModal
          studentId={studentId}
          schoolId={schoolId}
          userId={userId}
          slug={slug}
          initialWorks={works}
          activeClass={activeClass}
          activeStream={activeStream}
          activeYear={activeYear}
          activeTerm={activeTerm}
          editing={editing ?? undefined}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <DeleteConfirm
          work={deleting}
          slug={slug}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

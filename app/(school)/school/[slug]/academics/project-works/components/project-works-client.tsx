"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Upload, FileArchive, Trash2, Eye, ChevronDown, ChevronRight,
  Loader2, Plus, X, Download, Calendar, User, BookOpen,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge }    from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProjectWork = {
  id:          string;
  title:       string;
  description: string | null;
  fileUrl:     string;
  fileName:    string;
  fileSizeKb:  number | null;
  className:   string | null;
  streamName:  string | null;
  termName:    string | null;
  academicYear: string | null;
  createdAt:   string;
  updatedAt:   string;
  uploadedBy:  { name: string } | null;
};

type Student = {
  id:          string;
  name:        string;
  admissionNo: string;
  projectWorks: ProjectWork[];
};

type Stream = {
  id:          string;
  name:        string;
  classHeadId: string | null;
  classHead:   string | null;
  students:    Student[];
};

type ClassYear = {
  id:        string;
  className: string;
  level:     number;
  streams:   Stream[];
};

type Props = {
  schoolId:           string;
  slug:               string;
  classYears:         ClassYear[];
  canUploadAll:       boolean;
  classHeadStreamIds: string[];
  activeTermId:       string | null;
  activeTermName:     string | null;
  activeYear:         string | null;
  userId:             string;
};

const fmtSize = (kb: number | null) =>
  kb == null ? "" : kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
  student, stream, classYear, schoolId, activeTermName, activeYear,
  onClose, onUploaded,
}: {
  student:       Student;
  stream:        Stream;
  classYear:     ClassYear;
  schoolId:      string;
  activeTermName: string | null;
  activeYear:    string | null;
  onClose:       () => void;
  onUploaded:    (work: ProjectWork) => void;
}) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ title: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit() {
    if (!form.title || !file) { toast.error("Title and file are required"); return; }
    if (!file.name.endsWith(".zip")) { toast.error("Only .zip files are allowed"); return; }

    start(async () => {
      setUploading(true);
      try {
        // Upload to R2
        const presignRes = await fetch("/api/r2/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type || "application/zip", size: file.size }),
        });
        if (!presignRes.ok) throw new Error("Failed to get upload URL");
        const { presignedUrl, key, publicUrl } = await presignRes.json();

        await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/zip" } });

        // Save to DB
        const res = await fetch("/api/project-works", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId:   student.id,
            schoolId,
            title:       form.title,
            description: form.description || null,
            fileUrl:     publicUrl,
            fileKey:     key,
            fileName:    file.name,
            fileSizeKb:  Math.round(file.size / 1024),
            className:   classYear.className,
            streamName:  stream.name,
            academicYear: activeYear,
            termName:    activeTermName,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to save");
        }
        const work = await res.json();
        toast.success("Project work uploaded successfully");
        onUploaded(work);
        onClose();
      } catch (e: any) {
        toast.error(e.message ?? "Upload failed");
      } finally {
        setUploading(false);
      }
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Project Work</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold">{student.name}</span> · {student.admissionNo} · {classYear.className} {stream.name}
          </div>
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input placeholder="e.g. Biology Project — Ecosystem Study" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea placeholder="Brief description of the project work…" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Project File (.zip) *</Label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
              {file ? (
                <div className="flex items-center gap-3">
                  <FileArchive className="h-8 w-8 text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{fmtSize(Math.round(file.size / 1024))}</p>
                  </div>
                  <button onClick={() => setFile(null)} className="ml-auto shrink-0 text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Click to select a <strong>.zip</strong> file</p>
                  <p className="text-xs text-slate-400 mt-1">Include all evidence: videos, images, documents</p>
                  <input type="file" accept=".zip,application/zip" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" disabled={pending || uploading || !form.title || !file} onClick={handleSubmit}>
              {(pending || uploading) ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Uploading…</> : <><Upload className="h-4 w-4 mr-1.5" />Upload</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectWorksClient({
  schoolId, slug, classYears, canUploadAll, classHeadStreamIds,
  activeTermName, activeYear,
}: Props) {
  const [data,       setData]       = useState(classYears);
  const [expanded,   setExpanded]   = useState<Record<string, boolean>>({});
  const [uploadFor,  setUploadFor]  = useState<{ student: Student; stream: Stream; classYear: ClassYear } | null>(null);
  const [deleting,   startDelete]   = useTransition();
  const [search,     setSearch]     = useState("");

  function canUploadStream(streamId: string) {
    return canUploadAll || classHeadStreamIds.includes(streamId);
  }

  function toggle(id: string) {
    setExpanded(p => ({ ...p, [id]: !p[id] }));
  }

  function handleUploaded(classYearId: string, streamId: string, studentId: string, work: ProjectWork) {
    setData(prev => prev.map(cy =>
      cy.id !== classYearId ? cy : {
        ...cy,
        streams: cy.streams.map(s =>
          s.id !== streamId ? s : {
            ...s,
            students: s.students.map(st =>
              st.id !== studentId ? st : { ...st, projectWorks: [work, ...st.projectWorks] }
            ),
          }
        ),
      }
    ));
  }

  function handleDelete(classYearId: string, streamId: string, studentId: string, workId: string) {
    if (!confirm("Delete this project work?")) return;
    startDelete(async () => {
      const res = await fetch(`/api/project-works?id=${workId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      toast.success("Deleted");
      setData(prev => prev.map(cy =>
        cy.id !== classYearId ? cy : {
          ...cy,
          streams: cy.streams.map(s =>
            s.id !== streamId ? s : {
              ...s,
              students: s.students.map(st =>
                st.id !== studentId ? st : { ...st, projectWorks: st.projectWorks.filter(w => w.id !== workId) }
              ),
            }
          ),
        }
      ));
    });
  }

  const totalStudents = data.reduce((s, cy) => s + cy.streams.reduce((a, st) => a + st.students.length, 0), 0);
  const totalUploaded = data.reduce((s, cy) => s + cy.streams.reduce((a, st) => a + st.students.filter(s => s.projectWorks.length > 0).length, 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Works</h1>
          <p className="text-sm text-slate-500 mt-0.5">Senior 3 and above · {activeYear} · {activeTermName ?? "Active term"}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="font-semibold text-slate-800 dark:text-slate-200">{totalUploaded} / {totalStudents}</p>
            <p className="text-xs text-slate-400">students with uploads</p>
          </div>
          <div className="relative w-56">
            <Input placeholder="Search student…" value={search} onChange={e => setSearch(e.target.value)} className="pl-3 h-8 text-sm" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span>Upload Progress</span>
          <span>{totalStudents > 0 ? Math.round((totalUploaded / totalStudents) * 100) : 0}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalStudents > 0 ? (totalUploaded / totalStudents) * 100 : 0}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">{totalStudents - totalUploaded} students still missing project work</p>
      </div>

      {/* Class groups */}
      {data.map(cy => (
        <div key={cy.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggle(cy.id)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">{cy.className}</span>
              <Badge variant="outline" className="text-xs">
                {cy.streams.reduce((a, s) => a + s.students.length, 0)} students
              </Badge>
            </div>
            {expanded[cy.id] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {expanded[cy.id] && cy.streams.map(stream => {
            const canUp = canUploadStream(stream.id);
            const filteredStudents = stream.students.filter(s =>
              !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.admissionNo.toLowerCase().includes(search.toLowerCase())
            );

            return (
              <div key={stream.id} className="border-t border-slate-100 dark:border-slate-800">
                <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{cy.className} {stream.name}</span>
                    {stream.classHead && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <User className="h-3 w-3" /> Class Head: {stream.classHead}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {stream.students.filter(s => s.projectWorks.length > 0).length}/{stream.students.length} uploaded
                  </span>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Project Works</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      {canUp && <th className="px-4 py-2.5" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.admissionNo}</p>
                        </td>
                        <td className="px-4 py-3">
                          {student.projectWorks.length === 0 ? (
                            <span className="text-xs text-slate-400">No uploads yet</span>
                          ) : (
                            <div className="space-y-1.5">
                              {student.projectWorks.map(w => (
                                <div key={w.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                                  <FileArchive className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{w.title}</p>
                                    <p className="text-[10px] text-slate-400">{w.fileName} {w.fileSizeKb ? `· ${fmtSize(w.fileSizeKb)}` : ""} · {fmtDate(w.createdAt)}</p>
                                  </div>
                                  <a href={w.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:text-primary/80">
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                  {canUp && (
                                    <button onClick={() => handleDelete(cy.id, stream.id, student.id, w.id)} className="shrink-0 text-slate-400 hover:text-red-500" disabled={deleting}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {student.projectWorks.length > 0
                            ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-xs">
                                ✓ {student.projectWorks.length}/10
                              </Badge>
                            : <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0 text-xs">Pending</Badge>
                          }
                        </td>
                        {canUp && (
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="outline"
                              className="h-7 text-xs gap-1.5"
                              disabled={student.projectWorks.length >= 10}
                              title={student.projectWorks.length >= 10 ? "Maximum 10 project works reached" : ""}
                              onClick={() => setUploadFor({ student, stream, classYear: cy })}>
                              <Plus className="h-3 w-3" />
                              {student.projectWorks.length >= 10 ? "Max" : "Add"}
                              {student.projectWorks.length > 0 && (
                                <span className="text-[10px] text-slate-400">({student.projectWorks.length}/10)</span>
                              )}
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}

      {/* Upload modal */}
      {uploadFor && (
        <UploadModal
          student={uploadFor.student}
          stream={uploadFor.stream}
          classYear={uploadFor.classYear}
          schoolId={schoolId}
          activeTermName={activeTermName}
          activeYear={activeYear}
          onClose={() => setUploadFor(null)}
          onUploaded={work => {
            handleUploaded(uploadFor.classYear.id, uploadFor.stream.id, uploadFor.student.id, work);
            setUploadFor(null);
          }}
        />
      )}
    </div>
  );
}

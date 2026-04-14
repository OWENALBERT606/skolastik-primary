"use client";

// Reusable AOI Topics management dialog.
// Can be triggered from any dashboard that has a streamSubjectId.

import { useState, useEffect, useCallback } from "react";
import { toast }   from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Hash, Plus, Edit2, Trash2, Loader2, Check, X, BookOpen, RefreshCw,
} from "lucide-react";
import {
  getAOITopicsForStreamSubject,
  createAOITopic,
  updateAOITopic,
  deleteAOITopic,
} from "@/actions/class-settings";

// ── Types ─────────────────────────────────────────────────────────────────

type AOITopic = {
  id:          string;
  topicNumber: number;
  topicName:   string;
  competence:  string | null;
  maxPoints:   number;
  description: string | null;
  _count:      { aoiScores: number };
};

type SubjectData = {
  classSubjectId: string;
  subjectName:    string;
  subjectCode:    string | null;
  paper:          { id: string; paperNumber: number; name: string } | null;
  topics:         AOITopic[];
};

// ── Inline row components ─────────────────────────────────────────────────

function TopicRow({
  topic, isDeleting, onEdit, onDelete,
}: {
  topic:      AOITopic;
  isDeleting: boolean;
  onEdit:     () => void;
  onDelete:   () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 group">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold flex items-center justify-center shrink-0">
          {topic.topicNumber}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{topic.topicName}</p>
          {topic.competence && (
            <p className="text-xs text-blue-600 dark:text-blue-400 italic truncate">{topic.competence}</p>
          )}
          <p className="text-xs text-slate-400">
            Max {topic.maxPoints} pts
            {topic._count.aoiScores > 0 && (
              <span className="ml-2 text-green-600 dark:text-green-400">· {topic._count.aoiScores} score{topic._count.aoiScores !== 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 text-slate-400 hover:text-[#5B9BD5] hover:bg-[#5B9BD5]/10 rounded-lg"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting || topic._count.aoiScores > 0}
          title={topic._count.aoiScores > 0 ? "Cannot delete — scores exist" : "Delete topic"}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function TopicEditRow({
  topic, onSave, onCancel, isSaving,
}: { topic: AOITopic; onSave: (d: any) => void; onCancel: () => void; isSaving: boolean }) {
  const [name,       setName]       = useState(topic.topicName);
  const [competence, setCompetence] = useState(topic.competence ?? "");
  const [maxPoints,  setMaxPoints]  = useState(topic.maxPoints);
  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 rounded-lg border-2 border-[#5B9BD5]">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold flex items-center justify-center shrink-0">
          {topic.topicNumber}
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Topic name"
          className="flex-1 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <input
          type="number" value={maxPoints} min={1} max={10} step={0.5}
          onChange={(e) => setMaxPoints(parseFloat(e.target.value) || 3)}
          className="w-14 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded text-center focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <span className="text-xs text-slate-400 shrink-0">pts</span>
        <button
          onClick={() => onSave({ topicName: name, competence, maxPoints })}
          disabled={isSaving || !name.trim()}
          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        value={competence}
        onChange={(e) => setCompetence(e.target.value)}
        placeholder="Competence / learning outcome (optional)…"
        className="ml-8 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 italic"
      />
    </div>
  );
}

function TopicAddRow({
  classSubjectId, nextNumber, onSave, onCancel, isSaving,
}: { classSubjectId: string; nextNumber: number; onSave: (d: any) => void; onCancel: () => void; isSaving: boolean }) {
  const [name,       setName]       = useState("");
  const [competence, setCompetence] = useState("");
  const [maxPoints,  setMaxPoints]  = useState(3);
  const submit = () => {
    if (!name.trim()) return;
    onSave({ classSubjectId, topicNumber: nextNumber, topicName: name, competence, maxPoints });
  };
  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-[#5B9BD5]/50">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs font-semibold flex items-center justify-center shrink-0">
          {nextNumber}
        </span>
        <input
          autoFocus
          placeholder="Topic name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="flex-1 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
        />
        <input
          type="number" value={maxPoints} min={1} max={10} step={0.5}
          onChange={(e) => setMaxPoints(parseFloat(e.target.value) || 3)}
          className="w-14 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded text-center focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <span className="text-xs text-slate-400 shrink-0">pts</span>
        <button
          onClick={submit}
          disabled={isSaving || !name.trim()}
          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        value={competence}
        onChange={(e) => setCompetence(e.target.value)}
        placeholder="Competence / learning outcome (optional)…"
        className="ml-8 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9BD5] bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 italic"
      />
    </div>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────

interface AoiTopicsDialogProps {
  open:            boolean;
  onOpenChange:    (v: boolean) => void;
  streamSubjectId: string;
  subjectName:     string;
  paperName?:      string | null;
  paperNumber?:    number | null;
}

export function AoiTopicsDialog({
  open, onOpenChange, streamSubjectId, subjectName, paperName, paperNumber,
}: AoiTopicsDialogProps) {
  const [isLoading,  setIsLoading]  = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [data,       setData]       = useState<SubjectData | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getAOITopicsForStreamSubject(streamSubjectId);
    setIsLoading(false);
    if (res.ok && res.data) setData(res.data);
    else toast.error(res.message ?? "Failed to load AOI topics");
  }, [streamSubjectId]);

  useEffect(() => {
    if (open) { load(); setShowAdd(false); setEditingId(null); }
  }, [open, load]);

  const topics     = data?.topics ?? [];
  const nextNumber = topics.length > 0 ? Math.max(...topics.map(t => t.topicNumber)) + 1 : 1;

  const paperLabel = paperNumber != null
    ? `P${paperNumber}${paperName ? ` — ${paperName}` : ""}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-slate-900 dark:text-white text-base font-semibold leading-tight">
                AOI Topics
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subjectName}
                {paperLabel && <span className="ml-1.5 font-mono">{paperLabel}</span>}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading topics…</span>
            </div>
          ) : (
            <>
              {topics.length === 0 && !showAdd && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <BookOpen className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No AOI topics yet.</p>
                  <p className="text-xs mt-1">Add topics below to enable AOI score entry.</p>
                </div>
              )}

              {topics.map((topic) =>
                editingId === topic.id ? (
                  <TopicEditRow
                    key={topic.id}
                    topic={topic}
                    isSaving={isSaving}
                    onCancel={() => setEditingId(null)}
                    onSave={async (d) => {
                      setIsSaving(true);
                      const res = await updateAOITopic(topic.id, d);
                      setIsSaving(false);
                      if (res.ok) { toast.success(res.message); setEditingId(null); load(); }
                      else toast.error(res.message);
                    }}
                  />
                ) : (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    isDeleting={deletingId === topic.id}
                    onEdit={() => { setShowAdd(false); setEditingId(topic.id); }}
                    onDelete={async () => {
                      setDeletingId(topic.id);
                      const res = await deleteAOITopic(topic.id);
                      setDeletingId(null);
                      if (res.ok) { toast.success(res.message); load(); }
                      else toast.error(res.message);
                    }}
                  />
                )
              )}

              {showAdd && data ? (
                <TopicAddRow
                  classSubjectId={data.classSubjectId}
                  nextNumber={nextNumber}
                  isSaving={isSaving}
                  onCancel={() => setShowAdd(false)}
                  onSave={async (d) => {
                    setIsSaving(true);
                    const res = await createAOITopic(d);
                    setIsSaving(false);
                    if (res.ok) { toast.success(res.message); setShowAdd(false); load(); }
                    else toast.error(res.message);
                  }}
                />
              ) : (
                <button
                  onClick={() => { setEditingId(null); setShowAdd(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#5B9BD5] hover:text-[#4A8BC2] border border-dashed border-[#5B9BD5]/30 hover:border-[#5B9BD5]/60 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Topic
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={load}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}
            className="h-7 text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

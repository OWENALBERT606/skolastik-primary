"use client";

import { useState, useEffect } from "react";
import {
  Megaphone, Plus, Bell, RefreshCw, X, Pin,
  AlertCircle, CheckCircle, Clock, Users, ChevronDown,
} from "lucide-react";
import {
  getStaffNotices, createStaffNotice, publishNotice,
} from "@/actions/staff-actions";
import { getAuthenticatedUser } from "@/config/useAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-red-400 bg-red-500/10 border-red-500/20",
  HIGH:   "text-orange-400 bg-orange-500/10 border-orange-500/20",
  NORMAL: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  LOW:    "text-slate-500 bg-slate-700/30 border-slate-600/20",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     "bg-slate-500/10 text-slate-400 border-slate-500/20",
  PUBLISHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ARCHIVED:  "bg-slate-700/30 text-slate-500 border-slate-600/20",
  SCHEDULED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const inputCls =
  "w-full bg-[#0f172a] border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm " +
  "text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#6366f1] " +
  "focus:ring-1 focus:ring-[#6366f1]/20 transition-all";

const labelCls = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title, open, onClose, children, width = "max-w-lg",
}: {
  title: string; open: boolean; onClose: () => void;
  children: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#0d1117] border border-slate-700/50 rounded-2xl w-full ${width} max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50 sticky top-0 bg-[#0d1117] z-10">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
        <Megaphone size={26} className="text-amber-500/50" />
      </div>
      <p className="text-sm font-medium text-slate-400">No notices yet</p>
      <p className="text-xs text-slate-600 mt-1">Post your first announcement to staff</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[#0d1117] border border-slate-800/80 rounded-2xl p-5 animate-pulse">
          <div className="flex gap-2 mb-3">
            <div className="h-5 w-16 rounded-full bg-slate-800" />
            <div className="h-5 w-20 rounded-full bg-slate-800" />
          </div>
          <div className="h-4 w-2/3 rounded bg-slate-800 mb-2" />
          <div className="h-3 w-full rounded bg-slate-800/60 mb-1" />
          <div className="h-3 w-4/5 rounded bg-slate-800/60" />
        </div>
      ))}
    </div>
  );
}

// ─── Notice Card ──────────────────────────────────────────────────────────────

function NoticeCard({
  notice, onPublish,
}: {
  notice: any;
  onPublish: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = notice.content?.length > 200;

  return (
    <div
      className={`bg-[#0d1117] border rounded-2xl p-5 transition-all ${
        notice.isPinned ? "border-amber-500/30 shadow-[0_0_0_1px_rgba(245,158,11,0.08)]" : "border-slate-800/80"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Tags */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            {notice.isPinned && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                📌 Pinned
              </span>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[notice.priority] ?? PRIORITY_COLORS.NORMAL}`}>
              {notice.priority}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[notice.status] ?? ""}`}>
              {notice.status}
            </span>
            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
              {notice.audience.replace(/_/g, " ")}
            </span>
            {notice.requiresAcknowledgement && (
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                Ack. required
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-white mb-2 leading-snug">{notice.title}</h3>

          {/* Content */}
          <p className={`text-sm text-slate-400 leading-relaxed ${!expanded && isLong ? "line-clamp-3" : ""}`}>
            {notice.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1.5 transition-colors"
            >
              <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {notice.status === "DRAFT" && (
            <button
              onClick={() => onPublish(notice.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20 transition-colors"
            >
              <Bell size={11} /> Publish
            </button>
          )}
          {notice.status === "PUBLISHED" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500/70">
              <CheckCircle size={11} /> Live
            </span>
          )}
        </div>
      </div>

      {/* Attachments */}
      {notice.attachmentUrls?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {notice.attachmentUrls.map((url: string, i: number) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 underline transition-colors"
            >
              Attachment {i + 1}
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Users size={11} />
          <span>By: {notice.createdBy?.firstName} {notice.createdBy?.lastName}</span>
        </div>
        <div className="flex items-center gap-4">
          {notice._count?.acknowledgements > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle size={11} className="text-emerald-600" />
              {notice._count.acknowledgements} acknowledged
            </span>
          )}
          {notice.publishedAt ? (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {new Date(notice.publishedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-700">
              <Clock size={11} /> Draft
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>;
}

export default function NoticesPage({ params }: Props) {
  const [slug, setSlug] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [staffId, setStaffId] = useState(""); // Staff.id (not User.id) for createdById

  const [notices, setNotices]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");
  const [filter, setFilter]       = useState<"ALL" | "DRAFT" | "PUBLISHED">("ALL");

  const [form, setForm] = useState({
    title: "",
    content: "",
    audience: "ALL_STAFF",
    priority: "NORMAL",
    requiresAcknowledgement: false,
    isPinned: false,
    attachmentUrls: "",
  });

  // ── Resolve params & user ──
  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  // NOTE: getAuthenticatedUser is server-only. schoolId & staffId must be
  // passed from the server page as props (or fetched via an API route).
  // For now we read them from the server page via a lightweight fetch pattern.
  // If you already pass schoolId/staffId as props from the server page, replace
  // this block with direct prop usage.
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/school-by-slug?slug=${slug}`)
      .then(r => r.json())
      .then(d => { setSchoolId(d.schoolId); setStaffId(d.staffId ?? ""); })
      .catch(() => {});
  }, [slug]);

  async function load() {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await getStaffNotices(schoolId);
      setNotices(data as any[]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [schoolId]);

  // ── Create notice ──
  async function handleCreate(publishNow: boolean) {
    if (!form.title.trim() || !form.content.trim()) {
      setErr("Title and content are required."); return;
    }
    if (!staffId) { setErr("Could not resolve your staff record."); return; }

    setSaving(true); setErr("");
    try {
      const res = await createStaffNotice({
        schoolId,
        createdById: staffId,
        title: form.title,
        content: form.content,
        audience: form.audience as any,
        priority: form.priority,
        isPinned: form.isPinned,
        requiresAcknowledgement: form.requiresAcknowledgement,
        publishedAt: publishNow ? new Date() : undefined,
        attachmentUrls: form.attachmentUrls
          ? form.attachmentUrls.split("\n").map(s => s.trim()).filter(Boolean)
          : [],
      });
      if (!res.ok) { setErr(res.message); return; }
      setCreateOpen(false);
      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({ title: "", content: "", audience: "ALL_STAFF", priority: "NORMAL", requiresAcknowledgement: false, isPinned: false, attachmentUrls: "" });
    setErr("");
  }

  // ── Publish draft ──
  async function handlePublish(id: string) {
    await publishNotice(id);
    load();
  }

  // ── Filter notices ──
  const filtered = notices.filter(n => {
    if (filter === "ALL") return true;
    return n.status === filter;
  });

  const counts = {
    ALL: notices.length,
    DRAFT: notices.filter(n => n.status === "DRAFT").length,
    PUBLISHED: notices.filter(n => n.status === "PUBLISHED").length,
  };

  return (
    <div className="min-h-screen bg-[#080c10] text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Megaphone size={18} className="text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Staff Notice Board</h1>
            </div>
            <p className="text-sm text-slate-500 ml-0.5">Announcements and important communications</p>
          </div>
          <button
            onClick={() => { resetForm(); setCreateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-amber-900/20"
          >
            <Plus size={16} /> New Notice
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-slate-900/50 rounded-xl p-1 w-fit">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === f
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {f} {counts[f] > 0 && <span className="ml-1 opacity-60">({counts[f]})</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {filtered.map(n => (
              <NoticeCard key={n.id} notice={n} onPublish={handlePublish} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        title="Create Notice"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        width="max-w-xl"
      >
        <div className="p-6 space-y-4">
          {err && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle size={13} /> {err}
            </div>
          )}

          <div>
            <label className={labelCls}>Title *</label>
            <input
              className={inputCls}
              placeholder="Notice title…"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelCls}>Content *</label>
            <textarea
              className={inputCls}
              rows={6}
              placeholder="Write your announcement here…"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Audience</label>
              <select className={inputCls} value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}>
                {["ALL_STAFF", "TEACHING_ONLY", "NON_TEACHING_ONLY", "SPECIFIC_ROLES", "SPECIFIC_STAFF"].map(a => (
                  <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select className={inputCls} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {["LOW", "NORMAL", "HIGH", "URGENT"].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Attachment URLs (one per line)</label>
            <textarea
              className={inputCls}
              rows={2}
              placeholder="https://…"
              value={form.attachmentUrls}
              onChange={e => setForm(f => ({ ...f, attachmentUrls: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded accent-indigo-500"
                checked={form.isPinned}
                onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
              />
              <span className="text-sm text-slate-300">📌 Pin to top</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded accent-indigo-500"
                checked={form.requiresAcknowledgement}
                onChange={e => setForm(f => ({ ...f, requiresAcknowledgement: e.target.checked }))}
              />
              <span className="text-sm text-slate-300">Requires acknowledgement</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setCreateOpen(false)}
              className="flex-1 py-2.5 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleCreate(false)}
              disabled={saving}
              className="flex-1 py-2.5 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving && <RefreshCw size={13} className="animate-spin" />}
              Save as Draft
            </button>
            <button
              onClick={() => handleCreate(true)}
              disabled={saving}
              className="flex-1 py-2.5 text-sm text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving && <RefreshCw size={13} className="animate-spin" />}
              Publish Now
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
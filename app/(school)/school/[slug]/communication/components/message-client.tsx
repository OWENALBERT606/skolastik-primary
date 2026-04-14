"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, MessageSquare, Phone, Send, Clock, FileText,
  Users, User, ChevronLeft, ChevronRight,
  Plus, X, Ban, Search, Loader2, Inbox,
  Globe, GraduationCap, Baby,
} from "lucide-react";
import { createMessage, sendMessage, cancelMessage } from "@/actions/communication-actions";
import { toast } from "sonner";

// ── Types (exported so page.tsx can cast to them) ─────────────────────
export type MessageChannel  = "SYSTEM" | "EMAIL" | "SMS";
export type MessageAudience = "ALL" | "PARENTS" | "TEACHERS" | "ALL_STAFF" | "SPECIFIC_USERS";
export type MessageStatus   = "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PARTIALLY_SENT" | "FAILED" | "CANCELLED";
export type MessagePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Message {
  id: string;
  subject: string;
  body: string;
  channels: MessageChannel[];
  audience: MessageAudience;
  status: MessageStatus;
  priority: MessagePriority;
  scheduledAt?: string | null;
  sentAt?: string | null;
  totalRecipients: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: string;
  createdBy: { id: string; name: string; email?: string | null };
}

interface Props {
  schoolId: string;
  schoolSlug: string;
  userId: string;
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
  stats?: {
    totalMessages: number;
    sentMessages: number;
    scheduledMessages: number;
    draftMessages: number;
    totalEvents: number;
    upcomingEvents: number;
    unreadSystemPosts: number;
  };
}

// ── Meta maps ──────────────────────────────────────────────────────────
const AUDIENCE_META: Record<MessageAudience, { label: string; icon: React.ReactNode; cls: string }> = {
  ALL:            { label: "Everyone",  icon: <Globe size={13} />,         cls: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30" },
  PARENTS:        { label: "Parents",   icon: <Baby size={13} />,          cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" },
  TEACHERS:       { label: "Teachers",  icon: <GraduationCap size={13} />, cls: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30" },
  ALL_STAFF:      { label: "All Staff", icon: <Users size={13} />,         cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30" },
  SPECIFIC_USERS: { label: "Specific",  icon: <User size={13} />,          cls: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30" },
};

const STATUS_META: Record<MessageStatus, { label: string; cls: string; dot: string }> = {
  DRAFT:          { label: "Draft",     cls: "text-zinc-500 dark:text-zinc-400",        dot: "bg-zinc-400 dark:bg-zinc-500" },
  SCHEDULED:      { label: "Scheduled", cls: "text-amber-600 dark:text-amber-400",      dot: "bg-amber-400" },
  SENDING:        { label: "Sending…",  cls: "text-blue-600 dark:text-blue-400",        dot: "bg-blue-400 animate-pulse" },
  SENT:           { label: "Sent",      cls: "text-emerald-600 dark:text-emerald-400",  dot: "bg-emerald-400" },
  PARTIALLY_SENT: { label: "Partial",   cls: "text-amber-600 dark:text-amber-400",      dot: "bg-amber-500" },
  FAILED:         { label: "Failed",    cls: "text-red-600 dark:text-red-400",          dot: "bg-red-500" },
  CANCELLED:      { label: "Cancelled", cls: "text-zinc-400 dark:text-zinc-500",        dot: "bg-zinc-400 dark:bg-zinc-600" },
};

const PRIORITY_BORDER: Record<MessagePriority, string> = {
  LOW:    "border-l-zinc-300 dark:border-l-zinc-600",
  NORMAL: "border-l-violet-500 dark:border-l-violet-600",
  HIGH:   "border-l-amber-500",
  URGENT: "border-l-red-500",
};

const CHANNEL_ICONS: Record<MessageChannel, React.ReactNode> = {
  SYSTEM: <MessageSquare size={12} />,
  EMAIL:  <Mail size={12} />,
  SMS:    <Phone size={12} />,
};

function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-UG", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Reusable style strings ─────────────────────────────────────────────
const inputCls = [
  "w-full rounded-lg px-3 py-2.5 text-sm",
  "bg-white dark:bg-slate-800/60",
  "border border-zinc-200 dark:border-slate-700/60",
  "text-zinc-900 dark:text-white",
  "placeholder-zinc-400 dark:placeholder-zinc-600",
  "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20",
].join(" ");

const selectCls = [
  "w-full rounded-lg px-3 py-2 text-sm",
  "bg-white dark:bg-slate-800/60",
  "border border-zinc-200 dark:border-slate-700/60",
  "text-zinc-900 dark:text-white",
  "focus:outline-none focus:border-violet-500",
].join(" ");

// ── Toggle ─────────────────────────────────────────────────────────────
function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onToggle}>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${on ? "bg-violet-600" : "bg-zinc-200 dark:bg-white/10"}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
    </div>
  );
}

// ── Compose Dialog ─────────────────────────────────────────────────────
function ComposeDialog({ schoolId, userId, onClose, onSuccess }: {
  schoolId: string; userId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [channels, setChannels]       = useState<MessageChannel[]>(["SYSTEM"]);
  const [audience, setAudience]       = useState<MessageAudience>("ALL");
  const [priority, setPriority]       = useState<MessagePriority>("NORMAL");
  const [subject, setSubject]         = useState("");
  const [body, setBody]               = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendNow, setSendNow]         = useState(false);

  const toggleCh = (ch: MessageChannel) =>
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);

  const handleSubmit = (asDraft = false) => {
    startTransition(async () => {
      const res = await createMessage({
        schoolId, createdById: userId, subject, body, channels, audience, priority,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        sendNow: !asDraft && sendNow,
      });
      if (res.ok) { toast.success(res.message); onSuccess(); onClose(); }
      else toast.error(res.message);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-slate-700/40 bg-violet-50 dark:bg-gradient-to-r dark:from-violet-900/30 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-600/30 border border-violet-200 dark:border-violet-500/40 flex items-center justify-center">
              <Send size={15} className="text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <h2 className="text-zinc-900 dark:text-white font-semibold text-sm">New Message</h2>
              <p className="text-zinc-500 text-xs">Compose and send to recipients</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Channels */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Delivery Channels</label>
            <div className="flex gap-2">
              {(["SYSTEM", "EMAIL", "SMS"] as MessageChannel[]).map(ch => (
                <button key={ch} onClick={() => toggleCh(ch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    channels.includes(ch)
                      ? "bg-violet-100 dark:bg-violet-600/20 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-200"
                      : "bg-zinc-50 dark:bg-slate-800/50 border-zinc-200 dark:border-slate-700/60 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20"
                  }`}>
                  {CHANNEL_ICONS[ch]}
                  {ch === "SYSTEM" ? "In-App" : ch}
                </button>
              ))}
            </div>
          </div>

          {/* Audience + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Recipients</label>
              <select value={audience} onChange={e => setAudience(e.target.value as MessageAudience)} className={selectCls}>
                <option value="ALL">Everyone</option>
                <option value="PARENTS">Parents</option>
                <option value="TEACHERS">Teachers</option>
                <option value="ALL_STAFF">All Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as MessagePriority)} className={selectCls}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Message subject…" className={inputCls} />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Message Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
              placeholder="Write your message here…" className={`${inputCls} resize-none`} />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-zinc-400 dark:text-zinc-600">{body.length} chars</span>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Schedule (Optional)</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={inputCls} />
          </div>

          <Toggle on={sendNow} onToggle={() => setSendNow(v => !v)} label="Send immediately on save" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-slate-700/40 bg-zinc-50 dark:bg-black/20">
          <button onClick={() => handleSubmit(true)} disabled={isPending || !subject.trim() || !body.trim()}
            className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-slate-700/60 hover:border-zinc-300 dark:hover:border-white/20 rounded-lg transition-all disabled:opacity-40">
            Save Draft
          </button>
          <button onClick={() => handleSubmit(false)} disabled={isPending || !subject.trim() || !body.trim() || channels.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-40">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sendNow ? "Send Now" : scheduledAt ? "Schedule" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message Detail Dialog ──────────────────────────────────────────────
function MessageDetailDialog({ message, onClose, onRefresh }: {
  message: Message; onClose: () => void; onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const aud  = AUDIENCE_META[message.audience];
  const stat = STATUS_META[message.status];

  const handleSend = () => startTransition(async () => {
    const res = await sendMessage(message.id);
    if (res.ok) { toast.success(res.message); onRefresh(); onClose(); } else toast.error(res.message);
  });

  const handleCancel = () => startTransition(async () => {
    const res = await cancelMessage(message.id);
    if (res.ok) { toast.success(res.message); onRefresh(); onClose(); } else toast.error(res.message);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 dark:border-slate-700/40">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`flex items-center gap-1 text-xs font-medium ${stat.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} /> {stat.label}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${aud.cls}`}>
                {aud.icon} {aud.label}
              </span>
            </div>
            <h2 className="text-zinc-900 dark:text-white font-semibold text-sm truncate">{message.subject}</h2>
            <p className="text-zinc-500 text-xs mt-0.5">From {message.createdBy.name} · {fmt(message.createdAt)}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Channel badges */}
          <div className="flex gap-2 flex-wrap">
            {message.channels.map(ch => (
              <span key={ch} className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded text-xs text-zinc-600 dark:text-zinc-300">
                {CHANNEL_ICONS[ch]} {ch === "SYSTEM" ? "In-App" : ch}
              </span>
            ))}
          </div>

          {/* Body */}
          <div className="bg-zinc-50 dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700/40 rounded-xl p-4">
            <p className="text-zinc-700 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
          </div>

          {/* Delivery stats */}
          {message.status === "SENT" && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Recipients", val: message.totalRecipients, cls: "text-zinc-900 dark:text-white" },
                { label: "Delivered",  val: message.deliveredCount,  cls: "text-emerald-600 dark:text-emerald-400" },
                { label: "Read",       val: message.readCount,       cls: "text-violet-600 dark:text-violet-400" },
              ].map(s => (
                <div key={s.label} className="bg-zinc-50 dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700/40 rounded-lg p-3 text-center">
                  <div className={`text-xl font-bold ${s.cls}`}>{s.val}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Scheduled badge */}
          {message.scheduledAt && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2">
              <Clock size={12} /> Scheduled for {fmt(message.scheduledAt)}
            </div>
          )}
        </div>

        {/* Actions */}
        {(message.status === "DRAFT" || message.status === "SCHEDULED") && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-slate-700/40">
            <button onClick={handleCancel} disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-lg transition-all">
              <Ban size={12} /> Cancel
            </button>
            {message.status === "DRAFT" && (
              <button onClick={handleSend} disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-medium transition-all">
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Send Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function MessagesClient({ schoolId, userId, messages, total, page, totalPages, stats }: Props) {
  const router = useRouter();
  const [showCompose, setShowCompose]         = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [search, setSearch]                   = useState("");

  const filtered = messages.filter(m =>
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.createdBy.name.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: "Total Sent",      value: stats?.sentMessages ?? 0,      icon: <Send size={15} />,     bg: "bg-violet-50 dark:bg-gradient-to-br dark:from-violet-900/40 dark:to-transparent", border: "border-violet-100 dark:border-violet-900/40", iconCls: "text-violet-500 dark:text-violet-400" },
    { label: "Scheduled",       value: stats?.scheduledMessages ?? 0, icon: <Clock size={15} />,    bg: "bg-amber-50 dark:bg-gradient-to-br dark:from-amber-900/40 dark:to-transparent",   border: "border-amber-100 dark:border-amber-900/40",   iconCls: "text-amber-500 dark:text-amber-400" },
    { label: "Drafts",          value: stats?.draftMessages ?? 0,     icon: <FileText size={15} />, bg: "bg-zinc-100 dark:bg-gradient-to-br dark:from-zinc-800/60 dark:to-transparent",    border: "border-zinc-200 dark:border-zinc-700/40",     iconCls: "text-zinc-500 dark:text-zinc-400" },
    { label: "Unread (In-App)", value: stats?.unreadSystemPosts ?? 0, icon: <Inbox size={15} />,    bg: "bg-blue-50 dark:bg-gradient-to-br dark:from-blue-900/40 dark:to-transparent",     border: "border-blue-100 dark:border-blue-900/40",     iconCls: "text-blue-500 dark:text-blue-400" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0d1117] text-zinc-900 dark:text-white">

      {/* Sticky header */}
      <div className="border-b border-zinc-200 dark:border-slate-700/40 bg-white/80 dark:bg-[#0d1117]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Messages</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{total} message{total !== 1 ? "s" : ""} total</p>
          </div>
          <button onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl font-medium transition-all shadow-lg shadow-violet-500/20 dark:shadow-violet-900/40">
            <Plus size={15} /> Compose
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
              <div className={`mb-2 ${s.iconCls}`}>{s.icon}</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…"
              className="w-full bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20" />
          </div>
          <select onChange={e => router.push(`?status=${e.target.value}`)}
            className="bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-violet-500">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
          <select onChange={e => router.push(`?audience=${e.target.value}`)}
            className="bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-violet-500">
            <option value="">All Audiences</option>
            <option value="ALL">Everyone</option>
            <option value="PARENTS">Parents</option>
            <option value="TEACHERS">Teachers</option>
            <option value="ALL_STAFF">All Staff</option>
          </select>
        </div>

        {/* Message list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center mb-4">
              <MessageSquare size={22} className="text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No messages yet</p>
            <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">Compose your first message to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(msg => {
              const aud  = AUDIENCE_META[msg.audience];
              const stat = STATUS_META[msg.status];
              return (
                <div key={msg.id} onClick={() => setSelectedMessage(msg)}
                  className={`group flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 hover:bg-zinc-50 dark:hover:bg-slate-700/40 border border-zinc-200 dark:border-slate-700/40 border-l-2 ${PRIORITY_BORDER[msg.priority]} rounded-xl cursor-pointer transition-all`}>

                  {/* Channel icons */}
                  <div className="flex gap-1 shrink-0">
                    {msg.channels.map(ch => (
                      <span key={ch} className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-white/8 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                        {CHANNEL_ICONS[ch]}
                      </span>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{msg.subject}</span>
                      {msg.priority === "URGENT" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded font-semibold">URGENT</span>
                      )}
                      {msg.priority === "HIGH" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded">HIGH</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{msg.body.slice(0, 80)}…</p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`flex items-center gap-1 text-xs ${stat.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} /> {stat.label}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${aud.cls}`}>
                      {aud.icon} {aud.label}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{fmt(msg.sentAt ?? msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button disabled={page <= 1} onClick={() => router.push(`?page=${page - 1}`)}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-30 transition-all">
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs text-zinc-500 px-2">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => router.push(`?page=${page + 1}`)}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-30 transition-all">
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {showCompose && (
        <ComposeDialog schoolId={schoolId} userId={userId}
          onClose={() => setShowCompose(false)} onSuccess={() => router.refresh()} />
      )}
      {selectedMessage && (
        <MessageDetailDialog message={selectedMessage}
          onClose={() => setSelectedMessage(null)} onRefresh={() => router.refresh()} />
      )}
    </div>
  );
}
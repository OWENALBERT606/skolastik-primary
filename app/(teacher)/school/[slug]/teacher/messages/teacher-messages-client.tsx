"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Mail, Phone, Globe, Users, GraduationCap,
  ChevronLeft, ChevronRight, Search, X, Clock,
} from "lucide-react";

type MessageAudience = "ALL" | "PARENTS" | "TEACHERS" | "ALL_STAFF" | "SPECIFIC_USERS";
type MessagePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type MessageChannel  = "SYSTEM" | "EMAIL" | "SMS";

interface Message {
  id: string;
  subject: string;
  body: string;
  channels: MessageChannel[];
  audience: MessageAudience;
  priority: MessagePriority;
  sentAt?: string | null;
  createdAt: string;
  totalRecipients: number;
  createdBy: { id: string; name: string; email?: string | null };
}

interface Props {
  slug: string;
  messages: Message[];
  total: number;
  page: number;
}

const AUDIENCE_META: Record<MessageAudience, { label: string; icon: React.ReactNode; cls: string }> = {
  ALL:            { label: "Everyone",  icon: <Globe size={12} />,         cls: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30" },
  PARENTS:        { label: "Parents",   icon: null,                        cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" },
  TEACHERS:       { label: "Teachers",  icon: <GraduationCap size={12} />, cls: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30" },
  ALL_STAFF:      { label: "All Staff", icon: <Users size={12} />,         cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30" },
  SPECIFIC_USERS: { label: "Specific",  icon: null,                        cls: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30" },
};

const CHANNEL_ICONS: Record<MessageChannel, React.ReactNode> = {
  SYSTEM: <MessageSquare size={12} />,
  EMAIL:  <Mail size={12} />,
  SMS:    <Phone size={12} />,
};

const PRIORITY_BORDER: Record<MessagePriority, string> = {
  LOW:    "border-l-zinc-300 dark:border-l-zinc-600",
  NORMAL: "border-l-violet-400 dark:border-l-violet-600",
  HIGH:   "border-l-amber-500",
  URGENT: "border-l-red-500",
};

function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });
}

function DetailDialog({ message, onClose }: { message: Message; onClose: () => void }) {
  const aud = AUDIENCE_META[message.audience];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 dark:border-slate-700/40">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${aud.cls}`}>
                {aud.icon} {aud.label}
              </span>
              {message.priority === "URGENT" && (
                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded font-semibold">URGENT</span>
              )}
            </div>
            <h2 className="text-zinc-900 dark:text-white font-semibold text-sm">{message.subject}</h2>
            <p className="text-zinc-500 text-xs mt-0.5">From {message.createdBy.name} · {fmt(message.sentAt ?? message.createdAt)}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {message.channels.map(ch => (
              <span key={ch} className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded text-xs text-zinc-600 dark:text-zinc-300">
                {CHANNEL_ICONS[ch]} {ch === "SYSTEM" ? "In-App" : ch}
              </span>
            ))}
          </div>
          <div className="bg-zinc-50 dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700/40 rounded-xl p-4">
            <p className="text-zinc-700 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeacherMessagesClient({ messages, total, page }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);

  const filtered = messages.filter(m =>
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.createdBy.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-slate-950 text-zinc-900 dark:text-white">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-slate-700/40 bg-white/80 dark:bg-slate-950/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare size={18} className="text-violet-500" />
            <div>
              <h1 className="text-lg font-semibold">Messages</h1>
              <p className="text-zinc-500 text-xs">{total} message{total !== 1 ? "s" : ""} for staff</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…"
            className="w-full bg-white dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20" />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center mb-4">
              <MessageSquare size={22} className="text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No messages</p>
            <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">Messages sent to staff will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(msg => {
              const aud = AUDIENCE_META[msg.audience];
              return (
                <div key={msg.id} onClick={() => setSelected(msg)}
                  className={`flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 hover:bg-zinc-50 dark:hover:bg-slate-700/40 border border-zinc-200 dark:border-slate-700/40 border-l-2 ${PRIORITY_BORDER[msg.priority]} rounded-xl cursor-pointer transition-all`}>
                  <div className="flex gap-1 shrink-0">
                    {msg.channels.map(ch => (
                      <span key={ch} className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-white/8 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                        {CHANNEL_ICONS[ch]}
                      </span>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{msg.subject}</span>
                      {msg.priority === "URGENT" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded font-semibold">URGENT</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{msg.body.slice(0, 80)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${aud.cls}`}>
                      {aud.icon} {aud.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-600">
                      <Clock size={10} /> {fmt(msg.sentAt ?? msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
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

      {selected && <DetailDialog message={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

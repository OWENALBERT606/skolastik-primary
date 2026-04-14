"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox, Mail, MailOpen, Archive, Trash2, CheckCheck,
  ChevronLeft, ChevronRight, AlertCircle, Info, Bell,
  X, Loader2, MessageSquare,
} from "lucide-react";
import {
  markMessageAsRead, markAllMessagesAsRead,
  toggleMessageArchive, deleteMessagePost,
} from "@/actions/communication-actions";
import { toast } from "sonner";

type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Post {
  id: string;
  isRead: boolean;
  readAt?: string | null;
  isStarred: boolean;
  isArchived: boolean;
  createdAt: string;
  message: {
    id: string;
    subject: string;
    body: string;
    priority: Priority;
    sentAt?: string | null;
    createdBy: { id: string; name: string };
  };
}

interface Props {
  userId: string;
  posts: Post[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

const PRIORITY_ICON: Record<Priority, React.ReactNode> = {
  LOW:    <Info size={13} className="text-zinc-400 dark:text-zinc-500" />,
  NORMAL: <MessageSquare size={13} className="text-zinc-500 dark:text-zinc-400" />,
  HIGH:   <AlertCircle size={13} className="text-amber-500 dark:text-amber-400" />,
  URGENT: <Bell size={13} className="text-red-500 dark:text-red-400" />,
};

const PRIORITY_BORDER: Record<Priority, string> = {
  LOW:    "border-l-zinc-300 dark:border-l-slate-600",
  NORMAL: "border-l-zinc-400 dark:border-l-slate-500",
  HIGH:   "border-l-amber-500",
  URGENT: "border-l-red-500",
};

function fmt(d?: string | null) {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString("en-UG", { day: "2-digit", month: "short" });
}

// ── Message Read Dialog ────────────────────────────────────────────────
function MessageReadDialog({ post, userId, onClose, onAction }: {
  post: Post; userId: string; onClose: () => void; onAction: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => startTransition(async () => {
    const res = await toggleMessageArchive(post.id, userId);
    if (res.ok) { toast.success(res.message); onAction(); onClose(); }
    else toast.error(res.message);
  });

  const handleDelete = () => startTransition(async () => {
    const res = await deleteMessagePost(post.id, userId);
    if (res.ok) { toast.success(res.message); onAction(); onClose(); }
    else toast.error(res.message);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 dark:border-slate-700/40">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              {PRIORITY_ICON[post.message.priority]}
              <span className="text-xs text-zinc-500">
                From {post.message.createdBy.name} · {fmt(post.message.sentAt ?? post.createdAt)}
              </span>
            </div>
            <h2 className="text-zinc-900 dark:text-white font-semibold text-sm">{post.message.subject}</h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="bg-zinc-50 dark:bg-slate-800/40 border border-zinc-200 dark:border-slate-700/40 rounded-xl p-4">
            <p className="text-zinc-700 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{post.message.body}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-slate-700/40 bg-zinc-50 dark:bg-slate-900/40">
          <button onClick={handleDelete} disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-lg transition-all">
            <Trash2 size={12} /> Delete
          </button>
          <button onClick={handleArchive} disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700/60 hover:border-zinc-300 dark:hover:border-slate-600 rounded-lg transition-all">
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />}
            {post.isArchived ? "Unarchive" : "Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function InboxClient({ userId, posts, total, unreadCount, page, totalPages }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showArchived, setShowArchived]   = useState(false);

  const openPost = (post: Post) => {
    setSelectedPost(post);
    if (!post.isRead) {
      startTransition(async () => {
        await markMessageAsRead(post.id, userId);
        router.refresh();
      });
    }
  };

  const markAllRead = () => {
    startTransition(async () => {
      const res = await markAllMessagesAsRead(userId);
      if (res.ok) { toast.success(res.message); router.refresh(); }
      else toast.error(res.message);
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0d1117] text-zinc-900 dark:text-white">

      {/* Sticky header */}
      <div className="border-b border-zinc-200 dark:border-slate-700/40 bg-white/80 dark:bg-[#0d1117]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Inbox size={18} className="text-violet-500 dark:text-violet-400" />
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Inbox</h1>
              <p className="text-zinc-500 text-xs">
                {unreadCount > 0
                  ? <><span className="text-violet-600 dark:text-violet-400 font-medium">{unreadCount} unread</span> · {total} total</>
                  : `${total} message${total !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={isPending}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700/60 hover:border-zinc-300 dark:hover:border-slate-600 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all">
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">

        {/* Tab filters */}
        <div className="flex gap-2">
          {[
            { label: "All",               active: !showUnreadOnly && !showArchived, action: () => { setShowUnreadOnly(false); setShowArchived(false); router.push("?"); } },
            { label: `Unread (${unreadCount})`, active: showUnreadOnly,            action: () => { setShowUnreadOnly(true);  setShowArchived(false); router.push("?unread=1"); } },
            { label: "Archived",          active: showArchived,                     action: () => { setShowArchived(true);   setShowUnreadOnly(false); router.push("?archived=1"); } },
          ].map(tab => (
            <button key={tab.label} onClick={tab.action}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                tab.active
                  ? "bg-violet-100 dark:bg-violet-600/20 border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-200"
                  : "bg-white dark:bg-slate-800/60 border-zinc-200 dark:border-slate-700/60 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-slate-600 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center mb-4">
              <Inbox size={22} className="text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              {showUnreadOnly ? "No unread messages" : showArchived ? "No archived messages" : "Inbox is empty"}
            </p>
            <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">Messages sent to you will appear here</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {posts.map(post => (
              <div key={post.id} onClick={() => openPost(post)}
                className={`group flex items-start gap-4 p-4 border-l-2 ${PRIORITY_BORDER[post.message.priority]} border rounded-xl cursor-pointer transition-all ${
                  post.isRead
                    ? "bg-white dark:bg-slate-800/20 border-zinc-200 dark:border-slate-700/40 hover:bg-zinc-50 dark:hover:bg-slate-800/40"
                    : "bg-violet-50/50 dark:bg-slate-800/50 border-zinc-200 dark:border-slate-700/60 hover:bg-violet-50 dark:hover:bg-slate-700/40"
                }`}>

                {/* Read indicator */}
                <div className="mt-1 shrink-0">
                  {post.isRead
                    ? <MailOpen size={15} className="text-zinc-400 dark:text-zinc-600" />
                    : <Mail size={15} className="text-violet-500 dark:text-violet-400" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-sm font-medium truncate ${
                      post.isRead ? "text-zinc-500 dark:text-zinc-300" : "text-zinc-900 dark:text-white"
                    }`}>
                      {post.message.subject}
                    </span>
                    {!post.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                    )}
                    {post.message.priority === "URGENT" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded font-semibold shrink-0">URGENT</span>
                    )}
                    {post.message.priority === "HIGH" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded shrink-0">HIGH</span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${
                    post.isRead ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"
                  }`}>
                    {post.message.body.slice(0, 100)}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{fmt(post.message.sentAt ?? post.createdAt)}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-600">From {post.message.createdBy.name}</span>
                  {post.isArchived && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5">
                      <Archive size={9} /> Archived
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
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

      {selectedPost && (
        <MessageReadDialog post={selectedPost} userId={userId}
          onClose={() => setSelectedPost(null)} onAction={() => router.refresh()} />
      )}
    </div>
  );
}
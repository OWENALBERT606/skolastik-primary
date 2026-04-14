"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, BellOff, MessageSquare, Mail, Phone, Settings,
  CheckCheck, Trash2, X, Loader2, Calendar, CreditCard,
  BarChart3, Users, Info, Clock, Moon, Filter,
} from "lucide-react";
import {
  updateNotificationPreferences,
  markAllAppNotificationsRead,
  markAppNotificationRead,
  deleteAppNotification,
} from "@/actions/communication-actions";
import { toast } from "sonner";

interface NotificationPrefs {
  id: string;
  systemEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  receiveSchoolMessages: boolean;
  receiveEventReminders: boolean;
  receiveFeeAlerts: boolean;
  receiveGradeReports: boolean;
  receiveAttendanceAlerts: boolean;
  receiveStaffNotices: boolean;
  receiveAnnouncements: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  digestEnabled: boolean;
  digestFrequency: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  iconType?: string | null;
  isRead: boolean;
  readAt?: string | null;
  sourceType?: string | null;
  createdAt: string;
}

interface Props {
  userId: string;
  schoolId: string;
  prefs: NotificationPrefs | null;
  notifications: AppNotification[];
  unreadCount: number;
  total: number;
}

function fmt(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString("en-UG", { day: "2-digit", month: "short" });
}

const ICON_MAP: Record<string, React.ReactNode> = {
  fee:     <CreditCard size={13} className="text-amber-500 dark:text-amber-400" />,
  message: <MessageSquare size={13} className="text-violet-500 dark:text-violet-400" />,
  event:   <Calendar size={13} className="text-emerald-500 dark:text-emerald-400" />,
  mark:    <BarChart3 size={13} className="text-blue-500 dark:text-blue-400" />,
  staff:   <Users size={13} className="text-rose-500 dark:text-rose-400" />,
};

// ── Shared styles ──────────────────────────────────────────────────────
const inputCls = [
  "w-full rounded-lg px-3 py-2 text-sm",
  "bg-white dark:bg-slate-800/60",
  "border border-zinc-200 dark:border-slate-700/60",
  "text-zinc-900 dark:text-white",
  "focus:outline-none focus:border-violet-500",
].join(" ");

// ── Toggle row ─────────────────────────────────────────────────────────
function ToggleRow({ on, onToggle, label, icon }: {
  on: boolean; onToggle: () => void; label: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 dark:border-slate-700/30 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
        <span className="text-sm text-zinc-700 dark:text-zinc-200">{label}</span>
      </div>
      <div onClick={onToggle}
        className={`w-9 h-5 rounded-full cursor-pointer transition-colors relative shrink-0 ${on ? "bg-violet-600" : "bg-zinc-200 dark:bg-slate-700"}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}

// ── Preferences Dialog ─────────────────────────────────────────────────
function PreferencesDialog({ prefs, userId, schoolId, onClose, onSuccess }: {
  prefs: NotificationPrefs | null; userId: string; schoolId: string;
  onClose: () => void; onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const defaults = {
    systemEnabled: true, emailEnabled: true, smsEnabled: false,
    receiveSchoolMessages: true, receiveEventReminders: true, receiveFeeAlerts: true,
    receiveGradeReports: true, receiveAttendanceAlerts: true, receiveStaffNotices: true,
    receiveAnnouncements: true, quietHoursEnabled: false,
    quietHoursStart: "22:00", quietHoursEnd: "07:00",
    digestEnabled: false, digestFrequency: "DAILY",
  };

  const [state, setState] = useState({ ...defaults, ...prefs });
  const toggle = (key: keyof typeof state) => setState(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateNotificationPreferences(userId, schoolId, {
        systemEnabled: state.systemEnabled, emailEnabled: state.emailEnabled, smsEnabled: state.smsEnabled,
        receiveSchoolMessages: state.receiveSchoolMessages, receiveEventReminders: state.receiveEventReminders,
        receiveFeeAlerts: state.receiveFeeAlerts, receiveGradeReports: state.receiveGradeReports,
        receiveAttendanceAlerts: state.receiveAttendanceAlerts, receiveStaffNotices: state.receiveStaffNotices,
        receiveAnnouncements: state.receiveAnnouncements,
        quietHoursEnabled: state.quietHoursEnabled,
        quietHoursStart: state.quietHoursStart ?? undefined,
        quietHoursEnd: state.quietHoursEnd ?? undefined,
        digestEnabled: state.digestEnabled, digestFrequency: state.digestFrequency,
      });
      if (res.ok) { toast.success(res.message); onSuccess(); onClose(); }
      else toast.error(res.message);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-slate-700/40 bg-violet-50 dark:bg-gradient-to-r dark:from-violet-900/20 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center">
              <Settings size={14} className="text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <h2 className="text-zinc-900 dark:text-white font-semibold text-sm">Notification Preferences</h2>
              <p className="text-zinc-500 text-xs">Choose what you receive and how</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">

          {/* Channels */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Delivery Channels</h3>
            <div className="bg-zinc-50 dark:bg-slate-800/40 border border-zinc-200 dark:border-slate-700/40 rounded-xl px-4">
              <ToggleRow on={state.systemEnabled} onToggle={() => toggle("systemEnabled")} label="In-App Notifications" icon={<Bell size={14} />} />
              <ToggleRow on={state.emailEnabled}  onToggle={() => toggle("emailEnabled")}  label="Email Notifications"  icon={<Mail size={14} />} />
              <ToggleRow on={state.smsEnabled}    onToggle={() => toggle("smsEnabled")}    label="SMS Notifications"    icon={<Phone size={14} />} />
            </div>
          </div>

          {/* Topics */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Notification Topics</h3>
            <div className="bg-zinc-50 dark:bg-slate-800/40 border border-zinc-200 dark:border-slate-700/40 rounded-xl px-4">
              <ToggleRow on={state.receiveSchoolMessages}   onToggle={() => toggle("receiveSchoolMessages")}   label="School Messages"      icon={<MessageSquare size={14} />} />
              <ToggleRow on={state.receiveEventReminders}   onToggle={() => toggle("receiveEventReminders")}   label="Event Reminders"      icon={<Calendar size={14} />} />
              <ToggleRow on={state.receiveFeeAlerts}        onToggle={() => toggle("receiveFeeAlerts")}        label="Fee & Payment Alerts" icon={<CreditCard size={14} />} />
              <ToggleRow on={state.receiveGradeReports}     onToggle={() => toggle("receiveGradeReports")}     label="Grade Reports"        icon={<BarChart3 size={14} />} />
              <ToggleRow on={state.receiveAttendanceAlerts} onToggle={() => toggle("receiveAttendanceAlerts")} label="Attendance Alerts"    icon={<Clock size={14} />} />
              <ToggleRow on={state.receiveStaffNotices}     onToggle={() => toggle("receiveStaffNotices")}     label="Staff Notices"        icon={<Users size={14} />} />
              <ToggleRow on={state.receiveAnnouncements}    onToggle={() => toggle("receiveAnnouncements")}    label="Announcements"        icon={<Info size={14} />} />
            </div>
          </div>

          {/* Quiet hours */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Quiet Hours</h3>
            <div className="bg-zinc-50 dark:bg-slate-800/40 border border-zinc-200 dark:border-slate-700/40 rounded-xl p-4 space-y-3">
              <ToggleRow on={state.quietHoursEnabled} onToggle={() => toggle("quietHoursEnabled")} label="Enable quiet hours" icon={<Moon size={14} />} />
              {state.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">From</label>
                    <input type="time" value={state.quietHoursStart ?? "22:00"}
                      onChange={e => setState(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Until</label>
                    <input type="time" value={state.quietHoursEnd ?? "07:00"}
                      onChange={e => setState(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Digest */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Email Digest</h3>
            <div className="bg-zinc-50 dark:bg-slate-800/40 border border-zinc-200 dark:border-slate-700/40 rounded-xl p-4 space-y-3">
              <ToggleRow on={state.digestEnabled} onToggle={() => toggle("digestEnabled")} label="Send digest instead of real-time" icon={<Filter size={14} />} />
              {state.digestEnabled && (
                <select value={state.digestFrequency}
                  onChange={e => setState(prev => ({ ...prev, digestFrequency: e.target.value }))}
                  className={inputCls}>
                  <option value="DAILY">Daily digest</option>
                  <option value="WEEKLY">Weekly digest</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-slate-700/40 bg-zinc-50 dark:bg-slate-900/40">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-slate-700/60 hover:border-zinc-300 dark:hover:border-slate-600 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-40">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function NotificationsClient({ userId, schoolId, prefs, notifications, unreadCount, total }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPrefs, setShowPrefs]   = useState(false);
  const [localNotifs, setLocalNotifs] = useState(notifications);

  const markRead = (id: string) => {
    setLocalNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    startTransition(async () => { await markAppNotificationRead(id, userId); router.refresh(); });
  };

  const deleteNotif = (id: string) => {
    setLocalNotifs(prev => prev.filter(n => n.id !== id));
    startTransition(async () => { await deleteAppNotification(id, userId); router.refresh(); });
  };

  const markAllRead = () => {
    setLocalNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    startTransition(async () => {
      const res = await markAllAppNotificationsRead(userId);
      if (res.ok) toast.success(res.message);
      router.refresh();
    });
  };

  const localUnread = localNotifs.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0d1117] text-zinc-900 dark:text-white">

      {/* Sticky header */}
      <div className="border-b border-zinc-200 dark:border-slate-700/40 bg-white/80 dark:bg-[#0d1117]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={18} className="text-violet-500 dark:text-violet-400" />
              {localUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {localUnread > 9 ? "9+" : localUnread}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Notifications</h1>
              <p className="text-zinc-500 text-xs">
                {localUnread > 0
                  ? <><span className="text-red-500 dark:text-red-400 font-medium">{localUnread} unread</span> · {total} total</>
                  : `${total} notification${total !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {localUnread > 0 && (
              <button onClick={markAllRead} disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700/60 hover:border-zinc-300 dark:hover:border-slate-600 rounded-lg transition-all">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
            <button onClick={() => setShowPrefs(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700/60 hover:border-zinc-300 dark:hover:border-slate-600 rounded-lg transition-all">
              <Settings size={12} /> Preferences
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {localNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 flex items-center justify-center mb-4">
              <BellOff size={22} className="text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No notifications</p>
            <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">System alerts and updates will appear here</p>
            <button onClick={() => setShowPrefs(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 hover:border-violet-300 dark:hover:border-violet-500/50 rounded-lg transition-all">
              <Settings size={12} /> Configure preferences
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {localNotifs.map(n => (
              <div key={n.id}
                className={`group flex items-start gap-4 p-4 border rounded-xl transition-all ${
                  n.isRead
                    ? "bg-white dark:bg-slate-800/20 border-zinc-200 dark:border-slate-700/40 hover:bg-zinc-50 dark:hover:bg-slate-800/40"
                    : "bg-violet-50/50 dark:bg-slate-800/50 border-zinc-200 dark:border-slate-700/60 hover:bg-violet-50 dark:hover:bg-slate-700/40"
                }`}>

                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                  n.isRead
                    ? "bg-zinc-100 dark:bg-slate-800/60 border-zinc-200 dark:border-slate-700/40"
                    : "bg-violet-100 dark:bg-violet-600/15 border-violet-200 dark:border-violet-500/30"
                }`}>
                  {n.iconType && ICON_MAP[n.iconType]
                    ? ICON_MAP[n.iconType]
                    : <Bell size={13} className={n.isRead ? "text-zinc-400 dark:text-zinc-600" : "text-violet-500 dark:text-violet-400"} />
                  }
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-medium ${n.isRead ? "text-zinc-500 dark:text-zinc-300" : "text-zinc-900 dark:text-white"}`}>
                      {n.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0">{fmt(n.createdAt)}</span>
                  </div>
                  <p className={`text-xs mt-0.5 leading-relaxed ${n.isRead ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {n.body}
                  </p>
                  {n.actionUrl && (
                    <a href={n.actionUrl} className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mt-1 inline-block">
                      View details →
                    </a>
                  )}
                </div>

                {/* Actions (hover-reveal) */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.isRead && (
                    <button onClick={() => markRead(n.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-slate-700/60 transition-all">
                      <CheckCheck size={12} />
                    </button>
                  )}
                  <button onClick={() => deleteNotif(n.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-slate-700/60 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPrefs && (
        <PreferencesDialog prefs={prefs} userId={userId} schoolId={schoolId}
          onClose={() => setShowPrefs(false)} onSuccess={() => router.refresh()} />
      )}
    </div>
  );
}
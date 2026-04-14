"use client";

// app/school/[slug]/staff/_components/StaffClient.tsx

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Users, UserPlus, Search, MoreVertical,
  Clock, AlertCircle,
  Eye, Pencil,
  BadgeCheck, Briefcase, GraduationCap, ShieldCheck,
  DollarSign, CalendarDays, Phone, Mail, X,
  ArrowUpRight, Building2, SlidersHorizontal, RefreshCw,
  KeyRound, FileText, ChevronRight, ChevronDown,
  Loader2, CheckCircle2, AlertTriangle,
  Camera, Upload, RotateCcw, ImageIcon, ZapOff,
} from "lucide-react";
import {
  getStaff,
  createStaff,
  updateStaffStatus,
  resetStaffPassword,
  getStaffDashboardStats,
  getStaffRoleDefinitions,
} from "@/actions/staff-actions";
import { assignDOSRole, removeDOSRole } from "@/actions/dos-portal";
import type { StaffStatus, StaffType, EmploymentType } from "@prisma/client";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type StaffMember = Awaited<ReturnType<typeof getStaff>>[number];
type Stats       = Awaited<ReturnType<typeof getStaffDashboardStats>>;
type RoleDef     = Awaited<ReturnType<typeof getStaffRoleDefinitions>>[number];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:         "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ON_LEAVE:       "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  RESIGNED:       "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  TERMINATED:     "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  RETIRED:        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  SUSPENDED:      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  CONTRACT_ENDED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const TYPE_ICON: Record<string, typeof Users> = {
  TEACHING:       GraduationCap,
  NON_TEACHING:   Briefcase,
  ADMINISTRATIVE: ShieldCheck,
  SUPPORT:        Building2,
};

const AVATAR_COLORS = [
  "from-blue-500 to-violet-600",
  "from-indigo-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
  "from-violet-500 to-indigo-600",
  "from-blue-600 to-fuchsia-600",
];
function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];
}

// ─── SHARED INPUTS ────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-black dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-600 transition";

function Field({ label, children, required, hint }: {
  label: string; children: React.ReactNode; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        {hint && <span className="font-normal text-slate-400 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={inputCls + " appearance-none pr-8 cursor-pointer"}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium ${
      type === "success"
        ? "bg-emerald-50 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
        : "bg-rose-50 dark:bg-rose-900/90 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200"
    }`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colorClass, icon: Icon }: {
  label: string; value: number; sub: string; colorClass: string; icon: typeof Users;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 flex items-start gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className={`rounded-xl p-3 ${colorClass}`}><Icon size={20} strokeWidth={2} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-black dark:text-white tabular-nums">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ─── STAFF ROW ────────────────────────────────────────────────────────────────
// Columns: Staff Member | Staff ID | Type | Contact | Hired | Status | Actions
// (Basic Salary and Login ID removed)

function StaffRow({ staff, slug, schoolId, onReset, onStatusChange, onRefresh }: {
  staff: StaffMember;
  slug: string;
  schoolId: string;
  onReset: (s: StaffMember) => void;
  onStatusChange: (id: string, status: StaffStatus) => void;
  onRefresh: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dosLoading, setDosLoading] = useState(false);
  const TypeIcon = TYPE_ICON[staff.staffType] ?? Briefcase;

  const isDOS = staff.roles.some(r => r.roleDefinition?.code === "DOS" && r.isActive);
  const isTeachingStaff = staff.staffType === "TEACHING";

  const handleDOSToggle = async () => {
    setDosLoading(true);
    setMenuOpen(false);
    try {
      const result = isDOS
        ? await removeDOSRole(staff.id, schoolId)
        : await assignDOSRole(staff.id, schoolId);
      if (result.ok) onRefresh();
      else alert(result.message);
    } finally {
      setDosLoading(false);
    }
  };

  return (
    <tr className="group border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">

      {/* Staff Member */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {(staff as any).imageUrl ? (
            <img
              src={(staff as any).imageUrl}
              alt={`${staff.firstName} ${staff.lastName}`}
              className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
            />
          ) : (
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(staff.id)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
              {getInitials(staff.firstName, staff.lastName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-black dark:text-white truncate">
              {staff.firstName} {staff.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {staff.roles.find(r => r.isPrimary)?.roleDefinition.name
                ?? staff.roles[0]?.roleDefinition.name
                ?? "—"}
            </p>
            {isDOS && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded px-1 py-0.5 mt-0.5">
                <ShieldCheck size={9} /> DOS
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Staff ID */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold tracking-wide">
          {staff.staffId}
        </span>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <TypeIcon size={13} />{staff.staffType.replace("_", " ")}
        </span>
      </td>

      {/* Contact */}
      <td className="px-4 py-3">
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <Phone size={11} className="text-slate-400" />{staff.phone}
          </div>
          {staff.email && (
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Mail size={11} className="text-slate-400" />
              <span className="truncate max-w-[140px]">{staff.email}</span>
            </div>
          )}
        </div>
      </td>

      {/* Hired */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <CalendarDays size={11} />{fmtDate(staff.dateOfHire)}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[staff.status] ?? ""}`}>
          {staff.status.replace("_", " ")}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="relative flex items-center justify-end gap-1">
          <Link
            href={`/school/${slug}/staff/${staff.id}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
          >
            <Eye size={14} />
          </Link>
          <button
            onClick={() => setMenuOpen(p => !p)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <Link href={`/school/${slug}/staff/${staff.id}`} onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"><Eye size={13} /> View Details</Link>
                <Link href={`/school/${slug}/staff/${staff.id}?tab=edit`} onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"><Pencil size={13} /> Edit Staff</Link>
                <button onClick={() => { onReset(staff); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"><KeyRound size={13} /> Reset Password</button>
                <div className="border-t border-slate-100 dark:border-slate-800" />
                {isTeachingStaff && (
                  <button
                    onClick={handleDOSToggle}
                    disabled={dosLoading}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                      isDOS
                        ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    <ShieldCheck size={13} />
                    {dosLoading ? "Updating..." : isDOS ? "Remove DOS Role" : "Make Director of Studies"}
                  </button>
                )}
                <div className="border-t border-slate-100 dark:border-slate-800" />
                {staff.status === "ACTIVE" ? (
                  <button onClick={() => { onStatusChange(staff.id, "SUSPENDED"); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"><AlertCircle size={13} /> Suspend</button>
                ) : staff.status === "SUSPENDED" ? (
                  <button onClick={() => { onStatusChange(staff.id, "ACTIVE"); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><CheckCircle2 size={13} /> Reactivate</button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── R2 UPLOAD HELPER ─────────────────────────────────────────────────────────
//
// Uses the existing route at /api/r2/upload which returns { presignedUrl, publicUrl, key }
//
// Flow:
//   1. POST /api/r2/upload           → { presignedUrl, publicUrl, key }
//   2. PUT  presignedUrl             (raw file bytes, correct Content-Type)
//   3. Return publicUrl              → stored as imageUrl on the staff record

async function uploadToR2(file: File): Promise<string> {
  // Step 1 — get presigned URL from your existing route
  const res = await fetch("/api/r2/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error ?? "Failed to get upload URL");
  }

  // Your route returns `presignedUrl` (not `uploadUrl`)
  const { presignedUrl, publicUrl } = await res.json();

  // Step 2 — PUT file bytes directly to R2 via presigned URL
  const put = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!put.ok) throw new Error("Upload to R2 failed");

  return publicUrl; // Step 3 — remote URL ready to store in DB
}

// ─── IMAGE CAPTURE WIDGET ─────────────────────────────────────────────────────
//
// • File upload  — picks from device, validates type/size, uploads to R2
// • Webcam snap  — live <video> preview, canvas snap, uploads to R2
// • Shows upload progress while R2 transfer is in flight
// • `value` is always a remote R2 URL (or "" when empty)

type CamMode = "idle" | "webcam";
type UploadState = "idle" | "uploading" | "done" | "error";

function ImageCapture({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [mode, setMode] = useState<CamMode>("idle");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [camError, setCamError] = useState("");
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setUploadError("");
    setUploadState("uploading");
    try {
      const url = await uploadToR2(file);
      onChange(url);
      setUploadState("done");
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
      setUploadState("error");
    }
  }, [onChange]);

  // File input handler
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5 MB."); return; }
    setUploadError("");
    handleUpload(file);
    e.target.value = "";
  };

  // Webcam helpers
  const startCam = useCallback(async () => {
    setCamError(""); setMode("webcam");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch {
      setCamError("Camera access denied or unavailable.");
      setMode("idle");
    }
  }, []);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStreaming(false);
    setMode("idle");
  }, []);

  const snap = useCallback(async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    stopCam();
    // Convert canvas to File and upload
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: "image/jpeg" });
      await handleUpload(file);
    }, "image/jpeg", 0.85);
  }, [stopCam, handleUpload]);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const isUploading = uploadState === "uploading";

  return (
    <div>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        Staff Photo{" "}
        <span className="font-normal normal-case text-slate-400">(optional)</span>
      </p>

      <div className="flex gap-4 items-start">

        {/* Preview / placeholder */}
        <div className="shrink-0">
          {value ? (
            <div className="relative w-[88px] h-[88px] rounded-2xl overflow-hidden ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg">
              <img src={value} alt="Staff photo" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { onChange(""); setUploadState("idle"); }}
                title="Remove photo"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 flex items-center justify-center text-white transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ) : isUploading ? (
            /* Uploading spinner placeholder */
            <div className="w-[88px] h-[88px] rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 flex flex-col items-center justify-center gap-2 text-blue-500">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-[10px] font-medium">Uploading…</span>
            </div>
          ) : (
            <div className="w-[88px] h-[88px] rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-1.5 text-slate-400">
              <ImageIcon size={22} />
              <span className="text-[10px] text-center leading-tight px-1">No photo</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">
          {mode === "webcam" ? (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3", maxHeight: "148px" }}>
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                {!streaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 size={20} className="animate-spin text-white/70" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={snap} disabled={!streaming || isUploading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                  {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  {isUploading ? "Uploading…" : "Capture"}
                </button>
                <button type="button" onClick={stopCam}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors">
                  <ZapOff size={13} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={isUploading}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors w-full disabled:opacity-50">
                {isUploading
                  ? <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />
                  : <Upload size={13} className="text-blue-500 shrink-0" />}
                {isUploading ? "Uploading to R2…" : value ? "Change photo — upload" : "Upload from device"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />

              <button type="button" onClick={startCam} disabled={isUploading}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium transition-colors w-full disabled:opacity-50">
                <Camera size={13} className="shrink-0" />
                {value ? "Retake with webcam" : "Capture with webcam"}
              </button>

              {value && (
                <button type="button" onClick={() => { onChange(""); setUploadState("idle"); }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition-colors self-start">
                  <RotateCcw size={11} /> Remove photo
                </button>
              )}
            </div>
          )}

          {/* Error message */}
          {(uploadError || camError) && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle size={11} className="shrink-0" />
              {uploadError || camError}
            </p>
          )}

          {/* Success hint */}
          {uploadState === "done" && value && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={11} className="shrink-0" /> Uploaded to R2 successfully
            </p>
          )}

          <p className="text-[11px] text-slate-400 leading-snug">
            JPG / PNG / WebP · max 5 MB · stored on Cloudflare R2
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE STAFF MODAL ───────────────────────────────────────────────────────

function CreateStaffModal({ schoolId, slug, roles, onClose, onCreated }: {
  schoolId: string;
  slug: string;
  roles: RoleDef[];
  onClose: () => void;
  onCreated: (result: any) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    gender: "Male", staffType: "TEACHING" as StaffType,
    employmentType: "PERMANENT" as EmploymentType,
    basicSalary: "", dateOfHire: new Date().toISOString().split("T")[0],
    roleDefinitionId: "", password: "",
    highestQualification: "", specialization: "",
    nssfNumber: "", tinNumber: "",
    emergencyName: "", emergencyPhone: "", emergencyRelationship: "",
  });
  const [error, setError] = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.phone) {
      setError("First name, last name and phone are required.");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await createStaff({
        schoolId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        gender: form.gender,
        staffType: form.staffType,
        employmentType: form.employmentType,
        basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0,
        dateOfHire: new Date(form.dateOfHire),
        roleDefinitionId: form.roleDefinitionId || undefined,
        password: form.password.trim() || undefined,
        highestQualification: form.highestQualification || undefined,
        specialization: form.specialization || undefined,
        nssfNumber: form.nssfNumber || undefined,
        tinNumber: form.tinNumber || undefined,
        emergencyName: form.emergencyName || undefined,
        emergencyPhone: form.emergencyPhone || undefined,
        emergencyRelationship: form.emergencyRelationship || undefined,
        imageUrl: imageUrl || undefined, // remote R2 URL
      });
      if (res.ok) onCreated(res.data);
      else setError(res.message);
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UserPlus size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-black dark:text-white">Add Staff Member</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Portal account created automatically with staff ID as login</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">

          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 p-3 flex items-center gap-3">
            <BadgeCheck size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Staff ID auto-generated · used as portal Login ID</p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-mono">e.g. SMDSTF202603001 · default password = phone number</p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* ── PHOTO ─────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 p-4">
            <ImageCapture value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* ── PERSONAL ──────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Personal Information</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" required>
                <input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Grace" className={inputCls} />
              </Field>
              <Field label="Last Name" required>
                <input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Atuhaire" className={inputCls} />
              </Field>
              <Field label="Phone" required hint="Default password">
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="0772 100 001" className={inputCls} />
              </Field>
              <Field label="Email">
                <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="grace@school.ug" className={inputCls} />
              </Field>
              <Field label="Gender" required>
                <Select value={form.gender} onChange={v => set("gender", v)} options={[["Male","Male"],["Female","Female"]]} />
              </Field>
              <Field label="Date of Hire" required>
                <input type="date" value={form.dateOfHire} onChange={e => set("dateOfHire", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* ── EMPLOYMENT ────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Employment</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Staff Type" required>
                <Select value={form.staffType} onChange={v => set("staffType", v)} options={[["TEACHING","Teaching"],["NON_TEACHING","Non-Teaching"],["ADMINISTRATIVE","Administrative"],["SUPPORT","Support"]]} />
              </Field>
              <Field label="Employment Type" required>
                <Select value={form.employmentType} onChange={v => set("employmentType", v)} options={[["PERMANENT","Permanent"],["CONTRACT","Contract"],["PART_TIME","Part-Time"],["VOLUNTEER","Volunteer"],["INTERN","Intern"]]} />
              </Field>
              <Field label="Basic Salary (UGX)">
                <input type="number" value={form.basicSalary} onChange={e => set("basicSalary", e.target.value)} placeholder="850000" className={inputCls} />
              </Field>
              <Field label="Initial Role">
                <Select value={form.roleDefinitionId} onChange={v => set("roleDefinitionId", v)} options={[["","— None —"], ...roles.map(r => [r.id, r.name] as [string, string])]} />
              </Field>
            </div>
          </div>

          {/* ── QUALIFICATIONS ────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Qualifications (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Highest Qualification">
                <input value={form.highestQualification} onChange={e => set("highestQualification", e.target.value)} placeholder="Bachelor of Education" className={inputCls} />
              </Field>
              <Field label="Specialization">
                <input value={form.specialization} onChange={e => set("specialization", e.target.value)} placeholder="Mathematics" className={inputCls} />
              </Field>
              <Field label="NSSF Number">
                <input value={form.nssfNumber} onChange={e => set("nssfNumber", e.target.value)} placeholder="NSSF-XXXXXXXX" className={inputCls} />
              </Field>
              <Field label="TIN Number">
                <input value={form.tinNumber} onChange={e => set("tinNumber", e.target.value)} placeholder="1000XXXXXXX" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* ── EMERGENCY ─────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Emergency Contact (optional)</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Name">
                <input value={form.emergencyName} onChange={e => set("emergencyName", e.target.value)} placeholder="John Atuhaire" className={inputCls} />
              </Field>
              <Field label="Relationship">
                <input value={form.emergencyRelationship} onChange={e => set("emergencyRelationship", e.target.value)} placeholder="Spouse" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={form.emergencyPhone} onChange={e => set("emergencyPhone", e.target.value)} placeholder="0772 000 000" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* ── PORTAL ACCESS ─────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Portal Access</p>
            <Field label="Initial Password" hint="Leave blank to use phone number">
              <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 justify-end shrink-0">
          {imageUrl && (
            <span className="mr-auto flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={13} /> Photo uploaded to R2
            </span>
          )}
          <button onClick={onClose} disabled={isPending} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isPending} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2">
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? "Creating…" : "Create Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RESET PASSWORD MODAL ─────────────────────────────────────────────────────

function ResetPasswordModal({ staff, onClose, onDone }: {
  staff: StaffMember; onClose: () => void; onDone: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [pwd, setPwd] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function handleReset() {
    startTransition(async () => {
      const res = await resetStaffPassword(staff.id, pwd || undefined);
      if (res.ok) setResult(res.data?.temporaryPassword ?? (pwd || staff.phone));
      else { onDone("Error: " + res.message); onClose(); }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <KeyRound size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-black dark:text-white">Reset Password</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {result ? (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 p-4 text-center space-y-2">
              <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Password reset successfully</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">New password for <strong>{staff.firstName}</strong>:</p>
              <p className="font-mono font-bold text-lg text-black dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg py-2 px-3">{result}</p>
              <p className="text-xs text-slate-500">Share securely — shown once only</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 p-3 text-xs text-blue-700 dark:text-blue-300">
                Resetting for <strong>{staff.firstName} {staff.lastName}</strong><br />
                Login ID: <span className="font-mono font-bold">{staff.user?.loginId}</span>
              </div>
              <Field label="New Password" hint="blank = phone number">
                <input type="text" value={pwd} onChange={e => setPwd(e.target.value)} placeholder={staff.phone} className={inputCls} />
              </Field>
            </>
          )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end">
          {result ? (
            <button onClick={() => { onDone("Password reset for " + staff.firstName); onClose(); }} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">Done</button>
          ) : (
            <>
              <button onClick={onClose} disabled={isPending} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleReset} disabled={isPending} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {isPending ? "Resetting…" : "Reset"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CREDENTIALS MODAL ───────────────────────────────────────────────────────

function CredentialsModal({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-black dark:text-white">Staff Created!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Share these credentials with the staff member</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle size={14} /> These credentials are shown <strong>once only</strong>
          </div>
          {[
            { label: "Login ID",  value: data?.loginCredentials?.loginId  },
            { label: "Password",  value: data?.loginCredentials?.password },
            { label: "User Type", value: "STAFF"                          },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
              <span className="font-mono font-bold text-sm text-black dark:text-white">{value}</span>
            </div>
          ))}
          <p className="text-xs text-slate-400">{data?.loginCredentials?.note}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">Got it</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CLIENT COMPONENT ────────────────────────────────────────────────────

export default function StaffClient({ schoolId, slug, schoolName }: { schoolId: string; slug: string; schoolName: string}) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<StaffType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "ALL">("ALL");
  const [modal, setModal] = useState<"create" | "reset" | "credentials" | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [newCredentials, setNewCredentials] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [, startTransition] = useTransition();

  function showToast(msg: string, type: "success" | "error" = "success") { setToast({ msg, type }); }

  async function load() {
    setLoading(true);
    const [s, st, r] = await Promise.all([
      getStaff(schoolId, {
        status: statusFilter !== "ALL" ? statusFilter as StaffStatus : undefined,
        staffType: typeFilter !== "ALL" ? typeFilter as StaffType : undefined,
        search: search || undefined,
      }),
      getStaffDashboardStats(schoolId),
      getStaffRoleDefinitions(schoolId),
    ]);
    setStaff(s); setStats(st); setRoles(r); setLoading(false);
  }

  useEffect(() => { load(); }, [search, typeFilter, statusFilter]);

  function handleStatusChange(id: string, status: StaffStatus) {
    startTransition(async () => {
      const res = await updateStaffStatus(id, status);
      if (res.ok) { showToast(`Status updated to ${status}`); load(); }
      else showToast(res.message, "error");
    });
  }

  const statCards = stats ? [
    { label: "Total Staff",     value: stats.totalStaff,          sub: "All staff members",         colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",  icon: Users      },
    { label: "Active",          value: stats.activeStaff,         sub: `${Math.round((stats.activeStaff / (stats.totalStaff || 1)) * 100)}% of total`, colorClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", icon: BadgeCheck },
    { label: "On Leave",        value: stats.onLeave,             sub: `${stats.pendingLeaveRequests} pending`,  colorClass: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",   icon: Clock      },
    { label: "Pending Payroll", value: stats.pendingPayrollBatch, sub: "Batches needing action",     colorClass: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",          icon: DollarSign },
  ] : [];

  // Table headers — Basic Salary and Login ID removed
  const TABLE_HEADERS = ["Staff Member", "Staff ID", "Type", "Contact", "Hired", "Status", ""];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-black dark:text-white">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Building2 size={13} /><span>{schoolName}</span><ChevronRight size={11} />
              <span className="text-blue-600 dark:text-blue-400 font-medium">Staff</span>
            </div>
            <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight">Staff Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage staff accounts, payroll profiles and portal access</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/school/${slug}/staff/payroll`} className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 text-sm font-medium transition-all">
              <DollarSign size={15} /> Payroll
            </Link>
            <Link href={`/school/${slug}/staff/attendance`} className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 text-sm font-medium transition-all">
              <CalendarDays size={15} /> Attendance
            </Link>
            <button onClick={() => setModal("create")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all">
              <UserPlus size={16} /> Add Staff
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => <StatCard key={s.label} {...s} />)}
          </div>
        )}

        {/* Quick nav */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Roles",       href: `/school/${slug}/staff/roles`,   icon: ShieldCheck },
            { label: "Attendance",  href: `/school/${slug}/staff/attendance`,  icon: CalendarDays  },
            { label: "Leave",       href: `/school/${slug}/staff/leave`,       icon: Clock         },
            { label: "Payroll",     href: `/school/${slug}/staff/payroll`,     icon: DollarSign    },
            { label: "Training",    href: `/school/${slug}/staff/training`,    icon: GraduationCap },
            { label: "Notices",     href: `/school/${slug}/staff/notices`,     icon: FileText      },
            { label: "Offboarding", href: `/school/${slug}/staff/offboarding`, icon: ArrowUpRight  },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
              <Icon size={12} /> {label}
            </Link>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, staff ID, phone…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-black dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
            </div>
            <div className="relative">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer">
                <option value="ALL">All Types</option>
                <option value="TEACHING">Teaching</option>
                <option value="NON_TEACHING">Non-Teaching</option>
                <option value="ADMINISTRATIVE">Administrative</option>
                <option value="SUPPORT">Support</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer">
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <SlidersHorizontal size={13} className="text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-black dark:text-white">{staff.length}</span> staff
            </span>
            {(search || typeFilter !== "ALL" || statusFilter !== "ALL") && (
              <button onClick={() => { setSearch(""); setTypeFilter("ALL"); setStatusFilter("ALL"); }} className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">Clear filters</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                  {TABLE_HEADERS.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={TABLE_HEADERS.length} className="px-4 py-16 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                  </td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan={TABLE_HEADERS.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Users size={20} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No staff found</p>
                      <button onClick={() => setModal("create")} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Add first staff member →</button>
                    </div>
                  </td></tr>
                ) : staff.map(s => (
                  <StaffRow slug={slug} key={s.id} staff={s}
                    schoolId={schoolId}
                    onReset={s => { setSelectedStaff(s); setModal("reset"); }}
                    onStatusChange={handleStatusChange}
                    onRefresh={load}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {staff.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-xs text-slate-500 dark:text-slate-400">{staff.length} record{staff.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === "create" && (
        <CreateStaffModal  schoolId={schoolId} slug={slug} roles={roles} onClose={() => setModal(null)}
          onCreated={data => { setNewCredentials(data); setModal("credentials"); load(); }} />
      )}
      {modal === "reset" && selectedStaff && (
        <ResetPasswordModal staff={selectedStaff} onClose={() => setModal(null)}
          onDone={msg => { showToast(msg); setModal(null); }} />
      )}
      {modal === "credentials" && newCredentials && (
        <CredentialsModal data={newCredentials}
          onClose={() => { setModal(null); setNewCredentials(null); showToast("Staff created successfully!"); }} />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}